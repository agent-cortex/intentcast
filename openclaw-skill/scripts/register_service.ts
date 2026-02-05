#!/usr/bin/env npx tsx
/**
 * register_service.ts - Register as a service provider
 * 
 * Usage: npx tsx scripts/register_service.ts <capabilities> <pricing_json>
 * Example: npx tsx scripts/register_service.ts translation,summarization '{"translation":"0.01/word","summarization":"0.50/page"}'
 */

import { DiscoveryClient } from '../lib/api.js';
import { getAddressFromPrivateKey } from '../lib/wallet.js';
import { randomUUID } from 'crypto';

const API_URL = process.env.DISCOVERY_URL || 'https://intentcast.agentcortex.space';

function printUsage() {
  console.log(`
Usage: npx tsx scripts/register_service.ts <capabilities> <pricing_json>

Arguments:
  capabilities   Comma-separated list of services (e.g., translation,summarization,code_review)
  pricing_json   JSON object mapping capability to price (e.g., '{"translation":"0.01/word"}')

Environment:
  WALLET_PRIVATE_KEY  Private key for provider wallet (required)
  AGENT_ID            Custom agent ID (optional, auto-generated if not set)
  DISCOVERY_URL       API URL (default: ${API_URL})

Example:
  # export WALLET_PRIVATE_KEY="<your-private-key>" \\
    npx tsx scripts/register_service.ts translation,summarization '{"translation":"0.01/word","summarization":"0.50/page"}'
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(args.length < 2 ? 1 : 0);
  }

  const [capabilitiesStr, pricingJson] = args;
  
  const capabilities = capabilitiesStr.split(',').map(c => c.trim()).filter(Boolean);
  if (capabilities.length === 0) {
    console.error('Error: At least one capability is required');
    process.exit(1);
  }
  
  let pricing: Record<string, string>;
  try {
    pricing = JSON.parse(pricingJson);
  } catch (e) {
    console.error('Error: Invalid JSON for pricing');
    process.exit(1);
  }

  // Get wallet private key
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) {
    console.error('Error: WALLET_PRIVATE_KEY environment variable is required');
    console.error('Set WALLET_PRIVATE_KEY in your environment (Base Sepolia testnet key).');
    process.exit(1);
  }

  const walletAddress = getAddressFromPrivateKey(privateKey);
  const agentId = process.env.AGENT_ID || `agent-${randomUUID().slice(0, 8)}`;

  console.log('🔧 Registering as service provider...\n');
  console.log(`  Agent ID: ${agentId}`);
  console.log(`  Wallet: ${walletAddress}`);
  console.log(`  Capabilities: ${capabilities.join(', ')}`);
  console.log(`  Pricing: ${JSON.stringify(pricing)}\n`);

  const client = new DiscoveryClient({ serviceUrl: API_URL });
  
  const result = await client.registerProvider({
    agentId,
    capabilities,
    pricing,
    wallet: walletAddress,
  });

  if (!result.success) {
    console.error(`❌ Failed to register: ${result.error}`);
    process.exit(1);
  }

  console.log('✅ Provider registered!\n');
  console.log('=== PROVIDER REGISTERED ===');
  console.log(JSON.stringify({
    provider_id: result.data!.id,
    agent_id: result.data!.agentId,
    wallet: result.data!.wallet,
    capabilities: result.data!.capabilities,
    pricing: result.data!.pricing,
    status: result.data!.status,
    registered_at: result.data!.registeredAt,
  }, null, 2));
  
  console.log('\n📌 Next steps:');
  console.log('1. Your provider is now active and will receive matching intents');
  console.log('2. Check for matches with the API');
  console.log(`3. Submit offers to intents that match your capabilities`);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
