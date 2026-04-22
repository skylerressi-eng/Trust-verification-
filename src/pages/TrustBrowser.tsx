import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Globe, ArrowLeft, RotateCw, Lock, CreditCard, ArrowRight, X, Home,
} from 'lucide-react'
import { useTrust } from '../store/trustStore'

const QUICK_LINKS = [
  { label: 'Example',       url: 'https://example.com',                     icon: '🌐' },
  { label: 'Wikipedia',     url: 'https://en.wikipedia.org/wiki/Main_Page', icon: '📖' },
  { label: 'OpenStreetMap', url: 'https://www.openstreetmap.org',           icon: '🗺️' },
  { label: 'MDN Docs',      url: 'https://developer.mozilla.org',           icon: '📚' },
  { label: 'HackerNews',    url: 'https://news.ycombinator.com',            icon: '🔶' },
  { label: 'Internet Archive', url: 'https://archive.org',                  icon: '🏛️' },
  { label: 'DuckDuckGo',    url: 'https://duckduckgo.com',                  icon: '🦆' },
  { label: 'W3Schools',     url: 'https://www.w3schools.com',               icon: '🎓' },
]

function Paywall() {
  return (
    <div className="pt-28 pb-20 px-4 min-h-screen flex items-start justify-center">
      <div className="max-w-md w-full text-center card py-12">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-5"
             style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Lock className="w-7 h-7 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Trust Browser</h2>
        <p className="text-slate-400 leading-relaxed mb-2">
          Browse the web with your TrustNet identity — no tracking, no ads, no accounts.
        </p>
        <p className="text-slate-500 text-sm mb-8">Requires an active TrustNet Premium subscription.</p>
        <Link to="/subscribe" className="btn-primary inline-flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Subscribe — $15 / month
        </Link>
      </div>
    </div>
  )
}

export default function TrustBrowser() {
  const { subscribed } = useTrust()
  const [url, setUrl]           = useState('')
  const [inputUrl, setInputUrl] = useState('')
  const [loading, setLoading]   = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  if (!subscribed) return <Paywall />

  function navigateTo(dest: string) {
    let target = dest.trim()
    if (!target) return
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target
    setUrl(target)
    setInputUrl(target)
    setLoading(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    navigateTo(inputUrl)
  }

  function refresh() {
    const cur = url
    setUrl('')
    requestAnimationFrame(() => setUrl(cur))
    setLoading(true)
  }

  function goBack() {
    try { iframeRef.current?.contentWindow?.history.go(-1) } catch { /* cross-origin */ }
  }

  return (
    <div className="pt-14 flex flex-col" style={{ height: '100vh' }}>

      {/* Browser chrome */}
      <div className="border-b border-void-800 bg-void-950/95 backdrop-blur-sm px-3 py-2 flex items-center gap-2 shrink-0">
        <button onClick={goBack}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button onClick={refresh}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-colors">
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button onClick={() => { setUrl(''); setInputUrl('') }}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-colors">
          <Home className="w-4 h-4" />
        </button>

        <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-void-900/80 border border-void-700/60 rounded-xl px-3 py-1.5 focus-within:border-trust-500/50 transition-colors">
            {url
              ? <Lock className="w-3 h-3 text-trust-400 shrink-0" />
              : <Globe className="w-3 h-3 text-slate-500 shrink-0" />}
            <input
              className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600 font-mono"
              placeholder="Search or enter a URL…"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              spellCheck={false}
            />
            {inputUrl && (
              <button type="button" onClick={() => setInputUrl('')} className="text-slate-600 hover:text-slate-400 transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button type="submit"
            className="p-2 rounded-lg bg-trust-500/10 border border-trust-500/30 text-trust-400 hover:bg-trust-500/20 transition-colors">
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Viewport */}
      <div className="flex-1 relative overflow-hidden">
        {!url ? (
          <div className="h-full bg-void-950 flex flex-col items-center justify-center px-6 overflow-y-auto py-12">
            <div className="text-center mb-10">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
                   style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(8,14,26,0.6))', border: '1px solid rgba(34,197,94,0.3)' }}>
                <Globe className="w-7 h-7 text-trust-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-1">Trust Browser</h2>
              <p className="text-slate-500 text-sm max-w-sm">Your private window to the web — identity stays on your device.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl w-full">
              {QUICK_LINKS.map(l => (
                <button
                  key={l.url}
                  onClick={() => navigateTo(l.url)}
                  className="card text-center py-4 px-2 hover:border-trust-600/40 hover:-translate-y-0.5 transition-all duration-150"
                >
                  <div className="text-2xl mb-2">{l.icon}</div>
                  <div className="text-xs font-medium text-slate-300">{l.label}</div>
                </button>
              ))}
            </div>

            <p className="mt-8 text-[11px] text-slate-600 font-mono text-center max-w-sm">
              Note: many sites block iframe embedding. If a page appears blank, use "Open in new tab ↗" in the status bar.
            </p>
          </div>
        ) : (
          <>
            {loading && (
              <div className="absolute top-0 left-0 right-0 z-10 h-0.5 overflow-hidden">
                <div className="h-full bg-trust-500" style={{ width: '70%', animation: 'shimmer 1.5s infinite' }} />
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={url}
              className="w-full h-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              onLoad={() => setLoading(false)}
              title="Trust Browser"
            />
          </>
        )}
      </div>

      {/* Status bar */}
      {url && (
        <div className="shrink-0 border-t border-void-800/60 bg-void-950/90 px-4 py-1 flex items-center justify-between text-[10px] font-mono text-slate-600">
          <span className="flex items-center gap-1.5">
            <Lock className="w-2.5 h-2.5 text-trust-400" />
            trustnet-verified session · identity not shared
          </span>
          <a href={url} target="_blank" rel="noopener noreferrer"
             className="hover:text-trust-400 transition-colors">
            Open in new tab ↗
          </a>
        </div>
      )}
    </div>
  )
}
