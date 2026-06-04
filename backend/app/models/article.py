from pydantic import BaseModel

class SourcedField(BaseModel):
    value: str | None = None
    sourced: bool
    source_ref: str | None = None

class BodySection(BaseModel):
    section_title: str
    content: str
    source_ref: str | None = None

class KeyFact(BaseModel):
    key: str
    value: str | None = None
    sourced: bool
    source_ref: str | None = None

class ArticleOutput(BaseModel):
    title: SourcedField
    hook: SourcedField
    body: list[BodySection]
    best_for: SourcedField
    not_for: SourcedField
    ethics_notes: SourcedField | None = None
    key_facts: list[KeyFact]

class Article(BaseModel):
    id: str
    user_id: str
    title: str | None = None
    status: str
    hook: str | None = None
    body: list[dict] | None = None
    best_for: str | None = None
    not_for: str | None = None
    ethics_notes: str | None = None
    key_facts: dict | None = None
    sourced_fields: dict | None = None
    images: list[dict]
    original_file_url: str | None = None
    regeneration_count: int
    word_count_target: int | None = None
    created_at: str
    updated_at: str

class ArticleUpdate(BaseModel):
    title: str | None = None
    status: str | None = None
    hook: str | None = None
    body: list[dict] | None = None
    best_for: str | None = None
    not_for: str | None = None
    ethics_notes: str | None = None
    key_facts: dict | None = None
    sourced_fields: dict | None = None
    images: list[dict] | None = None
    regeneration_count: int | None = None
    word_count_target: int | None = None
    original_file_url: str | None = None
