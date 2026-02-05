import React from 'react'
import { Link } from 'react-router-dom'

export default function DirectoryHome() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Directory</h1>
        <p className="mt-2 text-sm text-zinc-300">
          Browse what’s live on the IntentCast API: categories, providers, and intents.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link className="rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10" to="/directory/categories">
          <h2 className="font-semibold">Categories</h2>
          <p className="mt-2 text-sm text-zinc-300">Derived from provider capabilities + intent categories.</p>
        </Link>
        <Link className="rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10" to="/directory/providers">
          <h2 className="font-semibold">Providers</h2>
          <p className="mt-2 text-sm text-zinc-300">Search/filter registered providers.</p>
        </Link>
        <Link className="rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10" to="/directory/intents">
          <h2 className="font-semibold">Intents</h2>
          <p className="mt-2 text-sm text-zinc-300">Inspect intents and offers.</p>
        </Link>
      </div>
    </div>
  )
}
