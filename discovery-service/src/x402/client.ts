/**
 * x402 client for calling provider endpoints with automatic payment handling.
 *
 * Flow:
 * 1) Make request
 * 2) If 402 Payment Required, automatically construct PAYMENT-SIGNATURE
 * 3) Retry request with payment header
 * 4) Return response + settlement receipt (when present)
 */

import { wrapFetchWithPayment, x402Client, decodePaymentResponseHeader } from '@x402/fetch';
import { ExactEvmScheme, toClientEvmSigner } from '@x402/evm';
import { createWalletClient, http, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia, base } from 'viem/chains';

export interface X402CallOptions {
  endpoint: string;
  method: 'GET' | 'POST';
  body?: unknown;
  /** CAIP-2 network id used by x402, e.g. "eip155:84532" */
  network: string;
  /** payer private key (service wallet or user wallet) */
  privateKey: string;
  /** optional override for RPC (otherwise BASE_RPC_URL / BASE_SEPOLIA_RPC is used if present) */
  rpcUrl?: string;
  /** optional additional headers */
  headers?: Record<string, string>;
}

export interface X402Result {
  success: boolean;
  data?: unknown;
  /** settlement tx hash (when the server returns PAYMENT-RESPONSE) */
  paymentTxHash?: string;
  error?: string;
  status?: number;
}

function chainForNetwork(network: string) {
  // x402 uses CAIP-2 network ids for EVM, e.g. eip155:8453 / eip155:84532
  if (network === 'eip155:8453') return base;
  if (network === 'eip155:84532') return baseSepolia;
  // Default to Base Sepolia for hackathon/dev
  return baseSepolia;
}

export async function callWithX402Payment(options: X402CallOptions): Promise<X402Result> {
  try {
    const chain = chainForNetwork(options.network);

    const pk = options.privateKey as Hex;
    const account = privateKeyToAccount(pk);

    const rpcUrl =
      options.rpcUrl ||
      process.env.BASE_RPC_URL ||
      process.env.BASE_SEPOLIA_RPC ||
      'https://sepolia.base.org';

    // viem wallet client is not strictly required for signing typed data,
    // but is useful if downstream scheme implementations need it.
    createWalletClient({
      account,
      chain,
      transport: http(rpcUrl),
    });

    // Build x402 client and register ExactEvmScheme for the requested network.
    const client = new x402Client().register(options.network as any, new ExactEvmScheme(toClientEvmSigner(account)));

    const fetchWithPay = wrapFetchWithPayment(globalThis.fetch, client);

    const headers: Record<string, string> = {
      ...(options.headers || {}),
    };

    let body: string | undefined;
    if (options.method === 'POST') {
      headers['content-type'] = headers['content-type'] || 'application/json';
      body = options.body === undefined ? undefined : JSON.stringify(options.body);
    }

    const resp = await fetchWithPay(options.endpoint, {
      method: options.method,
      headers,
      body,
    });

    const status = resp.status;

    // Attempt to decode PAYMENT-RESPONSE header (settlement receipt)
    let paymentTxHash: string | undefined;
    const paymentResponseHeader = resp.headers.get('PAYMENT-RESPONSE') || resp.headers.get('X-PAYMENT-RESPONSE');
    if (paymentResponseHeader) {
      try {
        const settle = decodePaymentResponseHeader(paymentResponseHeader);
        // SettleResponse has `transaction` field (facilitator-settled tx hash) when available.
        if (settle && typeof settle === 'object' && 'transaction' in settle) {
          const tx = (settle as any).transaction;
          if (typeof tx === 'string') paymentTxHash = tx;
        }
      } catch {
        // ignore; still return response data
      }
    }

    const contentType = resp.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!resp.ok) {
      const errorText = isJson ? JSON.stringify(await resp.json().catch(() => ({}))) : await resp.text();
      return { success: false, error: errorText || resp.statusText, status, paymentTxHash };
    }

    const data = isJson ? await resp.json() : await resp.text();

    return { success: true, data, paymentTxHash, status };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
