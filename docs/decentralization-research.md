# IntentCast decentralization research (minimize centralization, increase trustlessness)

**Context**: IntentCast is an agent service discovery + USDC payment system.
Current architecture:
- Centralized Express API for discovery
- Supabase (hosted Postgres) for persistence
- Wallet signature auth
- USDC payments on **Base Sepolia**

**Goal**: Reduce reliance on a single operator (censorship resistance, liveness, verifiable state, composability) while keeping UX workable.

---

## Design principles & threat model (quick framing)

**What “centralization” currently means here**
- A single discovery API can be censored, altered, rate-limited, or go down.
- A single DB can be tampered with or withheld.
- Payment may be on-chain, but *who gets discovered / which offers are shown / what the terms are* is not verifiable.

**Threats to address**
- **Censorship**: operator removes providers/intents or shadows them.
- **Tampering**: operator modifies intent/offer terms after signing.
- **Liveness**: operator downtime blocks matching or settlement.
- **Sybil/spam**: open registry can be flooded.
- **Disputes**: provider claims completion; requester disagrees.

**Good target properties (incremental)**
- Verifiable registry state (on-chain or content-addressed) + multiple indexers.
- Off-chain matching can exist, but should be *auditable* and *replaceable*.
- Non-custodial escrow with clear settlement rules.
- Communication layer that doesn’t require your server.

---

## 1) On-chain discovery registry

### Option A — Minimal on-chain registry (recommended first)
**Idea**: Put only *provider identity + service metadata pointers* on-chain.
- Provider registers: (provider address, endpoint/publicKey, metadataURI, tags, pricing model, stake)
- Optional: revoke/rotate metadata pointers, keys.

**Data placement**
- On-chain: minimal fields (cheap, verifiable).
- Off-chain: rich metadata (capabilities, schemas, examples) stored on IPFS/Arweave.

**How discovery works**
- Anyone can query the contract or an indexer; multiple indexers can coexist.
- Frontends can verify results by checking events/state.

**Pros (IntentCast fit)**
- Immediate decentralization win for discovery (no single DB/API needed).
- Simple contract; low gas.
- Composable (other apps can list providers).

**Cons**
- Search is still off-chain (tags/text search requires indexing).
- Open registry invites spam unless gated by stake/allowlists/reputation.

**Complexity**: **Low → Medium**
- Contract + events + indexer (The Graph, custom) + client verification.

### Option B — On-chain intent/offer state machine
**Idea**: Put intents and offers (and acceptance) on-chain.
Typical states:
1. Intent posted (hash/URI)
2. Offer submitted (hash/URI)
3. Offer accepted
4. Fulfillment proof / completion
5. Settlement / dispute

**Pros**
- Strongest verifiability for terms and matching.
- Eliminates “operator rewrites intent” class of attacks.

**Cons**
- Higher gas + worse UX (many transactions).
- Public mempool leaks intent details unless encrypted/committed.

**Mitigations**
- Commit-reveal: post hash first, reveal later.
- Encrypt payloads to recipients; store ciphertext off-chain.

**Complexity**: **Medium → High**

### Option C — Events-only + off-chain computed state
**Idea**: Use events as the source of truth; compute current registry/state from logs.

**Pros**
- Cheap storage (events vs storage slots).
- Easy to run multiple indexers.

**Cons**
- Clients must trust an indexer unless they verify logs.

**Complexity**: **Medium**

### Indexing choices
- **The Graph**: easiest dev experience; some centralization depending on hosting.
- **Self-hosted indexer** (viem + postgres): more control; still replicable.
- **Client-side light indexing** for small datasets: maximally trust-minimized but limited scale.

---

## 2) Decentralized storage for intent/offer content

### IPFS (content-addressed, mutable via indirection)
**Use**: store provider metadata JSON, intent/offer payloads, schemas.

**Pros**
- Content-addressed integrity (CID); easy to verify.
- Cheap and widely supported.

**Cons**
- Availability is not guaranteed without pinning.

**Implementation notes**
- Use a pinning service (Pinata/Web3.Storage) *but allow multiple*.
- Put CIDs on-chain (registry fields) for verifiable retrieval.

**Complexity**: **Low**

### Arweave (permanent storage)
**Use**: immutable records (receipts, completed job proofs, finalized offers).

**Pros**
- Permanent availability model.

**Cons**
- Cost per upload; less “mutable” unless you write new tx.

**Complexity**: **Low → Medium**

### Ceramic / ComposeDB (mutable decentralized data)
**Use**: user/provider profiles, reputation, mutable service docs.

**Pros**
- More “database-like” (updates, queries).

**Cons**
- Operational complexity; trust model depends on network + node operators.

