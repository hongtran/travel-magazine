import uuid
from supabase import Client

BUCKET = "articles"
DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

def upload_docx(supabase: Client, file_bytes: bytes, user_id: str) -> str:
    path = f"{user_id}/docx/{uuid.uuid4()}.docx"
    supabase.storage.from_(BUCKET).upload(path, file_bytes, {"content-type": DOCX_CONTENT_TYPE})
    return path

def upload_pending_image(supabase: Client, image_bytes: bytes, filename: str) -> str:
    path = f"pending/images/{uuid.uuid4()}-{filename}"
    supabase.storage.from_(BUCKET).upload(path, image_bytes, {"content-type": "image/jpeg"})
    return path

def move_pending_images(supabase: Client, pending_paths: list[str], article_id: str) -> list[dict]:
    result = []
    for pending_path in pending_paths:
        filename = pending_path.split("/")[-1]
        new_path = f"articles/{article_id}/images/{filename}"
        supabase.storage.from_(BUCKET).move(pending_path, new_path)
        url = supabase.storage.from_(BUCKET).get_public_url(new_path)
        result.append({"url": url, "filename": filename, "caption": None})
    return result
