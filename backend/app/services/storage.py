import uuid
from supabase import Client

BUCKET = "articles"
DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

def upload_docx(supabase: Client, file_bytes: bytes, user_id: str) -> str:
    path = f"{user_id}/docx/{uuid.uuid4()}.docx"
    supabase.storage.from_(BUCKET).upload(path, file_bytes, {"content-type": DOCX_CONTENT_TYPE})
    return path

def upload_pending_image(supabase: Client, image_bytes: bytes, filename: str, content_type: str = "image/jpeg") -> str:
    path = f"pending/images/{uuid.uuid4()}-{filename}"
    supabase.storage.from_(BUCKET).upload(path, image_bytes, {"content-type": content_type})
    return path

def move_pending_images(supabase: Client, pending_paths: list[str], article_id: str) -> list[dict]:
    result = []
    for pending_path in pending_paths:
        filename = pending_path.split("/")[-1]
        new_path = f"{article_id}/images/{filename}"
        try:
            # Download from pending then re-upload to final path (avoids move API quirks)
            file_bytes = supabase.storage.from_(BUCKET).download(pending_path)
            ext = filename.rsplit(".", 1)[-1].lower()
            content_type = "image/jpeg" if ext == "jpg" else f"image/{ext}"
            supabase.storage.from_(BUCKET).upload(new_path, file_bytes, {"content-type": content_type})
            supabase.storage.from_(BUCKET).remove([pending_path])
        except Exception as e:
            raise
        url = supabase.storage.from_(BUCKET).get_public_url(new_path)
        result.append({"url": url, "filename": filename, "caption": None})
    return result
