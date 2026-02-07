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
    'rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2775CA] transition-colors'
  const active = 'bg-[#2775CA]/10 text-white'

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 rounded bg-zinc-900 px-3 py-2 text-white">
        Skip to content
      </a>
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
        <NavLink to="/" className="flex items-center gap-2.5 group">
          {/* USDC-inspired logo mark */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2775CA] to-[#2775CA]/80 shadow-lg shadow-[#2775CA]/20 group-hover:shadow-[#2775CA]/40 transition-all">
            <span className="text-sm font-bold text-white">IC</span>
          </div>
          <span className="font-semibold tracking-tight text-white">IntentCast</span>
        </NavLink>
        <nav className="flex items-center gap-1" aria-label="Primary">
          <NavLink to="/directory" className={({ isActive }) => `${baseLink} ${isActive ? active : ''}`}>Directory</NavLink>
          <NavLink to="/docs" className={({ isActive }) => `${baseLink} ${isActive ? active : ''}`}>Docs</NavLink>
          <NavLink to="/explorer" className={({ isActive }) => `${baseLink} ${isActive ? active : ''}`}>API</NavLink>
          <NavLink to="/status" className={({ isActive }) => `${baseLink} ${isActive ? active : ''}`}>Status</NavLink>
          <a
            className={`${baseLink} flex items-center gap-1.5`}
            href="https://github.com/agent-cortex/intentcast"
            target="_blank"
            rel="noreferrer"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span className="hidden sm:inline">GitHub</span>
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
      <main id="main" className="mx-auto max-w-6xl px-4 py-12">
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
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
                <h1 className="text-xl font-semibold">Not found</h1>
                <p className="mt-2 text-zinc-400">That page doesn't exist.</p>
                <Link to="/" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#2775CA] hover:text-[#2775CA]/80">
                  Go home
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="border-t border-white/10 py-12 mt-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2775CA] to-[#2775CA]/80">
                <span className="text-xs font-bold text-white">IC</span>
              </div>
              <div>
                <p className="font-medium text-zinc-200">IntentCast</p>
                <p className="text-sm text-zinc-500">Monetization middleware for AI agents. Earn USDC via x402 on Base.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://x402.org" target="_blank" rel="noreferrer" className="text-sm text-zinc-400 hover:text-[#2775CA] transition-colors">
                x402 Protocol
              </a>
              <Link className="text-sm font-medium text-[#2775CA] hover:text-[#2775CA]/80 transition-colors" to="/explorer">
                API Explorer →
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span>Powered by</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2775CA]/10 px-2.5 py-1 text-[#2775CA] font-medium">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
              USDC
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#26A17B]/10 px-2.5 py-1 text-[#26A17B] font-medium">
              Base
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
