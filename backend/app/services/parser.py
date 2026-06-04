from dataclasses import dataclass, field
from pathlib import Path
from docx import Document
from docx.oxml.ns import qn

WORD_THRESHOLD = 100
CHUNK_THRESHOLD = 6000

@dataclass
class ImageBlob:
    blob: bytes
    content_type: str
    filename: str

@dataclass
class ParsedDocument:
    text: str
    comments: list[str]
    images: list[ImageBlob]
    word_count: int
    too_short: bool
    needs_chunking: bool

def parse_docx(path: Path) -> ParsedDocument:
    try:
        doc = Document(str(path))
    except Exception:
        return _fallback_mammoth(path)

    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    text = "\n\n".join(paragraphs)
    comments = _extract_comments(doc)
    if comments:
        text += "\n\n[AUTHOR COMMENTS]\n" + "\n".join(comments)

    images = _extract_images(doc)

    wc = len(text.split())
    return ParsedDocument(
        text=text,
        comments=comments,
        images=images,
        word_count=wc,
        too_short=wc < WORD_THRESHOLD,
        needs_chunking=wc > CHUNK_THRESHOLD,
    )

def _extract_comments(doc: Document) -> list[str]:
    try:
        comments_part = doc.part.package.part_related_by(
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments"
        )
        root = comments_part._element
        return [
            "".join(r.text for r in c.findall(f".//{qn('w:r')}/{qn('w:t')}"))
            for c in root.findall(qn("w:comment"))
        ]
    except Exception:
        return []

def _extract_images(doc: Document) -> list[ImageBlob]:
    images = []
    for rel in doc.part.rels.values():
        if "image" not in rel.reltype:
            continue
        try:
            part = rel.target_part
            ext = part.content_type.split("/")[-1]  # e.g. "png", "jpeg"
            filename = f"{rel.target_ref.split('/')[-1]}"
            images.append(ImageBlob(blob=part.blob, content_type=part.content_type, filename=filename))
        except Exception:
            continue
    return images

def _fallback_mammoth(path: Path) -> ParsedDocument:
    import mammoth
    with open(path, "rb") as f:
        result = mammoth.extract_raw_text(f)
    text = result.value
    wc = len(text.split())
    return ParsedDocument(
        text=text, comments=[], images=[],
        word_count=wc,
        too_short=wc < WORD_THRESHOLD,
        needs_chunking=wc > CHUNK_THRESHOLD,
    )
