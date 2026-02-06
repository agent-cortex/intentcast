# Backend Robustness Plan

**Date:** 2026-02-06
**Status:** ✅ Persistent storage complete, 4 items remaining

## Parallel Workstreams

### 1. Wallet-Based Auth (Agent: auth-wallet)
**Goal:** Verify EVM signatures for mutations (POST/PUT/DELETE)

**Research:**
- EIP-712 typed data signing
- ethers.js `verifyMessage` / `verifyTypedData`
- Nonce management to prevent replay attacks

**Implementation:**
1. Create `src/middleware/auth.ts`
2. Define signature format: `{ message, signature, wallet, nonce }`
3. Verify signature matches wallet
4. Add nonce tracking (Supabase `nonces` table or in-memory)
5. Apply middleware to mutation routes
6. Skip auth for GET requests (public reads)

**Files:**
- `src/middleware/auth.ts` (new)
- `src/routes/*.ts` (apply middleware)
- `supabase/schema.sql` (add nonces table if needed)

---

### 2. Rate Limiting (Agent: rate-limit)
**Goal:** Per-wallet request limits to prevent abuse

**Research:**
- `express-rate-limit` + custom key generator
- Upstash Redis for distributed rate limiting (optional)
- Sliding window vs fixed window

**Implementation:**
1. Install `express-rate-limit`
2. Create `src/middleware/rateLimit.ts`
3. Key by wallet address (from auth) or IP fallback
4. Limits: 100 req/min for reads, 20 req/min for writes
5. Return 429 with `Retry-After` header

**Files:**
- `src/middleware/rateLimit.ts` (new)
- `src/server.ts` (apply middleware)

---

### 3. Input Validation (Agent: validation-zod)
**Goal:** Zod schemas for all API inputs

**Research:**
- Zod library best practices
- Express middleware integration
- Error message formatting

**Implementation:**
1. Install `zod`
2. Create `src/schemas/` directory
3. Define schemas for:
   - `CreateIntentInput`
   - `CreateProviderInput`
   - `CreateOfferInput`
   - Query params (filters, pagination)
4. Create `src/middleware/validate.ts`
5. Apply to all routes

**Files:**
- `src/schemas/*.ts` (new)
- `src/middleware/validate.ts` (new)
- `src/routes/*.ts` (apply validation)

---

### 4. Error Handling (Agent: error-handling)
**Goal:** Consistent error response format

**Research:**
- RFC 7807 Problem Details
- Express error middleware patterns
- HTTP status code conventions

**Implementation:**
1. Create `src/middleware/errorHandler.ts`
2. Define error response format:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": [...],
    "requestId": "uuid"
  }
}
```
3. Create custom error classes
4. Wrap all routes in try-catch or async handler
5. Log errors with context

**Files:**
- `src/middleware/errorHandler.ts` (new)
- `src/utils/errors.ts` (new)
- `src/utils/asyncHandler.ts` (new)
- `src/routes/*.ts` (wrap handlers)

---

## Execution Order

All 4 can run in parallel since they touch different files:
- Auth → `middleware/auth.ts`
- Rate Limit → `middleware/rateLimit.ts`
- Validation → `schemas/`, `middleware/validate.ts`
- Errors → `middleware/errorHandler.ts`, `utils/errors.ts`

Integration point: `src/server.ts` (apply all middleware)

## Success Criteria

- [ ] All POST/PUT/DELETE require valid wallet signature
- [ ] Rate limits enforced per wallet
- [ ] Invalid inputs rejected with clear messages
- [ ] All errors follow consistent format
- [ ] All tests pass
- [ ] Deployed to production
