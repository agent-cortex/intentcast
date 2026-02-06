import { z } from 'zod';
import { outputFormatSchema } from './intent.js';

export const deliveryCommitmentSchema = z
  .object({
    outputFormat: outputFormatSchema,
    outputMimeType: z.string().optional(),
    estimatedDelivery: z
      .object({ value: z.number(), unit: z.enum(['minutes', 'hours', 'days']) })
      .strict(),
    guarantees: z
      .object({
        accuracy: z.number().min(0).max(1).optional(),
        revisions: z.number().int().nonnegative().optional(),
      })
      .strict()
      .optional(),
    limitations: z.array(z.string()).optional(),
  })
  .strict();

export const priceBreakdownSchema = z
  .object({
    basePrice: z.string().min(1),
    rushFee: z.string().optional(),
    volumeDiscount: z.string().optional(),
    finalPrice: z.string().min(1),
  })
  .strict();

/** Matches CreateOfferInput in src/models/offer.ts */
export const createOfferInputSchema = z
  .object({
    intentId: z.string().min(1),
    providerId: z.string().min(1),
    priceUsdc: z.string().min(1),
    commitment: deliveryCommitmentSchema,

    priceBreakdown: priceBreakdownSchema.optional(),
    qualifications: z.string().optional(),
    expiresInHours: z.number().int().positive().optional(),
  })
  .strict();

/** Body schema for POST /intents/:id/offers (intentId comes from params) */
export const submitOfferBodySchema = createOfferInputSchema.omit({ intentId: true });

export const acceptOfferBodySchema = z
  .object({
    offerId: z.string().min(1),
  })
  .strict();
