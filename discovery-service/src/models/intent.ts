/**
 * Intent Model — Represents a service request broadcast by an agent
 * 
 * Generic schema supporting multiple AI use cases:
 * coding, research, data_analysis, content_writing, translation,
 * customer_support, lead_generation, summarization, image_generation, automation
 */

export type IntentStatus = 'active' | 'matched' | 'completed' | 'expired' | 'cancelled';
export type UrgencyLevel = 'low' | 'normal' | 'high' | 'critical';

export interface IntentInput {
  /** Input data type (text, code, url, file, json, etc.) */
  type: 'text' | 'code' | 'url' | 'file' | 'json' | 'image' | 'audio' | 'video';
  /** The actual input content or reference */
  content: string;
  /** Optional metadata about the input */
  metadata?: Record<string, unknown>;
}

export interface IntentOutput {
  /** Expected output format */
  format: 'text' | 'code' | 'json' | 'markdown' | 'image' | 'file' | 'structured';
  /** Description of expected output */
  description?: string;
  /** Optional schema for structured outputs */
  schema?: Record<string, unknown>;
}

export interface Intent {
  id: string;
  type: 'service_request';
  
  /** Category ID (coding, research, translation, etc.) */
  category: string;
  
  /** Human-readable title/summary */
  title?: string;
  
  /** Detailed description of the task */
  description?: string;
  
  /** Structured input specification */
  input?: IntentInput;
  
  /** Expected output specification */
  output?: IntentOutput;
  
  /** Legacy: free-form requirements (deprecated, use input/output) */
  requirements: Record<string, unknown>;
  
  /** Tags for better matching */
  tags?: string[];
  
  /** Urgency level */
  urgency?: UrgencyLevel;
  
  /** Maximum price willing to pay (USDC) */
  maxPriceUsdc: string;
  
  /** Deadline for completion */
  deadline: Date;
  
  /** Requester's wallet address */
  requesterWallet: string;
  
  /** Transaction hash of the stake */
  stakeTxHash: string;
  
  /** Whether stake has been verified on-chain */
  stakeVerified: boolean;
  
  /** Amount staked (USDC) */
  stakeAmount: string;
  
  /** Current status */
  status: IntentStatus;
  
  /** ID of the accepted offer (if any) */
  acceptedOfferId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIntentInput {
  category: string;
  title?: string;
  description?: string;
  input?: IntentInput;
  output?: IntentOutput;
  requirements?: Record<string, unknown>;
  tags?: string[];
  urgency?: UrgencyLevel;
  maxPriceUsdc: string;
  deadlineHours?: number;
  requesterWallet: string;
  stakeTxHash: string;
  stakeAmount: string;
}

export function createIntent(input: CreateIntentInput, id: string): Intent {
  const now = new Date();
  const deadlineMs = (input.deadlineHours ?? 24) * 60 * 60 * 1000;
  
  return {
    id,
    type: 'service_request',
    category: input.category,
    title: input.title,
    description: input.description,
    input: input.input,
    output: input.output,
    requirements: input.requirements ?? {},
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
