# Seek Sophie Magazine Article Generator — Design Spec

**Date:** 2026-06-03
**Status:** Approved

---

## Overview

A production-ready SaaS web app for Seek Sophie (Singapore-based travel marketplace) that converts rough author notes (`.docx` files) into structured magazine articles using GPT-4o. Authors upload notes, review the AI-generated output in a split-view editor, make edits, and save. Articles are persisted and viewable later.

---

## System Architecture

```
Next.js 15 (Frontend)          FastAPI (Python Backend)          Supabase
─────────────────────          ───────────────────────          ────────
Supabase Auth (JWT)    ──JWT── JWT middleware                   Auth (auth.users)
Upload .docx           ──────► POST /articles/parse    ──────► Storage (docx + images)
Generate article       ──────► POST /articles/generate ──────► Postgres (articles)
CRUD articles          ──────► GET/POST/PATCH/DELETE           
                                        │
                                        ▼
                                   OpenAI GPT-4o
```

**Auth flow:**
1. User logs in via Supabase Auth on the frontend → receives a signed JWT
2. Every request to FastAPI includes `Authorization: Bearer <jwt>`
3. FastAPI validates the JWT using Supabase's JWKS endpoint (`/auth/v1/.well-known/jwks.json`) with ES256 — no shared secret needed
4. Extracted `user_id` scopes all database queries

**Rule:** Frontend talks to Supabase for auth only. All article data flows through FastAPI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| State management | Jotai |
| Backend | FastAPI (Python 3.12) |
| Document parsing | python-docx (primary: text + comments + images), mammoth (fallback if python-docx fails to open file) |
| LLM | OpenAI GPT-4o (Structured Outputs) |
| LLM summarisation (chunking) | GPT-4o-mini |
| Auth | Supabase Auth (magic link / invite-only) |
| Database | Supabase Postgres |
| File storage | Supabase Storage |
| Frontend deploy | Vercel |
| Backend deploy | Railway (Dockerised) |

---

## User Access

**Invite-only.** An admin invites authors by email via the Supabase dashboard (v1) or a future `/admin/users` page. Supabase sends a magic link. No open signup.

**Roles:**
- `author` — can create, edit, and publish their own articles
- `admin` — future role; out of scope for v1

---

## App Pages

| Route | Purpose |
|---|---|
| `/login` | Supabase magic-link auth |
| `/dashboard` | Paginated list of all user's articles (title, status, date) |
| `/articles/new` | Upload `.docx` → trigger generation → redirect to editor |
| `/articles/[id]` | Split-view editor (fields left, preview right, 50/50) |

---

## Data Model

### `profiles` (app-specific user data)

```sql
profiles
  id          uuid  PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
  full_name   text
  role        text  DEFAULT 'author'
  created_at  timestamptz DEFAULT now()
```

Auto-created on user confirmation via Supabase database trigger.

### `articles`

```sql
articles
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid()
  user_id             uuid        REFERENCES auth.users(id) ON DELETE CASCADE
  title               text
  status              text        DEFAULT 'draft'        -- 'draft' | 'published'
  hook                text
  body                jsonb       -- [{section_title, content, source_ref}]
  best_for            text
  not_for             text
  ethics_notes        text        -- nullable
  key_facts           jsonb       -- {price_range, duration, season, ...} flexible
  sourced_fields      jsonb       -- {field_name: {sourced: bool, source_ref: text}}
  images              jsonb       DEFAULT '[]'            -- [{url, filename, caption}]
  original_file_url   text        -- Supabase Storage path to the .docx
  regeneration_count  int         DEFAULT 0               -- max from app_config
  word_count_target   int         -- snapshot of config at generation time
  created_at          timestamptz DEFAULT now()
  updated_at          timestamptz DEFAULT now()
```

### `app_config` (single row, admin-editable)

