/**
 * Intent Model — Represents a service request broadcast by an agent
 */

export type IntentStatus = 'active' | 'matched' | 'completed' | 'expired' | 'cancelled';

export interface Intent {
  id: string;
  type: 'service_request';
  category: string;
  requirements: Record<string, unknown>;
  maxPriceUsdc: string;
  deadline: Date;
  requesterWallet: string;
  stakeTxHash: string;
  stakeVerified: boolean;
  stakeAmount: string;
  status: IntentStatus;
  acceptedOfferId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIntentInput {
  category: string;
  requirements?: Record<string, unknown>;
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
    requirements: input.requirements ?? {},
    maxPriceUsdc: input.maxPriceUsdc,
    deadline: new Date(now.getTime() + deadlineMs),
    requesterWallet: input.requesterWallet,
    stakeTxHash: input.stakeTxHash,
    stakeVerified: false, // Will be verified async
    stakeAmount: input.stakeAmount,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
}
