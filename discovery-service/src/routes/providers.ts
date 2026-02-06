/**
 * Providers Routes — Register, list, and match providers
 */

import { Router, Request, Response } from 'express';
import { providerStore } from '../store/index.js';
import { findMatchingIntents, getMatchStats } from '../services/matching.js';
import { CreateProviderInput } from '../models/provider.js';

const router = Router();

/**
 * POST /api/v1/providers — Register a new provider
 * Body: { agentId, name, capabilities, pricing, wallet, ... }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const input: CreateProviderInput = req.body;

    // Validate required fields
    const required = ['agentId', 'name', 'capabilities', 'pricing', 'wallet'];
    const missing = required.filter((f) => !input[f as keyof CreateProviderInput]);

    if (missing.length > 0) {
      res.status(400).json({
        error: 'Missing required fields',
        required,
        missing,
      });
      return;
    }

    // Validate capabilities array
    if (!Array.isArray(input.capabilities) || input.capabilities.length === 0) {
      res.status(400).json({
        error: 'capabilities must be a non-empty array of CapabilityDeclaration',
      });
      return;
    }

    // Validate each capability
    for (const cap of input.capabilities) {
      if (!cap.category || !cap.name || !cap.description || !cap.acceptsInputTypes || !cap.producesOutputFormats) {
        res.status(400).json({
          error: 'Invalid capability declaration',
          required: ['category', 'name', 'description', 'acceptsInputTypes', 'producesOutputFormats'],
        });
        return;
      }
    }

    // Validate pricing array
    if (!Array.isArray(input.pricing) || input.pricing.length === 0) {
      res.status(400).json({
        error: 'pricing must be a non-empty array of PricingDeclaration',
      });
      return;
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
  } catch (error) {
    console.error('Register provider error:', error);
    res.status(500).json({ error: 'Failed to register provider' });
  }
});

/**
 * GET /api/v1/providers — List providers
 * Query: ?status=online&category=research
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, category } = req.query;

    const providers = await providerStore.list({
      status: status as string | undefined,
      category: category as string | undefined,
    });

    res.json({
      count: providers.length,
      providers,
    });
  } catch (error) {
    console.error('List providers error:', error);
    res.status(500).json({ error: 'Failed to list providers' });
  }
});

/**
 * GET /api/v1/providers/match/:providerId — Get matching intents for a provider
 */
router.get('/match/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;

    const provider = await providerStore.get(providerId);
    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }

    const matches = await findMatchingIntents(providerId);

    res.json({
      providerId,
      providerName: provider.name,
      matchCount: matches.length,
      matches,
    });
  } catch (error) {
    console.error('Match intents error:', error);
    res.status(500).json({ error: 'Failed to find matching intents' });
  }
});

/**
 * GET /api/v1/providers/:id — Get single provider
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const provider = await providerStore.get(id);

    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }

    res.json({ provider });
  } catch (error) {
    console.error('Get provider error:', error);
    res.status(500).json({ error: 'Failed to get provider' });
  }
});

/**
 * GET /api/v1/providers/stats/overview — Get matching statistics
 */
router.get('/stats/overview', async (_req: Request, res: Response) => {
  try {
    const stats = await getMatchStats();
    res.json({ stats });
  } catch (error) {
    console.error('Match stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

/**
 * DELETE /api/v1/providers/:id — Unregister/offline a provider
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const provider = await providerStore.get(id);

    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }

    // Mark as offline rather than delete
    await providerStore.update(id, { status: 'offline' });

    console.log(`Provider offline: ${id}`);

    res.json({
      success: true,
      message: 'Provider marked offline',
      provider: await providerStore.get(id),
    });
  } catch (error) {
    console.error('Offline provider error:', error);
    res.status(500).json({ error: 'Failed to offline provider' });
  }
});

export { router as providersRouter };
