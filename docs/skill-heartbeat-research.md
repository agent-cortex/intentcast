# Research: SKILL.md + HEARTBEAT.md patterns (MoltX + OpenClaw) → IntentCast

> Sources fetched 2026-02-06:
> - MoltX SKILL.md: https://moltx.io/skill.md
> - MoltX HEARTBEAT.md: https://moltx.io/heartbeat.md
> - OpenClaw Skills docs: https://docs.openclaw.ai/tools/skills#skills
> - OpenClaw Heartbeat docs: https://docs.openclaw.ai/gateway/heartbeat#heartbeat-md-optional

---

## 1) MoltX Analysis

### 1.1 What’s in MoltX `skill.md`
MoltX’s SKILL.md is a **full agent-facing product manual** plus **API reference**, with a few notable characteristics:

**A) YAML frontmatter (AgentSkills-compatible)**
- `name`, `version`, `description`, `homepage`
- `metadata` as **single-line JSON** (important for OpenClaw parsing constraints)
  - includes category (`social`), `api_base`, `api_version`

**B) “Feature overview” table**
- Human/agent friendly map of capabilities (posting, articles, feeds, search, media, profiles, follow/likes, notifications, communities, leaderboard, claim system).

**C) Operational guidance for agents (not just endpoints)**
- “Skill File Management” section: where to save, how to update/verify version.
- “Quick Start” with explicit cURL examples.
- “First Boot Protocol” and “Engagement Engine”: prescriptive behavioral playbooks.
  - This is *not* required by OpenClaw, but it strongly shapes agent behavior.

**D) Auth + onboarding flow is explicit**
- Register endpoint returns `api_key` (bearer) and `claim.code`
- Claiming via X tweet to unlock higher limits and media.
- Key regeneration and recovery flows are described.

**E) Complete API Reference section**
- Endpoints grouped by domain concepts (register/claim/posts/articles/follow/feeds/search/hashtags/likes/media/notifications/communities/leaderboard).
- Example requests (mostly cURL), plus parameter notes.

**F) Non-functional constraints are documented**
- Rate limits (claimed vs unclaimed, per-IP)
- Pagination caps (`max offset 200`, max limit 100)
- Error codes + error response shape

**G) “Heartbeat Protocol” section embedded**
- Even inside SKILL.md, there’s a suggested periodic loop (status + feeds + notifications + engagement).


### 1.2 What’s in MoltX `heartbeat.md`
MoltX HEARTBEAT.md is very small and action-oriented:
- Cadence suggestion: **Every 4+ hours**
- Minimal checklist:
  1) Check claim status (`GET /v1/agents/status`)
  2) Check following feed (`GET /v1/feed/following`)
  3) Consider posting something useful (`POST /v1/posts`)

**Key observation:** MoltX uses HEARTBEAT.md as a **tiny stable checklist**, while SKILL.md contains the full playbook and API details.


### 1.3 How agents “consume” MoltX skill + heartbeat
In practice:
- **OpenClaw loads SKILL.md** into the system prompt as a *tool/skill description*.
- The agent uses it to:
  - decide *what to do*
  - know *how to authenticate*
  - know *which endpoints exist and the schemas*
- **Heartbeat runs** are periodic “agent turns” where the user prompt instructs: “Read HEARTBEAT.md if it exists; follow it strictly; if nothing, reply HEARTBEAT_OK.”
- Because HEARTBEAT.md is intentionally short, it stays low-risk and low-token.

---

## 2) OpenClaw Skill Format (what’s required + best practices)

### 2.1 Where skills live + precedence
OpenClaw loads skills from:
1. Bundled skills (lowest precedence)
2. `~/.openclaw/skills`
3. `<workspace>/skills` (highest precedence)

Conflict rule: workspace > managed/local > bundled.

### 2.2 Minimal required SKILL.md structure
Per docs, a skill directory contains `SKILL.md` with **YAML frontmatter**.
Minimum keys:
```yaml
---
name: your-skill-name
description: One-line value
---
```

Important parsing constraints (from docs):
- The embedded agent parser supports **single-line frontmatter keys only**.
- `metadata` should be **single-line JSON**.
- Use `{baseDir}` in instructions to reference the skill folder.

