/**
 * Intent Model — Explicit service request contract
 * 
 * Inspired by Claude Code skills: zero ambiguity, self-describing schema.
 * Schema v2.0 explicitly declares inputs, outputs, and required capabilities.
 * 
 * Backward compatible: old fields (category, requirements) still work.
 */

export type IntentStatus = 'active' | 'matched' | 'in_progress' | 'completed' | 'expired' | 'cancelled' | 'disputed';
export type UrgencyLevel = 'low' | 'normal' | 'high' | 'critical';

/** Supported input types */
export type InputType = 'text' | 'code' | 'url' | 'file' | 'json' | 'image' | 'audio' | 'video' | 'binary';

/** Supported output formats */
export type OutputFormat = 'text' | 'code' | 'json' | 'markdown' | 'html' | 'image' | 'audio' | 'video' | 'file' | 'structured';

/**
 * Input specification — what the requester provides (v2.0)
 */
export interface IntentInputSpec {
  type: InputType;
  mimeType?: string;
  language?: string;
  locale?: string;
  size?: { value: number; unit: 'bytes' | 'chars' | 'tokens' | 'words' | 'lines' };
  content: string;
  attachments?: Array<{ type: InputType; mimeType?: string; name: string; content: string }>;
}

/**
 * Output specification — what the requester expects (v2.0)
 */
export interface IntentOutputSpec {
  format: OutputFormat;
  mimeType?: string;
  language?: string;
  locale?: string;
  schema?: Record<string, unknown>;
  description?: string;
  example?: string;
  validation?: { minLength?: number; maxLength?: number; pattern?: string; requiredFields?: string[] };
}

/**
 * Required capabilities (v2.0)
 */
export interface RequiredCapabilities {
  category: string;
  skills?: string[];
  minRating?: number;
  minCompletedJobs?: number;
}

export interface Intent {
  id: string;
  type: 'service_request';
  
  /** === BACKWARD COMPATIBLE FIELDS === */
  /** Category ID (simple string for matching) */
  category: string;
  /** Legacy requirements object */
  requirements: Record<string, unknown>;
  
  /** === V2.0 EXPLICIT CONTRACT FIELDS === */
  /** Schema version (absent = v1, "2.0" = explicit) */
  schemaVersion?: '2.0';
  /** Human-readable title */
  title?: string;
  /** Detailed description */
  description?: string;
  /** Argument hint (like Claude skills) */
  argumentHint?: string;
  /** Explicit input spec */
  input?: IntentInputSpec;
  /** Explicit output spec */
  output?: IntentOutputSpec;
  /** Explicit capability requirements */
  requires?: RequiredCapabilities;
  /** Additional context */
  context?: {
    references?: string[];
    conventions?: string;
    examples?: Array<{ input: string; output: string; quality: 'good' | 'bad' }>;
  };
  
  /** Tags for discovery */
  tags?: string[];
  /** Urgency level */
  urgency?: UrgencyLevel;
  
  /** === PAYMENT === */
  maxPriceUsdc: string;
  stakeTxHash: string;
  stakeVerified: boolean;
  stakeAmount: string;
  
  deadline: Date;
  requesterWallet: string;
  status: IntentStatus;
  acceptedOfferId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIntentInput {
  // Required (backward compatible)
  category: string;
  maxPriceUsdc: string;
  requesterWallet: string;
  stakeTxHash: string;
  stakeAmount: string;
  
  // Optional v1 fields
  requirements?: Record<string, unknown>;
  deadlineHours?: number;
  
  // Optional v2.0 explicit fields
  title?: string;
  description?: string;
  argumentHint?: string;
  input?: IntentInputSpec;
  output?: IntentOutputSpec;
  requires?: RequiredCapabilities;
  context?: Intent['context'];
  tags?: string[];
  urgency?: UrgencyLevel;
}

export function createIntent(input: CreateIntentInput, id: string): Intent {
  const now = new Date();
  const deadlineMs = (input.deadlineHours ?? 24) * 60 * 60 * 1000;
  
  // Determine schema version based on presence of v2 fields
  const isV2 = !!(input.input || input.output || input.requires);
  
  return {
    id,
    type: 'service_request',
    // Backward compatible
    category: input.requires?.category ?? input.category,
    requirements: input.requirements ?? {},
    // V2.0 fields
    schemaVersion: isV2 ? '2.0' : undefined,
    title: input.title,
    description: input.description,
    argumentHint: input.argumentHint,
    input: input.input,
    output: input.output,
    requires: input.requires ?? { category: input.category },
    context: input.context,
    tags: input.tags,
    urgency: input.urgency ?? 'normal',
    // Payment
    maxPriceUsdc: input.maxPriceUsdc,
    deadline: new Date(now.getTime() + deadlineMs),
    requesterWallet: input.requesterWallet,
    stakeTxHash: input.stakeTxHash,
    stakeVerified: false,
    stakeAmount: input.stakeAmount,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
}
