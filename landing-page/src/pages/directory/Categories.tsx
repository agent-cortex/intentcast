import React from 'react'
import { Link } from 'react-router-dom'
import { api, unwrapList, Provider, Intent } from '../../lib/api'

export default function Categories() {
  const [providers, setProviders] = React.useState<Provider[]>([])
  const [intents, setIntents] = React.useState<Intent[]>([])
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    Promise.all([api.providers(), api.intents()])
      .then(([p, i]) => {
        setProviders(unwrapList<Provider>(p, 'providers'))
        setIntents(unwrapList<Intent>(i, 'intents'))
      })
      .catch((e) => setError(String(e)))
  }, [])

  const counts = new Map<string, { providers: number; intents: number }>()

  for (const p of providers) {
    for (const c of p.categories ?? []) {
      const cur = counts.get(c) ?? { providers: 0, intents: 0 }
      cur.providers += 1
      counts.set(c, cur)
    }
  }
  for (const it of intents) {
    const c = it.category
    if (!c) continue
    const cur = counts.get(c) ?? { providers: 0, intents: 0 }
    cur.intents += 1
    counts.set(c, cur)
  }

  const rows = Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="mt-2 text-sm text-zinc-300">Derived live from <code className="text-zinc-100">/providers</code> and <code className="text-zinc-100">/intents</code>.</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-zinc-300">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Providers</th>
              <th className="px-4 py-3 text-left font-medium">Intents</th>
              <th className="px-4 py-3 text-left font-medium">Explore</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-zinc-300" colSpan={4}>Loading…</td>
              </tr>
            ) : (
              rows.map(([cat, c]) => (
                <tr key={cat} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-white">{cat}</td>
                  <td className="px-4 py-3 text-zinc-300">{c.providers}</td>
                  <td className="px-4 py-3 text-zinc-300">{c.intents}</td>
                  <td className="px-4 py-3">
                    <Link className="text-blue-400 hover:text-blue-300" to={`/directory/providers?category=${encodeURIComponent(cat)}`}>View providers</Link>
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
