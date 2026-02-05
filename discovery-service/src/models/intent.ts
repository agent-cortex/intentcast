/**
 * Intent Model — Explicit service request contract (v2.0)
 * 
 * Zero ambiguity, self-describing schema inspired by Claude Code skills.
 * Explicitly declares inputs, outputs, and required capabilities.
 */

export type IntentStatus = 'active' | 'matched' | 'in_progress' | 'completed' | 'expired' | 'cancelled' | 'disputed';
export type UrgencyLevel = 'low' | 'normal' | 'high' | 'critical';

/** Supported input types */
export type InputType = 'text' | 'code' | 'url' | 'file' | 'json' | 'image' | 'audio' | 'video' | 'binary';

/** Supported output formats */
export type OutputFormat = 'text' | 'code' | 'json' | 'markdown' | 'html' | 'image' | 'audio' | 'video' | 'file' | 'structured';

/**
 * Input specification — what the requester provides
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
 * Output specification — what the requester expects
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
 * Required capabilities
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
  
  /** Human-readable title */
  title: string;
  /** Detailed description */
  description?: string;
  /** Argument hint (like Claude skills) */
  argumentHint?: string;
  /** Explicit input spec */
  input: IntentInputSpec;
  /** Explicit output spec */
  output: IntentOutputSpec;
  /** Explicit capability requirements */
  requires: RequiredCapabilities;
  /** Additional context */
  context?: {
    references?: string[];
    conventions?: string;
    examples?: Array<{ input: string; output: string; quality: 'good' | 'bad' }>;
  };
  
  /** Tags for discovery */
  tags?: string[];
  /** Urgency level */
  urgency: UrgencyLevel;
  
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
  /** Human-readable title */
  title: string;
  /** What's needed */
  input: IntentInputSpec;
  /** What's expected */
  output: IntentOutputSpec;
  /** Required capabilities */
  requires: RequiredCapabilities;
  /** Payment */
  maxPriceUsdc: string;
  requesterWallet: string;
  stakeTxHash: string;
  stakeAmount: string;
  
  /** Optional */
  description?: string;
  argumentHint?: string;
  context?: Intent['context'];
  tags?: string[];
  urgency?: UrgencyLevel;
  deadlineHours?: number;
}

export function createIntent(input: CreateIntentInput, id: string): Intent {
  const now = new Date();
  const deadlineMs = (input.deadlineHours ?? 24) * 60 * 60 * 1000;
  
  return {
    id,
    type: 'service_request',
    title: input.title,
    description: input.description,
    argumentHint: input.argumentHint,
    input: input.input,
    output: input.output,
    requires: input.requires,
    context: input.context,
    tags: input.tags,
    urgency: input.urgency ?? 'normal',
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
