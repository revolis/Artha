# Rabin Finance OS (working name)

## Goal
Build a web-only, single-user personal finance app that tracks profit/loss, portfolio value, targets, analytics, reporting, and AI insights. Data must persist in a cloud database with no browser storage of business data.

## Product Scope
- Profit/Loss tracking with notes and attachments (Google Drive)
- Portfolio value over time
- Targets by year/quarter/month/week/day
- Analytics with premium charts
- USD base currency with NPR conversion (manual FX per entry, optional default rate)
<<<<<<< HEAD
- AI insights chat using OpenAI (numbers + notes only)
=======
- AI insights chat using Gemini (numbers + notes only)
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
- Year heatmap (GitHub-style) for net P/L
- Tax and fee reporting
- Export CSV/JSON backups and shareable reports
- Professional premium light theme with Private Mode (eye icon)

## Users and Roles
- Single user now (Rabin)
- Architecture should be multi-user ready later (no UI yet)

## Key Constraints (Must-Haves)
<<<<<<< HEAD
- Cloud persistence only (Firebase Cloud Firestore)
=======
- Cloud persistence only (Supabase Postgres)
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
- No business data in localStorage/IndexedDB
- Any caching must be in-memory only or server-side
- Attachments stored in Google Drive; keep originals forever
- Store attachment metadata + Drive file IDs only
<<<<<<< HEAD
- OpenAI API only via server-side API routes and secrets
=======
- Gemini API only via server-side Edge Functions and secrets
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
- Trading detail fields only for Trading category
- Private Mode hides amounts across UI (no passcode)

## Recommended Stack
- Frontend: Next.js (App Router) + TypeScript + Tailwind + Recharts
- UI primitives: Radix + shadcn/ui-style components
<<<<<<< HEAD
- Backend: Firebase (Auth + Cloud Firestore + Admin SDK)
- Storage: Google Drive API (drive.file + Picker + OAuth)
- AI: OpenAI via server-side API routes
=======
- Backend: Supabase (Postgres + Auth + Edge Functions)
- Storage: Google Drive API (drive.file + Picker + OAuth)
- AI: Gemini via Supabase Edge Functions
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
- FX: Manual NPR rate stored per entry (no live FX for now)

## Core Features by Page
### Dashboard
- KPI cards: Net P/L, Profit, Loss, Fees, Taxes, Goal progress, Portfolio value
- Date range selector + presets
- Charts: Net P/L over time, Category contribution, Portfolio value
- Quick add: Entry, Portfolio snapshot
- Private Mode eye icon

### Add / Edit Entry
- Date/time, type (profit/loss/fee/tax/transfer)
- Category (system + custom), source, amount (USD base + optional original)
- Notes (rich text), tags, attachments (Drive)
- Conditional: Trading details
- Power: recurring entries (optional), split entries

### Portfolio
- Manual snapshots
- Value over time chart
- Performance and ROI from baseline

### Analytics
- Grouping: day/week/15d/month/quarter/6m/year
- Period comparison
- Breakdowns by category/source/tags
- Best/worst days, volatility/consistency

### Year Heatmap
- GitHub-style net P/L grid
- Auto-scaled intensity
- Tooltip details

### Goals / Targets
- Timeframe and target type
- Progress and pace required
- Optional category-specific goals

### Tax & Fees
- Summary totals
- Breakdowns by category and exchange (if Trading)
- Export CSV/JSON

### Reports (Export + Share)
- CSV and JSON exports
- Shareable report view with toggles

### Sources & Categories
- CRUD for categories (system locked + custom)
- CRUD for sources
- Tag manager

<<<<<<< HEAD
### AI Insights
- Chat UI with suggested prompts
- Context: numbers + notes only
- No attachments
- Server-side API route calls
=======
### Gemini Insights
- Chat UI with suggested prompts
- Context: numbers + notes only
- No attachments
- Server-side Edge Function calls
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688

## Non-goals (Now)
- Multi-user sharing/collab
- Broker/exchange auto-sync
- OCR on attachments
- Offline mode

## Acceptance Criteria
- CRUD on entries updates analytics instantly from cloud DB
- Refresh does not lose data
- No P/L/portfolio/goal data stored in browser storage
- Drive uploads create attachment records
- Currency display uses stored/manual FX only
- Trading details only for Trading category
- Heatmap auto-scales intensity
- Exports and share links respect permissions
<<<<<<< HEAD
- AI chat uses only numbers + notes
=======
- Gemini chat uses only numbers + notes
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688

## Open Questions
- Should the manual NPR rate be stored as a default in UserSettings for new entries?
