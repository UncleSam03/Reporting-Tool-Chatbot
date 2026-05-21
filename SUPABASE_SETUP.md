# Supabase Setup for HFF Dashboard

## Quick status check

From the project root (PowerShell):

```powershell
.\scripts\check-supabase-cli.ps1
```

This reports CLI install, Docker, migrations, `.env` keys, and whether the project is linked.

---

## Supabase CLI (enabled in this repo)

### Install CLI (already done if `.bin/supabase.exe` exists)

**Option A — Local install (recommended, no admin):**

```powershell
.\scripts\install-supabase-cli.ps1
```

**Option B — Scoop (global PATH):**

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
iwr -useb get.scoop.sh | iex
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Option C — npm (project dev dependency):**

```powershell
npm install
npx supabase --version
```

### Use the CLI in this project

```powershell
# Shorthand (local binary)
.\.bin\supabase.exe --version

# Or npm script (after npm install)
npm run supabase -- --version
```

### Project layout

| Path | Purpose |
|------|---------|
| `supabase/config.toml` | Local dev ports, auth, API settings |
| `supabase/migrations/` | Schema migrations (versioned) |
| `supabase/seed.sql` | Optional seed data on `db reset` |
| `.bin/supabase.exe` | Local CLI binary (gitignored) |

---

## 1. Create a Supabase cloud project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. Open **Project Settings → General** and copy the **Project ID** (reference).
3. Open **Project Settings → API** and copy:
   - Project URL → `SUPABASE_URL`
   - `anon` `public` key → `SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Configure environment

```powershell
Copy-Item .env.example .env
# Edit .env with your real keys (not placeholders)
```

---

## 3. Link CLI to your cloud project

```powershell
.\.bin\supabase.exe login
.\.bin\supabase.exe link --project-ref YOUR_PROJECT_REF
```

`YOUR_PROJECT_REF` is the Project ID from the dashboard (e.g. `abcdefghijklmnop`).

Verify link:

```powershell
.\.bin\supabase.exe projects list
.\scripts\check-supabase-cli.ps1
```

---

## 4. Push migrations to cloud

After linking:

```powershell
.\.bin\supabase.exe db push
```

This applies `supabase/migrations/20240521000000_create_reports.sql` to your remote database.

**Alternative (manual):** paste the migration SQL into the Supabase **SQL Editor** and run it.

---

## 5. Local development (optional)

Requires **Docker Desktop running**.

```powershell
.\.bin\supabase.exe start      # Start local Postgres, Studio, etc.
.\.bin\supabase.exe status     # URLs and keys for local stack
.\.bin\supabase.exe db reset   # Apply migrations + seed.sql
.\.bin\supabase.exe stop
```

Local Studio: http://127.0.0.1:54323

List local migrations:

```powershell
.\.bin\supabase.exe migration list --local
```

---

## 6. Run the app and dashboard

```powershell
pip install -r requirements.txt
python app.py
```

- Simulator: http://127.0.0.1:5000
- Dashboard: http://127.0.0.1:5000/dashboard

Completed chatbot reports sync to Supabase when `.env` keys are set.

---

## Common commands

| Command | Description |
|---------|-------------|
| `supabase login` | Authenticate CLI with Supabase |
| `supabase link` | Connect repo to cloud project |
| `supabase db push` | Push migrations to linked project |
| `supabase db pull` | Pull remote schema into a new migration |
| `supabase db diff` | Generate migration from schema diff |
| `supabase migration new name` | Create a new empty migration file |
| `supabase db advisors` | Security/performance lint (CLI 2.81.3+) |

---

## Security note

The migration includes a permissive `SELECT` policy for demo use. For production, replace with authenticated admin policies and remove public read access.
