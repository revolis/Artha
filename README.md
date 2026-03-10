# Rabin Finance OS

<<<<<<< HEAD
Next.js App Router + TypeScript + Tailwind app for personal wealth management.
=======
Next.js App Router + TypeScript + Tailwind UI scaffold for a premium personal finance OS.
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688

## Quick start
```bash
npm install
npm run dev
```

<<<<<<< HEAD
## Environment setup
1. Copy `.env.example` to `.env.local`.
2. Fill Firebase client and admin env vars.
3. Fill Google Drive and OpenAI env vars if you use those features.

## Firebase scope
- Firebase Authentication (email/password)
- Cloud Firestore (all app data)
- Firebase Admin SDK is used server-side in API routes

## Firestore collections
- `categories`
- `sources`
- `tags`
- `financial_years`
- `entries`
- `entry_tags`
- `trade_details`
- `attachments`
- `portfolio_snapshots`
- `goals`
- `user_settings`
- `reports`
- `drive_tokens`

## Security model
- API routes verify Firebase ID token on each authenticated request.
- Firestore access is performed server-side via Admin SDK.
- Client-to-Firestore direct access should remain disabled by rules.
- No business data in localStorage/IndexedDB.

## Notes
- Google Drive uploads store metadata and Drive file IDs only.
- Private Mode masks numeric values across the UI.
- Public shared reports are token-based (`/reports/shared/:token`).
=======
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
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
