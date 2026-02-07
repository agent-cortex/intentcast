import React from 'react'
import { NavLink, Route, Routes, Link } from 'react-router-dom'
import Landing from './pages/Landing'
import DirectoryHome from './pages/directory/DirectoryHome'
import Categories from './pages/directory/Categories'
import Providers from './pages/directory/Providers'
import ProviderDetail from './pages/directory/ProviderDetail'
import Intents from './pages/directory/Intents'
import IntentDetail from './pages/directory/IntentDetail'
import DocsHome from './pages/docs/DocsHome'
import DocsApi from './pages/docs/DocsApi'
import DocsFlows from './pages/docs/DocsFlows'
import GettingStarted from './pages/docs/GettingStarted'
import Status from './pages/Status'
import LiveApi from './pages/LiveApi'

function TopNav() {
  const baseLink =
    'rounded-md px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
  const active = 'bg-white/10 text-white'

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 rounded bg-zinc-900 px-3 py-2 text-white">
        Skip to content
      </a>
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-400" aria-hidden="true" />
          <span className="font-semibold tracking-tight text-white">IntentCast</span>
        </NavLink>
        <nav className="flex items-center gap-1" aria-label="Primary">
          <NavLink to="/directory" className={({ isActive }) => `${baseLink} ${isActive ? active : ''}`}>Directory</NavLink>
          <NavLink to="/docs" className={({ isActive }) => `${baseLink} ${isActive ? active : ''}`}>Docs</NavLink>
          <NavLink to="/explorer" className={({ isActive }) => `${baseLink} ${isActive ? active : ''}`}>API</NavLink>
          <NavLink to="/status" className={({ isActive }) => `${baseLink} ${isActive ? active : ''}`}>Status</NavLink>
          <a
            className={baseLink}
            href="https://github.com/agent-cortex/intentcast"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <TopNav />
      <main id="main" className="mx-auto max-w-6xl px-4 py-10">
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/directory" element={<DirectoryHome />} />
          <Route path="/directory/categories" element={<Categories />} />
          <Route path="/directory/providers" element={<Providers />} />
          <Route path="/directory/providers/:providerId" element={<ProviderDetail />} />
          <Route path="/directory/intents" element={<Intents />} />
          <Route path="/directory/intents/:intentId" element={<IntentDetail />} />

          <Route path="/docs" element={<DocsHome />} />
          <Route path="/docs/getting-started" element={<GettingStarted />} />
          <Route path="/docs/api" element={<DocsApi />} />
          <Route path="/docs/flows" element={<DocsFlows />} />

          <Route path="/explorer" element={<LiveApi />} />
          <Route path="/status" element={<Status />} />

          <Route
            path="*"
            element={
              <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                <h1 className="text-xl font-semibold">Not found</h1>
                <p className="mt-2 text-zinc-300">That page doesn't exist.</p>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto max-w-6xl px-4 text-sm text-zinc-400">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p>IntentCast — Monetization middleware for AI agents. Earn USDC via x402 on Base.</p>
            <Link className="text-blue-400 hover:text-blue-300" to="/explorer">API Explorer →</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
