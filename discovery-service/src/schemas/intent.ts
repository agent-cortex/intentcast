import { z } from 'zod';

const sizeSchema = z
  .object({
    value: z.number(),
    unit: z.enum(['bytes', 'chars', 'tokens', 'words', 'lines']),
  })
  .strict();

export const inputTypeSchema = z.enum(['text', 'code', 'url', 'file', 'json', 'image', 'audio', 'video', 'binary']);
export const outputFormatSchema = z.enum([
  'text',
  'code',
  'json',
  'markdown',
  'html',
  'image',
  'audio',
  'video',
  'file',
  'structured',
]);
export const urgencyLevelSchema = z.enum(['low', 'normal', 'high', 'critical']);

export const intentInputAttachmentSchema = z
  .object({
    type: inputTypeSchema,
    mimeType: z.string().optional(),
    name: z.string().min(1),
    content: z.string(),
  })
  .strict();

export const intentInputSpecSchema = z
  .object({
    type: inputTypeSchema,
    mimeType: z.string().optional(),
    language: z.string().optional(),
    locale: z.string().optional(),
    size: sizeSchema.optional(),
    content: z.string(),
    attachments: z.array(intentInputAttachmentSchema).optional(),
  })
  .strict();

export const intentOutputValidationSchema = z
  .object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    requiredFields: z.array(z.string()).optional(),
  })
  .strict();

export const intentOutputSpecSchema = z
  .object({
    format: outputFormatSchema,
    mimeType: z.string().optional(),
    language: z.string().optional(),
    locale: z.string().optional(),
    schema: z.record(z.unknown()).optional(),
    description: z.string().optional(),
    example: z.string().optional(),
    validation: intentOutputValidationSchema.optional(),
  })
  .strict();

export const requiredCapabilitiesSchema = z
  .object({
    category: z.string().min(1),
    skills: z.array(z.string()).optional(),
    minRating: z.number().optional(),
    minCompletedJobs: z.number().optional(),
  })
  .strict();

export const intentContextSchema = z
  .object({
    references: z.array(z.string()).optional(),
    conventions: z.string().optional(),
    examples: z
      .array(
        z
          .object({
            input: z.string(),
            output: z.string(),
            quality: z.enum(['good', 'bad']),
          })
          .strict()
      )
      .optional(),
  })
  .strict();

export const createIntentInputSchema = z
  .object({
    title: z.string().min(1),
    input: intentInputSpecSchema,
    output: intentOutputSpecSchema,
    requires: requiredCapabilitiesSchema,
    maxPriceUsdc: z.string().min(1),
    requesterWallet: z.string().min(1),
    stakeTxHash: z.string().min(1),
    stakeAmount: z.string().min(1),

    description: z.string().optional(),
    argumentHint: z.string().optional(),
    context: intentContextSchema.optional(),
    tags: z.array(z.string()).optional(),
    urgency: urgencyLevelSchema.optional(),
    deadlineHours: z.number().int().positive().optional(),
  })
  .strict();

export const listIntentsQuerySchema = z
  .object({
    status: z.string().optional(),
    category: z.string().optional(),
  })
  .passthrough();
