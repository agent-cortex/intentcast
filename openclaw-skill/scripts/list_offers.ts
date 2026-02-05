#!/usr/bin/env npx tsx
/**
 * list_offers.ts - List offers for an intent
 * 
 * Usage: npx tsx scripts/list_offers.ts <intent_id>
 */

import { DiscoveryClient } from '../lib/api.js';

const API_URL = process.env.DISCOVERY_URL || 'https://intentcast.agentcortex.space';

function printUsage() {
  console.log(`
Usage: npx tsx scripts/list_offers.ts <intent_id>

Arguments:
  intent_id    The intent ID to list offers for

Environment:
  DISCOVERY_URL    API URL (default: ${API_URL})

Example:
  npx tsx scripts/list_offers.ts intent_abc123
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(args.length < 1 ? 1 : 0);
  }

  const [intentId] = args;
  
  console.log(`📋 Fetching offers for intent ${intentId}...\n`);

  const client = new DiscoveryClient({ serviceUrl: API_URL });
  
  // Also get intent details
  const intentResult = await client.getIntent(intentId);
  if (!intentResult.success) {
    console.error(`❌ Failed to get intent: ${intentResult.error}`);
    process.exit(1);
  }
  
  const intent = intentResult.data!;
  console.log(`Intent: ${intent.category} | Max: ${intent.maxPriceUsdc} USDC | Status: ${intent.status}`);
  console.log(`Deadline: ${intent.deadline}\n`);

  const result = await client.listOffers(intentId);
  
  if (!result.success) {
    console.error(`❌ Failed to list offers: ${result.error}`);
    process.exit(1);
  }

  const offers = result.data!;
  
  if (offers.length === 0) {
    console.log('No offers yet. Providers are still reviewing your intent.');
    process.exit(0);
  }

  console.log(`Found ${offers.length} offer(s):\n`);
  console.log('┌─────────────────┬────────────┬──────────┬────────────────┬──────────────────────────────┐');
  console.log('│ Offer ID        │ Price USDC │ ETA mins │ Status         │ Message                      │');
  console.log('├─────────────────┼────────────┼──────────┼────────────────┼──────────────────────────────┤');
  
  for (const offer of offers) {
    const offerId = offer.id.substring(0, 15).padEnd(15);
    const price = offer.priceUsdc.padStart(10);
    const eta = (offer.estimatedDeliveryMinutes?.toString() || '-').padStart(8);
    const status = offer.status.padEnd(14);
    const msg = (offer.message || '-').substring(0, 28).padEnd(28);
    console.log(`│ ${offerId} │ ${price} │ ${eta} │ ${status} │ ${msg} │`);
  }
  
  console.log('└─────────────────┴────────────┴──────────┴────────────────┴──────────────────────────────┘');
  
  // Also output JSON for programmatic use
  console.log('\n=== JSON OUTPUT ===');
  console.log(JSON.stringify({
    intent_id: intentId,
    intent_status: intent.status,
    offer_count: offers.length,
    offers: offers.map(o => ({
      offer_id: o.id,
      provider_id: o.providerId,
      price_usdc: o.priceUsdc,
      eta_minutes: o.estimatedDeliveryMinutes,
      status: o.status,
      message: o.message,
    })),
  }, null, 2));
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
