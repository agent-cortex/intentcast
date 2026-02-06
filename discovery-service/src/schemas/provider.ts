import { z } from 'zod';
import { inputTypeSchema, outputFormatSchema } from './intent.js';

const sizeSchema = z
  .object({
    value: z.number(),
    unit: z.enum(['bytes', 'chars', 'tokens', 'words', 'lines']),
  })
  .strict();

export const capabilityDeclarationSchema = z
  .object({
    category: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    acceptsInputTypes: z.array(inputTypeSchema).min(1),
    acceptsMimeTypes: z.array(z.string()).optional(),
    acceptsLanguages: z.array(z.string()).optional(),
    acceptsLocales: z.array(z.string()).optional(),
    maxInputSize: sizeSchema.optional(),
    producesOutputFormats: z.array(outputFormatSchema).min(1),
    producesMimeTypes: z.array(z.string()).optional(),
    producesLanguages: z.array(z.string()).optional(),
    producesLocales: z.array(z.string()).optional(),
    avgProcessingTime: z
      .object({ value: z.number(), unit: z.enum(['seconds', 'minutes', 'hours']) })
      .strict()
      .optional(),
    guarantees: z
      .object({
        accuracy: z.number().min(0).max(1).optional(),
        revisions: z.number().int().nonnegative().optional(),
        responseTimeMinutes: z.number().int().positive().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const pricingDeclarationSchema = z
  .object({
    category: z.string().min(1),
    basePrice: z.string().min(1),
    unit: z.enum(['per_task', 'per_word', 'per_token', 'per_minute', 'per_image', 'per_request', 'flat']),
    minimumCharge: z.string().optional(),
    maximumCharge: z.string().optional(),
    rushMultiplier: z.number().optional(),
    volumeDiscounts: z
      .array(z.object({ minUnits: z.number().int().positive(), discountPercent: z.number().min(0).max(100) }).strict())
      .optional(),
  })
  .strict();

export const createProviderInputSchema = z
  .object({
    agentId: z.string().min(1),
    wallet: z.string().min(1),
    name: z.string().min(1),
    capabilities: z.array(capabilityDeclarationSchema).min(1),
    pricing: z.array(pricingDeclarationSchema).min(1),

    description: z.string().optional(),
    argumentHint: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    certifications: z.array(z.string()).optional(),
    websiteUrl: z.string().url().optional(),
    apiEndpoint: z.string().url().optional(),
  })
  .strict();

export const listProvidersQuerySchema = z
  .object({
    status: z.string().optional(),
    category: z.string().optional(),
  })
  .strict();
