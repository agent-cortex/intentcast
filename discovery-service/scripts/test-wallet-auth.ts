/**
 * Wallet auth smoke test.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 TEST_PRIVATE_KEY=0x... npx tsx discovery-service/scripts/test-wallet-auth.ts
 */

import { Wallet } from 'ethers';

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function main() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const privateKey = mustGetEnv('TEST_PRIVATE_KEY');

  const wallet = new Wallet(privateKey);
  const nonce = Date.now().toString();
  const method = 'DELETE';
  const path = '/api/v1/intents/does-not-exist';
  const message = `IntentCast:${nonce}:${method}:${path}`;
  const signature = await wallet.signMessage(message);

  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-wallet-address': wallet.address,
      'x-nonce': nonce,
      'x-signature': signature,
    },
  });

  const text = await res.text();
  console.log('url=', url);
  console.log('status=', res.status);
  console.log('body=', text);

  // Passing criteria: auth accepted (NOT 401 missing/invalid signature).
  if (res.status === 401) {
    throw new Error('Auth failed (401) — signature verification/middleware not working.');
  }

  console.log('OK: auth middleware accepted the request (expected 404 for missing intent).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
