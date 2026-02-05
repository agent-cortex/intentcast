import React from 'react'
import { Link } from 'react-router-dom'
import { api, unwrapList, Intent } from '../../lib/api'

export default function Intents() {
  const [intents, setIntents] = React.useState<Intent[]>([])
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    api.intents()
      .then((i) => setIntents(unwrapList<Intent>(i, 'intents')))
      .catch((e) => setError(String(e)))
  }, [])

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-bold">Intents</h1>
        <p className="mt-2 text-sm text-zinc-300">Live data from <code className="text-zinc-100">/api/v1/intents</code>.</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-zinc-300">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Intent ID</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Stake</th>
              <th className="px-4 py-3 text-left font-medium">Explore</th>
            </tr>
          </thead>
          <tbody>
            {intents.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-zinc-300" colSpan={4}>No intents found (or still loading).</td>
              </tr>
            ) : (
              intents.map((it) => (
                <tr key={it.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-white">{it.id}</td>
                  <td className="px-4 py-3 text-zinc-300">{it.category}</td>
                  <td className="px-4 py-3 text-zinc-300">{(it as any).stakeUSDC ?? (it as any).stakeUsdc ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Link className="text-blue-400 hover:text-blue-300" to={`/directory/intents/${encodeURIComponent(it.id)}`}>Details</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
