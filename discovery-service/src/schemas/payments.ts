import { z } from 'zod';

export const releasePaymentBodySchema = z
  .object({
    intentId: z.string().min(1),
    confirmCompletion: z.literal(true),
  })
  .strict();