**Complexity**: **Medium → High**

### ENS/Basename for provider identity
**Use**: map provider address → human-readable name + metadata pointers.

**Pros**
- Familiar identity primitive; integrates well with Base (Basename).

**Cons**
- Name squatting; not a full reputation system.

**Complexity**: **Low**

---

## 3) Trustless escrow & settlement

### Baseline — Non-custodial escrow contract (recommended)
**Idea**: Payments go to a contract that releases funds based on explicit rules.

**Common patterns**
1. **Prepaid escrow**: requester deposits USDC; provider can claim upon completion.
2. **Milestone escrow**: multiple releases.
3. **Streaming** (Superfluid): continuous payment, stoppable.

**Key requirements**
- Uses USDC ERC20 on Base (Sepolia now; mainnet later).
- Defines who can release/cancel and under what conditions.
- Emits events for indexers.

**Pros**
- Eliminates operator custody risk.
- Transparent and auditable.

**Cons**
- Dispute handling is hard; “completion” is often subjective.

**Complexity**: **Medium**

### Dispute resolution options

#### (A) Optimistic settlement + challenge window (recommended for most digital services)
- Provider submits “completion claim” (with proof link/hash).
- Requester has N hours to dispute; otherwise funds release.

**Pros**
- Cheap; works for most cases.

**Cons**
- Requires requester attention.

**Complexity**: **Medium**

#### (B) Arbitration protocols: Kleros
- If disputed, escalate to jurors.

**Pros**
- Externalizes dispute resolution; more trustless.

**Cons**
- Time + fees; evidence UX.

**Complexity**: **High**

#### (C) UMA Optimistic Oracle (OO)
- Ask an oracle question (“Did provider deliver X?”) with optimistic proposals and disputes.

**Pros**
- Strong cryptoeconomic guarantees; composable.

**Cons**
- Requires well-formed verifiable questions; slower.

**Complexity**: **High**

#### (D) Multisig / Safe-based escrow (human arbitration)
- Funds sit in a Safe controlled by requester+provider(+mediator).

**Pros**
- Practical; battle-tested.

**Cons**
- Not fully trustless; coordination overhead.

**Complexity**: **Medium**

### Existing contract building blocks
- OpenZeppelin ERC20 + AccessControl + EIP-712 typed signatures.
- “Pull payment” pattern; avoid reentrancy.

---

## 4) P2P communication layer (agent-to-agent)

### libp2p / WebRTC
**Use**: direct messaging, negotiation, offer exchange, streaming logs.

**Pros**
- No central server required.
- Flexible transport; good for agent networks.

**Cons**
- NAT traversal complexity; rendezvous/bootstrapping can reintroduce central points.

**Complexity**: **High**

### XMTP (wallet-based messaging)
**Use**: encrypted messages between addresses (intents, offers, receipts).

**Pros**
- Strong UX for wallet identities.
- Works well for asynchronous negotiation.

**Cons**
- Ecosystem dependency; still relies on network infrastructure.

**Complexity**: **Medium**

### Waku
**Use**: censorship-resistant pubsub-like messaging.

**Pros**
- Stronger censorship resistance.

**Cons**
- Operational and integration complexity.

**Complexity**: **High**

### Push Protocol (notifications)
**Use**: notify users about offers, disputes, releases.

**Pros**
- Improves UX; multi-channel.

**Cons**
- Not a full transport; adds dependency.

**Complexity**: **Low → Medium**

---

## 5) Hybrid approaches (pragmatic decentralization)

### Hybrid 1 — On-chain registry + off-chain matching (default recommendation)
**How**
- Registry and identities on-chain.
- Matching done by *anyone* (multiple matchmakers/relayers).
- All offers/intents are signed (EIP-712) so tampering is detectable.

**Pros**
- Great UX; minimal chain interactions.
- No single operator; matchmakers are replaceable.

**Cons**
- Discovery/search quality depends on indexers.

**Complexity**: **Medium**

### Hybrid 2 — “Optimistic” off-chain state with fraud proofs (advanced)
**How**
- Off-chain system proposes a state root (e.g., offers/orderbook) periodically.
- Challenges can prove misbehavior.

**Pros**
- Stronger guarantees at scale.

**Cons**
- Hard to engineer and audit.

**Complexity**: **Very High**

### Cheaper execution layers
- Use Base L2 for registry/escrow now.
- Consider an L3 / appchain later only if throughput demands it.

### MPC / threshold signatures
**Use**: distribute control of key operations (e.g., rotating registry pointers or managing a shared relayer).

**Pros**
- Reduces single-key compromise.

**Cons**
- Operational overhead; doesn’t remove need for a protocol.

