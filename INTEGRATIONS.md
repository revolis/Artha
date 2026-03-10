# Integrations

## Firebase
- Use Firebase Auth for login/signup
- Use Firestore (via server-side API routes) for all app data
- No business data in browser storage

Suggested env vars:
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY (server-only)

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

## OpenAI
- Use server-side API route to call OpenAI
- Context: aggregated numbers + notes only

Suggested env vars:
- OPENAI_API_KEY
