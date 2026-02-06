# IntentCast × x402 (Coinbase) × Agent0 (ERC‑8004) — Integration Plan

Date: 2026-02-06

## Executive summary

IntentCast today:
- Uses Supabase as the registry for **providers** (capabilities + pricing + `apiEndpoint`).
- Uses a **service wallet** to release USDC to the provider after completion (`/payments/release`).

This doc proposes 3 integration options:

- **Option A — x402 for payments (recommended for Feb 8 hackathon):**
  - Keep IntentCast discovery/matching as-is.
  - Providers expose **x402-protected HTTP endpoints** (pay-per-request) on **Base USDC**.
  - IntentCast (or the end-user client) calls the provider endpoint, automatically handling the **402 → pay → retry** flow.
  - Removes the need for IntentCast to custody funds for per-request work.

- **Option B — Agent0 for discovery (higher risk / longer):**
  - Use ERC‑8004 + Agent0 subgraph as the source of truth for providers.
  - IntentCast becomes a coordinator/matchmaker UI + intent router.
  - Requires Base support in Agent0 (contracts + subgraph) or accepting Ethereum Sepolia/Mainnet as the registry chain.

- **Option C — full integration:**
  - Providers are registered on ERC‑8004 (Agent0), advertising endpoints + `x402support=true`.
  - IntentCast matches using the subgraph and pays via x402 at fulfillment time.

**Recommendation for hackathon:** implement **Option A** now (fast, demo-friendly, USDC-on-Base native). Option B/C are compelling but require infra (contracts/subgraph) or a multi-chain story.

---

## Background: x402 deep dive (what matters for IntentCast)

### What x402 is
x402 is an HTTP-native payment protocol:
- Server protects a resource and returns **HTTP 402 Payment Required** with instructions.
- Client pays (by producing a signed payment payload) and retries the *same request* with a payment header.

From x402 repo (`x402/README.md`):
- **Step 2:** server returns `402` and a base64 `PaymentRequired` object in header `PAYMENT-REQUIRED`.
- **Step 4:** client retries with `PAYMENT-SIGNATURE` containing the `PaymentPayload`.
- **Step 5–7:** server verifies (locally or via facilitator `/verify`) then fulfills.
- **Step 8–11:** server settles (directly or via facilitator `/settle`).

### Supported networks/tokens (USDC on Base)
For the **Exact EVM scheme** (`@x402/evm/exact/server`), the default stablecoin mapping includes:
- `eip155:8453` (Base mainnet): USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (6 decimals)
- `eip155:84532` (Base Sepolia): USDC `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (6 decimals)

Important limitation in current implementation:
- The default conversion notes: **“Currently only EIP‑3009 supporting stablecoins can be used with this scheme.”**
  - Generic ERC20 via EIP‑2612/Permit2 is planned, not implemented.

So for hackathon, **USDC on Base Sepolia** is a good default.

### Express middleware (provider-side)
The canonical server integration is `@x402/express`:

```ts
import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

const app = express();

const facilitatorClient = new HTTPFacilitatorClient({ url: "https://facilitator.x402.org" });
const resourceServer = new x402ResourceServer(facilitatorClient)
  .register("eip155:84532", new ExactEvmScheme());

app.use(
  paymentMiddleware(
    {
      "POST /fulfill": {
        accepts: {
          scheme: "exact",
          price: "$0.05",
          network: "eip155:84532",
          payTo: "0xProviderWallet",
        },
        description: "Fulfill an IntentCast job",
      },
    },
    resourceServer,
  ),
);

