#!/usr/bin/env npx tsx
/**
 * release_payment.ts - Release USDC to provider after service delivery
 * 
 * Usage: npx tsx scripts/release_payment.ts <intent_id>
 */

import { DiscoveryClient } from '../lib/api.js';

const API_URL = process.env.DISCOVERY_URL || 'https://intentcast.agentcortex.space';

function printUsage() {
  console.log(`
Usage: npx tsx scripts/release_payment.ts <intent_id>

Arguments:
  intent_id        The intent ID (must have an accepted offer)

Environment:
  DISCOVERY_URL    API URL (default: ${API_URL})

Example:
  npx tsx scripts/release_payment.ts intent_abc123

Note: Payment amount and provider wallet are automatically determined from the accepted offer.
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(args.length < 1 ? 1 : 0);
  }

  const [intentId] = args;

  console.log(`💸 Releasing payment for intent ${intentId}...\n`);

  const client = new DiscoveryClient({ serviceUrl: API_URL });
  
  // First get the intent to show details
  const intentResult = await client.getIntent(intentId);
  if (intentResult.success && intentResult.data) {
    const intent = intentResult.data;
    console.log(`  Category: ${intent.category}`);
    console.log(`  Status: ${intent.status}`);
    console.log(`  Accepted offer: ${intent.acceptedOfferId || 'none'}`);
  }
  
  const result = await client.releasePayment({
    intentId,
    confirmCompletion: true,
  });
  
  if (!result.success) {
    console.error(`\n❌ Failed to release payment: ${result.error}`);
    process.exit(1);
  }

  const payment = (result.data as any).payment;
  console.log('\n✅ Payment released!\n');
  console.log('=== PAYMENT CONFIRMED ===');
  console.log(JSON.stringify({
    intent_id: intentId,
    amount_usdc: payment?.amount || 'unknown',
    provider_wallet: payment?.providerWallet || 'unknown',
    tx_hash: payment?.txHash || (result.data as any).txHash,
    explorer_url: `https://sepolia.basescan.org/tx/${payment?.txHash || (result.data as any).txHash}`,
  }, null, 2));
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
