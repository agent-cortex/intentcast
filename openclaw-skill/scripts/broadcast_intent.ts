#!/usr/bin/env npx tsx
/**
 * broadcast_intent.ts - Stake USDC and broadcast intent to find providers
 * 
 * Usage: npx tsx scripts/broadcast_intent.ts <service> <max_price> [requirements_json] [deadline_hours]
 * Example: npx tsx scripts/broadcast_intent.ts translation 2.50 '{"source":"en","target":"es"}' 24
 */

import { DiscoveryClient } from '../lib/api.js';
import { createWallet, getAddressFromPrivateKey } from '../lib/wallet.js';

const API_URL = process.env.DISCOVERY_URL || 'https://intentcast.agentcortex.space';
const ESCROW_WALLET = process.env.ESCROW_WALLET || '0xe08Ad6b0975222f410Eb2fa0e50c7Ee8FBe78F2D';

function printUsage() {
  console.log(`
Usage: npx tsx scripts/broadcast_intent.ts <service> <max_price> [requirements_json] [deadline_hours]

Arguments:
  service          Service category (e.g., translation, summarization, code_review)
  max_price        Maximum USDC to pay (e.g., 2.50)
  requirements     JSON object with specific requirements (optional)
  deadline_hours   Hours until intent expires (default: 24)

Environment:
  WALLET_PRIVATE_KEY  Private key for staking USDC (required)
  DISCOVERY_URL       API URL (default: ${API_URL})
  ESCROW_WALLET       Escrow wallet address (default: ${ESCROW_WALLET})

Example:
  # export WALLET_PRIVATE_KEY="<your-private-key>" \\
    npx tsx scripts/broadcast_intent.ts translation 2.50 '{"source":"en","target":"es","words":500}' 48
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(args.length < 2 ? 1 : 0);
  }

  const [service, maxPrice, requirementsJson, deadlineHoursStr] = args;
  const deadlineHours = deadlineHoursStr ? parseInt(deadlineHoursStr, 10) : 24;
  
  let requirements: Record<string, unknown> = {};
  if (requirementsJson) {
    try {
      requirements = JSON.parse(requirementsJson);
    } catch (e) {
      console.error('Error: Invalid JSON for requirements');
      process.exit(1);
    }
  }

  // Get wallet private key
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) {
    console.error('Error: WALLET_PRIVATE_KEY environment variable is required');
    console.error('Set WALLET_PRIVATE_KEY in your environment (Base Sepolia testnet key).');
    process.exit(1);
  }

  console.log('📡 Broadcasting intent...\n');

  // Step 1: Stake USDC
  console.log(`Step 1: Staking ${maxPrice} USDC...`);
  const wallet = createWallet(privateKey);
  console.log(`  Wallet: ${wallet.address}`);
  
  const stakeResult = await wallet.stakeUsdc(maxPrice, ESCROW_WALLET);
  if (!stakeResult.success) {
    console.error(`  ❌ Stake failed: ${stakeResult.error}`);
    process.exit(1);
  }
  console.log(`  ✅ Staked! TxHash: ${stakeResult.txHash}\n`);

  // Step 2: Create intent via API
  console.log('Step 2: Creating intent on discovery service...');
  const client = new DiscoveryClient({ serviceUrl: API_URL });
  
  const result = await client.createIntent({
    category: service,
    requirements,
    maxPriceUsdc: maxPrice,
    deadlineHours,
    requesterWallet: wallet.address,
    stakeTxHash: stakeResult.txHash!,
    stakeAmount: maxPrice,
  });

  if (!result.success) {
    console.error(`  ❌ Failed to create intent: ${result.error}`);
    process.exit(1);
  }

  console.log('  ✅ Intent created!\n');
  console.log('=== INTENT CREATED ===');
  console.log(JSON.stringify({
    intent_id: result.data!.id,
    status: result.data!.status,
    category: result.data!.category,
    max_price: result.data!.maxPriceUsdc,
    deadline: result.data!.deadline,
    stake_verified: result.data!.stakeVerified,
    stake_tx: stakeResult.txHash,
  }, null, 2));
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
