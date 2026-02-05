import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../lib/api'

export default function IntentDetail() {
  const { intentId } = useParams()
  const [intent, setIntent] = React.useState<any>(null)
  const [offers, setOffers] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!intentId) return
    Promise.all([api.intent(intentId), api.offers(intentId)])
      .then(([it, of]) => {
        setIntent(it)
        setOffers(of)
      })
      .catch((e) => setError(String(e)))
  }, [intentId])

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Intent</h1>
          <p className="mt-2 text-sm text-zinc-300">Intent ID: <code className="text-zinc-100">{intentId}</code></p>
        </div>
        <Link className="text-sm text-blue-400 hover:text-blue-300" to="/directory/intents">← All intents</Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold">Intent JSON</h2>
        <pre className="mt-3 overflow-auto rounded-lg border border-white/10 bg-zinc-950 p-3 text-xs text-zinc-200">
          {intent ? JSON.stringify(intent, null, 2) : 'Loading…'}
        </pre>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold">Offers JSON</h2>
        <pre className="mt-3 overflow-auto rounded-lg border border-white/10 bg-zinc-950 p-3 text-xs text-zinc-200">
          {offers ? JSON.stringify(offers, null, 2) : 'Loading…'}
        </pre>
      </div>
    </div>
  )
}