**Complexity**: **High**

---

## 6) Existing protocols to leverage (fit assessment)

### Safe (multi-sig)
- Best for: team-controlled treasury, mediation escrow, protocol admin.
- Not ideal as the *core* trustless mechanism, but great for gradual decentralization.

**Complexity**: Medium

### Superfluid (streaming USDC)
- Best for: long-running agent services, pay-per-second jobs, cancelable work.

**Complexity**: Medium

### Request Network
- Best for: invoicing/receipts/accounting layer.
- Might be complementary rather than core.

**Complexity**: Medium

### Chainlink / Oracles
- Best for: objective external data, not subjective job completion.

**Complexity**: Medium → High

---

## Recommended phased approach (quick wins → full decentralization)

### Phase 0 (Now): “Auditable centralized” (1–3 days)
- Keep Express + Supabase, but:
  - Make all intents/offers **EIP-712 signed**.
  - Store payloads as **content-addressed** objects (IPFS CIDs) even if pinned by you.
  - Publish a simple **replication/export** endpoint and/or periodic dumps.

**Goal**: Operator can’t silently alter terms; data can be mirrored.

**Complexity**: Low

### Phase 1: On-chain provider registry + IPFS metadata (~1–2 weeks)
- Deploy a **ProviderRegistry** contract on Base (Sepolia → mainnet).
- Provider registration includes:
  - `providerAddr`
  - `xmtpKey` or `commPubKey` (optional)
  - `metadataCID`
  - `tags` (bytes32 categories) or minimal structured tags
  - optional `stakeAmount` to deter spam
- Build an indexer (start centralized but open-source), allow community mirrors.

**Goal**: Discovery no longer depends on your API/DB.

**Complexity**: Medium

### Phase 2: Trustless escrow for payments (2–4 weeks)
- Add an **Escrow** contract for USDC with:
  - deposit by requester
  - accept by provider
  - optimistic completion claim + challenge window
  - optional mediator path (Safe) for early versions

**Goal**: Funds safety + credible settlement.

**Complexity**: Medium → High

### Phase 3: Decentralized messaging + multi-indexer ecosystem (4–8+ weeks)
- Adopt **XMTP** (or Waku/libp2p) for negotiation and delivery artifacts.
- Standardize signed message formats and schemas.
- Encourage multiple indexers/matchmakers.

**Goal**: Remove dependence on your infrastructure for negotiation/transport.

**Complexity**: Medium → High

### Phase 4: Advanced dispute resolution & reputation (later)
- Integrate Kleros/UMA where needed.
- Add portable reputation anchored on-chain or via attestations.

**Goal**: Stronger trustless outcomes for high-value tasks.

**Complexity**: High

---

## Practical implementation notes (IntentCast-specific)

### Make intents/offers portable and verifiable
- Use **EIP-712** typed data for:
  - Intent (requester-signed)
  - Offer (provider-signed)
  - Acceptance (requester-signed)
- Put only hashes/URIs on-chain; keep details off-chain.

### Spam/Sybil mitigation for an on-chain registry
- Optional deposit/stake to register.
- Rate limits per address.
- Community curation lists (also on-chain or signed lists).

### What to keep off-chain (even in decentralized future)
- Full-text search, ranking, personalization.
- Large artifacts/logs.
- Private negotiation content (store encrypted blobs).

---

## Complexity estimates (relative)

| Area | Approach | Complexity | Notes |
|---|---|---:|---|
| Discovery | On-chain provider registry + IPFS metadata | Medium | Biggest ROI per effort |
| Discovery | On-chain intent/offer state machine | High | Gas + UX complexity |
| Storage | IPFS (+ pinning) | Low | Add redundancy for availability |
| Storage | Arweave receipts | Low–Medium | Great for immutable proofs |
| Storage | Ceramic/ComposeDB | Medium–High | More moving parts |
| Payments | Simple escrow (deposit/release) | Medium | Easy but disputes remain |
| Payments | Optimistic completion + challenge window | Medium | Good default |
| Disputes | Kleros / UMA OO | High | Use for high-value cases |
| Comms | XMTP | Medium | Practical wallet messaging |
| Comms | libp2p/Waku | High | Better censorship-resistance, more ops |

---

## Suggested “minimum viable decentralization” target

If you want the largest reduction in centralization with manageable scope:
1. **On-chain provider registry** (Base) + IPFS metadata.
2. **Signed intents/offers** (EIP-712) stored as CIDs.
3. **USDC escrow contract** with optimistic settlement.
4. Optional **XMTP** for negotiation.

This makes IntentCast:
- discoverable without your server,
- tamper-evident,
- non-custodial for payments,
- resilient to an operator going offline.
