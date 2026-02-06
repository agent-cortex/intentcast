-- IntentCast Discovery Service schema (Supabase/Postgres)
-- Run this in Supabase SQL Editor.

-- Extensions
create extension if not exists pgcrypto;

-- Helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================
-- intents
-- =========================
create table if not exists public.intents (
  id text primary key,
  type text not null default 'service_request',

  title text not null,
  description text,
  argument_hint text,

  input jsonb not null,
  output jsonb not null,
  requires jsonb not null,
  context jsonb,

  tags text[],
  urgency text not null default 'normal',

  max_price_usdc text not null,
  stake_tx_hash text not null,
  stake_verified boolean not null default false,
  stake_amount text not null,

  deadline timestamptz not null,
  requester_wallet text not null,
  status text not null default 'active',
  accepted_offer_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists intents_status_idx on public.intents (status);
create index if not exists intents_requester_wallet_idx on public.intents (requester_wallet);
create index if not exists intents_created_at_idx on public.intents (created_at desc);
-- common filter: category (requires.category)
create index if not exists intents_requires_category_idx on public.intents ((requires->>'category'));

create trigger intents_set_updated_at
before update on public.intents
for each row execute function public.set_updated_at();

-- =========================
-- providers
-- =========================
create table if not exists public.providers (
  id text primary key,
  agent_id text not null unique,

  name text not null,
  description text,
  argument_hint text,
  avatar_url text,

  capabilities jsonb not null,
  pricing jsonb not null,

  tags text[],
  languages text[],
  wallet text not null,
  status text not null default 'online',

  completed_jobs integer not null default 0,
  rating numeric,
  rating_count integer not null default 0,

  certifications text[],
  website_url text,
  api_endpoint text,

  registered_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists providers_status_idx on public.providers (status);
create index if not exists providers_wallet_idx on public.providers (wallet);
create index if not exists providers_registered_at_idx on public.providers (registered_at desc);

-- JSONB indices to speed up contains queries
create index if not exists providers_capabilities_gin on public.providers using gin (capabilities jsonb_path_ops);
create index if not exists providers_pricing_gin on public.providers using gin (pricing jsonb_path_ops);

create trigger providers_set_updated_at
before update on public.providers
for each row execute function public.set_updated_at();

-- =========================
-- offers
-- =========================
create table if not exists public.offers (
  id text primary key,

  intent_id text not null references public.intents(id) on delete cascade,
  provider_id text not null references public.providers(id) on delete cascade,

  price_usdc text not null,
  price_breakdown jsonb,
  commitment jsonb not null,
  qualifications text,

  status text not null default 'pending',

  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists offers_intent_id_idx on public.offers (intent_id);
create index if not exists offers_provider_id_idx on public.offers (provider_id);
create index if not exists offers_status_idx on public.offers (status);
create index if not exists offers_created_at_idx on public.offers (created_at desc);

create trigger offers_set_updated_at
before update on public.offers
for each row execute function public.set_updated_at();

-- =========================
-- Row Level Security (RLS)
-- =========================
alter table public.intents enable row level security;
alter table public.providers enable row level security;
alter table public.offers enable row level security;

-- NOTE:
-- - The server can use SUPABASE_SERVICE_ROLE_KEY to bypass RLS.
-- - For direct client access during the hackathon/demo, we allow anon/authenticated.

-- intents policies
create policy "intents_read_all" on public.intents
for select to anon, authenticated
using (true);

create policy "intents_write_all" on public.intents
for insert to anon, authenticated
with check (true);

create policy "intents_update_all" on public.intents
for update to anon, authenticated
using (true)
with check (true);

create policy "intents_delete_all" on public.intents
for delete to anon, authenticated
using (true);

-- providers policies
create policy "providers_read_all" on public.providers
for select to anon, authenticated
using (true);

create policy "providers_write_all" on public.providers
for insert to anon, authenticated
with check (true);

create policy "providers_update_all" on public.providers
for update to anon, authenticated
using (true)
with check (true);

create policy "providers_delete_all" on public.providers
for delete to anon, authenticated
using (true);

-- offers policies
create policy "offers_read_all" on public.offers
for select to anon, authenticated
using (true);

create policy "offers_write_all" on public.offers
for insert to anon, authenticated
with check (true);

create policy "offers_update_all" on public.offers
for update to anon, authenticated
using (true)
with check (true);

create policy "offers_delete_all" on public.offers
for delete to anon, authenticated
using (true);