app.post("/fulfill", async (req, res) => {
  // do work
  res.json({ ok: true, result: "..." });
});
```

Notes:
- The middleware can show a paywall UI to browsers; for agent-to-agent requests you typically use a programmatic client.
- x402 uses a “facilitator” service for verify/settle (default public endpoint above) but can be self-hosted.

### Client-side flow
IntentCast can act as:
- **A payer client** (when IntentCast is the purchaser), or
- **A pass-through coordinator** (end-user client pays provider directly).

In either case the flow is:
1. Request provider endpoint.
2. Receive `402 + PAYMENT-REQUIRED`.
3. Create payment payload (wallet signs EIP‑3009 authorization for USDC).
4. Retry with `PAYMENT-SIGNATURE`.

x402 provides client helpers in `@x402/fetch` / `@x402/axios` to automate the retry behavior.

---

## Background: Agent0 SDK deep dive (what matters for IntentCast)

### What Agent0 provides
Agent0 is a TS SDK around ERC‑8004 registries + decentralized metadata:
- On-chain identity + endpoints + operators/owners.
- Off-chain registration file (often IPFS) containing name/description/endpoints/metadata.
- Subgraph indexing to enable fast search.

Core SDK usage (from `agent0-ts/README.md`):
- `sdk.createAgent(...)` then `agent.setMCP(url)` / `agent.setA2A(url)`.
- `agent.setX402Support(true)` sets a **binary flag** in the registration file.
- `sdk.searchAgents({ ...filters... })` queries the subgraph.

### What’s actually indexed / searchable
`AgentSummary` includes:
- Endpoint strings: `mcp`, `a2a`, `web`, `email`, `ens`, `did`.
- Extracted capability metadata: `mcpTools`, `a2aSkills`, etc.
- `x402support` boolean.

### Chain/subgraph support caveat (Base)
In `agent0-ts/src/core/contracts.ts` defaults:
- Default registries are provided for chainId **1 (Ethereum)** and **11155111 (Sepolia)**.
- Default subgraph URLs exist for **1, 11155111, 137**.

**Base (8453/84532) is not included by default.**
To use Agent0 as the discovery source on Base you likely need:
- Deploy ERC‑8004 registries on Base, and
- Run / configure a subgraph (or accept read-only RPC scans, which defeats the “fast search” value).

---

## Option A — x402 for payments (keep IntentCast discovery)

### Target architecture
- Providers continue to register in IntentCast (Supabase) with `apiEndpoint`.
- Providers additionally declare an **x402 paywall config** for their fulfillment endpoint.
- IntentCast (or the requesting client) performs fulfillment by calling provider endpoint with x402.

```
User/Client → IntentCast (match) → Provider endpoint
                              ↘ (optional) store receipt / rating
Provider endpoint: HTTP 402 → client pays USDC (EIP-3009) → retry → 200 result
```

### Provider registration changes (schema/API)
Add explicit x402 fields to the Provider model (or in `metadata`):

```ts
// suggested additions to discovery-service/src/models/provider.ts
export interface X402Declaration {
  enabled: boolean;
  // CAIP-2 network id used by x402
  network: "eip155:8453" | "eip155:84532" | string;
  scheme: "exact" | string;
  payTo: string;        // provider wallet
  // optional defaults; actual price can still be per-offer
  defaultPrice?: string; // "$0.05" etc
  // endpoint(s) that are protected; simplest is just apiEndpoint
  endpoints?: string[];  // e.g. ["POST /fulfill"]
}
```

Where to store:
- Supabase `providers` table: new jsonb column `x402`.
- Discovery API: accept/return this structure.

### Matching / offer flow changes
Minimal change approach:
1. IntentCast matches providers by capability (unchanged).
2. Provider sends an offer with a `priceUsdc` **and** indicates the fulfillment endpoint is x402-protected.
3. On accept, the fulfillment call is done via x402.

Key decision: **who pays**?
- **A1 (recommended): Requester pays provider directly** via x402.
  - IntentCast never holds funds.
  - Great for demo: “pay per agent action”.
- **A2: IntentCast pays providers** (service wallet as the x402 client).
  - Keeps current UX but still eliminates the “release payment” step.
  - Requires service wallet to hold USDC and sign x402 payloads.

### What happens to `/payments/release`?
- If you adopt **A1**, `/payments/release` becomes optional or removed.
- If you adopt **A2**, `/payments/release` is replaced by “call provider and pay inline”.

### Implementation sketch (IntentCast as x402 client)
A minimal client wrapper (pseudo-code; adapt to chosen x402 client package):

```ts
import { x402Fetch } from "@x402/fetch";
import { createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";

const walletClient = createWalletClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_RPC_URL!),
  account: /* service or user account */,
});

