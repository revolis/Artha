# Rabin Finance OS

Next.js App Router + TypeScript + Tailwind app for personal wealth management.

## Quick start
```bash
npm install
npm run dev
```

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
