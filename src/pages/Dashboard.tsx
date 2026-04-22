import { useState, useEffect } from 'react'
import { Shield, KeyRound, Sparkles, Loader2, Copy, Check, LogOut,
         Hash, Zap, Star, ShieldCheck, Briefcase, Users, MessageSquare,
         TrendingUp, Activity } from 'lucide-react'
import { useTrust } from '../store/trustStore'
import { useToast } from '../components/Toast'
import { generateProof, formatProofId, ProofType } from '../crypto/zkp'

interface EarnAction {
  id: string
  label: string
  description: string
  delta: number
  icon: React.ReactNode
  cooldown: number      // ms before usable again
  type: ProofType
  witness: string
}

const EARN_ACTIONS: EarnAction[] = [
  {
    id: 'vouch',
    label: 'Get vouched',
    description: 'Existing high-trust user signed a vouch attestation',
    delta: 12,
    icon: <Users className="w-4 h-4" />,
    cooldown: 8000,
    type: 'membership',
    witness: 'vouch_received',
  },
  {
    id: 'trade',
    label: 'Complete trade',
    description: 'PeerMarket trade completed, no disputes',
    delta: 8,
    icon: <Briefcase className="w-4 h-4" />,
    cooldown: 5000,
    type: 'trust-threshold',
    witness: 'trade_complete',
  },
  {
    id: 'review',
    label: 'Write review',
    description: 'Positive community review, upvote verified',
    delta: 4,
    icon: <MessageSquare className="w-4 h-4" />,
    cooldown: 3000,
    type: 'membership',
    witness: 'review_posted',
  },
  {
    id: 'verify_device',
    label: 'Verify device',
    description: 'Secure Enclave device attestation confirmed',
    delta: 20,
    icon: <Shield className="w-4 h-4" />,
    cooldown: 15000,
    type: 'humanity',
    witness: 'device_attested',
  },
  {
    id: 'contribute',
    label: 'Open-source commit',
    description: 'Signed commit merged into a public repo',
    delta: 6,
    icon: <Star className="w-4 h-4" />,
    cooldown: 4000,
    type: 'membership',
    witness: 'commit_merged',
  },
  {
    id: 'resolve',
    label: 'Resolve dispute',
    description: 'Acted as arbitrator, outcome accepted by both parties',
    delta: 15,
    icon: <ShieldCheck className="w-4 h-4" />,
    cooldown: 10000,
    type: 'no-prior-ban',
    witness: 'dispute_resolved',
  },
]

// SVG sparkline from an array of numbers
function Sparkline({ values, height = 40 }: { values: number[]; height?: number }) {
  if (values.length < 2) return null
  const w = 260, h = height
  const max = Math.max(...values, 1)
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * (h - 4)}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#22c55e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${h} ${pts} ${w},${h}`}
        fill="url(#spark-fill)"
        stroke="none"
      />
      <polyline
        points={pts}
        fill="none"
        stroke="#4ade80"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={(values.length - 1) / (values.length - 1) * w}
        cy={h - (values[values.length - 1] / max) * (h - 4)}
        r="3"
        fill="#4ade80"
      />
    </svg>
  )
}

