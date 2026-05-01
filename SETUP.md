# QuestMind - Local Setup Guide

## What This Project Uses

- Next.js with the App Router
- Supabase Auth and Postgres
- Anthropic Claude for PDF-based question generation
- npm as the package manager

## Prerequisites

- Node.js 20+
- npm 10+
- A Supabase project
- An Anthropic API key

## Step 1 - Install

```bash
cd questmind
npm install
```

## Step 2 - Create a Supabase Project

1. Go to https://supabase.com and sign in.
2. Create a new project.
3. In Settings > API, copy:
   - Project URL to `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 3 - Run Database Migrations

In Supabase SQL Editor, run the scripts in order:

1. `scripts/001_profiles.sql`
2. `scripts/002_game_sessions.sql`
3. `scripts/003_questions.sql`
4. `scripts/004_inventory.sql`
5. `scripts/005_chests.sql`
6. `scripts/006_subjects.sql`
7. `scripts/007_streak.sql`
8. `scripts/008_records_leaderboards.sql`
9. `scripts/009_sus_form.sql`
10. `scripts/010_tutorial.sql`
11. `scripts/011_ai_cost_optimization_prompt_cache.sql`
12. `scripts/012_adhd_screening_results.sql`
13. `scripts/013_user_usage_reports.sql`
14. `scripts/014_user_achievements.sql`
15. `scripts/015_personal_chest_tasks.sql`

Run them in order because later scripts reference earlier tables.

## Step 4 - Environment Variables

Create `.env.local` and fill in your own values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=

ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-4-5
ANTHROPIC_MAX_INPUT_CHARS=35000
ANTHROPIC_MAX_OUTPUT_TOKENS=2800
ANTHROPIC_PROMPT_CACHE=true
ANTHROPIC_CACHE_TTL=5m
AI_REUSE_GENERATED_QUESTIONS=true
ANTHROPIC_ALLOW_DIRECT_PDF_FALLBACK=false
```

Do not commit real API keys. If a real key was ever committed or shared, revoke it and create a new one.

## Step 5 - Run the Dev Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Vercel Settings

Use npm commands in Vercel:

- Install Command: `npm install`
- Build Command: `npm run build`
- Development Command: `npm run dev`

Add the same environment variables listed above in Project Settings > Environment Variables.

## PDF AI Cost Controls

The app extracts selectable text locally with `pdf-parse` before calling Claude. It no longer sends the complete PDF as base64 by default.

Cost controls:

- `ANTHROPIC_MAX_INPUT_CHARS` limits the text sent to Claude.
- Long PDFs are sampled from the beginning, middle, and end instead of using only the first pages.
- `ANTHROPIC_MODEL` defaults to `claude-haiku-4-5`.
- `ANTHROPIC_MAX_OUTPUT_TOKENS` defaults to `2800`.
- Prompt caching is requested on the stable PDF text block when the cacheable prefix is large enough for the selected model.
- Repeated uploads with the same user, PDF hash, difficulty, and enough existing questions reuse saved questions without calling Claude.
- Scanned PDFs are rejected by default with a clear error. Set `ANTHROPIC_ALLOW_DIRECT_PDF_FALLBACK=true` only if you explicitly accept the higher direct-PDF cost.

## Test Flow

1. Run `npm install`.
2. Run `npm run dev`.
3. Upload a selectable-text PDF for the first time.
4. Upload the same PDF with another difficulty within 5 minutes and check `ai_cache_read_input_tokens`.
5. Upload the same PDF with the same difficulty and check that `ai_source_mode = 'reused'` and no Claude call is needed.

## Project Structure

```text
app/
  api/game/create/     PDF upload, text extraction, Claude call, reuse, Supabase writes
  api/game/answer/     Validates answers, updates XP/lives/status
  dashboard/           Main hub and PDF upload UI
  game/[sessionId]/    Quiz gameplay

components/
  dashboard/pdf-upload-card.tsx
  game/

lib/
  ai/                  PDF text extraction, prompt caching, Claude question generation
  supabase/            Supabase client helpers
  types.ts             Shared app types

scripts/
  001_*.sql through 015_*.sql
```

## Common Errors

| Error | Fix |
| --- | --- |
| `relation "game_sessions" does not exist` | Run the SQL scripts in order in Supabase SQL Editor. |
| `No autenticado` | Log in and verify Supabase environment variables. |
| `ANTHROPIC_API_KEY is not set` | Add the key to environment variables and restart `npm run dev`. |
| `El PDF no tiene suficiente texto seleccionable` | Use a PDF with selectable text or OCR it before upload. |
| Sign-up redirects to error page | In Supabase Auth settings, set Site URL to `http://localhost:3000`. |
