/**
 * Providers Routes — Register, list, and match providers
 */

import { Router, Request, Response } from 'express';
import { providerStore } from '../store/memory.js';
import { findMatchingIntents, getMatchStats } from '../services/matching.js';
import { CreateProviderInput } from '../models/provider.js';

const router = Router();

/**
 * POST /api/v1/providers — Register a new provider
 * Body: { agentId, capabilities, pricing, wallet }
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const input: CreateProviderInput = req.body;
    
    // Validate required fields
    if (!input.agentId || !input.capabilities || !input.wallet) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['agentId', 'capabilities', 'wallet'],
      });
      return;
    }
    
    // Check for existing provider with same agentId
    const existing = providerStore.getByAgentId(input.agentId);
    if (existing) {
      // Update existing provider (re-registration = heartbeat)
      providerStore.update(existing.id, {
        capabilities: input.capabilities,
        pricing: input.pricing || {},
        wallet: input.wallet,
        status: 'online',
      });
      
      console.log(`Provider updated: ${existing.id} (${input.agentId})`);
      
      res.json({
        success: true,
        message: 'Provider updated',
        provider: providerStore.get(existing.id),
      });
      return;
    }
    
    // Create new provider
    const provider = providerStore.create({
      ...input,
      pricing: input.pricing || {},
    });
    
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
 * Query: ?status=online&capability=research
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { status, capability } = req.query;
    
    const providers = providerStore.list({
      status: status as string | undefined,
      capability: capability as string | undefined,
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
 * GET /api/v1/providers/:id — Get single provider
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const provider = providerStore.get(id);
    
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
 * GET /api/v1/match/:providerId — Get matching intents for a provider
 */
router.get('/match/:providerId', (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    
    const provider = providerStore.get(providerId);
    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }
    
    const matches = findMatchingIntents(providerId);
    
    res.json({
      providerId,
      capabilities: provider.capabilities,
      matchCount: matches.length,
      matches,
    });
  } catch (error) {
    console.error('Match intents error:', error);
    res.status(500).json({ error: 'Failed to find matching intents' });
  }
});

/**
 * GET /api/v1/providers/stats — Get matching statistics
 */
router.get('/stats/overview', (_req: Request, res: Response) => {
  try {
    const stats = getMatchStats();
    res.json({ stats });
  } catch (error) {
    console.error('Match stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

/**
 * DELETE /api/v1/providers/:id — Unregister/offline a provider
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const provider = providerStore.get(id);
    
    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }
    
    // Mark as offline rather than delete
    providerStore.update(id, { status: 'offline' });
    
    console.log(`Provider offline: ${id}`);
    
    res.json({
      success: true,
      message: 'Provider marked offline',
      provider: providerStore.get(id),
    });
  } catch (error) {
    console.error('Offline provider error:', error);
    res.status(500).json({ error: 'Failed to offline provider' });
  }
});

export { router as providersRouter };