const fetchWithPayments = x402Fetch({
  // register signer / wallet
  signer: walletClient,
  // optionally pin facilitator URL if needed
});

const resp = await fetchWithPayments(provider.apiEndpoint + "/fulfill", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ intentId, input }),
});

if (!resp.ok) throw new Error(await resp.text());
const result = await resp.json();
```

(Exact API names may differ depending on the x402 client helper you choose; the important part is: it must automatically handle the `402 → pay → retry` loop.)

### Pros / cons
Pros:
- Fast to ship; minimal infra.
- Native USDC on Base; pay-per-request.
- Eliminates custodial “release funds” path.

Cons:
- Requires provider to run an HTTP service with x402 middleware.
- For long-running jobs you may need async patterns (see “notes” below).

### Notes for long-running work
x402 is per-HTTP request. For long tasks:
- Use **job pattern**:
  - `POST /jobs` (x402 paid) → returns jobId
  - `GET /jobs/:id` (free or cheaper x402) → status/result

---

## Option B — Agent0 for discovery (ERC‑8004 as source of truth)

### Target architecture
- Providers register with Agent0 (ERC‑8004) and publish:
  - Name/description
  - Endpoints (MCP/A2A/Web)
  - `x402support=true`
  - Metadata (can include IntentCast capability/pricing JSON)
- IntentCast no longer stores providers as the canonical registry.
- IntentCast queries Agent0 subgraph to discover matching providers.

```
Provider → ERC-8004 registry (+ IPFS file)
        → Subgraph indexes agent summaries
IntentCast → Subgraph searchAgents(...) → candidates
```

### Mapping IntentCast provider model to Agent0
Agent0’s indexed surface is optimized for:
- MCP tools, A2A skills, OASF taxonomies.

IntentCast’s provider schema has:
- Rich capability declarations + pricing.

Two approaches:
1. **Minimal mapping (hackathon-friendly):**
   - Store IntentCast capability/pricing JSON inside Agent0 `metadata`.
   - IntentCast reads metadata after subgraph returns candidates.
2. **Semantic mapping (longer-term):**
   - Map IntentCast categories → OASF domains/skills.
   - Publish MCP/A2A descriptors so the indexer extracts tools/skills.

### Base support gap
To run this on Base, you need either:
- Deploy registries + subgraph on Base, **or**
- Accept Ethereum/Sepolia/Polygon as the discovery chain and keep payments on Base.

That split is workable but increases complexity:
- discovery chainId != payment chainId
- agent wallet may differ

### Pros / cons
Pros:
- Permissionless discovery, no centralized provider DB needed.
- Composable with other ecosystems already indexing ERC‑8004.

Cons:
- Requires chain/subgraph alignment (Base not in defaults).
- More moving pieces than hackathon timeframe allows.

---

## Option C — Full integration (Agent0 discovery + x402 payment)

### Target architecture
- Provider registers on ERC‑8004 via Agent0.
- Provider advertises endpoint(s) and `x402support=true`.
- IntentCast discovers via subgraph, matches intents, then fulfills by calling provider endpoint with x402.

```
Provider: ERC-8004 registration  +  x402-protected endpoint
IntentCast: searchAgents(...) → match → x402 fulfill call
```

### What IntentCast becomes
- A matchmaker + intent router UI.
- Optionally a reputation/feedback writer (Agent0 supports feedback writes).

### Pros / cons
Pros:
- Clean story: on-chain discovery + pay-per-request execution.
- IntentCast can focus on matching UX and intent routing.

Cons:
- Inherits Option B’s Base/subgraph constraints.
- Highest integration effort.

---

## Required changes to IntentCast (by option)

### Option A (x402 payments)
1. **Provider schema:** add `x402` declaration (see above).
2. **Offer schema:** optionally include `x402Price` / `fulfillmentEndpoint` or assert `provider.apiEndpoint` is protected.
3. **Fulfillment path:** implement a server-side (or client-side) x402-enabled HTTP client.
4. **Deprecate/adjust escrow:** reduce reliance on `/payments/release`.

### Option B (Agent0 discovery)
1. Add an Agent0 “indexer client” module in IntentCast that:
   - calls `sdk.searchAgents()` with filters,
   - fetches agent registration file / metadata,
   - maps to IntentCast Provider shape.
2. Decide chain/subgraph strategy (Base deployment vs. Sepolia). 
3. Add a “provider import”/caching layer (optional) for performance.

### Option C
- Combine changes from A + B.

---

## Implementation effort estimate (rough)

Assumptions: 1–2 engineers, hackathon-grade quality.

- **Option A:** 0.5–1.5 days
  - Add schema fields + UI wiring: ~0.5 day
  - Implement x402 client wrapper + demo provider endpoint: ~0.5–1 day

- **Option B:** 2–5 days (and may block on Base infra)
  - Read-only subgraph integration on existing chains: 1–2 days
  - Proper mapping + metadata + caching: +1–2 days
  - Base deployment/subgraph: highly variable (likely > hackathon)

- **Option C:** 3–7+ days

---

## Recommended approach for Feb 8 hackathon

### Do now (Option A)
- Ship a demo where:
  1. Provider registers in IntentCast with an `apiEndpoint` that is x402 paywalled.
  2. Requester accepts offer.
  3. IntentCast calls provider `/fulfill` and pays **USDC on Base Sepolia** inline via x402.
  4. Response includes a receipt/tx reference for attribution.

This demonstrates the core value proposition ("agents sell work, paid in USDC") without needing on-chain discovery.

### Do next (post-hackathon)
- Add Agent0 import as an alternative discovery source (Option B) on a supported chain first.
- Consider a Base deployment of ERC‑8004 + subgraph only if ecosystem demand justifies it.

---

## Key code snippets (drop-in starting points)

### 1) Provider: x402-protected fulfillment route (Express)

```ts
import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";

