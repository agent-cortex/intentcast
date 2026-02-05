/**
 * Provider Model — Represents a service provider agent
 */

export type ProviderStatus = 'online' | 'offline';

export interface Provider {
  id: string;
  agentId: string;
  capabilities: string[];
  pricing: Record<string, string>;
  wallet: string;
  status: ProviderStatus;
  registeredAt: Date;
  lastSeen: Date;
}

export interface CreateProviderInput {
  agentId: string;
  capabilities: string[];
  pricing: Record<string, string>;
  wallet: string;
}

export function createProvider(input: CreateProviderInput, id: string): Provider {
  const now = new Date();
  
  return {
    id,
    agentId: input.agentId,
    capabilities: input.capabilities,
    pricing: input.pricing,
    wallet: input.wallet,
    status: 'online',
    registeredAt: now,
    lastSeen: now,
  };
}
