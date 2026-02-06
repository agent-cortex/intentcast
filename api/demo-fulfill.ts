/**
 * Demo x402 Provider - Vercel Serverless Function with payment verification
 * 
 * x402 Protocol Flow:
 * 1. Client sends request without payment → Server returns 402 with X-PAYMENT header
 * 2. Client pays via facilitator, gets signed receipt
 * 3. Client retries with X-PAYMENT header containing payment proof
 * 4. Server verifies payment and processes request
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// x402 Configuration
const X402_CONFIG = {
  network: 'eip155:84532', // Base Sepolia
  scheme: 'exact',
  price: '$0.01',
  payTo: process.env.DEMO_PROVIDER_WALLET || '0x536100EFF5aE2F494A961C7F874e90b3B5Ac1eC4',
  facilitatorUrl: 'https://facilitator.x402.org',
  maxTimeoutSeconds: 300,
};

// Build the x402 payment requirements header
function buildPaymentRequirements(): string {
  const requirements = {
    accepts: [{
      scheme: X402_CONFIG.scheme,
      network: X402_CONFIG.network,
      maxAmountRequired: X402_CONFIG.price,
      resource: '/api/demo-fulfill',
      payTo: X402_CONFIG.payTo,
      maxTimeoutSeconds: X402_CONFIG.maxTimeoutSeconds,
    }],
    facilitator: X402_CONFIG.facilitatorUrl,
    version: '1.0',
  };
  return Buffer.from(JSON.stringify(requirements)).toString('base64');
}

// Verify payment (simplified for demo)
async function verifyPayment(paymentHeader: string): Promise<{ valid: boolean; txHash?: string; error?: string }> {
  try {
    // Decode the payment header
    const decoded = Buffer.from(paymentHeader, 'base64').toString('utf-8');
    const paymentData = JSON.parse(decoded);
    
    // Accept payment if it has the right structure
    if (paymentData && (paymentData.signature || paymentData.payload || paymentData.x402)) {
      return { 
        valid: true, 
        txHash: paymentData.transaction || paymentData.payload?.transaction || 'tx-' + Date.now() 
      };
    }
    
    return { valid: false, error: 'Invalid payment structure' };
  } catch (err) {
    return { valid: false, error: 'Failed to parse payment header' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Payment, X-Payment-Response');
  res.setHeader('Access-Control-Expose-Headers', 'X-Payment, X-Payment-Response');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Return service info and pricing
  if (req.method === 'GET') {
    return res.status(200).json({
      service: 'IntentCast Demo Provider',
      description: 'x402-enabled demo endpoint for testing payment flow',
      x402: {
        enabled: true,
        network: X402_CONFIG.network,
        scheme: X402_CONFIG.scheme,
        price: X402_CONFIG.price,
        payTo: X402_CONFIG.payTo,
        facilitator: X402_CONFIG.facilitatorUrl,
      },
      endpoints: {
        info: 'GET /api/demo-fulfill',
        fulfill: 'POST /api/demo-fulfill (requires x402 payment)',
      },
    });
  }

  // POST - Protected endpoint requiring x402 payment
  if (req.method === 'POST') {
    // Check for x402 payment header
    const paymentHeader = req.headers['x-payment'] as string | undefined;

    // No payment header → Return 402 Payment Required
    if (!paymentHeader) {
      res.setHeader('X-Payment', buildPaymentRequirements());
      return res.status(402).json({
        error: 'Payment Required',
        code: 'PAYMENT_REQUIRED',
        message: 'This endpoint requires x402 payment',
        x402: {
          price: X402_CONFIG.price,
          network: X402_CONFIG.network,
          payTo: X402_CONFIG.payTo,
          facilitator: X402_CONFIG.facilitatorUrl,
        },
        instructions: [
          '1. Decode the X-Payment header (base64 JSON)',
          '2. Pay via the facilitator at ' + X402_CONFIG.facilitatorUrl,
          '3. Retry with X-Payment header containing payment proof',
        ],
      });
    }

    // Payment header present → Verify it
    const verification = await verifyPayment(paymentHeader);

    if (!verification.valid) {
      res.setHeader('X-Payment', buildPaymentRequirements());
      return res.status(402).json({
        error: 'Payment Invalid',
        code: 'PAYMENT_INVALID',
        message: verification.error || 'Payment verification failed',
        retry: true,
      });
    }

    // Payment verified! Process the request
    const body = req.body || {};
    const intentId = body.intentId || 'demo-intent';
    const input = body.input || '';
    const preview = typeof input === 'string' ? input.substring(0, 100) : JSON.stringify(input).substring(0, 100);

    // Build payment response header
    const paymentResponse = Buffer.from(JSON.stringify({
      status: 'settled',
      transaction: verification.txHash,
      network: X402_CONFIG.network,
      amount: X402_CONFIG.price,
    })).toString('base64');

    res.setHeader('X-Payment-Response', paymentResponse);

    return res.status(200).json({
      success: true,
      intentId: intentId,
      provider: 'IntentCast Demo Provider',
      result: `Processed: "${preview}..."`,
      summary: 'This is a demo summary generated after successful x402 payment verification.',
      timestamp: new Date().toISOString(),
      payment: {
        status: 'verified',
        txHash: verification.txHash,
        amount: X402_CONFIG.price,
        network: X402_CONFIG.network,
        payTo: X402_CONFIG.payTo,
      },
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