const app = express();
app.use(express.json());

const facilitator = new HTTPFacilitatorClient({ url: "https://facilitator.x402.org" });
const server = new x402ResourceServer(facilitator)
  .register("eip155:84532", new ExactEvmScheme());

app.use(
  paymentMiddleware(
    {
      "POST /fulfill": {
        accepts: {
          scheme: "exact",
          price: "$0.10",
          network: "eip155:84532",
          payTo: process.env.PROVIDER_WALLET!,
        },
        description: "IntentCast fulfillment",
      },
    },
    server,
  ),
);

app.post("/fulfill", async (req, res) => {
  const { intentId, input } = req.body;
  // run the model/tooling, produce output
  res.json({ intentId, output: "..." });
});

app.listen(3001);
```

### 2) Provider registration payload extension (IntentCast)

```json
{
  "agentId": "provider-123",
  "wallet": "0x...",
  "name": "Summarizer Agent",
  "apiEndpoint": "https://provider.example.com",
  "x402": {
    "enabled": true,
    "scheme": "exact",
    "network": "eip155:84532",
    "payTo": "0xProviderWallet",
    "defaultPrice": "$0.10",
    "endpoints": ["POST /fulfill"]
  },
  "capabilities": ["..."],
  "pricing": ["..."]
}
```

### 3) Agent0: set x402 support flag during registration

```ts
import { SDK } from "agent0-sdk";

const sdk = new SDK({ chainId: 11155111, rpcUrl: process.env.RPC_URL!, privateKey: process.env.PRIVATE_KEY });
const agent = sdk.createAgent("IntentCast Provider", "Does X", "https://...");

agent.setX402Support(true);
await agent.setA2A("https://provider.example.com/agent-card.json");
await agent.registerIPFS();
```

---

## Open questions / decisions

1. **Payer identity:** should the *user* pay provider directly (best) or should IntentCast pay (easiest UX continuity)?
2. **Pricing granularity:** x402 price per request vs. per job size.
3. **Receipts / reputation:** do we store the x402 payment proof/tx hash in IntentCast offers/intents for later disputes?
4. **Agent0 chain:** if we adopt Agent0, do we accept Sepolia/Mainnet for discovery while using Base for payments, or do we invest in Base deployment?
