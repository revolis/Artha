# Project Architecture Notes

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + Radix UI primitives
- Firebase Authentication (email/password)
- Cloud Firestore (data persistence)
- Firebase Admin SDK in server routes
- Google Drive OAuth for attachments
- OpenAI API for AI insights

## Core structure
- `src/app/*`:
  - pages + API routes
- `src/components/*`:
  - UI and feature components
- `src/lib/firebase/*`:
  - Firebase env, client, admin, auth header helpers, query helpers

## Auth and data flow
- Client obtains Firebase ID token from Auth.
- Client API requests include `Authorization: Bearer <id_token>`.
- Server API routes verify the ID token via Firebase Admin Auth.
- API routes read/write Firestore collections via server-side db client.

## Security model
- Firestore rules default to deny client read/write.
- Business data access goes through authenticated API routes.
- Ownership checks are enforced in API handlers.

## Deployment
- Vercel-hosted web app
- Environment variables configured in Vercel project settings