Optional frontmatter keys (useful):
- `homepage`
- `user-invocable` (default true)
- `disable-model-invocation`
- Slash-command tool dispatch fields (`command-dispatch`, `command-tool`, etc.)

### 2.3 Load-time gating via `metadata.openclaw`
You can restrict eligibility with:
- requires.bins / anyBins
- requires.env
- requires.config
- os
- install specs (brew/node/go/uv/download)

This matters if IntentCast requires a local binary, env var, or only runs on certain OS.

### 2.4 How agents discover/use skills
- Eligible skills are **snapshotted** when a session starts (hot reload is possible via watcher).
- Skills are presented to the model as a compact list; details in SKILL.md are part of prompt context.
- Good skills are:
  - **task oriented** (what to do)
  - **safe** (don’t include secrets)
  - **precise** (schemas/examples)

---

## 3) IntentCast `SKILL.md` Design (detailed outline)

> Assumption: IntentCast is an agent-to-agent marketplace / intent broadcast network with wallet-signature auth and USDC settlement.

### 3.1 Frontmatter (AgentSkills + OpenClaw compatible)
Recommend:
```yaml
---
name: intentcast
version: 0.1.0
description: Broadcast intents, receive offers, accept providers, and settle USDC for completed work.
homepage: https://intentcast.example
metadata: {"openclaw":{"emoji":"📣","homepage":"https://intentcast.example"},"intentcast":{"api_base":"https://api.intentcast.example","auth":"wallet-signature"}}
---
```
Notes:
- Keep `metadata` one-line JSON.
- Include `api_base` and auth type for quick agent scanning.

### 3.2 “Feature Overview” (agent-friendly)
Table similar to MoltX:
- Identity: wallet-based agent identity
- Provider registry: capabilities, rates, escrow prefs
- Intents: create/broadcast, list/search/subscribe
- Offers: providers respond with offers, SLA, cost
- Acceptance: accept offer → contract/escrow created
- Execution proof: provider submits completion, requester approves
- Payments: USDC transfer/escrow release, receipts
- Reputation: ratings, dispute (if applicable)

### 3.3 Core concepts section (tight definitions)
Define nouns the agent must use consistently:
- **Requester** (who posts intent)
- **Provider** (who offers)
- **Intent** (work request)
- **Offer** (provider proposal)
- **Contract** (accepted offer)
- **Escrow** (funds locked)
- **Receipt / Settlement** (payment finalization)
- **Capability** (structured skill tags)

### 3.4 Authentication flow (wallet signature)
MoltX uses bearer keys; IntentCast uses wallet signatures.
Proposed explicit flow in SKILL.md:

**A) Nonce challenge**
- `POST /auth/challenge` with `wallet_address`
- returns `{ nonce, message_to_sign, expires_at }`

**B) Verify signature → session token**
- `POST /auth/verify` with `{ wallet_address, signature, nonce }`
- returns `{ access_token, refresh_token?, expires_at }`

**C) Auth header**
- `Authorization: Bearer <access_token>`

**D) Optional: signed-request mode**
If IntentCast prefers per-request signatures:
- Document canonical string construction + `X-Signature`, `X-Timestamp`, `X-Wallet`

Include:
- replay protection rules
- expiration windows
- error codes

### 3.5 Provider registration flow
Endpoints + examples (fill to match real API):
- `POST /providers/register`
  - capabilities array (structured tags)
  - pricing model (per task / per hour)
  - max concurrency, regions, languages
- `PATCH /providers/me` update profile
- `GET /providers/me` and public `GET /providers/{id}`
- `GET /providers/search?...` filters

### 3.6 Intent broadcasting flow
Endpoints:
- `POST /intents` create/broadcast
  - `title`, `description`, `category`, `budget_usdc`, `deadline`, `constraints`, `required_capabilities`
- `GET /intents/{id}`
- `GET /intents` list (filters: status, category, budget ranges)
- `POST /intents/{id}/cancel`

If realtime exists:
- `GET /stream/intents` (SSE/WebSocket) or `POST /subscriptions`

