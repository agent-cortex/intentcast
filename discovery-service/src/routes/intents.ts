/**
 * Intents Routes — Create, list, get, cancel intents
 */

import { Router, Request, Response } from 'express';
import { intentStore } from '../store/index.js';
import { verifyStake } from '../services/usdc.js';
import { CreateIntentInput } from '../models/intent.js';

const router = Router();

/**
 * POST /api/v1/intents — Create a new intent
 * Body: { title, input, output, requires, maxPriceUsdc, requesterWallet, stakeTxHash, stakeAmount, ... }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const input: CreateIntentInput = req.body;

    // Validate required fields
    const required = ['title', 'input', 'output', 'requires', 'maxPriceUsdc', 'requesterWallet', 'stakeTxHash', 'stakeAmount'];
    const missing = required.filter((f) => !input[f as keyof CreateIntentInput]);

    if (missing.length > 0) {
      res.status(400).json({
        error: 'Missing required fields',
        required,
        missing,
      });
      return;
    }

    // Validate nested required fields
    if (!input.input?.type || !input.input?.content) {
      res.status(400).json({
        error: 'Invalid input spec',
        required: ['input.type', 'input.content'],
      });
      return;
    }

    if (!input.output?.format) {
      res.status(400).json({
        error: 'Invalid output spec',
        required: ['output.format'],
      });
      return;
    }

    if (!input.requires?.category) {
      res.status(400).json({
        error: 'Invalid requires spec',
        required: ['requires.category'],
      });
      return;
    }

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
  } catch (error) {
    console.error('Create intent error:', error);
    res.status(500).json({ error: 'Failed to create intent' });
  }
});

/**
 * GET /api/v1/intents — List intents
 * Query: ?status=active&category=research
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, category } = req.query;

    const intents = await intentStore.list({
      status: status as string | undefined,
      category: category as string | undefined,
    });

    res.json({
      count: intents.length,
      intents,
    });
  } catch (error) {
    console.error('List intents error:', error);
    res.status(500).json({ error: 'Failed to list intents' });
  }
});

/**
 * GET /api/v1/intents/:id — Get single intent
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const intent = await intentStore.get(id);

    if (!intent) {
      res.status(404).json({ error: 'Intent not found' });
      return;
    }

    res.json({ intent });
  } catch (error) {
    console.error('Get intent error:', error);
    res.status(500).json({ error: 'Failed to get intent' });
  }
});

/**
 * DELETE /api/v1/intents/:id — Cancel an intent
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const intent = await intentStore.get(id);

    if (!intent) {
      res.status(404).json({ error: 'Intent not found' });
      return;
    }

    // Only active intents can be cancelled
    if (intent.status !== 'active') {
      res.status(400).json({
        error: 'Cannot cancel intent',
        reason: `Intent is ${intent.status}`,
      });
      return;
    }

    // Mark as cancelled (don't delete, keep for history)
    await intentStore.update(id, { status: 'cancelled' });

    console.log(`Intent cancelled: ${id}`);

    res.json({
      success: true,
      message: 'Intent cancelled',
      intent: await intentStore.get(id),
    });
  } catch (error) {
    console.error('Cancel intent error:', error);
    res.status(500).json({ error: 'Failed to cancel intent' });
  }
});

export { router as intentsRouter };
