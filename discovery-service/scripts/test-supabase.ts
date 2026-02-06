/**
 * Quick local smoke test for the store.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx discovery-service/scripts/test-supabase.ts
 */

import { intentStore, providerStore, offerStore, getStoreStats, clearStore } from '../src/store/index.js';

async function main() {
  console.log('stats(before)=', await getStoreStats());
  await clearStore();

  const provider = await providerStore.create({
    agentId: 'agent_test',
    wallet: '0xabc',
    name: 'Test',
    capabilities: [
      {
        category: 'research',
        name: 'Research',
        description: 'Test capability',
        acceptsInputTypes: ['text'],
        producesOutputFormats: ['text'],
      },
    ],
    pricing: [{ category: 'research', basePrice: '1', unit: 'per_task' }],
  });

  const intent = await intentStore.create({
    title: 'Need research',
    input: { type: 'text', content: 'hi' },
    output: { format: 'text' },
    requires: { category: 'research' },
    maxPriceUsdc: '5',
    requesterWallet: '0xreq',
    stakeTxHash: '0xstake',
    stakeAmount: '1',
  });

  const offer = await offerStore.create({
    intentId: intent.id,
    providerId: provider.id,
    priceUsdc: '2',
    commitment: { outputFormat: 'text', estimatedDelivery: { value: 1, unit: 'hours' } },
  });

  console.log({ provider, intent, offer });
  console.log('stats(after)=', await getStoreStats());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
