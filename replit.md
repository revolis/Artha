# Rabin Finance OS

A personal finance command center built with Next.js 14, featuring financial dashboards, portfolio tracking, P/L analysis, and Gemini AI insights.

## Overview

This is a comprehensive personal finance management application that allows users to:
- Track financial entries (income, expenses, investments)
- Monitor portfolio performance
- View P/L analytics and trends
- Set and track financial goals
- Generate reports
- Get AI-powered insights via Gemini

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives with shadcn/ui
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Google Gemini API
- **External Integration**: Google Drive API

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── ai/           # Gemini AI endpoints
│   │   ├── analytics/    # Analytics data
│   │   ├── dashboard/    # Dashboard data
│   │   ├── entries/      # Financial entries CRUD
│   │   ├── goals/        # Goals management
│   │   ├── portfolio/    # Portfolio tracking
│   │   ├── reports/      # Report generation
│   │   └── settings/     # User settings
│   ├── entries/          # Entries pages
│   ├── goals/            # Goals pages
│   ├── portfolio/        # Portfolio pages
│   └── ...
├── components/            # React components
│   ├── ui/               # Base UI components (shadcn)
│   ├── charts/           # Chart components
│   └── ...
├── lib/                   # Utilities and helpers
│   ├── supabase/         # Supabase client and queries
│   └── hooks/            # Custom React hooks
└── middleware.ts          # Auth middleware
```

## Environment Variables Required

### Supabase (Required)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_URL` - Supabase project URL (server-side)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Google Drive (Optional)
- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`
- `GOOGLE_DRIVE_REDIRECT_URI`
- `NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY`
- `NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID`

### Gemini AI (Optional)
- `GEMINI_API_KEY` - Google Gemini API key for AI insights

### App Configuration
- `NEXT_PUBLIC_APP_URL` - Application URL (auto-set by Replit)

## Development

The app runs on port 5000 with the workflow "Next.js Dev Server".

## Database

The application uses Supabase's hosted PostgreSQL database. Database schema migrations are located in the `supabase/` directory.

## Recent Changes

- 2026-01-17: Initial import and Replit environment setup
  - Configured Next.js to run on port 5000
  - Set up workflow for development server
  - Added frame ancestor headers for Replit proxy compatibility
