import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  Shield, Terminal, LayoutDashboard, BookOpen, FlaskConical,
  Bot, Menu, X, Globe, CreditCard,
} from 'lucide-react'
import { useTrust } from '../store/trustStore'

export default function Navbar() {
  const { pathname } = useLocation()
  const { registered, trustScore, humanityVerified, subscribed, displayName } = useTrust()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { to: '/architecture', label: 'Architecture', icon: <BookOpen     className="w-3.5 h-3.5" /> },
    { to: '/playground',   label: 'Playground',   icon: <FlaskConical className="w-3.5 h-3.5" /> },
    { to: '/sybil',        label: 'Sybil Demo',   icon: <Bot          className="w-3.5 h-3.5" /> },
    { to: '/login',        label: 'Login Demo',   icon: <Terminal     className="w-3.5 h-3.5" /> },
    ...(registered ? [{ to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> }] : []),
    ...(registered && !subscribed ? [{ to: '/subscribe', label: 'Subscribe', icon: <CreditCard className="w-3.5 h-3.5" /> }] : []),
    ...(subscribed ? [{ to: '/browser', label: 'Trust Browser', icon: <Globe className="w-3.5 h-3.5" /> }] : []),
  ]

  const navLink = (to: string, label: string, icon: React.ReactNode, onClick?: () => void) => (
    <Link
      key={to}
      to={to}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150
        ${pathname === to
          ? 'text-trust-300 bg-trust-500/10 border border-trust-500/20 shadow-inner shadow-trust-500/5'
          : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'}`}
    >
      {icon}{label}
    </Link>
  )

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]"
           style={{ background: 'linear-gradient(180deg, rgba(8,14,26,0.95) 0%, rgba(8,14,26,0.85) 100%)', backdropFilter: 'blur(24px)' }}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                 style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(74,222,128,0.1))', border: '1px solid rgba(34,197,94,0.3)', boxShadow: '0 0 12px rgba(34,197,94,0.15)' }}>
              <Shield className="w-4 h-4 text-trust-400" />
            </div>
            <span className="font-black text-slate-100 tracking-tight">
              Trust<span className="bg-gradient-to-r from-trust-400 to-emerald-300 bg-clip-text text-transparent">Net</span>
            </span>
            <span className="hidden sm:block text-[10px] font-mono text-slate-600 border border-void-700/50 px-1.5 py-0.5 rounded">v0.1</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navItems.map(n => navLink(n.to, n.label, n.icon))}
          </div>

          {/* Right: identity badge + CTA + hamburger */}
          <div className="flex items-center gap-2">
            {humanityVerified && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                   style={{ background: 'linear-gradient(135deg, rgba(5,46,22,0.5), rgba(8,14,26,0.5))', border: '1px solid rgba(34,197,94,0.3)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-trust-400 animate-pulse" />
                <span className="text-trust-300">
                  {displayName ? `@${displayName}` : `Trust ${trustScore}`}
                </span>
              </div>
            )}

            {registered ? (
              <Link to="/dashboard" className="btn-primary py-1.5 px-4 text-sm hidden sm:block">Dashboard</Link>
            ) : (
              <Link to="/register" className="btn-primary py-1.5 px-4 text-sm hidden sm:block">Get Started</Link>
            )}

            <button
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-void-950/80 backdrop-blur-sm" />
          <div
            className="absolute top-14 left-0 right-0 border-b border-white/[0.06] p-4 space-y-1"
            style={{ background: 'linear-gradient(180deg, rgba(8,14,26,0.98), rgba(8,14,26,0.95))' }}
            onClick={e => e.stopPropagation()}
          >
            {navItems.map(n => navLink(n.to, n.label, n.icon, () => setMobileOpen(false)))}
            <div className="pt-3 border-t border-white/[0.06]">
              {registered ? (
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="btn-primary py-2 px-4 text-sm w-full flex justify-center">Dashboard</Link>
              ) : (
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary py-2 px-4 text-sm w-full flex justify-center">Get Started</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
