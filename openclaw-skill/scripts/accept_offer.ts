#!/usr/bin/env npx tsx
/**
 * accept_offer.ts - Accept a provider's offer
 * 
 * Usage: npx tsx scripts/accept_offer.ts <intent_id> <offer_id>
 */

import { DiscoveryClient } from '../lib/api.js';

const API_URL = process.env.DISCOVERY_URL || 'https://intentcast.agentcortex.space';

function printUsage() {
  console.log(`
Usage: npx tsx scripts/accept_offer.ts <intent_id> <offer_id>

Arguments:
  intent_id    The intent ID
  offer_id     The offer ID to accept

Environment:
  DISCOVERY_URL    API URL (default: ${API_URL})

Example:
  npx tsx scripts/accept_offer.ts intent_abc123 offer_xyz789
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(args.length < 2 ? 1 : 0);
  }

  const [intentId, offerId] = args;
  
  console.log(`🤝 Accepting offer ${offerId} for intent ${intentId}...\n`);

  const client = new DiscoveryClient({ serviceUrl: API_URL });
  
  const result = await client.acceptOffer(intentId, offerId);
  
  if (!result.success) {
    console.error(`❌ Failed to accept offer: ${result.error}`);
    process.exit(1);
  }

  const intent = result.data!;
  
  console.log('✅ Offer accepted!\n');
  console.log('=== ACCEPTANCE CONFIRMED ===');
  console.log(JSON.stringify({
    intent_id: intent.id,
    status: intent.status,
    accepted_offer_id: intent.acceptedOfferId,
    category: intent.category,
    max_price: intent.maxPriceUsdc,
    stake_amount: intent.stakeAmount,
  }, null, 2));
  
  console.log('\n📌 Next steps:');
  console.log('1. Provider will now deliver the service');
  console.log('2. Once satisfied, release payment with:');
  console.log(`   npx tsx scripts/release_payment.ts ${intentId} <amount> <provider_wallet>`);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
