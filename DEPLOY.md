# Deployment

## Prerequisites

- Supabase project created at supabase.com
- Railway account at railway.app
- Vercel account at vercel.com

## 1. Supabase Setup

1. Create a new Supabase project
2. Go to SQL Editor → run `supabase/migrations/001_initial_schema.sql`
3. Go to SQL Editor → run `supabase/migrations/002_storage_bucket.sql`
4. Disable public signups: Authentication → Settings → Disable "Enable email signups"
5. Note your project URL and API keys (Settings → API Keys)

## 2. Deploy Backend to Railway

1. Go to railway.app → New Project → Deploy from GitHub
2. Select the `travel-magazine` repo, root directory: `backend`
3. Add environment variables:
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_SERVICE_KEY` = your secret key (Settings → API Keys → Secret keys)
   - `OPENAI_API_KEY` = your OpenAI API key
   - `FRONTEND_URL` = (set after Vercel deploy)
4. Railway auto-detects Dockerfile and builds
5. Copy the generated Railway URL (e.g. `https://travel-magazine-api-production.railway.app`)

## 3. Deploy Frontend to Vercel

1. Go to vercel.com → New Project → Import from GitHub
2. Select `travel-magazine` repo, root directory: `frontend`
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
   - `NEXT_PUBLIC_API_URL` = your Railway URL from step 2
4. Deploy → copy the Vercel URL

## 4. Finalize

1. Update Railway env var: `FRONTEND_URL` = your Vercel URL → redeploy
2. Supabase → Authentication → URL Configuration:
   - Site URL: `<Vercel URL>`
   - Redirect URLs: `<Vercel URL>/**`

## 5. Invite First Author

Supabase dashboard → Authentication → Users → Invite user → enter author email

## Smoke Test

1. Open Vercel URL → should redirect to /login
2. Enter your email → receive magic link → click it → lands on /dashboard
3. Click "New article" → upload a .docx → verify parse → generate flow
4. Check split-view editor loads with amber highlights on unsourced fields
5. Edit a field → blur → verify "Saving…" indicator
6. Click Publish → confirm unsourced dialog if applicable
