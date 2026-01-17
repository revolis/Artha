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

- 2026-01-17: Year deletion feature fixed
  - Replaced stored procedure calls with direct Supabase queries
  - Year summary API now returns entry, goal, attachment, and snapshot counts
  - Year delete API properly removes all data for a year

- 2026-01-17: Entries page UI overhaul
  - Premium clean table-based design
  - Only Type and Amount are color-coded (green for profit, red for loss)
  - Search, type filter, and timeframe filter with custom date range
  - Auto-loads entries for current year
  - Expandable notes for long entries

- 2026-01-17: Exchange rate settings update
  - Default rate changed to 1 USD = 147 NPR
  - "Set as Default" button saves manually entered rate

- 2026-01-17: AI Insights page enhancement
  - New date filters: This Month, This Quarter, 6 Months, This Year, All Time, Custom Range
  - Custom date range picker with calendar popover
  - 5 AI insight types: Financial Health, Spending Analysis, Savings Opportunities, Goal Progress, Forecast
  - Specialized AI prompts for each insight type with detailed analysis
  - Enhanced UI with cards, quick tips sidebar, and how-it-works guide
  - Better markdown rendering for AI responses
  - Added "this_month", "this_quarter", and "custom" to Period type

- 2026-01-17: Comprehensive Analytics page overhaul
  - Default period changed to "All Time" for complete financial overview
  - Fixed date range to include future-dated entries (uses actual min/max entry dates)
  - Added income breakdown by category (mirroring expense breakdown)
  - Added platform/source performance table (income + expenses per source)
  - Added transaction statistics (counts, averages, largest transactions)
  - Added financial ratios (savings rate, expense ratio)
  - Added best/worst month insights with highlighted cards
  - Enhanced chart with ComposedChart showing income bars, expense bars, and net profit line
  - Added monthly trends line chart for pattern analysis
  - Added top income entries section alongside top expenses
  - Chart grouping optimized: daily (<60d), weekly (60-180d), monthly (180-730d), yearly (>730d)

- 2026-01-17: Analytics feature fixes and data integrity improvements
  - Fixed Supabase array join normalization for categories/sources
  - Added proper error handling with throw on Supabase errors
  - Fixed period date range calculations for accurate growth comparisons
  - Added null/NaN guards in UI for divide-by-zero and missing values
  - "All Time" period now correctly shows no growth comparison (N/A)
  - Goals table now has name and purpose columns in database

- 2026-01-17: Production readiness - removed all mock data
  - Removed DISABLE_AUTH environment variable and mock data file
  - All API routes now require real Supabase authentication
  - Added custom name and purpose fields to goals
  - Application now works exclusively with real data from Supabase

- 2026-01-17: Authentication system overhaul and code polish
  - Implemented fetchWithAuth helper that combines Bearer token + cookie-based auth
  - Updated all 40+ fetch calls across the app to use authenticated requests
  - Removed redundant token shadow copies, relying on Supabase's session management
  - Fixed heatmap with bidirectional legend (profit/loss scales)
  - Cleaned up unused imports and debug routes

- 2026-01-17: Initial import and Replit environment setup
  - Configured Next.js to run on port 5000
  - Set up workflow for development server
  - Added frame ancestor headers for Replit proxy compatibility
