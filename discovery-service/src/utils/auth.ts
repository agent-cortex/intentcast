import { ethers } from 'ethers';

export type IntentCastAuthHeaders = {
  walletAddress: string;
  signature: string;
  nonce: string;
};

export function getHeader(reqHeader: unknown): string | undefined {
  if (typeof reqHeader !== 'string') return undefined;
  const v = reqHeader.trim();
  return v.length ? v : undefined;
}

export function buildIntentCastMessage(params: { nonce: string; method: string; path: string }): string {
  const method = params.method.toUpperCase();
  const path = params.path.startsWith('/') ? params.path : `/${params.path}`;
  return `IntentCast:${params.nonce}:${method}:${path}`;
}

export function normalizeAddress(address: string): string {
  return ethers.getAddress(address);
}

export function verifyIntentCastSignature(params: {
  walletAddress: string;
  signature: string;
  nonce: string;
  method: string;
  path: string;
}): { ok: true; recoveredAddress: string; message: string } | { ok: false; error: string; message: string } {
  const message = buildIntentCastMessage({
    nonce: params.nonce,
    method: params.method,
    path: params.path,
  });

  try {
    const recovered = ethers.verifyMessage(message, params.signature);
    const recoveredNorm = normalizeAddress(recovered);
    const walletNorm = normalizeAddress(params.walletAddress);

    if (recoveredNorm !== walletNorm) {
      return {
        ok: false,
        error: 'Signature does not match wallet address',
        message,
      };
    }

    return { ok: true, recoveredAddress: recoveredNorm, message };
  } catch (e) {
    return {
      ok: false,
      error: `Signature verification failed: ${(e as Error).message}`,
      message,
    };
  }
}
