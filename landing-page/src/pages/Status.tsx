import React from 'react'
import { api } from '../lib/api'

export default function Status() {
  const [data, setData] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    api.health()
      .then(setData)
      .catch((e) => setError(String(e)))
  }, [])

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Status</h1>
      <p className="text-sm text-zinc-300">Human-friendly view of <code className="text-zinc-100">/health</code>.</p>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <pre className="overflow-auto text-xs text-zinc-200">{data ? JSON.stringify(data, null, 2) : 'Loading…'}</pre>
      </div>
    </div>
  )
}
