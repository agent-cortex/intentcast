/**
 * Payment service: fulfill an accepted offer by calling the provider's x402-protected endpoint.
 */

import { intentStore, offerStore, providerStore } from '../store/index.js';
import { AppError } from '../utils/errors.js';
import { callWithX402Payment, type X402Result } from './client.js';

export interface FulfillIntentInput {
  input?: unknown;
  /** optional override of provider endpoint; otherwise derived from provider.apiEndpoint */
  endpoint?: string;
}

export interface FulfillIntentResult {
  intentId: string;
  providerId: string;
  offerId: string;
  providerEndpoint: string;
  x402: X402Result;
}

function buildProviderFulfillUrl(apiEndpoint?: string): string {
  if (!apiEndpoint) return '';
  // If the provider gave a full /fulfill endpoint, use it.
  if (apiEndpoint.endsWith('/fulfill')) return apiEndpoint;
  // Otherwise, assume apiEndpoint is a base URL.
  return apiEndpoint.replace(/\/+$/, '') + '/fulfill';
}

export async function fulfillIntent(intentId: string, body: FulfillIntentInput): Promise<FulfillIntentResult> {
  const intent = await intentStore.get(intentId);
  if (!intent) {
    throw new AppError({ code: 'NOT_FOUND', statusCode: 404, message: 'Intent not found', details: { intentId } });
  }

  if (!intent.acceptedOfferId) {
    throw new AppError({
      code: 'BAD_REQUEST',
      statusCode: 400,
      message: 'Intent has no accepted offer',
      details: { intentId, status: intent.status },
    });
  }

  const offer = await offerStore.get(intent.acceptedOfferId);
  if (!offer) {
    throw new AppError({
      code: 'NOT_FOUND',
      statusCode: 404,
      message: 'Accepted offer not found',
      details: { offerId: intent.acceptedOfferId },
    });
  }

  const provider = await providerStore.get(offer.providerId);
  if (!provider) {
    throw new AppError({
      code: 'NOT_FOUND',
      statusCode: 404,
      message: 'Provider not found',
      details: { providerId: offer.providerId },
    });
  }

  const providerEndpoint = body.endpoint || buildProviderFulfillUrl((provider as any).apiEndpoint);
  if (!providerEndpoint) {
    throw new AppError({
      code: 'BAD_REQUEST',
      statusCode: 400,
      message: 'Provider has no apiEndpoint',
      details: { providerId: provider.id },
    });
  }

  const privateKey = process.env.SERVICE_WALLET_PRIVATE_KEY || process.env.SERVICE_PRIVATE_KEY;
  if (!privateKey) {
    throw new AppError({
      code: 'CONFIG_ERROR',
      statusCode: 500,
      message: 'SERVICE_WALLET_PRIVATE_KEY not configured (required to pay providers via x402)',
    });
  }

  // Network selection:
  // - Prefer provider.x402.network if present
  // - Otherwise default to Base Sepolia
  const network = (provider as any)?.x402?.network || 'eip155:84532';

  const x402 = await callWithX402Payment({
    endpoint: providerEndpoint,
    method: 'POST',
    body: { intentId, input: body.input },
    network,
    privateKey,
    rpcUrl: process.env.BASE_RPC_URL || process.env.BASE_SEPOLIA_RPC,
  });

  return {
    intentId,
    providerId: provider.id,
    offerId: offer.id,
    providerEndpoint,
    x402,
  };
}
