# IntentCast Demo

End-to-end demonstration of the IntentCast flow with x402 payments.

## Prerequisites

- Node.js 18+
- USDC on Base Sepolia (get from faucet)
- Two wallets: one for requester, one for provider

## Quick Demo (No Provider)

Test the API without running your own provider:

```bash
# 1. List existing providers
curl -s https://intentcast.agentcortex.space/api/v1/providers | jq

# 2. List active intents
curl -s https://intentcast.agentcortex.space/api/v1/intents?status=active | jq

# 3. Create a test intent (requires wallet signature)
node scripts/create-intent.js
```

## Full Demo (With Provider)

### 1. Start Demo Provider

```bash
cd ../demo-provider
cp .env.example .env
# Edit .env with your PROVIDER_WALLET
npm run dev
```

Provider runs at http://localhost:3001 with x402 paywall.

### 2. Register Provider

```bash
node scripts/register-provider.js
```

### 3. Create Intent

```bash
node scripts/create-intent.js
```

### 4. Make Offer (as provider)

```bash
node scripts/make-offer.js <intentId>
```

### 5. Accept Offer (as requester)

```bash
node scripts/accept-offer.js <offerId>
```

### 6. Fulfill (triggers x402 payment)

```bash
node scripts/fulfill.js <intentId>
```

Watch the USDC flow from requester → provider!

## Demo Video Script

1. Show empty intents list
2. Register a provider with x402 config
3. Create an intent "Summarize this URL"
4. Provider makes offer at $0.05
5. Requester accepts
6. Call /fulfill — show 402 → pay → result
7. Check Base Sepolia explorer for USDC transfer
