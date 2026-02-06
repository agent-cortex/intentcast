/**
 * Intents Routes — Create, list, get, cancel intents
 */

import { Router, Request, Response } from 'express';
import { intentStore } from '../store/index.js';
import { verifyStake } from '../services/usdc.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { fulfillIntent } from '../x402/service.js';
import { createIntentInputSchema, listIntentsQuerySchema } from '../schemas/intent.js';
import { CreateIntentInput } from '../models/intent.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';

const router = Router();

/**
 * POST /api/v1/intents — Create a new intent
 * Body: { title, input, output, requires, maxPriceUsdc, requesterWallet, stakeTxHash, stakeAmount, ... }
 */
router.post(
  '/',
  validateBody(createIntentInputSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const input: CreateIntentInput = req.body;

    // (validated by Zod middleware)

    // Verify stake
    const hasStake = await verifyStake(input.requesterWallet, input.stakeAmount);

    // Create intent
    const intent = await intentStore.create(input);

    // Mark stake as verified if balance check passed
    if (hasStake) {
      await intentStore.update(intent.id, { stakeVerified: true });
    }

    console.log(`Intent created: ${intent.id} (stake verified: ${hasStake})`);

    res.status(201).json({
      success: true,
      intent: await intentStore.get(intent.id),
      stakeVerified: hasStake,
    });
  })
);

/**
 * GET /api/v1/intents — List intents
 * Query: ?status=active&category=research
 */
router.get(
  '/',
  validateQuery(listIntentsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { status, category } = req.query as { status?: string; category?: string };

    const intents = await intentStore.list({
      status,
      category,
    });

    res.json({
      count: intents.length,
      intents,
    });
  })
);

/**
 * GET /api/v1/intents/:id — Get single intent
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const intent = await intentStore.get(id);

    if (!intent) {
      throw new AppError({
        code: 'NOT_FOUND',
        statusCode: 404,
        message: 'Intent not found',
        details: { id },
      });
    }

    res.json({ intent });
  })
);

/**
 * DELETE /api/v1/intents/:id — Cancel an intent
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const intent = await intentStore.get(id);

    if (!intent) {
      throw new AppError({
        code: 'NOT_FOUND',
        statusCode: 404,
        message: 'Intent not found',
        details: { id },
      });
    }

    // Only active intents can be cancelled
    if (intent.status !== 'active') {
      throw new AppError({
        code: 'BAD_REQUEST',
        statusCode: 400,
        message: 'Cannot cancel intent',
        details: { reason: `Intent is ${intent.status}` },
      });
    }

    // Mark as cancelled (don't delete, keep for history)
    await intentStore.update(id, { status: 'cancelled' });

    console.log(`Intent cancelled: ${id}`);

    res.json({
      success: true,
      message: 'Intent cancelled',
      intent: await intentStore.get(id),
    });
  })
);

/**
 * POST /api/v1/intents/:id/fulfill — Fulfill an accepted intent via x402 payment
 * Body: { input?: any, endpoint?: string }
 * 
 * This calls the provider's x402-protected endpoint and pays them automatically.
 * Requires SERVICE_WALLET_PRIVATE_KEY env var.
 */
router.post(
  '/:id/fulfill',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { input, endpoint } = req.body as { input?: unknown; endpoint?: string };

    const result = await fulfillIntent(id, { input, endpoint });

    res.json({
      success: result.x402.success,
      intentId: result.intentId,
      providerId: result.providerId,
      offerId: result.offerId,
      providerEndpoint: result.providerEndpoint,
      result: result.x402.data,
      paymentTxHash: result.x402.paymentTxHash,
      error: result.x402.error,
    });
  })
);

export { router as intentsRouter };
