import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, unwrapList, Provider } from '../../lib/api'

export default function ProviderDetail() {
  const { providerId } = useParams()
  const [providers, setProviders] = React.useState<Provider[]>([])
  const [match, setMatch] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!providerId) return
    api.providers()
      .then((p) => {
        const list = unwrapList<Provider>(p, 'providers')
        setProviders(list)
        const p0 = list.find((x) => x.id === providerId)
        if (!p0) return
        return api.match(providerId)
      })
      .then((m) => setMatch(m))
      .catch((e) => setError(String(e)))
  }, [providerId])

  const provider = providers.find((p) => p.id === providerId)

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Provider</h1>
          <p className="mt-2 text-sm text-zinc-300">Provider ID: <code className="text-zinc-100">{providerId}</code></p>
        </div>
        <Link className="text-sm text-blue-400 hover:text-blue-300" to="/directory/providers">← All providers</Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold">Profile</h2>
        <div className="mt-3 grid gap-2 text-sm text-zinc-300">
          <div>Wallet: <code className="text-xs text-zinc-100">{provider?.wallet ?? '—'}</code></div>
          <div>Categories: <span className="text-zinc-100">{(provider?.categories ?? []).join(', ') || '—'}</span></div>
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-zinc-200">Capabilities JSON</summary>
          <pre className="mt-3 overflow-auto rounded-lg border border-white/10 bg-zinc-950 p-3 text-xs text-zinc-200">
            {provider ? JSON.stringify(provider.capabilities, null, 2) : 'Loading…'}
          </pre>
        </details>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold">Matches</h2>
        <p className="mt-2 text-sm text-zinc-300">Live response from <code className="text-zinc-100">/api/v1/match/{providerId}</code>.</p>
        <pre className="mt-3 overflow-auto rounded-lg border border-white/10 bg-zinc-950 p-3 text-xs text-zinc-200">
          {match ? JSON.stringify(match, null, 2) : 'Loading…'}
        </pre>
      </div>
    </div>
  )
}
