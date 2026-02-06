/**
 * IntentCast Demo Flow
 * 
 * Demonstrates the full flow:
 * 1. Register provider with x402
 * 2. Create intent
 * 3. Provider makes offer
 * 4. Requester accepts
 * 5. Fulfill via x402 (pay + execute)
 */

import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

const API_BASE = process.env.API_BASE || 'https://intentcast.agentcortex.space/api/v1';

// Demo wallets (use your own!)
const PROVIDER_KEY = process.env.PROVIDER_PRIVATE_KEY;
const REQUESTER_KEY = process.env.REQUESTER_PRIVATE_KEY;

if (!PROVIDER_KEY || !REQUESTER_KEY) {
  console.error('Set PROVIDER_PRIVATE_KEY and REQUESTER_PRIVATE_KEY env vars');
  process.exit(1);
}

const providerAccount = privateKeyToAccount(PROVIDER_KEY as `0x${string}`);
const requesterAccount = privateKeyToAccount(REQUESTER_KEY as `0x${string}`);

async function signMessage(account: any, nonce: string, method: string, path: string) {
  const message = `IntentCast:${nonce}:${method}:${path}`;
  return account.signMessage({ message });
}

async function apiCall(method: string, path: string, body?: any, account?: any) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  if (account && method !== 'GET') {
    const nonce = Date.now().toString();
    headers['x-wallet-address'] = account.address;
    headers['x-nonce'] = nonce;
    headers['x-signature'] = await signMessage(account, nonce, method, path);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return res.json();
}

async function main() {
  console.log('🚀 IntentCast Demo Flow\n');
  console.log(`Provider: ${providerAccount.address}`);
  console.log(`Requester: ${requesterAccount.address}\n`);

  // 1. Register Provider
  console.log('1️⃣ Registering provider with x402...');
  const provider = await apiCall('POST', '/providers', {
    agentId: `demo-provider-${Date.now()}`,
    wallet: providerAccount.address,
    name: 'Demo Summarizer',
    description: 'Summarizes text for the demo',
    apiEndpoint: process.env.PROVIDER_ENDPOINT || 'http://localhost:3001',
    capabilities: [{
      category: 'research',
      subcategory: 'summarization',
      description: 'Text summarization',
    }],
    pricing: [{
      category: 'research',
      basePrice: '0.05',
      currency: 'USDC',
      unit: 'request',
    }],
    x402: {
      enabled: true,
      network: 'eip155:84532',
      scheme: 'exact',
      payTo: providerAccount.address,
      defaultPrice: '$0.05',
    },
  }, providerAccount);
  console.log(`   ✅ Provider: ${provider.provider?.id || provider.error}\n`);

  // 2. Create Intent
  console.log('2️⃣ Creating intent...');
  const intent = await apiCall('POST', '/intents', {
    title: 'Summarize demo text',
    description: 'Please summarize: "The quick brown fox jumps over the lazy dog."',
    category: 'research',
    input: { text: 'The quick brown fox jumps over the lazy dog.' },
    output: { format: 'text', maxLength: 100 },
    maxPriceUsdc: '0.10',
    requesterWallet: requesterAccount.address,
    stakeAmount: '0.10',
  }, requesterAccount);
  const intentId = intent.intent?.id;
  console.log(`   ✅ Intent: ${intentId || intent.error}\n`);

  if (!intentId) {
    console.error('Failed to create intent');
    return;
  }

  // 3. Provider Makes Offer
  console.log('3️⃣ Provider making offer...');
  const offer = await apiCall('POST', '/offers', {
    intentId,
    providerId: provider.provider?.id,
    priceUsdc: '0.05',
    estimatedTime: '10 seconds',
    message: 'I can summarize this instantly!',
  }, providerAccount);
  const offerId = offer.offer?.id;
  console.log(`   ✅ Offer: ${offerId || offer.error}\n`);

  if (!offerId) {
    console.error('Failed to create offer');
    return;
  }

  // 4. Requester Accepts Offer
  console.log('4️⃣ Requester accepting offer...');
  const accept = await apiCall('POST', `/offers/${offerId}/accept`, {}, requesterAccount);
  console.log(`   ✅ Accepted: ${accept.success || accept.error}\n`);

  // 5. Fulfill via x402
  console.log('5️⃣ Fulfilling via x402 (this triggers payment)...');
  console.log('   ⏳ Calling provider endpoint with x402...');
  const fulfill = await apiCall('POST', `/intents/${intentId}/fulfill`, {
    input: { text: 'The quick brown fox jumps over the lazy dog.' },
  }, requesterAccount);

  if (fulfill.success) {
    console.log('   ✅ Fulfilled!');
    console.log(`   📝 Result: ${JSON.stringify(fulfill.result)}`);
    console.log(`   💸 Payment TX: ${fulfill.paymentTxHash || '(pending)'}`);
  } else {
    console.log(`   ❌ Error: ${fulfill.error}`);
    console.log('   (Make sure demo-provider is running on localhost:3001)');
  }

  console.log('\n🎉 Demo complete!');
}

main().catch(console.error);
