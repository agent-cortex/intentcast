import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, unwrapList, Provider } from '../../lib/api'

function includesAny(haystack: string, needles: string[]) {
  const h = haystack.toLowerCase()
  return needles.some((n) => h.includes(n.toLowerCase()))
}

export default function Providers() {
  const [providers, setProviders] = React.useState<Provider[]>([])
  const [q, setQ] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [params] = useSearchParams()

  const category = params.get('category')

  React.useEffect(() => {
    api.providers()
      .then((p) => setProviders(unwrapList<Provider>(p, 'providers')))
      .catch((e) => setError(String(e)))
  }, [])

  const filtered = providers
    .filter((p) => (category ? (p.categories ?? []).includes(category) : true))
    .filter((p) => {
      if (!q.trim()) return true
      const needles = q.split(/\s+/).filter(Boolean)
      return includesAny(p.id ?? '', needles) || includesAny(p.wallet ?? '', needles) || includesAny((p.categories ?? []).join(' '), needles)
    })

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Providers</h1>
          <p className="mt-2 text-sm text-zinc-300">Live data from <code className="text-zinc-100">/api/v1/providers</code>.</p>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-zinc-300" htmlFor="q">Search</label>
          <input
            id="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="provider id, wallet, category…"
            className="w-full md:w-80 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      {category ? (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
          Filtering by category: <span className="font-semibold">{category}</span>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-zinc-300">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Provider ID</th>
              <th className="px-4 py-3 text-left font-medium">Wallet</th>
              <th className="px-4 py-3 text-left font-medium">Categories</th>
              <th className="px-4 py-3 text-left font-medium">Explore</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-zinc-300" colSpan={4}>No providers found.</td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-white">{p.id}</td>
                  <td className="px-4 py-3 text-zinc-300"><code className="text-xs">{p.wallet}</code></td>
                  <td className="px-4 py-3 text-zinc-300">{(p.categories ?? []).join(', ') || '—'}</td>
                  <td className="px-4 py-3">
                    <Link className="text-blue-400 hover:text-blue-300" to={`/directory/providers/${encodeURIComponent(p.id)}`}>Details</Link>
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
