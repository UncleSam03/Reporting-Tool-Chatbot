# Deploying on Vercel

This project deploys as a **Flask serverless** app via `@vercel/python` (`app.py` entrypoint).

## What works on Vercel

| Feature | Status |
|---------|--------|
| **Admin dashboard** (`/dashboard`, all sub-pages) | Works when Supabase env vars are set |
| **API metrics** (`/api/dashboard/*`) | Works with Supabase |
| **Static assets** (`/static/*`) | Works |
| **Health check** (`/api/health`) | Works |

## Required: Supabase on Vercel

Vercel has **no persistent disk**. SQLite (`reports.db`) does not work in production.

In **Vercel → Project → Settings → Environment Variables**, add:

| Variable | Notes |
|----------|--------|
| `SUPABASE_URL` | `https://ivhxkseutquczwoxevvu.supabase.co` |
| `SUPABASE_ANON_KEY` | Public anon key (dashboard browser client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret — server API + saving reports |

Apply to **Production**, **Preview**, and **Development**.

Run the migration once in Supabase SQL Editor:  
`supabase/migrations/20240521000000_create_reports.sql`

## Chatbot simulator limitation

The WhatsApp simulator (`/`) stores conversation state **in server memory**. On Vercel, each request may hit a **new** serverless instance, so the chatbot flow can **reset mid-session**.

- **Recommended:** Use the dashboard on Vercel; run the chatbot locally with `python app.py`.
- **Future:** Persist sessions in Supabase or client-side state.

## Word document download

Requires `HFF SUPPORT GROUP REPORTING TOOL.docx` in the repo (included). Generated files use `/tmp` on Vercel.

## Deploy

```bash
vercel
```

Or connect the GitHub repo in the Vercel dashboard for automatic deploys on push to `master`.

## Verify after deploy

1. `https://YOUR-PROJECT.vercel.app/api/health` → `"status": "ok"`, `"supabase_configured": true`
2. `https://YOUR-PROJECT.vercel.app/dashboard` → KPIs load from Supabase

## Local vs Vercel

| | Local (`python app.py`) | Vercel |
|--|-------------------------|--------|
| Database | SQLite and/or Supabase | **Supabase only** |
| Chatbot sessions | Reliable | Unreliable |
| Dashboard | Yes | Yes (with Supabase) |
