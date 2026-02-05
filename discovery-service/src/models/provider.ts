/**
 * Provider Model — Represents a service provider agent
 * 
 * Generic schema supporting multiple AI capabilities:
 * coding, research, data_analysis, content_writing, translation,
 * customer_support, lead_generation, summarization, image_generation, automation
 */

export type ProviderStatus = 'online' | 'offline' | 'busy';

export interface ProviderCapability {
  /** Category ID this capability belongs to */
  category: string;
  
  /** Supported input types */
  inputTypes?: ('text' | 'code' | 'url' | 'file' | 'json' | 'image' | 'audio' | 'video')[];
  
  /** Supported output formats */
  outputFormats?: ('text' | 'code' | 'json' | 'markdown' | 'image' | 'file' | 'structured')[];
  
  /** Supported languages (for translation, content, etc.) */
  languages?: string[];
  
  /** Max input size (characters, tokens, or bytes depending on context) */
  maxInputSize?: number;
  
  /** Average response time in minutes */
  avgResponseMinutes?: number;
  
  /** Additional metadata about this capability */
  metadata?: Record<string, unknown>;
}

export interface ProviderPricing {
  /** Category ID */
  category: string;
  
  /** Base price in USDC */
  basePrice: string;
  
  /** Pricing unit (per word, per task, per hour, etc.) */
  unit: string;
  
  /** Minimum price per job */
  minPrice?: string;
  
  /** Maximum price per job */
  maxPrice?: string;
}

export interface Provider {
  id: string;
  
  /** Unique agent identifier */
  agentId: string;
  
  /** Display name */
  name?: string;
  
  /** Short description of the provider */
  description?: string;
  
  /** Provider's avatar URL */
  avatarUrl?: string;
  
  /** List of category IDs this provider supports */
  capabilities: string[];
  
  /** Detailed capability specifications */
  capabilityDetails?: ProviderCapability[];
  
  /** Legacy: simple pricing map (deprecated, use pricingDetails) */
  pricing: Record<string, string>;
  
  /** Detailed pricing specifications */
  pricingDetails?: ProviderPricing[];
  
  /** Tags for discovery */
  tags?: string[];
  
  /** Supported languages (global across capabilities) */
  languages?: string[];
  
  /** Wallet address for payments */
  wallet: string;
  
  /** Current status */
  status: ProviderStatus;
  
  /** Number of completed jobs */
  completedJobs?: number;
  
  /** Average rating (0-5) */
  rating?: number;
  
  /** Number of ratings */
  ratingCount?: number;
  
  /** Website or documentation URL */
  websiteUrl?: string;
  
  registeredAt: Date;
  lastSeen: Date;
}

export interface CreateProviderInput {
  agentId: string;
  name?: string;
  description?: string;
  avatarUrl?: string;
  capabilities: string[];
  capabilityDetails?: ProviderCapability[];
  pricing: Record<string, string>;
  pricingDetails?: ProviderPricing[];
  tags?: string[];
  languages?: string[];
  wallet: string;
  websiteUrl?: string;
}

export function createProvider(input: CreateProviderInput, id: string): Provider {
  const now = new Date();
  
  return {
    id,
    agentId: input.agentId,
    name: input.name,
    description: input.description,
    avatarUrl: input.avatarUrl,
    capabilities: input.capabilities,
    capabilityDetails: input.capabilityDetails,
    pricing: input.pricing,
    pricingDetails: input.pricingDetails,
    tags: input.tags,
    languages: input.languages,
    wallet: input.wallet,
    websiteUrl: input.websiteUrl,
    status: 'online',
    completedJobs: 0,
    rating: undefined,
    ratingCount: 0,
    registeredAt: now,
    lastSeen: now,
  };
}
