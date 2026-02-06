/**
 * Offers Routes — Submit and manage offers on intents
 */

import { Router, Request, Response } from 'express';
import { intentStore, offerStore, providerStore } from '../store/index.js';
import { CreateOfferInput } from '../models/offer.js';
import { getProviderCategories } from '../models/provider.js';

const router = Router();

/**
 * POST /api/v1/intents/:id/offers — Submit an offer for an intent
 * Body: { providerId, priceUsdc, commitment, priceBreakdown?, qualifications? }
 */
router.post('/intents/:id/offers', async (req: Request, res: Response) => {
  try {
    const { id: intentId } = req.params;
    const { providerId, priceUsdc, commitment, priceBreakdown, qualifications } = req.body;

    // Validate intent exists and is active
    const intent = await intentStore.get(intentId);
    if (!intent) {
      res.status(404).json({ error: 'Intent not found' });
      return;
    }

    if (intent.status !== 'active') {
      res.status(400).json({
        error: 'Cannot submit offer',
        reason: `Intent is ${intent.status}`,
      });
      return;
    }

    // Validate required fields
    if (!providerId || !priceUsdc || !commitment) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['providerId', 'priceUsdc', 'commitment'],
      });
      return;
    }

    // Validate commitment
    if (!commitment.outputFormat || !commitment.estimatedDelivery) {
      res.status(400).json({
        error: 'Invalid commitment',
        required: ['commitment.outputFormat', 'commitment.estimatedDelivery'],
      });
      return;
    }

    // Validate provider exists
    const provider = await providerStore.get(providerId);
    if (!provider) {
      res.status(400).json({ error: 'Provider not found' });
      return;
    }

    // Check price is within intent's max
    if (parseFloat(priceUsdc) > parseFloat(intent.maxPriceUsdc)) {
      res.status(400).json({
        error: 'Price exceeds max',
        maxPriceUsdc: intent.maxPriceUsdc,
        offeredPrice: priceUsdc,
      });
      return;
    }

    // Check for existing offer from this provider
    const existingOffers = await offerStore.listByIntent(intentId);
    const existingOffer = existingOffers.find((o: any) => o.providerId === providerId);
    if (existingOffer) {
      res.status(400).json({
        error: 'Provider already submitted an offer',
        existingOfferId: existingOffer.id,
      });
      return;
    }

    // Create offer
    const input: CreateOfferInput = {
      intentId,
      providerId,
      priceUsdc,
      commitment,
      priceBreakdown,
      qualifications,
    };

    const offer = await offerStore.create(input);

    console.log(`Offer submitted: ${offer.id} for intent ${intentId} by provider ${providerId}`);

    res.status(201).json({
      success: true,
      offer,
    });
  } catch (error) {
    console.error('Submit offer error:', error);
    res.status(500).json({ error: 'Failed to submit offer' });
  }
});

/**
 * GET /api/v1/intents/:id/offers — List offers for an intent
 */
router.get('/intents/:id/offers', async (req: Request, res: Response) => {
  try {
    const { id: intentId } = req.params;

    // Validate intent exists
    const intent = await intentStore.get(intentId);
    if (!intent) {
      res.status(404).json({ error: 'Intent not found' });
      return;
    }

    const offers = await offerStore.listByIntent(intentId);

    // Enrich with provider info
    const enrichedOffers = await Promise.all(
      offers.map(async (offer: any) => {
        const provider = await providerStore.get(offer.providerId);
        return {
          ...offer,
          provider: provider
            ? {
                id: provider.id,
                agentId: provider.agentId,
                name: provider.name,
                categories: getProviderCategories(provider),
                rating: provider.rating,
              }
            : null,
        };
      })
    );

    res.json({
      intentId,
      intentStatus: intent.status,
      count: enrichedOffers.length,
      offers: enrichedOffers,
    });
  } catch (error) {
    console.error('List offers error:', error);
    res.status(500).json({ error: 'Failed to list offers' });
  }
});

/**
 * POST /api/v1/intents/:id/accept — Accept an offer
 * Body: { offerId }
 */
router.post('/intents/:id/accept', async (req: Request, res: Response) => {
  try {
    const { id: intentId } = req.params;
    const { offerId } = req.body;

    // Validate intent
    const intent = await intentStore.get(intentId);
    if (!intent) {
      res.status(404).json({ error: 'Intent not found' });
      return;
    }

    if (intent.status !== 'active') {
      res.status(400).json({
        error: 'Cannot accept offer',
        reason: `Intent is ${intent.status}`,
      });
      return;
    }

    // Validate offer
    if (!offerId) {
      res.status(400).json({
        error: 'Missing required field: offerId',
      });
      return;
    }

    const offer = await offerStore.get(offerId);
    if (!offer) {
      res.status(404).json({ error: 'Offer not found' });
      return;
    }

    if (offer.intentId !== intentId) {
      res.status(400).json({ error: 'Offer does not belong to this intent' });
      return;
    }

    if (offer.status !== 'pending') {
      res.status(400).json({
        error: 'Cannot accept offer',
        reason: `Offer is ${offer.status}`,
      });
      return;
    }

    // Accept the offer
    await offerStore.update(offerId, { status: 'accepted' });

    // Update intent status and link to accepted offer
    await intentStore.update(intentId, {
      status: 'matched',
      acceptedOfferId: offerId,
    });

    // Reject other pending offers
    const allOffers = await offerStore.listByIntent(intentId);
    for (const otherOffer of allOffers) {
      if (otherOffer.id !== offerId && otherOffer.status === 'pending') {
        await offerStore.update(otherOffer.id, { status: 'rejected' });
      }
    }

    const provider = await providerStore.get(offer.providerId);

    console.log(`Offer accepted: ${offerId} for intent ${intentId}`);

    res.json({
      success: true,
      message: 'Offer accepted',
      intent: await intentStore.get(intentId),
      acceptedOffer: await offerStore.get(offerId),
      provider: provider
        ? {
            id: provider.id,
            agentId: provider.agentId,
            name: provider.name,
            wallet: provider.wallet,
          }
        : null,
    });
  } catch (error) {
    console.error('Accept offer error:', error);
    res.status(500).json({ error: 'Failed to accept offer' });
  }
});

export { router as offersRouter };
