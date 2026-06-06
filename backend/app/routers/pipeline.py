import uuid, tempfile
from datetime import date
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.auth import get_current_user_id
from app.db import get_supabase
from app.services.parser import parse_docx
from app.services.chunker import chunk_and_summarise
from app.services.generator import generate_article
from app.services.storage import upload_docx, upload_pending_image, move_pending_images

router = APIRouter(prefix="/articles", tags=["pipeline"])

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


class GenerateRequest(BaseModel):
    text: str
    file_url: str | None = None
    pending_image_paths: list[str] = []
    article_id: str | None = None

@router.post("/parse")
async def parse(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    if file.content_type != DOCX_MIME and not (file.filename or "").endswith(".docx"):
        raise HTTPException(status_code=422, detail="Only .docx files are accepted")

    file_bytes = await file.read()
    sb = get_supabase()

    with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = Path(tmp.name)

    parsed = parse_docx(tmp_path)
    tmp_path.unlink(missing_ok=True)

    if parsed.too_short:
        raise HTTPException(
            status_code=422,
            detail="Document is too short (under 100 words). Please add more notes.",
        )

    warning = None
    if _detect_multiple_experiences(parsed.text):
        warning = "multiple_experiences"

    file_url = upload_docx(sb, file_bytes, user_id)
    text = await chunk_and_summarise(parsed.text)

    pending_image_paths = [
        upload_pending_image(sb, img.blob, img.filename, img.content_type)
        for img in parsed.images
    ]

    return {
        "text": text,
        "file_url": file_url,
        "pending_image_paths": pending_image_paths,
        "warning": warning,
    }

@router.post("/generate")
async def generate(
    body: GenerateRequest,
    user_id: str = Depends(get_current_user_id),
):
    sb = get_supabase()
    config = sb.table("app_config").select("*").eq("id", 1).single().execute().data

    # Enforce daily generation limit
    max_daily = config.get("max_daily_generations", 5)
    today_count = (
        sb.table("articles")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .gte("created_at", date.today().isoformat())
        .execute()
        .count
    )
    if today_count >= max_daily:
        raise HTTPException(
            status_code=429,
            detail=f"Daily generation limit reached ({today_count}/{max_daily}). Try again tomorrow.",
        )

    # Enforce regeneration limit
    article_id_existing = body.article_id
    if article_id_existing:
        row = sb.table("articles").select("regeneration_count").eq("id", article_id_existing).single().execute().data
        if row and row["regeneration_count"] >= config["max_regenerations"]:
            raise HTTPException(status_code=429, detail=f"Regeneration limit reached ({config['max_regenerations']}/{config['max_regenerations']})")

    try:
        output = await generate_article(
            text=body.text,
            word_count_target=config["word_count_target"],
            house_style=config.get("house_style_notes") or "",
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Generation failed. Please retry.")

    article_id = article_id_existing or str(uuid.uuid4())

    images = move_pending_images(sb, body.pending_image_paths, article_id) if body.pending_image_paths else []
    row = _to_db_row(output, user_id, body.file_url, config, images)

    if article_id_existing:
        row["regeneration_count"] = (row.get("regeneration_count") or 0) + 1
        sb.table("articles").update(row).eq("id", article_id_existing).execute()
    else:
        sb.table("articles").insert({**row, "id": article_id}).execute()

    return {"id": article_id, "article": {**row, "id": article_id}}

def _to_db_row(output, user_id: str, file_url: str | None, config: dict, images: list[dict] | None = None) -> dict:
    def val(f):
        return f.value if f else None

    sourced_fields: dict = {}
    for field_name in ("title", "hook", "best_for", "not_for"):
        f = getattr(output, field_name)
        sourced_fields[field_name] = {"sourced": f.sourced, "source_ref": f.source_ref}
    if output.ethics_notes:
        sourced_fields["ethics_notes"] = {"sourced": output.ethics_notes.sourced, "source_ref": output.ethics_notes.source_ref}
    for f in output.key_facts:
        sourced_fields[f.key] = {"sourced": f.sourced, "source_ref": f.source_ref}

    return {
        "user_id": user_id,
        "title": val(output.title),
        "hook": val(output.hook),
        "body": [s.model_dump() for s in output.body],
        "best_for": val(output.best_for),
        "not_for": val(output.not_for),
        "ethics_notes": val(output.ethics_notes),
        "key_facts": {f.key: f.value for f in output.key_facts},
        "sourced_fields": sourced_fields,
        "images": images or [],
        "original_file_url": file_url,
        "word_count_target": config["word_count_target"],
        "status": "draft",
        "regeneration_count": 0,
    }

def _detect_multiple_experiences(text: str) -> bool:
    markers = ["experience 1", "experience 2", "trip 1", "trip 2", "part 1", "part 2"]
    lower = text.lower()
    return sum(1 for m in markers if m in lower) >= 2
