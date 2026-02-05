import React from 'react'
import { api } from '../lib/api'

function EndpointGroup({ title, endpoints }: { title: string; endpoints: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="font-semibold text-white capitalize">{title}</h3>
      <ul className="mt-3 space-y-2">
        {endpoints.map((ep) => {
          const [method, path] = ep.split(' ')
          return (
            <li key={ep} className="flex items-center gap-2 text-sm">
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                method === 'GET' ? 'bg-green-500/20 text-green-300' :
                method === 'POST' ? 'bg-blue-500/20 text-blue-300' :
                method === 'DELETE' ? 'bg-red-500/20 text-red-300' :
                'bg-zinc-500/20 text-zinc-300'
              }`}>
                {method}
              </span>
              <code className="text-zinc-300">{path}</code>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <button
      onClick={handleCopy}
      className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-400 hover:bg-white/10"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export default function LiveApi() {
  const [data, setData] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    api.apiIndex()
      .then(setData)
      .catch((e) => setError(String(e)))
  }, [])

  const baseUrl = 'https://intentcast.agentcortex.space'

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Live API</h1>
        <p className="mt-2 text-sm text-zinc-300">
          Explore the IntentCast API endpoints. All endpoints return JSON.
        </p>
      </div>

      {/* Base URL */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-400">Base URL</div>
            <code className="text-lg text-white">{baseUrl}</code>
          </div>
          <CopyButton text={baseUrl} />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : null}

      {data ? (
        <>
          {/* Version & Description */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-4">
              <span className="rounded bg-blue-500/20 px-2 py-1 text-sm font-medium text-blue-300">
                {data.version}
              </span>
              <span className="text-zinc-300">{data.description}</span>
            </div>
          </div>

          {/* Endpoint Groups */}
          {data.endpoints && typeof data.endpoints === 'object' && !Array.isArray(data.endpoints) ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(data.endpoints).map(([group, endpoints]) => (
                <EndpointGroup key={group} title={group} endpoints={endpoints as string[]} />
              ))}
            </div>
          ) : null}

          {/* Quick Test */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold">Quick Test</h2>
            <p className="mt-2 text-sm text-zinc-300">Try these curl commands:</p>
            <div className="mt-4 space-y-3">
              {[
                `curl -s ${baseUrl}/health | jq`,
                `curl -s ${baseUrl}/api/v1/categories | jq`,
                `curl -s ${baseUrl}/api/v1/providers | jq`,
                `curl -s ${baseUrl}/api/v1/intents | jq`,
              ].map((cmd) => (
                <div key={cmd} className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-950 px-3 py-2">
                  <code className="text-xs text-zinc-200 overflow-x-auto">{cmd}</code>
                  <CopyButton text={cmd} />
                </div>
              ))}
            </div>
          </div>

          {/* Raw Response */}
          <details className="rounded-xl border border-white/10 bg-white/5 p-6">
            <summary className="cursor-pointer text-sm font-medium text-zinc-200">Raw /api/v1 Response</summary>
            <pre className="mt-4 overflow-auto rounded-lg border border-white/10 bg-zinc-950 p-4 text-xs text-zinc-200">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </>
      ) : !error ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-zinc-300">Loading API index…</div>
      ) : null}
    </div>
  )
}
