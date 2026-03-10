# Rabin Finance OS

Next.js App Router + TypeScript + Tailwind UI scaffold for a premium personal finance OS.

## Quick start
```bash
npm install
npm run dev
```

## Env setup
Copy `.env.example` to `.env.local` and fill in Firebase + Google Drive + OpenAI secrets.
For Google Drive Picker, set `NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY` and `NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID`.

## Firebase setup
- Configure Firebase Authentication (Email/Password).
- Configure Firestore and ensure Admin SDK credentials are set in `.env.local`.
- The app accesses Firestore through server API routes.

## Notes
- All business data must stay in Firebase/Firestore (no localStorage/IndexedDB).
- Private Mode masks numeric values across the UI.
- Google Drive uploads must store file IDs only.
- Firebase Auth is required; use the `/login` page for sign-in/sign-up.
- Portfolio snapshots are auto-derived from entries when no snapshots exist.
