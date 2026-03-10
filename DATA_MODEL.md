# Data Model

<<<<<<< HEAD
Base: Cloud Firestore. All business data is persisted server-side through API routes.

## Identity
- Auth provider: Firebase Authentication (email/password)
- Auth ID: Firebase UID (`string`)

## Collections

### `categories`
- `id` (document id)
- `user_id` (`string | null`) // null = system category
- `name` (`string`)
- `type` (`"system" | "custom"`)
- `created_at` (`ISO string`)

### `sources`
- `id`
- `user_id`
- `platform`
- `handle` (`string | null`)
- `link` (`string | null`)
- `campaign_id` (`string | null`)
- `created_at`

### `tags`
- `id`
- `user_id`
- `name`

### `financial_years`
- `id`
- `user_id`
- `year` (`number`)
- `created_at`

### `entries`
- `id`
- `user_id`
- `entry_date` (`ISO string`)
- `entry_type` (`"profit" | "loss" | "fee" | "tax" | "transfer"`)
- `category_id`
- `source_id` (`string | null`)
- `amount_usd_base` (`number`)
- `currency_original` (`string | null`)
- `amount_original` (`number | null`)
- `fx_rate_used` (`number | null`)
- `notes` (`string | null`)
- `created_at`
- `updated_at`

### `entry_tags`
- `id`
- `entry_id`
- `tag_id`

### `trade_details`
- `id` (same as `entry_id`)
- `entry_id`
- `exchange` (`string | null`)
- `pair` (`string | null`)
- `side` (`"buy" | "sell" | null`)
- `quantity` (`number | null`)
- `entry_price` (`number | null`)
- `exit_price` (`number | null`)
- `fee_amount` (`number | null`)
- `fee_currency` (`string | null`)
- `realized_pnl_usd` (`number | null`)

### `attachments`
- `id`
- `user_id` (`string`)
- `entry_id`
- `drive_file_id`
- `file_name`
- `mime_type`
- `drive_view_link` (`string | null`)
- `created_at`

### `portfolio_snapshots`
- `id`
- `user_id`
- `snapshot_date` (`YYYY-MM-DD`)
- `total_value_usd` (`number`)
- `cash_usd` (`number | null`)
- `invested_usd` (`number | null`)
- `unrealized_pnl_usd` (`number | null`)
- `notes` (`string | null`)

### `goals`
- `id`
- `user_id`
- `name` (`string | null`)
- `purpose` (`string | null`)
- `timeframe` (`"year" | "quarter" | "month" | "week" | "day"`)
- `target_type` (`"income" | "net" | "portfolio_growth"`)
- `target_value_usd` (`number`)
- `start_date` (`YYYY-MM-DD`)
- `end_date` (`YYYY-MM-DD`)
- `category_id` (`string | null`)

### `user_settings`
- `id` (same as `user_id`)
- `user_id`
- `display_currency_mode` (`"usd" | "npr" | "both"`)
- `fx_mode` (`"stored_only"`)
- `fx_manual_rate_usd_npr` (`number | null`)
- `private_mode_default` (`boolean`)
- `created_at`
- `updated_at`

### `reports`
- `id`
- `user_id`
- `range_start` (`YYYY-MM-DD`)
- `range_end` (`YYYY-MM-DD`)
- `report_type` (`"summary" | "tax_fee" | "performance"`)
- `export_format` (`"csv" | "json"`)
- `share_token` (`string | null`)
- `share_enabled` (`boolean`)
- `generated_file_url` (`string | null`)
- `created_at`

### `drive_tokens`
- `id` (same as `user_id`)
- `user_id`
- `refresh_token`
- `created_at`
- `updated_at`
=======
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
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
