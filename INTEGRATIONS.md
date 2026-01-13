# Integrations

## Supabase
- Use Supabase Postgres + Auth + Edge Functions
- All app data persisted in Supabase
- No business data in browser storage

Suggested env vars:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server-only)

## Google Drive
- OAuth 2.0 for Drive uploads + Google Picker
- Scope: drive.file only
- Store only file metadata + file ID in DB
- Keep originals forever (no compression)
- Store refresh token server-side only

Suggested env vars:
- GOOGLE_DRIVE_CLIENT_ID
- GOOGLE_DRIVE_CLIENT_SECRET
- GOOGLE_DRIVE_REDIRECT_URI
- NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY
- NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID

## Gemini
- Use Supabase Edge Function to call Gemini
- Context: aggregated numbers + notes only

Suggested env vars:
- GEMINI_API_KEY
