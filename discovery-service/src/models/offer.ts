/**
 * Offer Model — Provider's response to an intent
 * 
 * Backward compatible with v1, supports v2.0 explicit commitments.
 */

import { OutputFormat } from './intent.js';

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';

/**
 * Delivery commitment (v2.0)
 */
export interface DeliveryCommitment {
  outputFormat: OutputFormat;
  outputMimeType?: string;
  estimatedDelivery: { value: number; unit: 'minutes' | 'hours' | 'days' };
  guarantees?: { accuracy?: number; revisions?: number };
  limitations?: string[];
}

export interface Offer {
  id: string;
  intentId: string;
  providerId: string;
  priceUsdc: string;
  
  /** === BACKWARD COMPATIBLE FIELDS === */
  estimatedDeliveryMinutes?: number;
  message?: string;
  
  /** === V2.0 EXPLICIT FIELDS === */
  schemaVersion?: '2.0';
  priceBreakdown?: { basePrice: string; rushFee?: string; volumeDiscount?: string; finalPrice: string };
  commitment?: DeliveryCommitment;
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
  
  // Backward compatible
  estimatedDeliveryMinutes?: number;
  message?: string;
  
  // V2.0 explicit
  priceBreakdown?: Offer['priceBreakdown'];
  commitment?: DeliveryCommitment;
  qualifications?: string;
  expiresInHours?: number;
}

export function createOffer(input: CreateOfferInput, id: string): Offer {
  const now = new Date();
  const expiresAt = input.expiresInHours
    ? new Date(now.getTime() + input.expiresInHours * 60 * 60 * 1000)
    : undefined;
  
  const isV2 = !!(input.commitment || input.priceBreakdown);
  
  return {
    id,
    intentId: input.intentId,
    providerId: input.providerId,
    priceUsdc: input.priceUsdc,
    // Backward compatible
    estimatedDeliveryMinutes: input.estimatedDeliveryMinutes,
    message: input.message,
    // V2.0 fields
    schemaVersion: isV2 ? '2.0' : undefined,
    priceBreakdown: input.priceBreakdown,
    commitment: input.commitment,
    qualifications: input.qualifications,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    expiresAt,
  };
}
