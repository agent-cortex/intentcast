-- Add x402 payment declaration to providers

alter table public.providers
  add column if not exists x402 jsonb;

-- Index for filtering providers where x402.enabled = true
-- Using expression index on the enabled flag (stored as JSON boolean ->> yields text)
create index if not exists providers_x402_enabled_idx
  on public.providers ((x402->>'enabled'));
