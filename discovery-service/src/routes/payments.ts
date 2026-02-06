/**
 * Payments Routes — Release USDC to providers after work completion
 */

import { Router, Request, Response } from 'express';
import { intentStore, offerStore, providerStore } from '../store/index.js';
import { executeTransfer, getBalance } from '../services/usdc.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';

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

  throw new AppError({
    code: 'INTERNAL_SERVER_ERROR',
    statusCode: 500,
    message: 'Service wallet private key not available',
    details: {
      hint: 'Set SERVICE_PRIVATE_KEY (or SERVICE_WALLET_PRIVATE_KEY) in the environment.',
    },
  });
}

/**
 * POST /api/v1/payments/release — Release payment to provider
 * Body: { intentId, confirmCompletion: true }
 */
router.post(
  '/release',
  asyncHandler(async (req: Request, res: Response) => {
    const { intentId, confirmCompletion } = req.body;

    // Validate required fields
    if (!intentId) {
      throw new AppError({
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        message: 'Missing required field: intentId',
      });
    }

    if (!confirmCompletion) {
      throw new AppError({
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        message: 'Must confirm completion',
        details: { hint: 'Set confirmCompletion: true to release payment' },
      });
    }

    // Validate intent
    const intent = await intentStore.get(intentId);
    if (!intent) {
      throw new AppError({
        code: 'NOT_FOUND',
        statusCode: 404,
        message: 'Intent not found',
        details: { intentId },
      });
    }

    if (intent.status !== 'matched') {
      throw new AppError({
        code: 'BAD_REQUEST',
        statusCode: 400,
        message: 'Cannot release payment',
        details: { reason: `Intent status is ${intent.status}, must be matched` },
      });
    }

    if (!intent.acceptedOfferId) {
      throw new AppError({
        code: 'BAD_REQUEST',
        statusCode: 400,
        message: 'No accepted offer for this intent',
      });
    }

    // Get the accepted offer
    const offer = await offerStore.get(intent.acceptedOfferId);
    if (!offer) {
      throw new AppError({
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
        message: 'Accepted offer not found',
        details: { acceptedOfferId: intent.acceptedOfferId },
      });
    }

    // Get provider wallet
    const provider = await providerStore.get(offer.providerId);
    if (!provider) {
      throw new AppError({
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
        message: 'Provider not found',
        details: { providerId: offer.providerId },
      });
    }

    const paymentAmount = offer.priceUsdc;
    const providerWallet = provider.wallet;

    console.log(`Releasing payment: ${paymentAmount} USDC to ${providerWallet}`);

    // Check service wallet balance
    const balance = await getBalance(SERVICE_WALLET);
    if (parseFloat(balance) < parseFloat(paymentAmount)) {
      throw new AppError({
        code: 'BAD_REQUEST',
        statusCode: 400,
        message: 'Insufficient service wallet balance',
        details: { available: balance, required: paymentAmount },
      });
    }

    // Get private key and execute transfer
    const privateKey = getServicePrivateKey();

    const result = await executeTransfer(providerWallet, paymentAmount, privateKey);

    if (!result.success) {
      throw new AppError({
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
        message: 'Payment transfer failed',
        details: { reason: result.error },
      });
    }

    // Update intent status to completed
    await intentStore.update(intentId, { status: 'completed' });

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
      intent: await intentStore.get(intentId),
    });
  })
);

/**
 * GET /api/v1/payments/balance — Check service wallet balance
 */
router.get(
  '/balance',
  asyncHandler(async (_req: Request, res: Response) => {
    const balance = await getBalance(SERVICE_WALLET);

    res.json({
      wallet: SERVICE_WALLET,
      balance,
      currency: 'USDC',
      network: 'base-sepolia',
    });
  })
);

export { router as paymentsRouter };
