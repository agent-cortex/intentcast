-- Add ERC-8004 agent identity fields to providers
-- ERC-8004 is a Trustless Agent identity standard on Ethereum

ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS agent_id_8004 TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS agent_id_8004_chain TEXT DEFAULT 'ethereum';

-- x402 config (stored as JSONB for flexibility)
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS x402_config JSONB;

COMMENT ON COLUMN public.providers.agent_id_8004 IS 'ERC-8004 agent token ID (Ethereum mainnet or Sepolia)';
COMMENT ON COLUMN public.providers.agent_id_8004_chain IS 'Chain for 8004 identity: ethereum or sepolia';
COMMENT ON COLUMN public.providers.x402_config IS 'x402 payment configuration (network, payTo, defaultPrice, etc.)';

-- Index for 8004 lookups
CREATE INDEX IF NOT EXISTS providers_agent_id_8004_idx ON public.providers (agent_id_8004) WHERE agent_id_8004 IS NOT NULL;
