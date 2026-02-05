/**
 * Intents Routes — Create, list, get, cancel intents
 */

import { Router, Request, Response } from 'express';
import { intentStore } from '../store/memory.js';
import { verifyStake } from '../services/usdc.js';
import { CreateIntentInput } from '../models/intent.js';

const router = Router();

/**
 * POST /api/v1/intents — Create a new intent
 * Body: { category, requirements?, maxPriceUsdc, deadlineHours?, requesterWallet, stakeTxHash, stakeAmount }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const input: CreateIntentInput = req.body;
    
    // Validate required fields
    if (!input.category || !input.maxPriceUsdc || !input.requesterWallet || !input.stakeTxHash || !input.stakeAmount) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['category', 'maxPriceUsdc', 'requesterWallet', 'stakeTxHash', 'stakeAmount'],
      });
      return;
    }
    
    // Verify stake
    const hasStake = await verifyStake(input.requesterWallet, input.stakeAmount);
    
    // Create intent
    const intent = intentStore.create(input);
    
    // Mark stake as verified if balance check passed
    if (hasStake) {
      intentStore.update(intent.id, { stakeVerified: true });
    }
    
    console.log(`Intent created: ${intent.id} (stake verified: ${hasStake})`);
    
    res.status(201).json({
      success: true,
      intent: intentStore.get(intent.id),
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
router.get('/', (req: Request, res: Response) => {
  try {
    const { status, category } = req.query;
    
    const intents = intentStore.list({
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
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const intent = intentStore.get(id);
    
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
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const intent = intentStore.get(id);
    
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
    intentStore.update(id, { status: 'cancelled' });
    
    console.log(`Intent cancelled: ${id}`);
    
    res.json({
      success: true,
      message: 'Intent cancelled',
      intent: intentStore.get(id),
    });
  } catch (error) {
    console.error('Cancel intent error:', error);
    res.status(500).json({ error: 'Failed to cancel intent' });
  }
});

export { router as intentsRouter };
