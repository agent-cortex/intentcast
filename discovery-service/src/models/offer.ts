/**
 * Offer Model — Provider's response to an intent (v2.0)
 */

import { OutputFormat } from './intent.js';

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';

/**
 * Delivery commitment
 */
export interface DeliveryCommitment {
  outputFormat: OutputFormat;
  outputMimeType?: string;
  estimatedDelivery: { value: number; unit: 'minutes' | 'hours' | 'days' };
  guarantees?: { accuracy?: number; revisions?: number };
  limitations?: string[];
}

/**
 * Price breakdown
 */
export interface PriceBreakdown {
  basePrice: string;
  rushFee?: string;
  volumeDiscount?: string;
  finalPrice: string;
}

export interface Offer {
  id: string;
  intentId: string;
  providerId: string;
  
  /** Price in USDC */
  priceUsdc: string;
  /** Detailed price breakdown */
  priceBreakdown?: PriceBreakdown;
  /** Delivery commitment */
  commitment: DeliveryCommitment;
  /** Provider's qualifications for this intent */
  qualifications?: string;
  
  status: OfferStatus;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface CreateOfferInput {
  intentId: string;
  providerId: string;
  priceUsdc: string;
  commitment: DeliveryCommitment;
  
  /** Optional */
  priceBreakdown?: PriceBreakdown;
  qualifications?: string;
  expiresInHours?: number;
}

export function createOffer(input: CreateOfferInput, id: string): Offer {
  const now = new Date();
  const expiresAt = input.expiresInHours
    ? new Date(now.getTime() + input.expiresInHours * 60 * 60 * 1000)
    : undefined;
  
  return {
    id,
    intentId: input.intentId,
    providerId: input.providerId,
    priceUsdc: input.priceUsdc,
    priceBreakdown: input.priceBreakdown,
    commitment: input.commitment,
    qualifications: input.qualifications,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    expiresAt,
  };
}
