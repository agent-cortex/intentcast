/**
 * Offer Model — Represents a provider's offer for an intent
 */

export type OfferStatus = 'pending' | 'accepted' | 'rejected';

export interface Offer {
  id: string;
  intentId: string;
  providerId: string;
  priceUsdc: string;
  estimatedDeliveryMinutes?: number;
  message?: string;
  status: OfferStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOfferInput {
  intentId: string;
  providerId: string;
  priceUsdc: string;
  estimatedDeliveryMinutes?: number;
  message?: string;
}

export function createOffer(input: CreateOfferInput, id: string): Offer {
  const now = new Date();
  
  return {
    id,
    intentId: input.intentId,
    providerId: input.providerId,
    priceUsdc: input.priceUsdc,
    estimatedDeliveryMinutes: input.estimatedDeliveryMinutes,
    message: input.message,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
}
