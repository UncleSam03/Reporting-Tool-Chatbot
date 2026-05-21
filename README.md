# HFF Support Group Reporting Tool

Rule-based monthly report chatbot for support group facilitators, with a **WhatsApp simulator**, **neomorphic admin dashboard**, and optional **Supabase** backend.

**Repository:** [github.com/UncleSam03/Reporting-Tool-Chatbot](https://github.com/UncleSam03/Reporting-Tool-Chatbot)

---

## Features

- **WhatsApp Chatbot Simulator** — Dark-mode phone UI with quick-reply chips and multi-select challenges
- **Branching conversational flow** — Skips attendance fields when the group did not meet
- **Word report generation** — Fills `HFF SUPPORT GROUP REPORTING TOOL.docx` on completion
- **Admin dashboard** — Neomorphic KPI overview (`/dashboard`) aligned with `DESIGN.md`
- **SQLite + Supabase** — Local storage by default; cloud sync when `.env` is configured
- **Supabase CLI** — Migrations, local dev, and `db push` (see `SUPABASE_SETUP.md`)

---

## Quick start

### Prerequisites

- Python 3.10+
- (Optional) Node.js 20+ for `npx supabase`
- (Optional) Docker Desktop for `supabase start`

### Install and run

```bash
git clone https://github.com/UncleSam03/Reporting-Tool-Chatbot.git
cd Reporting-Tool-Chatbot
pip install -r requirements.txt
python app.py
```

| URL | Description |
|-----|-------------|
| http://127.0.0.1:5000 | WhatsApp simulator |
| http://127.0.0.1:5000/dashboard | Dashboard overview (from Stitch) |
| http://127.0.0.1:5000/dashboard/group-metrics | Group metrics |
| http://127.0.0.1:5000/dashboard/testimonies | Testimonies & impact |
| http://127.0.0.1:5000/dashboard/qualitative | Qualitative analysis |
| http://127.0.0.1:5000/dashboard/settings | Settings & exports |

### Optional: sample data

```bash
python seed_db.py
```

### Optional: Supabase

```bash
copy .env.example .env   # Windows
# Add SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

.\scripts\check-supabase-cli.ps1
.\.bin\supabase.exe login
.\.bin\supabase.exe link --project-ref YOUR_PROJECT_REF
.\.bin\supabase.exe db push
```

Full guide: [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md)

---

## Project structure

| Path | Description |
|------|-------------|
| `app.py` | Flask API, chatbot flow, Word export |
| `index.html` | WhatsApp simulator UI |
| `dashboard.html` | Admin dashboard UI |
| `database.py` | SQLite persistence |
| `supabase_db.py` | Supabase sync and metrics |
| `supabase/migrations/` | Postgres schema |
| `scripts/` | CLI install and health checks |
| `DESIGN.md` | Neomorphic UI design tokens |
| `code.html` | Dashboard design reference |

---

## Environment variables

Copy `.env.example` to `.env` (never commit `.env`):

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Project API URL |
| `SUPABASE_ANON_KEY` | Browser dashboard client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side report sync |

---

## Deployment (Vercel)

The app is configured for [Vercel](https://vercel.com) via `vercel.json` and `app.py`.

**On Vercel you must set Supabase environment variables** (no persistent SQLite). See [VERCEL.md](VERCEL.md) for the full checklist.

- Dashboard: `https://your-app.vercel.app/dashboard`
- Health: `https://your-app.vercel.app/api/health`
- Chatbot simulator: best run **locally** (serverless has no shared session memory)

---

## License

Private / internal use — confirm with project owner before redistribution.
