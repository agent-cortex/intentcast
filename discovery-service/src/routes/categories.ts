/**
 * Categories Routes — Get available service categories
 */

import { Router, Request, Response } from 'express';
import { CATEGORIES, getCategoryById } from '../models/categories.js';
import { intentStore, providerStore } from '../store/memory.js';

const router = Router();

/**
 * GET /api/v1/categories
 * List all available service categories with counts
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    // Count providers and intents per category
    const categoryCounts = new Map<string, { providers: number; intents: number }>();
    
    // Initialize counts
    for (const cat of CATEGORIES) {
      categoryCounts.set(cat.id, { providers: 0, intents: 0 });
    }
    
    // Count providers per category
    providerStore.list().forEach((provider: any) => {
      for (const cap of provider.capabilities) {
        const counts = categoryCounts.get(cap);
        if (counts) {
          counts.providers += 1;
        }
      }
    });
    
    // Count intents per category
    intentStore.list().forEach((intent: any) => {
      const counts = categoryCounts.get(intent.category);
      if (counts) {
        counts.intents += 1;
      }
    });
    
    // Build response with counts
    const categories = CATEGORIES.map((cat) => ({
      ...cat,
      stats: categoryCounts.get(cat.id) ?? { providers: 0, intents: 0 },
    }));
    
    res.json({ categories });
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: 'Failed to list categories' });
  }
});

/**
 * GET /api/v1/categories/:id
 * Get a single category by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = getCategoryById(id);
    
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    
    // Get providers and intents for this category
    const providers = providerStore.list().filter((p: any) => p.capabilities.includes(id));
    const intents = intentStore.list().filter((i: any) => i.category === id);
    
    res.json({
      ...category,
      stats: {
        providers: providers.length,
        intents: intents.length,
      },
      recentProviders: providers.slice(0, 5).map((p: any) => ({
        id: p.id,
        name: p.name,
        wallet: p.wallet,
        pricing: p.pricing[id],
      })),
      recentIntents: intents.slice(0, 5).map((i: any) => ({
        id: i.id,
        title: i.title,
        maxPriceUsdc: i.maxPriceUsdc,
        status: i.status,
      })),
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to get category' });
  }
});

export { router as categoriesRouter };