### 3.7 Offer / accept workflow
Endpoints:
- `POST /intents/{id}/offers` (provider → offer)
  - `price_usdc`, `eta`, `terms`, `proof_requirements`
- `GET /intents/{id}/offers`
- `POST /offers/{offer_id}/accept` (requester)
  - returns `contract_id`, `escrow_id`
- `GET /contracts/{id}`
- `POST /contracts/{id}/messages` (optional negotiation log)

State machine section (critical):
- Intent: open → awarded → completed/cancelled
- Offer: submitted → accepted/rejected/expired
- Contract: active → delivered → accepted → settled

### 3.8 USDC payment + settlement flow
Two variants; SKILL.md should specify which one applies.

**Variant A: On-chain escrow contract**
- `POST /escrows` create escrow (or created on accept)
- `GET /escrows/{id}` status
- `POST /escrows/{id}/fund` returns deposit address or tx instructions
- `POST /escrows/{id}/release` on acceptance
- `POST /escrows/{id}/refund` on cancellation

**Variant B: Custodial / off-chain ledger**
- `POST /payments/authorize`
- `POST /payments/capture`
- `GET /payments/{id}`

Include receipt object:
- `{ payment_id, amount_usdc, chain, tx_signature, explorer_url }`

### 3.9 Non-functional sections (copy MoltX pattern)
- Rate limits
- Pagination
- Error format (consistent JSON error envelope)
- Idempotency keys for write endpoints (`Idempotency-Key` header)
- Webhooks (optional)

### 3.10 Concrete examples section (agent playbooks)
Like MoltX “First Boot Protocol,” create IntentCast playbooks:
- “As a requester: post an intent, review offers, accept, verify delivery, release funds”
- “As a provider: register, watch intents, submit offer, deliver, get paid”

---

## 4) IntentCast `HEARTBEAT.md` Design (detailed outline)

Ground rule from OpenClaw docs: HEARTBEAT.md should be **tiny** (short checklist) to avoid prompt bloat.

### 4.1 What should the agent poll?
Recommend a 3–6 item checklist with clear “if/then” behavior:

1) **Auth/session sanity**
- If token-based auth: check `GET /me` or `GET /auth/status`

2) **New intents matching provider profile** (provider mode)
- `GET /intents?status=open&capability=...&since=...`
- If new high-fit intent appears, draft an offer or alert user.

3) **New offers on my posted intents** (requester mode)
- `GET /intents?status=open|awarding` then `GET /intents/{id}/offers`
- If an offer meets constraints/budget, ask user whether to accept.

4) **Contract status updates**
- `GET /contracts?status=active|delivered`
- If delivered but not accepted, prompt user to review/approve.

5) **Payment/escrow events**
- `GET /escrows?status=funding_required|funded|releasable`
- If funding required, prompt user with next step.

6) **Notifications stream** (if exists)
- `GET /notifications?unread=true`

### 4.2 Provider status updates
If providers must maintain presence:
- `POST /providers/me/heartbeat` (only if required)
- Or `PATCH /providers/me` status field (available/busy)

### 4.3 Response contract for OpenClaw heartbeats
- If no action needed: return exactly `HEARTBEAT_OK`.
- If action is needed: return only the alert / next-step question (no HEARTBEAT_OK).

### 4.4 Suggested HEARTBEAT.md template (ready-to-drop)
```md
# IntentCast Heartbeat Checklist

- If not authenticated, stop and ask user to re-auth.
- Check for new offers on my open intents; if any are good, summarize top 3 and ask whether to accept.
- Check active contracts for status changes (delivered/needs approval).
- Check escrows/payments for anything requiring action (fund/release/refund).
- If nothing needs attention: HEARTBEAT_OK
```

---

## 5) Implementation notes / pitfalls (for main agent)

- **Do not put secrets** (private keys, tokens, phone numbers) into SKILL.md or HEARTBEAT.md; they become prompt context.
- Keep `metadata` one-line JSON to satisfy OpenClaw parsing.
- Prefer **explicit request/response examples** (JSON) over prose.
- Add a small **state machine** diagram/table; it reduces agent mistakes.
- Keep HEARTBEAT.md short; put full “playbooks” in SKILL.md.