export default function Dashboard() {
  const trust = useTrust()
  const { identity, proofs, attestations, trustScore } = trust
  const { toast } = useToast()

  const [cooldowns, setCooldowns]   = useState<Record<string, number>>({})
  const [busy, setBusy]             = useState<string | null>(null)
  const [copied, setCopied]         = useState(false)
  const [scoreHistory, setScoreHistory] = useState<number[]>([0])
  const [tab, setTab]               = useState<'proofs' | 'attestations'>('attestations')

  // Keep a rolling history of trust score for sparkline
  useEffect(() => {
    setScoreHistory(prev => {
      const next = [...prev, trustScore].slice(-20)
      return next
    })
  }, [trustScore])

  // Tick down cooldowns
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      setCooldowns(prev => {
        const next = { ...prev }
        let changed = false
        for (const k of Object.keys(next)) {
          if (next[k] <= now) { delete next[k]; changed = true }
        }
        return changed ? next : prev
      })
    }, 200)
    return () => clearInterval(id)
  }, [])

  async function earnTrust(action: EarnAction) {
    if (!identity || cooldowns[action.id]) return
    setBusy(action.id)

    try {
      const proof = await generateProof(action.type, action.witness, identity.publicKeyHex, action.label)
      trust.addProof(proof)
      trust.addAttestation({
        id: crypto.randomUUID(),
        action: action.id,
        delta: action.delta,
        timestamp: Date.now(),
        issuer: 'trustnet-attester-v1',
      })
      setCooldowns(prev => ({ ...prev, [action.id]: Date.now() + action.cooldown }))
      toast('success', `+${action.delta} trust earned`, action.description)
    } finally {
      setBusy(null)
    }
  }

  function copyPk() {
    if (!identity) return
    navigator.clipboard.writeText(identity.publicKeyHex)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
    toast('info', 'Public key copied')
  }

  function handleReset() {
    if (confirm('Permanently delete your identity? This cannot be undone.')) {
      trust.reset()
      toast('error', 'Identity reset', 'All proofs and attestations cleared.')
    }
  }

  if (!identity) return null

  const ringOffset = 283 - (283 * Math.min(trustScore, 100)) / 100
  const levelLabel =
    trustScore >= 80 ? 'Elite'
    : trustScore >= 60 ? 'Established'
    : trustScore >= 40 ? 'Trusted'
    : trustScore >= 20 ? 'Newcomer'
    : 'Unverified'

  const levelColor =
    trustScore >= 80 ? 'text-trust-300'
    : trustScore >= 60 ? 'text-emerald-400'
    : trustScore >= 40 ? 'text-amber-400'
    : trustScore >= 20 ? 'text-slate-300'
    : 'text-slate-500'

  return (
    <div className="pt-24 pb-24 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="section-tag mb-3">
              <Activity className="w-3.5 h-3.5" /> TRUST DASHBOARD
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-100">Your Identity</h1>
            <p className="text-slate-400 mt-1">
              <span className={`font-semibold ${levelColor}`}>{levelLabel}</span>
              {' · '}fingerprint: <span className="font-mono text-trust-400/70 text-sm">{identity.keyFingerprint.slice(0, 16)}</span>
            </p>
          </div>
          <button onClick={handleReset} className="btn-danger flex items-center gap-2 self-start sm:self-auto">
            <LogOut className="w-3.5 h-3.5" /> Reset identity
          </button>
        </div>

        {/* Top: Trust ring + identity + sparkline */}
        <div className="grid lg:grid-cols-3 gap-4 mb-8">

          {/* Trust ring */}
          <div className="card flex flex-col items-center justify-center py-8">
            <div className="relative w-52 h-52">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(51,65,85,0.3)" strokeWidth="3" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="url(#trustG)" strokeWidth="4"
                        strokeDasharray="264" strokeDashoffset={264 - (264 * Math.min(trustScore, 100)) / 100}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
                <defs>
                  <linearGradient id="trustG" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%"   stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#86efac" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-6xl font-black text-trust-400 font-mono leading-none glow-text">
                  {trustScore}
                </div>
                <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-2">Trust Score</div>
                <div className={`text-sm font-semibold mt-1 ${levelColor}`}>{levelLabel}</div>
              </div>
            </div>
            <div className="text-xs text-slate-500 font-mono mt-3 text-center">
              {attestations.length} attestation{attestations.length !== 1 ? 's' : ''} · {proofs.length} proof{proofs.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Identity + Sparkline */}
          <div className="card lg:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <KeyRound className="w-4 h-4 text-trust-400" />
              <h2 className="font-semibold text-slate-100">Device Identity</h2>
              <span className="ml-auto proof-badge"><Shield className="w-3 h-3" /> ECDSA P-256</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Public Key</div>
                <div className="flex items-center gap-2">
                  <code className="hex-text flex-1 bg-void-950/60 border border-void-800/60 rounded-xl p-2.5 text-[11px] break-all leading-relaxed">
                    {identity.publicKeyHex}
                  </code>
                  <button onClick={copyPk} className="btn-ghost py-2 px-3 text-xs rounded-xl">
                    {copied ? <Check className="w-3.5 h-3.5 text-trust-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Fingerprint</div>
                  <code className="hex-text">{identity.keyFingerprint}</code>
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Created</div>
                  <code className="hex-text">{new Date(identity.createdAt).toLocaleString()}</code>
                </div>
              </div>

              {/* Score history sparkline */}
              {scoreHistory.length > 1 && (
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" /> Trust history
                  </div>
                  <Sparkline values={scoreHistory} />
                </div>
              )}

              <div className="pt-3 border-t border-white/[0.05] text-xs text-slate-500">
                <span className="text-amber-400">⚠</span>{' '}
                Private key stored in browser crypto. Clearing site data removes it permanently.
              </div>
            </div>
          </div>
        </div>

        {/* Earn trust grid */}
        <div className="card mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-4 h-4 text-trust-400" />
            <h2 className="font-semibold text-slate-100">Earn trust</h2>
            <span className="text-xs text-slate-500 font-mono ml-1">— each action issues a signed attestation + ZK proof</span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EARN_ACTIONS.map(action => {
              const onCooldown = Boolean(cooldowns[action.id])
              const isBusy = busy === action.id
              const remaining = onCooldown
                ? Math.max(0, Math.ceil((cooldowns[action.id] - Date.now()) / 1000))
                : 0

              return (
                <button
                  key={action.id}
                  onClick={() => earnTrust(action)}
                  disabled={onCooldown || isBusy !== false}
                  className={`relative text-left p-4 rounded-xl border transition-all duration-200 group
                    ${onCooldown || isBusy
                      ? 'border-void-800/40 bg-void-950/30 opacity-50 cursor-not-allowed'
                      : 'border-void-700/50 bg-void-900/40 hover:border-trust-500/50 hover:bg-trust-950/20 active:scale-95'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                      ${onCooldown ? 'bg-void-800 text-slate-600' : 'bg-trust-500/10 border border-trust-500/30 text-trust-400'}`}>
                      {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-200 group-hover:text-trust-300 transition-colors">
                          {action.label}
                        </span>
                        <span className={`text-xs font-bold font-mono shrink-0
                          ${onCooldown ? 'text-slate-500' : 'text-trust-400'}`}>
                          {onCooldown ? `${remaining}s` : `+${action.delta}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{action.description}</p>
                    </div>
                  </div>

                  {onCooldown && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl bg-void-800 overflow-hidden">
                      <div
                        className="h-full bg-trust-700/50 transition-all duration-200"
                        style={{
                          width: `${100 - (remaining / (action.cooldown / 1000)) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Generate ZK proof */}
        <div className="card mb-8">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-4 h-4 text-trust-400" />
            <h2 className="font-semibold text-slate-100">Generate ZK proof</h2>
            <span className="text-xs text-slate-500 font-mono ml-1">— prove a predicate without revealing data</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {([
              { type: 'humanity'        as const, label: 'I am human',    witness: 'verified_human' },
              { type: 'trust-threshold' as const, label: `Trust ≥ ${trustScore}`, witness: String(trustScore) },
              { type: 'age-range'       as const, label: 'Age 18–99',     witness: '25' },
              { type: 'no-prior-ban'    as const, label: 'Never banned',  witness: 'clean_record' },
            ]).map(p => (
              <button
                key={p.label}
                onClick={async () => {
                  if (!identity) return
                  setBusy(p.label)
                  try {
                    const proof = await generateProof(p.type, p.witness, identity.publicKeyHex, p.label)
                    trust.addProof(proof)
                    toast('success', 'Proof generated', `${formatProofId(proof.id)}`)
                  } finally { setBusy(null) }
                }}
                disabled={busy === p.label}
                className="p-3 rounded-xl border border-void-700/50 hover:border-trust-500/50
                           bg-void-900/40 hover:bg-trust-950/20 text-left transition-all active:scale-95
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  {busy === p.label
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-trust-400" />
                    : <Hash    className="w-3.5 h-3.5 text-trust-400" />}
                  <span className="text-sm font-medium text-slate-200">{p.label}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">{p.type}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Proofs / Attestations tabs */}
        <div className="card">
          <div className="flex items-center gap-1 border-b border-white/[0.06] -mx-6 px-6 mb-5">
            {(['attestations', 'proofs'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg -mb-px transition-colors
                  ${tab === t
                    ? 'border-b-2 border-trust-500 text-trust-300'
                    : 'text-slate-500 hover:text-slate-300'}`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
                <span className="ml-2 text-xs text-slate-600 font-mono">
                  {t === 'attestations' ? attestations.length : proofs.length}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {tab === 'attestations' && (
              attestations.length === 0
                ? <Empty />
                : [...attestations].reverse().map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-void-950/40 border border-void-800/50 hover:border-void-700/60 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-trust-500/10 border border-trust-500/20 flex items-center justify-center shrink-0">
                        <Zap className="w-3.5 h-3.5 text-trust-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-200 font-mono truncate">{a.action}</div>
                        <div className="text-[11px] text-slate-500 truncate">by {a.issuer} · {new Date(a.timestamp).toLocaleString()}</div>
                      </div>
                      <span className="text-trust-400 font-bold font-mono shrink-0">+{a.delta}</span>
                    </div>
                  ))
            )}

            {tab === 'proofs' && (
              proofs.length === 0
                ? <Empty />
                : [...proofs].reverse().map(p => (
                    <div key={p.id} className="p-3 rounded-xl bg-void-950/40 border border-void-800/50 hover:border-trust-700/30 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <code className="text-xs text-trust-400 font-mono">{formatProofId(p.id)}</code>
                        <span className="text-[10px] font-mono text-slate-500">{new Date(p.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-sm text-slate-300 mb-1.5">{p.statement}</div>
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="proof-badge">{p.type}</span>
                        <span className="text-slate-600">commit: {p.commitment.slice(0, 16)}…</span>
                      </div>
                    </div>
                  ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Empty() {
  return <div className="text-center py-12 text-slate-600 text-sm">Nothing here yet.</div>
}
