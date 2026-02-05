/**
 * Payments Routes — Release USDC to providers after work completion
 */

import { Router, Request, Response } from 'express';
import { intentStore, offerStore, providerStore } from '../store/memory.js';
import { executeTransfer, getBalance } from '../services/usdc.js';

const router = Router();

// Service wallet address (funded for payments)
const SERVICE_WALLET = process.env.SERVICE_WALLET || '0xe08Ad6b0975222f410Eb2fa0e50c7Ee8FBe78F2D';

/**
 * Get service wallet private key from environment.
 *
 * This service is designed to run in serverless environments (e.g. Vercel), so
 * we do not shell out to local secret stores at runtime.
 */
function getServicePrivateKey(): string {
  const pk = process.env.SERVICE_PRIVATE_KEY || process.env.SERVICE_WALLET_PRIVATE_KEY;
  if (pk) return pk;

  throw new Error(
    'Service wallet private key not available. Set SERVICE_PRIVATE_KEY (or SERVICE_WALLET_PRIVATE_KEY) in the environment.'
  );
}

/**
 * POST /api/v1/payments/release — Release payment to provider
 * Body: { intentId, confirmCompletion: true }
 */
router.post('/release', async (req: Request, res: Response) => {
  try {
    const { intentId, confirmCompletion } = req.body;
    
    // Validate required fields
    if (!intentId) {
      res.status(400).json({
        error: 'Missing required field: intentId',
      });
      return;
    }
    
    if (!confirmCompletion) {
      res.status(400).json({
        error: 'Must confirm completion',
        hint: 'Set confirmCompletion: true to release payment',
      });
      return;
    }
    
    // Validate intent
    const intent = intentStore.get(intentId);
    if (!intent) {
      res.status(404).json({ error: 'Intent not found' });
      return;
    }
    
    if (intent.status !== 'matched') {
      res.status(400).json({
        error: 'Cannot release payment',
        reason: `Intent status is ${intent.status}, must be matched`,
      });
      return;
    }
    
    if (!intent.acceptedOfferId) {
      res.status(400).json({
        error: 'No accepted offer for this intent',
      });
      return;
    }
    
    // Get the accepted offer
    const offer = offerStore.get(intent.acceptedOfferId);
    if (!offer) {
      res.status(500).json({ error: 'Accepted offer not found' });
      return;
    }
    
    // Get provider wallet
    const provider = providerStore.get(offer.providerId);
    if (!provider) {
      res.status(500).json({ error: 'Provider not found' });
      return;
    }
    
    const paymentAmount = offer.priceUsdc;
    const providerWallet = provider.wallet;
    
    console.log(`Releasing payment: ${paymentAmount} USDC to ${providerWallet}`);
    
    // Check service wallet balance
    const balance = await getBalance(SERVICE_WALLET);
    if (parseFloat(balance) < parseFloat(paymentAmount)) {
      res.status(400).json({
        error: 'Insufficient service wallet balance',
        available: balance,
        required: paymentAmount,
      });
      return;
    }
    
    // Get private key and execute transfer
    let privateKey: string;
    try {
      privateKey = getServicePrivateKey();
    } catch (error) {
      res.status(500).json({
        error: 'Service wallet not configured',
        message: (error as Error).message,
      });
      return;
    }
    
    const result = await executeTransfer(providerWallet, paymentAmount, privateKey);
    
    if (!result.success) {
      res.status(500).json({
        error: 'Payment transfer failed',
        reason: result.error,
      });
      return;
    }
    
    // Update intent status to completed
    intentStore.update(intentId, { status: 'completed' });
    
    console.log(`Payment released: ${result.txHash}`);
    
    res.json({
      success: true,
      payment: {
        intentId,
        offerId: offer.id,
        providerId: provider.id,
        providerWallet,
        amount: paymentAmount,
        currency: 'USDC',
        network: 'base-sepolia',
        txHash: result.txHash,
      },
      intent: intentStore.get(intentId),
    });
  } catch (error) {
    console.error('Release payment error:', error);
    res.status(500).json({ error: 'Failed to release payment' });
  }
});

/**
 * GET /api/v1/payments/balance — Check service wallet balance
 */
router.get('/balance', async (_req: Request, res: Response) => {
  try {
    const balance = await getBalance(SERVICE_WALLET);
    
    res.json({
      wallet: SERVICE_WALLET,
      balance,
      currency: 'USDC',
      network: 'base-sepolia',
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

export { router as paymentsRouter };
