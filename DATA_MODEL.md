# Data Model

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
