# Requirements

## Functional Requirements
- CRUD for entries, categories, sources, tags, goals, portfolio snapshots
- Analytics computed from cloud DB and update instantly on changes
- Attachments uploaded to Google Drive; store metadata + file ID only
- Use Google Drive OAuth + Picker (drive.file scope)
- Private Mode masks all numeric values across UI (charts show shape only)
- Currency display mode: USD, NPR, Both
- FX mode: Stored/manual only (no live FX yet)
- Trading details shown only for Trading category
- Reports export: CSV and JSON backups
- Shareable reports with enable/disable and hide notes/sources toggles
- Gemini insights chat: numbers + notes only, no attachments

## Non-Functional Requirements
- Cloud persistence only; no business data in localStorage/IndexedDB
- In-memory cache allowed and cleared on refresh
- Secrets stored server-side; access via Edge Functions
- Data model and auth should be multi-user ready

## Currency and FX Rules
- Base currency: USD
- Store fx_rate_used per entry for historical accuracy
- NPR conversions use stored fx_rate_used and/or a manual global rate

## Privacy and Security
- No passcode/biometrics
- Private Mode toggle via eye icon
- Share tokens must be unguessable and revocable

## Integrations
- Google Drive: upload originals; keep forever; store file IDs
- Gemini: Edge Function only; context limited to numbers + notes
- FX provider: none for now (manual rate only)

## Acceptance Tests (High Level)
- Create/edit/delete entry updates analytics without refresh
- Refresh retains all data from cloud DB
- No app data in browser storage
- Attachment upload creates DB record with Drive file ID
- Trading details appear only for Trading category
- Heatmap net P/L auto-scales intensity
- Exports generate correct CSV/JSON; share link respects settings
- Gemini chat never includes attachment content
