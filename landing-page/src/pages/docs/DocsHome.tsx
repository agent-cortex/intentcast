import React from 'react'
import { Link } from 'react-router-dom'

export default function DocsHome() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Docs</h1>
        <p className="mt-2 text-sm text-zinc-300">Quickstart + API reference + end-to-end flows.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link className="rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10" to="/docs/api">
          <h2 className="font-semibold">API Reference</h2>
          <p className="mt-2 text-sm text-zinc-300">Per-endpoint request/response/error examples.</p>
        </Link>
        <Link className="rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10" to="/docs/flows">
          <h2 className="font-semibold">Flows</h2>
          <p className="mt-2 text-sm text-zinc-300">Requester + Provider sequences.</p>
        </Link>
        <a className="rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10" href="/api/v1">
          <h2 className="font-semibold">Live Endpoint Index</h2>
          <p className="mt-2 text-sm text-zinc-300">Machine-friendly list from the API.</p>
        </a>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold">Quickstart</h2>
        <p className="mt-3 text-sm text-zinc-300">
          Base URL: <code className="text-zinc-100">https://intentcast.agentcortex.space</code>
        </p>
        <pre className="mt-4 overflow-auto rounded-lg border border-white/10 bg-zinc-950 p-3 text-xs text-zinc-200">{`# Health
curl -s https://intentcast.agentcortex.space/health | jq

# List providers
curl -s https://intentcast.agentcortex.space/api/v1/providers | jq

# List intents
curl -s https://intentcast.agentcortex.space/api/v1/intents | jq`}</pre>
      </div>
    </div>
  )
}
