/**
 * Categories Routes — Get available service categories
 */

import { Router, Request, Response } from 'express';
import { CATEGORIES, getCategoryById } from '../models/categories.js';
import { intentStore, providerStore } from '../store/index.js';
import { getProviderCategories, getProviderPricing, Provider } from '../models/provider.js';
import { Intent } from '../models/intent.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';

const router = Router();

/**
 * GET /api/v1/categories
 * List all available service categories with counts
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    // Count providers and intents per category
    const categoryCounts = new Map<string, { providers: number; intents: number }>();

    // Initialize counts
    for (const cat of CATEGORIES) {
      categoryCounts.set(cat.id, { providers: 0, intents: 0 });
    }

    const providers: Provider[] = await providerStore.list();
    const intents: Intent[] = await intentStore.list();

    // Count providers per category
    providers.forEach((provider: Provider) => {
      const categories = getProviderCategories(provider);
      for (const catId of categories) {
        const counts = categoryCounts.get(catId);
        if (counts) counts.providers += 1;
      }
    });

    // Count intents per category
    intents.forEach((intent: Intent) => {
      const catId = intent.requires.category;
      const counts = categoryCounts.get(catId);
      if (counts) counts.intents += 1;
    });

    // Build response with counts
    const categories = CATEGORIES.map((cat) => ({
      ...cat,
      stats: categoryCounts.get(cat.id) ?? { providers: 0, intents: 0 },
    }));

    res.json({ categories });
  })
);

/**
 * GET /api/v1/categories/:id
 * Get a single category by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const category = getCategoryById(id);

    if (!category) {
      throw new AppError({
        code: 'NOT_FOUND',
        statusCode: 404,
        message: 'Category not found',
        details: { id },
      });
    }

    // Get providers and intents for this category
    const providers = (await providerStore.list()).filter((p: Provider) => getProviderCategories(p).includes(id));
    const intents = (await intentStore.list()).filter((i: Intent) => i.requires.category === id);

    res.json({
      ...category,
      stats: {
        providers: providers.length,
        intents: intents.length,
      },
      recentProviders: providers.slice(0, 5).map((p: Provider) => {
        const pricing = getProviderPricing(p, id);
        return {
          id: p.id,
          name: p.name,
          wallet: p.wallet,
          basePrice: pricing?.basePrice,
          priceUnit: pricing?.unit,
        };
      }),
      recentIntents: intents.slice(0, 5).map((i: Intent) => ({
        id: i.id,
        title: i.title,
        maxPriceUsdc: i.maxPriceUsdc,
        status: i.status,
      })),
    });
  })
);

export { router as categoriesRouter };
