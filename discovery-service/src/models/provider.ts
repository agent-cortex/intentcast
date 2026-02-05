/**
 * Provider Model — Explicit capability declaration
 * 
 * Inspired by Claude Code skills: zero ambiguity, self-describing schema.
 * Schema v2.0 explicitly declares inputs, outputs, and capabilities.
 * 
 * Backward compatible: old fields (capabilities as string[], pricing as object) still work.
 */

import { InputType, OutputFormat } from './intent.js';

export type ProviderStatus = 'online' | 'offline' | 'busy' | 'maintenance';

/**
 * Capability declaration (v2.0 explicit)
 */
export interface CapabilityDeclaration {
  category: string;
  name: string;
  description: string;
  acceptsInputTypes?: InputType[];
  acceptsMimeTypes?: string[];
  acceptsLanguages?: string[];
  acceptsLocales?: string[];
  maxInputSize?: { value: number; unit: 'bytes' | 'chars' | 'tokens' | 'words' | 'lines' };
  producesOutputFormats?: OutputFormat[];
  producesMimeTypes?: string[];
  producesLanguages?: string[];
  producesLocales?: string[];
  avgProcessingTime?: { value: number; unit: 'seconds' | 'minutes' | 'hours' };
  guarantees?: { accuracy?: number; revisions?: number; responseTimeMinutes?: number };
}

/**
 * Pricing declaration (v2.0 explicit)
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

export interface Provider {
  id: string;
  agentId: string;
  
  /** === BACKWARD COMPATIBLE FIELDS === */
  /** Categories as simple string array */
  capabilities: string[];
  /** Pricing as simple object */
  pricing: Record<string, string>;
  
  /** === V2.0 EXPLICIT FIELDS === */
  schemaVersion?: '2.0';
  name?: string;
  description?: string;
  argumentHint?: string;
  avatarUrl?: string;
  /** Detailed capability declarations */
  capabilityDetails?: CapabilityDeclaration[];
  /** Detailed pricing declarations */
  pricingDetails?: PricingDeclaration[];
  
  tags?: string[];
  languages?: string[];
  wallet: string;
  status: ProviderStatus;
  
  /** Stats */
  completedJobs?: number;
  rating?: number;
  ratingCount?: number;
  
  certifications?: string[];
  websiteUrl?: string;
  apiEndpoint?: string;
  
  registeredAt: Date;
  lastSeen: Date;
}

export interface CreateProviderInput {
  agentId: string;
  wallet: string;
  
  // Backward compatible (required)
  capabilities: string[];
  pricing: Record<string, string>;
  
  // V2.0 explicit (optional)
  name?: string;
  description?: string;
  argumentHint?: string;
  avatarUrl?: string;
  capabilityDetails?: CapabilityDeclaration[];
  pricingDetails?: PricingDeclaration[];
  tags?: string[];
  languages?: string[];
  certifications?: string[];
  websiteUrl?: string;
  apiEndpoint?: string;
}

export function createProvider(input: CreateProviderInput, id: string): Provider {
  const now = new Date();
  
  // Determine schema version
  const isV2 = !!(input.capabilityDetails || input.pricingDetails);
  
  return {
    id,
    agentId: input.agentId,
    // Backward compatible
    capabilities: input.capabilities,
    pricing: input.pricing,
    // V2.0 fields
    schemaVersion: isV2 ? '2.0' : undefined,
    name: input.name,
    description: input.description,
    argumentHint: input.argumentHint,
    avatarUrl: input.avatarUrl,
    capabilityDetails: input.capabilityDetails,
    pricingDetails: input.pricingDetails,
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
    registeredAt: now,
    lastSeen: now,
  };
}
