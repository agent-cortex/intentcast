import React from 'react'
import { api, HealthResponse, formatUptime } from '../lib/api'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm text-zinc-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
      {sub ? <div className="mt-1 text-xs text-zinc-500">{sub}</div> : null}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isOk = status === 'ok'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
      isOk ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
    }`}>
      <span className={`h-2 w-2 rounded-full ${isOk ? 'bg-green-400' : 'bg-red-400'}`} />
      {isOk ? 'Operational' : 'Degraded'}
    </span>
  )
}

export default function Status() {
  const [data, setData] = React.useState<HealthResponse | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [lastChecked, setLastChecked] = React.useState<Date | null>(null)

  const fetchHealth = React.useCallback(() => {
    api.health()
      .then((d) => {
        setData(d)
        setError(null)
        setLastChecked(new Date())
      })
      .catch((e) => setError(String(e)))
  }, [])

  React.useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [fetchHealth])

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Status</h1>
          <p className="mt-2 text-sm text-zinc-300">Real-time health of the IntentCast API.</p>
        </div>
        <div className="flex items-center gap-4">
          {data ? <StatusBadge status={data.status} /> : null}
          <button
            onClick={fetchHealth}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/10"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : null}

      {data ? (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard 
              label="Uptime" 
              value={data.uptime ? formatUptime(data.uptime) : '—'} 
              sub="Since last restart"
            />
            <StatCard 
              label="Categories" 
              value={data.stats.categories ?? '—'} 
              sub="Service types"
            />
            <StatCard 
              label="Providers" 
              value={data.stats.providers} 
              sub="Registered agents"
            />
            <StatCard 
              label="Intents" 
              value={data.stats.intents} 
              sub="Active requests"
            />
          </div>

          {/* Service Info */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold">Service Info</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-400">Service</span>
                <span className="text-white">{data.service}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-400">Version</span>
                <span className="text-white">{data.version}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-400">Timestamp</span>
                <span className="text-white">{new Date(data.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-400">Total Offers</span>
                <span className="text-white">{data.stats.offers}</span>
              </div>
              {lastChecked ? (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Last Checked</span>
                  <span className="text-zinc-300">{lastChecked.toLocaleTimeString()}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Quick Links */}
          {data.endpoints ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold">Quick Links</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={data.endpoints.api}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10"
                >
                  API Index →
                </a>
                <a
                  href={data.endpoints.docs}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10"
                >
                  Documentation →
                </a>
                <a
                  href={data.endpoints.directory}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10"
                >
                  Directory →
                </a>
              </div>
            </div>
          ) : null}

          {/* Raw Response (collapsible) */}
          <details className="rounded-xl border border-white/10 bg-white/5 p-6">
            <summary className="cursor-pointer text-sm font-medium text-zinc-200">Raw API Response</summary>
            <pre className="mt-4 overflow-auto rounded-lg border border-white/10 bg-zinc-950 p-4 text-xs text-zinc-200">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </>
      ) : !error ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-zinc-300">Loading status…</div>
      ) : null}
    </div>
  )
}
