import { Link, useLocation } from 'react-router-dom'
import { Shield, Terminal, LayoutDashboard, BookOpen, FlaskConical } from 'lucide-react'
import { useTrust } from '../store/trustStore'

export default function Navbar() {
  const { pathname } = useLocation()
  const { registered, trustScore, humanityVerified } = useTrust()

  const link = (to: string, label: string, icon: React.ReactNode) => (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150
        ${pathname === to
          ? 'text-trust-400 bg-trust-500/10 border border-trust-500/20'
          : 'text-slate-400 hover:text-slate-200 hover:bg-void-800'}`}
    >
      {icon}
      {label}
    </Link>
  )

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-void-800/80 bg-void-950/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-trust-500/10 border border-trust-500/30 flex items-center justify-center
                          group-hover:border-trust-400/60 transition-colors duration-200">
            <Shield className="w-4 h-4 text-trust-400" />
          </div>
          <span className="font-bold text-slate-100 tracking-tight">Trust<span className="text-trust-400">Net</span></span>
        </Link>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {link('/architecture', 'Architecture', <BookOpen className="w-3.5 h-3.5" />)}
          {link('/playground',   'Playground',   <FlaskConical className="w-3.5 h-3.5" />)}
          {link('/login',        'Login Demo',   <Terminal  className="w-3.5 h-3.5" />)}
          {registered && link('/dashboard', 'Dashboard', <LayoutDashboard className="w-3.5 h-3.5" />)}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {humanityVerified && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-trust-900/40
                            border border-trust-700/40 text-trust-300 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-trust-400 animate-pulse" />
              Trust {trustScore}
            </div>
          )}
          {registered ? (
            <Link to="/dashboard" className="btn-primary py-1.5 px-4 text-sm">Dashboard</Link>
          ) : (
            <Link to="/register" className="btn-primary py-1.5 px-4 text-sm">Get Started</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
