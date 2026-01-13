# Data Model

Base: Supabase Postgres. All data persisted in cloud DB.

## User
- id (uuid, pk)
- email (text, unique)
- name (text)
- created_at (timestamptz)

## Category
- id (uuid, pk)
- name (text)
- type (text) // system | custom
- created_at (timestamptz)

## Source
- id (uuid, pk)
- platform (text)
- handle (text)
- link (text)
- campaign_id (text)
- created_at (timestamptz)

## Tag
- id (uuid, pk)
- name (text)

## Entry
- id (uuid, pk)
- user_id (uuid, fk -> User)
- entry_date (timestamptz)
- entry_type (text) // profit | loss | fee | tax | transfer
- category_id (uuid, fk -> Category)
- source_id (uuid, fk -> Source, nullable)
- amount_usd_base (numeric)
- currency_original (text, nullable)
- amount_original (numeric, nullable)
- fx_rate_used (numeric, nullable)
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)

## EntryTags
- entry_id (uuid, fk -> Entry)
- tag_id (uuid, fk -> Tag)
- pk (entry_id, tag_id)

## TradeDetail (only if category = Trading)
- entry_id (uuid, pk, fk -> Entry)
- exchange (text)
- pair (text)
- side (text) // buy | sell
- quantity (numeric, nullable)
- entry_price (numeric, nullable)
- exit_price (numeric, nullable)
- fee_amount (numeric, nullable)
- fee_currency (text, nullable)
- realized_pnl_usd (numeric, nullable)

## Attachment
- id (uuid, pk)
- entry_id (uuid, fk -> Entry)
- drive_file_id (text)
- file_name (text)
- mime_type (text)
- drive_view_link (text, nullable)
- created_at (timestamptz)

## PortfolioSnapshot
- id (uuid, pk)
- user_id (uuid, fk -> User)
- snapshot_date (timestamptz)
- total_value_usd (numeric)
- cash_usd (numeric, nullable)
- invested_usd (numeric, nullable)
- unrealized_pnl_usd (numeric, nullable)
- notes (text, nullable)

## Goal
- id (uuid, pk)
- user_id (uuid, fk -> User)
- timeframe (text) // year | quarter | month | week | day
- target_type (text) // income | net | portfolio_growth
- target_value_usd (numeric)
- start_date (date)
- end_date (date)
- category_id (uuid, fk -> Category, nullable)

## UserSettings
- user_id (uuid, pk, fk -> User)
- display_currency_mode (text) // usd | npr | both
- fx_mode (text) // stored_only (future: live)
- fx_manual_rate_usd_npr (numeric, nullable)
- private_mode_default (boolean, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

## Report
- id (uuid, pk)
- user_id (uuid, fk -> User)
- range_start (date)
- range_end (date)
- report_type (text) // summary | tax_fee | performance
- export_format (text) // csv | json
- share_token (text, unique)
- share_enabled (boolean)
- generated_file_url (text, nullable)
- created_at (timestamptz)
