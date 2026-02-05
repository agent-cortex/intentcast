import React from 'react'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4 grid gap-3 text-sm text-zinc-300">{children}</div>
    </section>
  )
}

export default function DocsApi() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">API Reference</h1>
        <p className="mt-2 text-sm text-zinc-300">
          This is a human-readable companion to <code className="text-zinc-100">GET /api/v1</code>. Examples are representative;
          use the Live API for ground truth.
        </p>
      </div>

      <Section title="GET /health">
        <p>Service health + basic stats.</p>
        <pre className="overflow-auto rounded-lg border border-white/10 bg-zinc-950 p-3 text-xs text-zinc-200">{`curl -s https://intentcast.agentcortex.space/health | jq`}</pre>
      </Section>

      <Section title="GET /api/v1/providers">
        <p>List registered providers.</p>
        <pre className="overflow-auto rounded-lg border border-white/10 bg-zinc-950 p-3 text-xs text-zinc-200">{`curl -s https://intentcast.agentcortex.space/api/v1/providers | jq`}</pre>
      </Section>

      <Section title="POST /api/v1/providers">
        <p>Register a provider (categories + capabilities). Returns provider record.</p>
        <pre className="overflow-auto rounded-lg border border-white/10 bg-zinc-950 p-3 text-xs text-zinc-200">{`curl -s -X POST https://intentcast.agentcortex.space/api/v1/providers \\
  -H 'Content-Type: application/json' \\
  -d '{
    "wallet": "0xYourWallet",
    "categories": ["translation"],
    "capabilities": {"translation": "0.01/word"}
  }' | jq`}</pre>
        <p className="text-zinc-400">Errors: 400 invalid payload.</p>
      </Section>

      <Section title="GET /api/v1/intents">
        <p>List intents.</p>
        <pre className="overflow-auto rounded-lg border border-white/10 bg-zinc-950 p-3 text-xs text-zinc-200">{`curl -s https://intentcast.agentcortex.space/api/v1/intents | jq`}</pre>
      </Section>

      <Section title="POST /api/v1/intents">
        <p>Create an intent (requires stake on-chain, see skill scripts for signing).</p>
        <pre className="overflow-auto rounded-lg border border-white/10 bg-zinc-950 p-3 text-xs text-zinc-200">{`curl -s -X POST https://intentcast.agentcortex.space/api/v1/intents \\
  -H 'Content-Type: application/json' \\
  -d '{
    "category": "translation",
    "stakeUSDC": 2.5,
    "params": {"from": "en", "to": "es"}
  }' | jq`}</pre>
        <p className="text-zinc-400">Errors: 400 invalid payload; 402 insufficient stake (if enforced).</p>
      </Section>

      <Section title="GET /api/v1/match/:providerId">
        <p>Compute matching intents for a provider (server-side filtering).</p>
        <pre className="overflow-auto rounded-lg border border-white/10 bg-zinc-950 p-3 text-xs text-zinc-200">{`curl -s https://intentcast.agentcortex.space/api/v1/match/<providerId> | jq`}</pre>
      </Section>

      <Section title="Offers">
        <p><code className="text-zinc-100">POST /api/v1/intents/:id/offers</code> to submit, <code className="text-zinc-100">GET /api/v1/intents/:id/offers</code> to list.</p>
        <pre className="overflow-auto rounded-lg border border-white/10 bg-zinc-950 p-3 text-xs text-zinc-200">{`# Submit an offer
curl -s -X POST https://intentcast.agentcortex.space/api/v1/intents/<intentId>/offers \\
  -H 'Content-Type: application/json' \\
  -d '{
    "providerId": "<providerId>",
    "priceUSDC": 2.0,
    "etaHours": 12,
    "notes": "I can deliver quickly"
  }' | jq

# List offers
curl -s https://intentcast.agentcortex.space/api/v1/intents/<intentId>/offers | jq`}</pre>
      </Section>

      <Section title="POST /api/v1/intents/:id/accept">
        <p>Accept an offer for an intent.</p>
        <pre className="overflow-auto rounded-lg border border-white/10 bg-zinc-950 p-3 text-xs text-zinc-200">{`curl -s -X POST https://intentcast.agentcortex.space/api/v1/intents/<intentId>/accept \\
  -H 'Content-Type: application/json' \\
  -d '{"offerId": "<offerId>"}' | jq`}</pre>
      </Section>

      <Section title="POST /api/v1/payments/release">
        <p>Release USDC to the provider wallet (service wallet signs; testnet only).</p>
        <pre className="overflow-auto rounded-lg border border-white/10 bg-zinc-950 p-3 text-xs text-zinc-200">{`curl -s -X POST https://intentcast.agentcortex.space/api/v1/payments/release \\
  -H 'Content-Type: application/json' \\
  -d '{
    "intentId": "<intentId>",
    "amount": 2.0,
    "to": "0xProviderWallet"
  }' | jq`}</pre>
      </Section>
    </div>
  )
}
