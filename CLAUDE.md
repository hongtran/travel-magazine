# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (FastAPI — `backend/`)

```bash
cd backend
poetry install                                          # install deps
poetry run uvicorn app.main:app --reload --port 8000   # dev server
poetry run pytest                                       # all tests
poetry run pytest tests/test_generator.py              # single test file
poetry run pytest tests/test_pipeline.py::test_parse_ok  # single test
```

### Frontend (Next.js — `frontend/`)

```bash
cd frontend
pnpm install     # install deps
pnpm dev         # dev server on :3000
pnpm build       # production build (type-checks)
```

No lint or format scripts are configured. TypeScript errors surface via `pnpm build`.

---

## Architecture

Two separate services — a Next.js frontend and a FastAPI backend — sharing Supabase for auth, database, and file storage.

```
Next.js (port 3000)      FastAPI (port 8000)       Supabase
────────────────         ──────────────────         ────────
Supabase Auth    ──JWT──► JWT middleware             auth.users
/articles/new    ───────► POST /articles/parse  ───► Storage (docx + images)
                 ───────► POST /articles/generate ──► Postgres articles table
/articles/[id]   ───────► PATCH /articles/{id}
```

**Auth:** The frontend authenticates users through Supabase (magic link / invite-only). Every API call to FastAPI includes `Authorization: Bearer <jwt>`. FastAPI validates JWTs via Supabase's JWKS endpoint (ES256 — `auth.py`) — no shared secret needed.

**Frontend never reads article data directly from Supabase.** All article reads and writes go through FastAPI. Supabase is frontend-only for auth (`createClient()` in `lib/supabase.ts`).

---

## Key Subsystems

### Two-Step Generation Pipeline (`backend/app/routers/pipeline.py`)

1. `POST /articles/parse` — receives `.docx`, extracts text + inline comments via `python-docx` (falls back to `mammoth`), uploads the file to Supabase Storage, optionally chunks + summarises with GPT-4o-mini if >6 000 words.
2. `POST /articles/generate` — takes the parsed text, calls GPT-4o with Structured Outputs (`ArticleOutput` Pydantic model), saves the article row to Supabase, returns `{id, article}`.

These are kept separate so the frontend can show per-step progress and retry generation without re-uploading.

### OpenAI Structured Outputs — critical constraints

- Use `response.choices[0].message.parsed` (not `response.parsed`) with SDK v2.
- `key_facts` in `ArticleOutput` is `list[KeyFact]` — **not** `dict[str, SourcedField]`. OpenAI Structured Outputs rejects `dict` types with arbitrary string keys. Each `KeyFact` has `{key, value, sourced, source_ref}`.
- When saving to Postgres, `_to_db_row` converts `key_facts: list[KeyFact]` → `{key: value}` dict for the `key_facts` column and writes sourcing metadata into the single `sourced_fields` jsonb column.

### Sourced-fields dual representation

The Pydantic model carries `{value, sourced, source_ref}` per field. On save, the backend splits this into:
- Flat columns: `title`, `hook`, `best_for`, `not_for`, `key_facts` (values only)
- `sourced_fields` jsonb: `{field_name: {sourced: bool, source_ref: str}}`

Both must stay in sync on every save.

### Frontend State (`frontend/src/store/article.ts`)

Four Jotai atoms:
- `articleAtom` — currently loaded article
- `isSavingAtom` — triggers "Saving…" indicator
- `parsedTextAtom` — raw extracted text from the parse step (needed for regeneration)
- `pendingFileUrlAtom` — Supabase Storage path to the uploaded `.docx`

**`parsedTextAtom` is in-memory only.** It is set during the upload flow and cleared on navigation. If the user navigates away and returns, `parsedText` is `null` and the Regenerate button becomes permanently disabled for that session.

### Editor Auto-save

There is no explicit "Save Draft" button. `FieldEditor` calls `onSave(draft)` on blur, which triggers `PATCH /articles/{id}`. The `KeyFactsEditor` and `BodySectionList` call their `onChange` prop on every change, which also calls `save()`.

### Auth Confirm Flow (`frontend/src/app/auth/confirm/page.tsx`)

Supabase invite links redirect to `/auth/confirm#access_token=...`. The page reads the hash, calls `supabase.auth.setSession()` to store the session in cookies (required for SSR), then redirects to `/dashboard`.

### Route Protection (`frontend/src/middleware.ts`)

All routes except `/login` and `/auth/*` require a valid Supabase session. Unauthenticated requests are redirected to `/login`; authenticated requests to `/login` are redirected to `/dashboard`.

---

## Environment Variables

**Backend (`backend/.env`):**
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` — uses service role (bypasses RLS)
- `OPENAI_API_KEY`
- `FRONTEND_URL` — added to CORS allowlist

**Frontend (`frontend/.env.local`):**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` — FastAPI base URL (e.g. `http://localhost:8000`)

---

## Database Migrations

SQL files are in `supabase/migrations/`. Run them in order via the Supabase dashboard SQL editor. There is no migration CLI wired up.

## Deployment

Backend → Railway (Dockerfile in `backend/`). Frontend → Vercel (root dir `frontend/`). See `DEPLOY.md` for the full checklist.
