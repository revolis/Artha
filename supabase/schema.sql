-- Supabase schema for Rabin Finance OS
-- Run in Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  name text not null,
  type text not null check (type in ('system', 'custom')),
  created_at timestamptz not null default now()
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  platform text not null,
  handle text,
  link text,
  campaign_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  name text not null
);

create table if not exists public.financial_years (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  year integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, year)
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  entry_date timestamptz not null,
  entry_type text not null check (entry_type in ('profit', 'loss', 'fee', 'tax', 'transfer')),
  category_id uuid not null references public.categories on delete restrict,
  source_id uuid references public.sources on delete set null,
  amount_usd_base numeric not null,
  currency_original text,
  amount_original numeric,
  fx_rate_used numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entry_tags (
  entry_id uuid not null references public.entries on delete cascade,
  tag_id uuid not null references public.tags on delete cascade,
  primary key (entry_id, tag_id)
);

create table if not exists public.trade_details (
  entry_id uuid primary key references public.entries on delete cascade,
  exchange text,
  pair text,
  side text check (side in ('buy', 'sell')),
  quantity numeric,
  entry_price numeric,
  exit_price numeric,
  fee_amount numeric,
  fee_currency text,
  realized_pnl_usd numeric
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries on delete cascade,
  drive_file_id text not null,
  file_name text not null,
  mime_type text not null,
  drive_view_link text,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  snapshot_date date not null,
  total_value_usd numeric not null,
  cash_usd numeric,
  invested_usd numeric,
  unrealized_pnl_usd numeric,
  notes text
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  timeframe text not null check (timeframe in ('year', 'quarter', 'month', 'week', 'day')),
  target_type text not null check (target_type in ('income', 'net', 'portfolio_growth')),
  target_value_usd numeric not null,
  start_date date not null,
  end_date date not null,
  category_id uuid references public.categories on delete set null
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users on delete cascade,
  display_currency_mode text not null check (display_currency_mode in ('usd', 'npr', 'both')),
  fx_mode text not null default 'stored_only',
  fx_manual_rate_usd_npr numeric,
  private_mode_default boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  range_start date not null,
  range_end date not null,
  report_type text not null check (report_type in ('summary', 'tax_fee', 'performance')),
  export_format text not null check (export_format in ('csv', 'json')),
  share_token text unique,
  share_enabled boolean not null default false,
  generated_file_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.drive_tokens (
  user_id uuid primary key references auth.users on delete cascade,
  refresh_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists entries_user_date_idx on public.entries (user_id, entry_date);
create index if not exists entries_category_idx on public.entries (category_id);
create index if not exists entries_type_idx on public.entries (entry_type);
create index if not exists financial_years_user_year_idx on public.financial_years (user_id, year);
create index if not exists portfolio_snapshots_user_date_idx on public.portfolio_snapshots (user_id, snapshot_date);
create unique index if not exists portfolio_snapshots_user_date_unique on public.portfolio_snapshots (user_id, snapshot_date);
create index if not exists goals_user_date_idx on public.goals (user_id, start_date, end_date);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_entries_updated_at
before update on public.entries
for each row execute function public.set_updated_at();

create trigger set_user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

create trigger set_drive_tokens_updated_at
before update on public.drive_tokens
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.sources enable row level security;
alter table public.tags enable row level security;
alter table public.financial_years enable row level security;
alter table public.entries enable row level security;
alter table public.entry_tags enable row level security;
alter table public.trade_details enable row level security;
alter table public.attachments enable row level security;
alter table public.portfolio_snapshots enable row level security;
alter table public.goals enable row level security;
alter table public.user_settings enable row level security;
alter table public.reports enable row level security;
alter table public.drive_tokens enable row level security;

create policy "categories_select" on public.categories
  for select using (user_id = auth.uid() or user_id is null);
create policy "categories_modify" on public.categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "sources_select" on public.sources
  for select using (user_id = auth.uid());
create policy "sources_modify" on public.sources
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "tags_select" on public.tags
  for select using (user_id = auth.uid());
create policy "tags_modify" on public.tags
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "financial_years_select" on public.financial_years
  for select using (user_id = auth.uid());
create policy "financial_years_modify" on public.financial_years
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "entries_select" on public.entries
  for select using (user_id = auth.uid());
create policy "entries_modify" on public.entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "entry_tags_select" on public.entry_tags
  for select using (
    exists (
      select 1 from public.entries e
      where e.id = entry_tags.entry_id and e.user_id = auth.uid()
    )
  );
create policy "entry_tags_modify" on public.entry_tags
  for all using (
    exists (
      select 1 from public.entries e
      where e.id = entry_tags.entry_id and e.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.entries e
      where e.id = entry_tags.entry_id and e.user_id = auth.uid()
    )
  );

create policy "trade_details_select" on public.trade_details
  for select using (
    exists (
      select 1 from public.entries e
      where e.id = trade_details.entry_id and e.user_id = auth.uid()
    )
  );
create policy "trade_details_modify" on public.trade_details
  for all using (
    exists (
      select 1 from public.entries e
      where e.id = trade_details.entry_id and e.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.entries e
      where e.id = trade_details.entry_id and e.user_id = auth.uid()
    )
  );

create policy "attachments_select" on public.attachments
  for select using (
    exists (
      select 1 from public.entries e
      where e.id = attachments.entry_id and e.user_id = auth.uid()
    )
  );
create policy "attachments_modify" on public.attachments
  for all using (
    exists (
      select 1 from public.entries e
      where e.id = attachments.entry_id and e.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.entries e
      where e.id = attachments.entry_id and e.user_id = auth.uid()
    )
  );

create policy "portfolio_select" on public.portfolio_snapshots
  for select using (user_id = auth.uid());
create policy "portfolio_modify" on public.portfolio_snapshots
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "goals_select" on public.goals
  for select using (user_id = auth.uid());
create policy "goals_modify" on public.goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "settings_select" on public.user_settings
  for select using (user_id = auth.uid());
create policy "settings_modify" on public.user_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "reports_select" on public.reports
  for select using (user_id = auth.uid());
create policy "reports_modify" on public.reports
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "drive_tokens_select" on public.drive_tokens
  for select using (user_id = auth.uid());
create policy "drive_tokens_modify" on public.drive_tokens
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.get_year_delete_summary(p_year integer)
returns table (
  entries_count integer,
  goals_count integer,
  attachments_count integer,
  snapshots_count integer
) language plpgsql
security definer
set search_path = public
as $$
declare
  current_user uuid := auth.uid();
  year_start date := make_date(p_year, 1, 1);
  year_end date := make_date(p_year + 1, 1, 1);
begin
  if current_user is null then
    raise exception 'Unauthorized';
  end if;

  return query
    select
      (select count(*) from public.entries
        where user_id = current_user
          and entry_date >= year_start
          and entry_date < year_end),
      (select count(*) from public.goals
        where user_id = current_user
          and start_date >= year_start
          and end_date < year_end),
      (select count(*) from public.attachments
        where entry_id in (
          select id from public.entries
          where user_id = current_user
            and entry_date >= year_start
            and entry_date < year_end
        )),
      (select count(*) from public.portfolio_snapshots
        where user_id = current_user
          and snapshot_date >= year_start
          and snapshot_date < year_end);
end;
$$;

create or replace function public.delete_financial_year(p_year integer)
returns table (
  entries_deleted integer,
  goals_deleted integer,
  attachments_deleted integer,
  snapshots_deleted integer,
  drive_file_ids text[]
) language plpgsql
security definer
set search_path = public
as $$
declare
  current_user uuid := auth.uid();
  year_start date := make_date(p_year, 1, 1);
  year_end date := make_date(p_year + 1, 1, 1);
  entry_ids uuid[];
begin
  if current_user is null then
    raise exception 'Unauthorized';
  end if;

  select array_agg(id) into entry_ids
    from public.entries
    where user_id = current_user
      and entry_date >= year_start
      and entry_date < year_end;

  entry_ids := coalesce(entry_ids, ARRAY[]::uuid[]);

  select array_agg(drive_file_id) into drive_file_ids
    from public.attachments
    where entry_id = any(entry_ids);

  select count(*) into attachments_deleted
    from public.attachments
    where entry_id = any(entry_ids);

  select count(*) into entries_deleted
    from public.entries
    where id = any(entry_ids);

  select count(*) into goals_deleted
    from public.goals
    where user_id = current_user
      and start_date >= year_start
      and end_date < year_end;

  select count(*) into snapshots_deleted
    from public.portfolio_snapshots
    where user_id = current_user
      and snapshot_date >= year_start
      and snapshot_date < year_end;

  delete from public.attachments where entry_id = any(entry_ids);
  delete from public.entry_tags where entry_id = any(entry_ids);
  delete from public.trade_details where entry_id = any(entry_ids);
  delete from public.entries where id = any(entry_ids);
  delete from public.goals
    where user_id = current_user
      and start_date >= year_start
      and end_date < year_end;
  delete from public.portfolio_snapshots
    where user_id = current_user
      and snapshot_date >= year_start
      and snapshot_date < year_end;
  delete from public.financial_years
    where user_id = current_user
      and year = p_year;

  return query
    select
      coalesce(entries_deleted, 0),
      coalesce(goals_deleted, 0),
      coalesce(attachments_deleted, 0),
      coalesce(snapshots_deleted, 0),
      coalesce(drive_file_ids, ARRAY[]::text[]);
end;
$$;
