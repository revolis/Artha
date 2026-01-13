# Rabin Finance OS

Next.js App Router + TypeScript + Tailwind UI scaffold for a premium personal finance OS.

## Quick start
```bash
npm install
npm run dev
```

## Env setup
Copy `.env.example` to `.env.local` and fill in Supabase + Google Drive + Gemini secrets.
For Google Drive Picker, set `NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY` and `NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID`.

## Supabase schema
- Run `supabase/schema.sql` in the Supabase SQL editor.
- Optional: run `supabase/seed.sql` once for system categories.
  - Re-run `supabase/schema.sql` if you want Google Drive token storage (drive_tokens table).

## Notes
- All business data must stay in Supabase (no localStorage/IndexedDB).
- Private Mode masks numeric values across the UI.
- Google Drive uploads must store file IDs only.
- Supabase Auth is required; use the `/login` page for sign-in/sign-up.
- Portfolio snapshots are auto-derived from entries when no snapshots exist.
