# Magazine Studio

An AI-powered article generator for travel magazines. Authors upload rough `.docx` notes and receive a structured, editor-ready article draft via GPT-4o — complete with hook, body sections, key facts, and sourcing indicators to flag anything that needs verification before publishing.

## Features

- Upload `.docx` travel notes → AI generates a structured magazine article
- Split-view editor: editable fields on the left, live magazine preview on the right
- Hallucination guardrails: fields the AI couldn't ground in your notes are highlighted in amber
- Regenerate up to 3 times per article
- Publish confirmation dialog lists any unverified fields
- Images extracted from `.docx` and attached to the article
- Invite-only access via Supabase magic link

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind v4, shadcn/ui, Jotai |
| Backend | FastAPI (Python 3.12), python-docx, mammoth |
| AI | OpenAI GPT-4o (structured outputs), GPT-4o-mini (chunking) |
| Auth / DB / Storage | Supabase |
| Frontend deploy | Vercel |
| Backend deploy | Railway (Docker) |

## Project structure

```
travel-magazine/
├── backend/               # FastAPI app
│   ├── app/
│   │   ├── main.py
│   │   ├── auth.py        # Supabase JWT validation
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── models/
│   │   ├── routers/       # articles, pipeline
│   │   └── services/      # parser, chunker, generator, storage
│   ├── tests/
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/              # Next.js app
│   └── src/
│       ├── app/           # login, dashboard, articles/new, articles/[id]
│       ├── components/    # article editor components
│       ├── lib/           # api client, supabase client, types
│       └── store/         # Jotai atoms
├── supabase/
│   └── migrations/        # SQL migration files
├── railway.json
└── DEPLOY.md              # Production deployment checklist
```

## Prerequisites

- Node.js 20+ and pnpm
- Python 3.12+
- [Poetry](https://python-poetry.org/docs/#installation)
- Docker (optional, for local container testing)
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key

---

## Local setup

### 1. Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the two migration files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_storage_bucket.sql`
3. Go to **Authentication → URL Configuration** and add `http://localhost:3000` to **Redirect URLs**
4. Invite an author: **Authentication → Users → Invite user**

Collect these values from your Supabase project settings:

| Setting | Where to find it |
|---|---|
| Project URL | Settings → API → Project URL |
| Anon key | Settings → API → Project API keys → `anon public` |
| Service role key | Settings → API → Project API keys → `service_role` |
| JWT secret | Settings → API → JWT Settings → JWT Secret |

### 2. Backend

```bash
cd backend

# Install dependencies
poetry install

# Create env file
cp .env.example .env
```

Edit `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=sk-...
FRONTEND_URL=http://localhost:3000
```

Start the server:

```bash
poetry run uvicorn app.main:app --reload --port 8000
```

API is now running at `http://localhost:8000`. Health check: `http://localhost:8000/health`

Run tests:

```bash
poetry run pytest
```

### 3. Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Create env file
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the dev server:

```bash
pnpm dev
```

Frontend is now running at `http://localhost:3000`.

---

## How it works

1. **Login** — Author receives a magic link invitation from Supabase; clicks it to authenticate
2. **Upload** — Author uploads a `.docx` file on `/articles/new`
3. **Parse** — Backend extracts text, inline comments, tracked changes, and embedded images
4. **Generate** — GPT-4o produces a structured article (hook, body sections, best_for, not_for, key facts); each field includes a `sourced: bool` flag
5. **Edit** — Split-view editor lets authors refine fields; amber highlight marks unverified content
6. **Publish** — Confirmation dialog lists any unverified fields before publishing

### Long documents

If the uploaded notes exceed ~6,000 words, the backend chunks the text and summarises each chunk with GPT-4o-mini before passing the condensed version to GPT-4o.

### Hallucination protection

Every AI-generated field carries `sourced: true/false`. Fields the model had to infer or extrapolate are marked `sourced: false` and shown with an amber highlight in the editor. Authors must review these before publishing.

---

## Docker (local)

Build and run the backend as a container from the repo root:

```bash
docker build -f backend/Dockerfile .
docker run -p 8000:8000 --env-file backend/.env <image-id>
```

---

## Deployment

See [DEPLOY.md](./DEPLOY.md) for the full Railway + Vercel deployment checklist.

**Backend (Railway):** Connect your repo, set root service to use `backend/Dockerfile`, add the five env vars from `.env.example`.

**Frontend (Vercel):** Connect your repo, set root directory to `frontend`, add the three env vars from `.env.local.example`.
