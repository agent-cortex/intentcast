/**
 * Cleanup test/QA providers from IntentCast
 * Run with: WALLET_PRIVATE_KEY=<key> npx tsx scripts/cleanup_test_providers.ts
 */

import { Wallet } from 'ethers';

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
const API_BASE = process.env.API_BASE || 'https://intentcast.agentcortex.space/api/v1';

if (!PRIVATE_KEY) {
  console.error('❌ Missing WALLET_PRIVATE_KEY env var');
  process.exit(1);
}

const wallet = new Wallet(PRIVATE_KEY);

// Test/QA providers to delete
const PROVIDERS_TO_DELETE = [
  'prov_6011c0ad',  // Debug Provider
  'prov_056b4019',  // QA Provider with Endpoint
  'prov_60638c5b',  // QA Final Provider
  'prov_22655248',  // QA Complete Test Provider
  'prov_bc3a6a92',  // QA Full Flow Provider
  'prov_8e7ce1fa',  // QA Provider
  'prov_27a1fb1a',  // QA Provider
  'prov_3d02b750',  // Simple
  'prov_093982c7',  // QA Final
  'prov_455e79dc',  // Test
  'prov_984d88a7',  // Test Provider
  'prov_826bb915',  // Debug Test
  'prov_5d462565',  // QA Test Agent
  'prov_c09ccc7a',  // Test
];

async function signRequest(method: string, path: string): Promise<{ address: string; nonce: string; signature: string }> {
  const nonce = Date.now().toString();
  const message = `IntentCast:${nonce}:${method}:${path}`;
  const signature = await wallet.signMessage(message);
  
  return {
    address: wallet.address,
    nonce,
    signature,
  };
}

async function deleteProvider(id: string): Promise<void> {
  const path = `/api/v1/providers/${id}`;
  const { address, nonce, signature } = await signRequest('DELETE', path);
  
  try {
    const response = await fetch(`${API_BASE}/providers/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': address,
        'x-nonce': nonce,
        'x-signature': signature,
      },
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Deleted ${id}`);
    } else {
      console.log(`❌ Failed ${id}: ${data.message || data.error}`);
    }
  } catch (error: any) {
    console.log(`❌ Error deleting ${id}: ${error.message}`);
  }
}

async function main() {
  console.log(`🔑 Wallet: ${wallet.address}`);
  console.log(`🗑️  Deleting ${PROVIDERS_TO_DELETE.length} test providers...\n`);
  
  for (const id of PROVIDERS_TO_DELETE) {
    await deleteProvider(id);
    await new Promise(r => setTimeout(r, 100)); // Small delay between requests
  }
  
  console.log('\n✨ Cleanup complete!');
  
  // Verify
  console.log('\n📊 Checking remaining providers...');
  const response = await fetch(`${API_BASE}/providers`);
  const { count, providers } = await response.json();
  
  console.log(`\nRemaining providers: ${count}`);
  providers.forEach((p: any) => {
    console.log(`  - ${p.id}: ${p.name} (${p.status})`);
  });
}

main().catch(console.error);
