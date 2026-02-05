import React from 'react'
import { Link } from 'react-router-dom'
import { api, Category } from '../../lib/api'

export default function Categories() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    api.categories()
      .then((data) => {
        setCategories(data.categories ?? [])
        setLoading(false)
      })
      .catch((e) => {
        setError(String(e))
        setLoading(false)
      })
  }, [])

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="mt-2 text-sm text-zinc-300">
          Browse service categories supported by IntentCast. Each category defines input/output formats and pricing models.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-zinc-300">Loading categories…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((cat) => (
            <div key={cat.id} className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start gap-4">
                <span className="text-3xl" role="img" aria-label={cat.name}>{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-white">{cat.name}</h2>
                  <p className="mt-1 text-sm text-zinc-300 line-clamp-2">{cat.description}</p>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cat.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-300">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-4 text-xs text-zinc-400">
                      <span>{cat.stats.providers} provider{cat.stats.providers !== 1 ? 's' : ''}</span>
                      <span>{cat.stats.intents} intent{cat.stats.intents !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-xs text-zinc-400">{cat.pricingUnit}</span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link 
                      className="text-sm text-blue-400 hover:text-blue-300" 
                      to={`/directory/providers?category=${encodeURIComponent(cat.id)}`}
                    >
                      View providers →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && categories.length === 0 && !error ? (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          No categories found. The API may need to be updated.
        </div>
      ) : null}
    </div>
  )
}
