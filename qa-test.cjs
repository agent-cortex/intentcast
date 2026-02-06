const { ethers } = require('ethers');
const { execSync } = require('child_process');

const pk = execSync('pass show evm-wallet/agent_dev', { encoding: 'utf8' }).trim();
const wallet = new ethers.Wallet(pk);
const API = 'https://intentcast.agentcortex.space/api/v1';

async function api(method, path, body) {
  const nonce = Date.now().toString();
  const fullPath = '/api/v1' + path;
  const msg = 'IntentCast:' + nonce + ':' + method + ':' + fullPath;
  console.log('  Signing:', msg);
  const sig = await wallet.signMessage(msg);
  
  const r = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-wallet-address': wallet.address,
      'x-signature': sig,
      'x-nonce': nonce
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: r.status, data: await r.json() };
}

async function test() {
  const ts = Date.now();
  console.log('=== FULL FLOW TEST ===');
  console.log('Wallet:', wallet.address);
  
  // 1. GET /intents
  let r = await fetch(API + '/intents?status=active').then(r => r.json());
  console.log('✓ GET /intents:', r.count, 'intents');
  
  // 2. Create provider
  console.log('\n--- Creating Provider ---');
  r = await api('POST', '/providers', {
    agentId: 'qa-final-' + ts,
    name: 'QA Final',
    wallet: wallet.address,
    apiEndpoint: 'https://test.example.com',
    capabilities: [{ category: 'research', name: 'test', description: 'Test', acceptsInputTypes: ['text'], producesOutputFormats: ['markdown'] }],
    pricing: [{ category: 'research', basePrice: '0.50', unit: 'per_request' }]
  });
  console.log('Status:', r.status);
  const providerId = r.data.provider ? r.data.provider.id : null;
  if (providerId) {
    console.log('✓ Provider:', providerId);
  } else {
    console.log('✗ Provider failed:', JSON.stringify(r.data));
    return;
  }
  
  // 3. Create intent
  console.log('\n--- Creating Intent ---');
  r = await api('POST', '/intents', {
    title: 'QA Flow ' + ts,
    input: { type: 'text', content: 'test' },
    output: { format: 'markdown', description: 'test' },
    requires: { category: 'research' },
    maxPriceUsdc: '1.00',
    requesterWallet: wallet.address,
    stakeTxHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    stakeAmount: '1.00'
  });
  console.log('Status:', r.status);
  const intentId = r.data.intent ? r.data.intent.id : null;
  if (intentId) {
    console.log('✓ Intent:', intentId);
  } else {
    console.log('✗ Intent failed:', JSON.stringify(r.data));
    return;
  }
  
  // 4. Submit offer
  console.log('\n--- Submitting Offer ---');
  r = await api('POST', '/intents/' + intentId + '/offers', {
    providerId: providerId,
    priceUsdc: '0.50',
    commitment: { outputFormat: 'markdown', estimatedDelivery: { value: 1, unit: 'minutes' } }
  });
  console.log('Status:', r.status);
  const offerId = r.data.offer ? r.data.offer.id : null;
  if (offerId) {
    console.log('✓ Offer:', offerId);
  } else {
    console.log('✗ Offer failed:', JSON.stringify(r.data));
    return;
  }
  
  // 5. Accept offer
  console.log('\n--- Accepting Offer ---');
  r = await api('POST', '/intents/' + intentId + '/accept', { offerId: offerId });
  console.log('Status:', r.status);
  if (r.data.success) {
    console.log('✓ Accepted');
  } else {
    console.log('✗ Accept failed:', JSON.stringify(r.data));
  }
  
  // 6. Final state
  console.log('\n--- Final State ---');
  r = await fetch(API + '/intents/' + intentId).then(r => r.json());
  console.log('Intent status:', r.intent ? r.intent.status : 'N/A');
  console.log('Accepted offer:', r.intent ? r.intent.acceptedOfferId : 'N/A');
  
  console.log('\n=== COMPLETE ===');
}

test().catch(console.error);
