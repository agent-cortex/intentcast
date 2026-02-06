/**
 * Providers Routes — Register, list, and match providers
 */

import { Router, Request, Response } from 'express';
import { providerStore } from '../store/index.js';
import { findMatchingIntents, getMatchStats } from '../services/matching.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createProviderInputSchema, listProvidersQuerySchema } from '../schemas/provider.js';
import { CreateProviderInput } from '../models/provider.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';

const router = Router();

/**
 * POST /api/v1/providers — Register a new provider
 * Body: { agentId, name, capabilities, pricing, wallet, ... }
 */
router.post(
  '/',
  validateBody(createProviderInputSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const input: CreateProviderInput = req.body;

    // Validate required fields
    const required = ['agentId', 'name', 'capabilities', 'pricing', 'wallet'] as const;
    const missing = required.filter((f) => !(input as any)?.[f]);

    if (missing.length > 0) {
      throw new AppError({
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        message: 'Missing required fields',
        details: { required, missing },
      });
    }

    // Validate capabilities array
    if (!Array.isArray(input.capabilities) || input.capabilities.length === 0) {
      throw new AppError({
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        message: 'capabilities must be a non-empty array of CapabilityDeclaration',
      });
    }

    // Validate each capability
    for (const cap of input.capabilities as any[]) {
      if (!cap.category || !cap.name || !cap.description || !cap.acceptsInputTypes || !cap.producesOutputFormats) {
        throw new AppError({
          code: 'VALIDATION_ERROR',
          statusCode: 400,
          message: 'Invalid capability declaration',
          details: {
            required: ['category', 'name', 'description', 'acceptsInputTypes', 'producesOutputFormats'],
          },
        });
      }
    }

    // Validate pricing array
    if (!Array.isArray(input.pricing) || input.pricing.length === 0) {
      throw new AppError({
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        message: 'pricing must be a non-empty array of PricingDeclaration',
      });
    }

    // Check for existing provider with same agentId
    const existing = await providerStore.getByAgentId(input.agentId);
    if (existing) {
      // Update existing provider (re-registration = heartbeat)
      await providerStore.update(existing.id, {
        name: input.name,
        description: input.description,
        capabilities: input.capabilities,
        pricing: input.pricing,
        wallet: input.wallet,
        status: 'online',
      });

      console.log(`Provider updated: ${existing.id} (${input.agentId})`);

      res.json({
        success: true,
        message: 'Provider updated',
        provider: await providerStore.get(existing.id),
      });
      return;
    }

    // Create new provider
    const provider = await providerStore.create(input);

    console.log(`Provider registered: ${provider.id} (${input.agentId})`);

    res.status(201).json({
      success: true,
      provider,
    });
  })
);

/**
 * GET /api/v1/providers — List providers
 * Query: ?status=online&category=research
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { status, category } = req.query;

    const providers = await providerStore.list({
      status: status as string | undefined,
      category: category as string | undefined,
    });

    res.json({
      count: providers.length,
      providers,
    });
  })
);

/**
 * GET /api/v1/providers/stats/overview — Get matching statistics
 */
router.get(
  '/stats/overview',
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await getMatchStats();
    res.json({ stats });
  })
);

/**
 * GET /api/v1/providers/match/:providerId — Get matching intents for a provider
 */
router.get(
  '/match/:providerId',
  asyncHandler(async (req: Request, res: Response) => {
    const { providerId } = req.params;

    const provider = await providerStore.get(providerId);
    if (!provider) {
      throw new AppError({
        code: 'NOT_FOUND',
        statusCode: 404,
        message: 'Provider not found',
        details: { providerId },
      });
    }

    const matches = await findMatchingIntents(providerId);

    res.json({
      providerId,
      providerName: provider.name,
      matchCount: matches.length,
      matches,
    });
  })
);

/**
 * GET /api/v1/providers/:id — Get single provider
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const provider = await providerStore.get(id);

    if (!provider) {
      throw new AppError({
        code: 'NOT_FOUND',
        statusCode: 404,
        message: 'Provider not found',
        details: { id },
      });
    }

    res.json({ provider });
  })
);

/**
 * DELETE /api/v1/providers/:id — Unregister/offline a provider
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const provider = await providerStore.get(id);

    if (!provider) {
      throw new AppError({
        code: 'NOT_FOUND',
        statusCode: 404,
        message: 'Provider not found',
        details: { id },
      });
    }

    // Mark as offline rather than delete
    await providerStore.update(id, { status: 'offline' });

    console.log(`Provider offline: ${id}`);

    res.json({
      success: true,
      message: 'Provider marked offline',
      provider: await providerStore.get(id),
    });
  })
);

export { router as providersRouter };
