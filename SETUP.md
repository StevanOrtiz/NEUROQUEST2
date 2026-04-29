# QuestMind — Local Setup Guide

## What was fixed
- ✅ Replaced OpenAI/GPT-4o with **Claude** (claude-opus-4-5 via `@ai-sdk/anthropic`)
- ✅ All SQL scripts completely rewritten to match the actual code (columns, types, constraints)
- ✅ Added `profiles` auto-creation trigger on user sign-up
- ✅ Added missing RLS policies for `profiles`
- ✅ Fixed `getLevelProgress()` — the early `break` was skipping levels for high XP values
- ✅ Fixed the level calculation in `answer/route.ts` (same bug)
- ✅ Fixed accuracy stat calculation in dashboard
- ✅ Fixed `skip_question` power-up — now correctly updates `current_question_index` in the session and marks the question as answered in client state
- ✅ Implemented `double_xp` power-up (was silently doing nothing)
- ✅ Fixed `chest/route.ts` — added missing `icon` field to inventory insert
- ✅ Added fallback for empty chest reward pool
- ✅ Added input validation to answer and use-item routes
- ✅ Replaced SQL `004_chests_and_peadadarks.sql` with `004_inventory.sql` matching `inventory_items` table
dadadad
---

## Prerequisites

- **Node.js** 20+ (install from https://nodejs.org or use `nvm`)
- **pnpm** — `npm install -g pnpm`
- A free **Supabase** account (https://supabase.com)
- An **Anthropic API key** (https://console.anthropic.com)

---

## Step 1 — Clone & Install

```bash
# Copy the project folder to wherever you want it, then:
cd questmind
pnpm install
```

---

## Step 2 — Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click **New project**, fill in a name, password, and choose a region
3. Wait ~1 minute for it to provision
4. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 3 — Run the Database Migrations

In the Supabase dashboard, go to **SQL Editor** and run each script in order:

1. Paste and run `scripts/001_profiles.sql`
2. Paste and run `scripts/002_game_sessions.sql`
3. Paste and run `scripts/003_questions.sql`
4. Paste and run `scripts/004_inventory.sql`

> ⚠️ Run them **in order** — later scripts reference tables from earlier ones.

### Enable Email Auth (if not already enabled)
Go to **Authentication → Providers → Email** and make sure it's enabled.

### (Optional) Disable Email Confirmation for local dev
Go to **Authentication → Settings** → turn off **"Confirm email"** so you can log in instantly without checking your email.

---

## Step 4 — Configure Environment Variables

Copy the example file:
```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Where to get the Anthropic key:**
1. Go to https://console.anthropic.com/settings/keys
2. Click **Create Key**, copy it
3. Paste it as `ANTHROPIC_API_KEY`

---

## Step 5 — Run the Dev Server

```bash
pnpm dev
```

Open http://localhost:3000 in your browser.

---

## Step 6 — Create an Account & Test

1. Go to http://localhost:3000 and click **Registrarse**
2. Fill in your name, email, and password → submit
3. If email confirmation is disabled, you can log in immediately
4. On the dashboard, drag a PDF file onto the upload card
5. Choose a difficulty and click **Iniciar Batalla**
6. Wait ~10–15 seconds for Claude to generate the questions
7. Play through the quiz!

---

## Common Errors

| Error | Fix |
|-------|-----|
| `relation "game_sessions" does not exist` | Run the SQL scripts in Supabase SQL Editor |
| `No autenticado` on API calls | Make sure you're logged in and the Supabase env vars are correct |
| `ANTHROPIC_API_KEY is not set` | Check your `.env.local` file — restart `pnpm dev` after editing |
| `Error al procesar el PDF` | Make sure the PDF has readable text (not a scanned image). Also check the Anthropic API key |
| Sign-up redirects to error page | In Supabase → Authentication → Settings, set Site URL to `http://localhost:3000` |
| Profile doesn't appear after sign-up | Make sure you ran `001_profiles.sql` which includes the auto-create trigger |

---

## Project Structure

```
app/
  api/game/
    create/     ← Uploads PDF, calls Claude, saves questions
    answer/     ← Validates answers, updates XP/lives/status
    chest/      ← Opens reward chest after victory
    use-item/   ← Applies power-up effects
  auth/         ← Login, sign-up pages
  dashboard/    ← Main hub, inventory, profile
  game/[id]/    ← The actual quiz gameplay

components/
  game/         ← GameClient, QuestionCard, HUD, PowerUpBar, GameOver
  dashboard/    ← DashboardContent, PdfUploadCard, StatsCard, Nav

lib/
  types.ts      ← All TypeScript types + DIFFICULTY_CONFIG + getLevelProgress
  supabase/     ← Supabase client helpers

scripts/
  001_profiles.sql
  002_game_sessions.sql
  003_questions.sql
  004_inventory.sql
```
