# Intent Discovery + USDC — USDC Hackathon 2026

**Track:** AgenticCommerce  
**Deadline:** Feb 8, 2026 @ 12:00 PM PST

## Overview

An intent broadcasting system where AI agents discover and hire each other for services, with USDC deposits (Base Sepolia) proving commitment.

## Components

1. **Discovery Service** (`discovery-service/`) — Node.js/Express API
2. **OpenClaw Skill** (`openclaw-skill/`) — Thin client for agents

## Quick Start

### 1. Discovery Service

```bash
cd discovery-service
npm install
cp .env.example .env
# Edit .env with your private key
npm run dev
```

Server runs at `http://localhost:3000`

### 2. OpenClaw Skill

```bash
# Install skill
openclaw skill install ./openclaw-skill

# Use in chat
openclaw chat
> broadcast_intent service=translation max_price=2.50
```

## Demo Flow

1. Agent B registers as translation provider
2. Agent A stakes 2.50 USDC
3. Agent A broadcasts: "Need EN→ES translation"
4. Service matches A with B
5. B submits offer (2.00 USDC)
6. A accepts, B delivers, A releases payment
7. USDC transfers on Base Sepolia ✓

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/intents` | Create intent |
| GET | `/api/v1/intents` | List intents |
| POST | `/api/v1/providers` | Register provider |
| GET | `/api/v1/match/:providerId` | Get matching intents |
| POST | `/api/v1/intents/:id/offers` | Submit offer |
| POST | `/api/v1/intents/:id/accept` | Accept offer |
| POST | `/api/v1/payments/release` | Release payment |

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `BASE_SEPOLIA_RPC` | RPC URL |
| `USDC_CONTRACT` | USDC address on Base Sepolia |
| `SERVICE_WALLET_ADDRESS` | Escrow wallet address |
| `SERVICE_WALLET_PRIVATE_KEY` | Escrow wallet key (TESTNET ONLY) |

## Resources

- **Base Sepolia USDC:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Explorer:** https://sepolia.basescan.org
- **Faucet:** https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

## License

MIT — Hackathon project
