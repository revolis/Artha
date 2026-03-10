# Integrations

## Firebase
- Use Firebase Authentication for email/password login.
- Use Cloud Firestore for all application data.
- Use Firebase Admin SDK only in server/API code.

Required env vars:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Optional client env vars:
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`

## Google Drive
- OAuth 2.0 for uploads + Google Picker
- Scope: `drive.file`
- Store only metadata + Drive file IDs in Firestore
- Store refresh token server-side only (`drive_tokens` collection)

Required env vars:
- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`
- `GOOGLE_DRIVE_REDIRECT_URI`
- `NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY`
- `NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID`

## OpenAI
- Uses API route `/api/ai/insights` for analysis generation.

Required env vars:
- `OPENAI_API_KEY`