```sql
app_config
  id                  int   PRIMARY KEY DEFAULT 1
  word_count_target   int   DEFAULT 800
  max_regenerations   int   DEFAULT 3
  house_style_notes   text  -- injected into GPT system prompt; nullable
```

---

## FastAPI Endpoints

All endpoints require a valid Supabase JWT in the `Authorization` header.

```
POST /articles/parse          Upload .docx → extract text, comments, images → return parsed payload
POST /articles/generate       Accept parsed payload → call GPT-4o → return ArticleOutput JSON
POST /articles                Save article to Supabase → return {id}
GET  /articles                List articles for user (paginated, newest first)
GET  /articles/{id}           Fetch single article
PATCH /articles/{id}          Update any field (called on each edit)
DELETE /articles/{id}         Delete article
```

`/parse` and `/generate` are separate so the frontend can show per-step progress and retry generation without re-uploading the file.

---

## Generation Pipeline

### Stage 1 — Parse (`POST /articles/parse`)

Using **python-docx**:
- Extract body paragraphs
- Extract tracked changes and inline comments (often contain key author insights)
- Extract embedded images → save to Supabase Storage at `articles/pending/images/`

**Long document handling:** If extracted text exceeds ~6 000 words:
1. Split into chunks of ~1 500 words
2. Summarise each chunk with GPT-4o-mini
3. Concatenate summaries + key verbatim excerpts for Stage 2

**Multi-experience detection:** If the notes appear to contain multiple distinct experiences (detected by prompt heuristic), return a `warning: "multiple_experiences"` flag. Frontend shows: *"These notes seem to cover more than one experience. For best results, split into separate files."*

### Stage 2 — Generate (`POST /articles/generate`)

GPT-4o with **Structured Outputs** (Pydantic schema). The system prompt includes:
- Seek Sophie editorial voice (from `app_config.house_style_notes`)
- Target word count (from `app_config.word_count_target`)
- Strict grounding rule: *"Only use information present in the provided notes. If a field cannot be filled from the notes, return null. Never invent facts, prices, dates, or safety information. For each field, set sourced: false if you had to infer or extrapolate."*

**Pydantic output schema:**

```python
class SourcedField(BaseModel):
    value: str | None
    sourced: bool
    source_ref: str | None  # verbatim snippet from original notes

class BodySection(BaseModel):
    section_title: str
    content: str
    source_ref: str | None

class ArticleOutput(BaseModel):
    title: SourcedField
    hook: SourcedField
    body: list[BodySection]
    best_for: SourcedField
    not_for: SourcedField
    ethics_notes: SourcedField | None
    key_facts: dict[str, SourcedField]  # flexible: price, duration, season, etc.
```

On failure: retry once. If the second attempt fails, return HTTP 500 with a retry-friendly error.

**Pydantic → DB mapping:** The Pydantic model wraps each field's value and sourcing metadata together. When saving to Postgres, the FastAPI service splits them: plain values go into their respective columns (`title`, `hook`, `best_for`, etc.), and all sourcing metadata is collapsed into the single `sourced_fields` jsonb column as `{field_name: {sourced: bool, source_ref: text}}`. The two representations are always kept in sync on every save.

### Stage 3 — Save (`POST /articles`)

- Article row written to Supabase with `status: 'draft'`
- Images moved from `articles/pending/` to `articles/{article_id}/images/` in Supabase Storage
- `word_count_target` snapshot written to the article row

---

## Hallucination Handling

Fields with `sourced: false` are displayed in the editor with an **amber highlight** and a tooltip: *"This wasn't found directly in your notes — please verify before publishing."*

Authors must actively dismiss or correct amber fields. Publishing an article with unsourced fields shows a confirmation dialog: *"X fields are unverified. Publish anyway?"*

---

## Editor UI — Split View (50/50)

