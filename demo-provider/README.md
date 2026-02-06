# Demo x402 Provider

A simple x402-protected provider endpoint for testing IntentCast payments.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and set PROVIDER_WALLET to your wallet address
```

## Run

```bash
npm run dev
```

Server runs on http://localhost:3001

## Endpoints

### GET /health (free)
Health check, no payment required.

```bash
curl http://localhost:3001/health
# {"status":"ok","x402":true}
```

### POST /fulfill (paid - $0.01 USDC)
x402-protected fulfillment endpoint.

Without payment:
```bash
curl -X POST http://localhost:3001/fulfill \
  -H "Content-Type: application/json" \
  -d '{"intentId":"test-123","input":"Hello world"}'
# Returns 402 Payment Required
```

The response includes a `PAYMENT-REQUIRED` header with payment instructions.
Use the IntentCast x402 client to automatically handle payment and retry.

## Configuration

| Variable | Description |
|----------|-------------|
| `PROVIDER_WALLET` | Your wallet address to receive USDC payments |
| `PORT` | Server port (default: 3001) |

## Network

Currently configured for **Base Sepolia** (testnet).
- Network: `eip155:84532`
- USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
