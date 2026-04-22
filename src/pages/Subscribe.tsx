import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  CreditCard, Check, Lock, Loader2, Zap, Globe, Shield,
  BarChart2, Download, User, ArrowRight,
} from 'lucide-react'
import { useTrust } from '../store/trustStore'
import { useToast } from '../components/Toast'

const FEATURES = [
  { icon: <Globe className="w-4 h-4" />,     label: 'Trust Browser',         sub: 'Browse the web with your TrustNet identity' },
  { icon: <Zap className="w-4 h-4" />,       label: '+15 Trust Bonus',        sub: 'Instant score boost on activation' },
  { icon: <Shield className="w-4 h-4" />,    label: 'Priority Verification',  sub: 'Faster humanity checks' },
  { icon: <BarChart2 className="w-4 h-4" />, label: 'Advanced Analytics',     sub: 'Full trust history + charts' },
  { icon: <Download className="w-4 h-4" />,  label: 'Proof Export',           sub: 'Download your ZK credentials as JSON' },
  { icon: <User className="w-4 h-4" />,      label: 'Custom Display Name',    sub: 'Vanity handle on your identity' },
]

function fmt4(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
}
function fmtExpiry(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

export default function Subscribe() {
  const { subscribed, setSubscribed, addAttestation } = useTrust()
  const { toast } = useToast()
  const nav = useNavigate()

  const [card, setCard]     = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc]       = useState('')
  const [name, setName]     = useState('')
  const [busy, setBusy]     = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Cardholder name is required'
    const raw = card.replace(/\s/g, '')
    if (raw.length !== 16 || !/^\d+$/.test(raw)) e.card = 'Enter a valid 16-digit card number'
    const [mm, yy] = expiry.split('/')
    const m = parseInt(mm ?? ''), y = parseInt(yy ?? '')
    const now = new Date()
    if (
      !mm || !yy || isNaN(m) || isNaN(y) ||
      m < 1 || m > 12 ||
      y + 2000 < now.getFullYear() ||
      (y + 2000 === now.getFullYear() && m < now.getMonth() + 1)
    ) e.expiry = 'Invalid expiry date'
    if (!/^\d{3,4}$/.test(cvc)) e.cvc = 'Enter a 3-digit CVC'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    setBusy(true)
    await new Promise(r => setTimeout(r, 2000))
    setSubscribed(true)
    addAttestation({
      id: crypto.randomUUID(),
      action: 'premium_subscription',
      delta: 15,
      timestamp: Date.now(),
      issuer: 'trustnet-billing-v1',
    })
    toast('success', 'Subscribed!', 'Trust Browser unlocked · +15 trust')
    nav('/browser')
  }

  if (subscribed) {
    return (
      <div className="pt-28 pb-20 px-4 min-h-screen flex items-start justify-center">
        <div className="max-w-md w-full card text-center py-12">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-5 glow-pulse"
               style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.2),rgba(74,222,128,0.1))', border: '2px solid rgba(34,197,94,0.5)' }}>
            <Check className="w-8 h-8 text-trust-300" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">You're Premium</h2>
          <p className="text-slate-400 mb-6">All premium features are active on your anonymous identity.</p>
          <Link to="/browser" className="btn-primary inline-flex items-center gap-2">
            Open Trust Browser <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-28 pb-24 px-4 relative z-10">
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-10">
          <div className="section-tag mb-4">
            <CreditCard className="w-3.5 h-3.5" /> TRUSTNET PREMIUM
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-100">
            Upgrade your identity
          </h1>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto">
            One plan. Private browsing, advanced analytics, and an instant trust boost.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* Feature list */}
          <div className="card">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-5xl font-black text-trust-400 font-mono">$15</span>
              <span className="text-slate-400 text-lg">/month</span>
            </div>
            <p className="text-slate-500 text-sm mb-6">Cancel anytime · no tracking · no ads.</p>

            <ul className="space-y-3.5">
              {FEATURES.map(f => (
                <li key={f.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-trust-500/10 border border-trust-500/30 flex items-center justify-center shrink-0 text-trust-400 mt-0.5">
                    {f.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-200">{f.label}</div>
                    <div className="text-xs text-slate-500">{f.sub}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment form */}
          <form onSubmit={handleSubmit} className="card space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-trust-400" />
              <h2 className="font-semibold text-slate-100">Payment details</h2>
              <span className="ml-auto text-[10px] font-mono text-slate-500">demo only · no charge</span>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Cardholder name</label>
              <input className="input" placeholder="Jane Smith" value={name}
                onChange={e => setName(e.target.value)} />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Card number</label>
              <div className="relative">
                <input className="input pr-10" placeholder="4242 4242 4242 4242" value={card}
                  onChange={e => setCard(fmt4(e.target.value))} />
                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
              </div>
              {errors.card && <p className="text-xs text-red-400 mt-1">{errors.card}</p>}
              <p className="text-[10px] text-slate-600 mt-1 font-mono">Test card: 4242 4242 4242 4242</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Expiry</label>
                <input className="input" placeholder="MM/YY" value={expiry}
                  onChange={e => setExpiry(fmtExpiry(e.target.value))} />
                {errors.expiry && <p className="text-xs text-red-400 mt-1">{errors.expiry}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">CVC</label>
                <input className="input" placeholder="123" value={cvc}
                  onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} />
                {errors.cvc && <p className="text-xs text-red-400 mt-1">{errors.cvc}</p>}
              </div>
            </div>

            <button type="submit" disabled={busy} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {busy
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing payment…</>
                : <><Lock className="w-4 h-4" /> Subscribe — $15 / month</>}
            </button>

            <p className="text-center text-[10px] text-slate-600 font-mono">
              This is a demo — no real payment will be processed.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