```
┌─────────────────────────────────────────────────┐
│  ← All Articles          Saving…  [Regen] [Pub] │  ← toolbar
├────────────────────────┬────────────────────────┤
│  FIELDS                │  PREVIEW               │
│                        │                        │
│  Title          [edit] │  Komodo by Boat:       │
│  Hook           [edit] │  A Week in the Wild    │
│                        │  ─────                 │
│  Body Sections         │  There's a moment...   │
│  ▸ Getting There       │                        │
│  ▸ The Dragons         │  Getting There         │
│  ▸ Snorkelling...      │  Fly into Labuan...    │
│                        │                        │
│  Best For      [amber] │  ✦ Best for wildlife   │
│  Not For        [edit] │  ✗ Not for: luxury     │
│                        │                        │
│  Key Facts      [edit] │  💰 $120–180  ⏱ 5–7d  │
│  Images         [list] │  [image thumbnails]    │
│                        │                        │
└────────────────────────┴────────────────────────┘
```

- **Toolbar left:** `← All Articles` link navigates back to `/dashboard`
- Each field is inline-editable (click to edit)
- Preview re-renders live as fields are edited
- `PATCH /articles/{id}` called on field blur (auto-save when author moves away from a field) and on explicit Save button click
- Amber = `sourced: false` — author must verify
- Regenerate button disabled and greyed at limit (3/3)

## New Article Page (`/articles/new`)

- `← All Articles` link at the top navigates back to `/dashboard`
- Page heading: "New article"
- Subheading: "Upload your notes and we'll generate a structured magazine article."
- `.docx` upload widget below the heading

---

## Regeneration

- `regeneration_count` persisted per article
- FastAPI returns HTTP 429 at limit: *"Regeneration limit reached (3/3)"*
- Each regeneration overwrites article fields (no version history in v1)
- Count displayed in the editor: *"Regenerate (1/3 used)"*

---

## Image Handling

- Embedded images extracted from `.docx` during parse, stored in Supabase Storage
- Stored as `{url, filename, caption: null}` in `articles.images[]`
- Displayed in the preview panel as a thumbnail strip
- Authors can add captions per image in v1; section assignment is manual (out of scope v1)

---

## Edge Cases

| Case | Handling |
|---|---|
| Empty / near-empty doc (< 100 words) | Reject at parse with clear message |
| Multiple experiences in one doc | Warning flag returned; frontend shows advisory |
| Very long doc (> 6 000 words) | Chunk → summarise with GPT-4o-mini → generate |
| Images only, no text | Empty text check → error: "No readable text found" |
| Password-protected `.docx` | python-docx exception caught → "Remove password protection and re-upload" |
| Non-English notes | Prompt explicitly instructs output in English; input language is irrelevant |
| Tracked changes / comments | Extracted alongside body text and included in parsed payload |
| GPT-4o timeout / malformed response | Retry once; on second failure return 500 with a frontend retry button |
| Regeneration limit reached | HTTP 429, button disabled in UI |
| Unsourced fields at publish | Confirmation dialog listing unverified fields |

---

## Error Handling

- Parse errors: 422 with user-facing message shown inline
- Generation errors: 500 with a retry button (parsed text preserved in frontend state)
- Auth errors: 401, redirect to `/login`
- Not found: 404
- Regeneration limit: 429 with remaining count
- All error responses: `{error: string, code: string}`

---

## Deployment

| Service | Platform |
|---|---|
| Next.js frontend | Vercel |
| FastAPI backend | Railway or Fly.io (Dockerised) |
| Database + Auth + Storage | Supabase Cloud |
| LLM | OpenAI API (GPT-4o + GPT-4o-mini) |

**Environment variables:**

Frontend (Vercel):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` (FastAPI base URL)

Backend (Railway):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` (secret key from Settings → API Keys)
- `OPENAI_API_KEY`

---

## Out of Scope (v1)

- CMS / website publishing integration
- Admin panel for invite management (use Supabase dashboard)
- Article version history / revert
- Multi-author collaboration on a single article
- Image-to-section assignment
- Article search or filtering
- Reviewer / approver role
