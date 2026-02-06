/**
 * Provider Model — Explicit capability declaration (v2.0)
 * 
 * Zero ambiguity, self-describing schema inspired by Claude Code skills.
 * Explicitly declares inputs accepted, outputs produced, and pricing.
 */

import { InputType, OutputFormat } from './intent.js';

export type ProviderStatus = 'online' | 'offline' | 'busy' | 'maintenance';

/**
 * Capability declaration
 */
export interface CapabilityDeclaration {
  category: string;
  name: string;
  description: string;
  acceptsInputTypes: InputType[];
  acceptsMimeTypes?: string[];
  acceptsLanguages?: string[];
  acceptsLocales?: string[];
  maxInputSize?: { value: number; unit: 'bytes' | 'chars' | 'tokens' | 'words' | 'lines' };
  producesOutputFormats: OutputFormat[];
  producesMimeTypes?: string[];
  producesLanguages?: string[];
  producesLocales?: string[];
  avgProcessingTime?: { value: number; unit: 'seconds' | 'minutes' | 'hours' };
  guarantees?: { accuracy?: number; revisions?: number; responseTimeMinutes?: number };
}

/**
 * Pricing declaration
 */
export interface PricingDeclaration {
  category: string;
  basePrice: string;
  unit: 'per_task' | 'per_word' | 'per_token' | 'per_minute' | 'per_image' | 'per_request' | 'flat';
  minimumCharge?: string;
  maximumCharge?: string;
  rushMultiplier?: number;
  volumeDiscounts?: Array<{ minUnits: number; discountPercent: number }>;
}

/**
 * x402 payment declaration (Coinbase x402 HTTP payments)
 */
export interface X402Config {
  enabled: boolean;
  /** CAIP-2 network id used by x402, e.g. "eip155:8453" (Base) or "eip155:84532" (Base Sepolia) */
  network: string;
  scheme: 'exact';
  /** Provider wallet address */
  payTo: string;
  /** Default price string, e.g. "$0.10" */
  defaultPrice?: string;
  /** Protected endpoints, e.g. ["POST /fulfill"] */
  endpoints?: string[];
}

export interface X402Declaration {
  enabled: boolean;
  /** CAIP-2 network id, e.g. eip155:84532 */
  network: string;
  /** Payment scheme (typically "exact") */
  scheme?: string;
  /** Optional default price ("$0.10" etc). Actual price may still be per-offer. */
  defaultPrice?: string;
  /** Optional endpoint patterns (e.g. ["POST /fulfill"]) */
  endpoints?: string[];
}

export interface Provider {
  id: string;
  agentId: string;
  
  /** Human-readable name */
  name: string;
  /** Description */
  description?: string;
  /** Argument hint (like Claude skills) */
  argumentHint?: string;
  /** Avatar URL */
  avatarUrl?: string;
  
  /** Detailed capability declarations */
  capabilities: CapabilityDeclaration[];
  /** Detailed pricing declarations */
  pricing: PricingDeclaration[];
  
  tags?: string[];
  languages?: string[];
  wallet: string;
  status: ProviderStatus;
  
  /** Stats */
  completedJobs: number;
  rating?: number;
  ratingCount: number;
  
  certifications?: string[];
  websiteUrl?: string;
  apiEndpoint?: string;

  /** Optional x402 paywall declaration for provider endpoints */
  x402?: X402Config;
  
  registeredAt: Date;
  lastSeen: Date;
}

export interface CreateProviderInput {
  agentId: string;
  wallet: string;
  name: string;
  capabilities: CapabilityDeclaration[];
  pricing: PricingDeclaration[];
  
  /** Optional */
  description?: string;
  argumentHint?: string;
  avatarUrl?: string;
  tags?: string[];
  languages?: string[];
  certifications?: string[];
  websiteUrl?: string;
  apiEndpoint?: string;

  /** Optional x402 paywall declaration for provider endpoints */
  x402?: X402Config;
}

export function createProvider(input: CreateProviderInput, id: string): Provider {
  const now = new Date();
  
  return {
    id,
    agentId: input.agentId,
    name: input.name,
    description: input.description,
    argumentHint: input.argumentHint,
    avatarUrl: input.avatarUrl,
    capabilities: input.capabilities,
    pricing: input.pricing,
    tags: input.tags,
    languages: input.languages,
    wallet: input.wallet,
    status: 'online',
    completedJobs: 0,
    rating: undefined,
    ratingCount: 0,
    certifications: input.certifications,
    websiteUrl: input.websiteUrl,
    apiEndpoint: input.apiEndpoint,
    x402: input.x402,
    registeredAt: now,
    lastSeen: now,
  };
}

/** Helper: Get all categories this provider supports */
export function getProviderCategories(provider: Provider): string[] {
  return [...new Set(provider.capabilities.map(c => c.category))];
}

/** Helper: Get pricing for a category */
export function getProviderPricing(provider: Provider, category: string): PricingDeclaration | undefined {
  return provider.pricing.find(p => p.category === category);
}
