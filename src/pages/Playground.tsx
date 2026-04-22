import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FlaskConical, Shield, Loader2, Sparkles, Check, X, ArrowRight,
  Globe, ShoppingBag, Users, GraduationCap, Copy, AlertTriangle,
} from 'lucide-react'
import { useTrust } from '../store/trustStore'
import { generateProof, verifyProof, formatProofId, ProofType } from '../crypto/zkp'

// Sample third-party services with their predicate requirements.
// In reality each predicate would compile to a ZK circuit; here we simulate.
interface MockService {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  predicates: Array<{ type: ProofType; min?: number; label: string }>
  description: string
}

const SERVICES: MockService[] = [
  {
    id: 'forum',
    name: 'DecentralChat',
    icon: <Users className="w-5 h-5" />,
    color: 'violet',
    predicates: [
      { type: 'humanity',        label: 'Verified human' },
      { type: 'trust-threshold', min: 30, label: 'Trust ≥ 30' },
    ],
    description: 'A Discord-style community. Requires humanity + low trust to weed out bots.',
  },
  {
    id: 'market',
    name: 'PeerMarket',
    icon: <ShoppingBag className="w-5 h-5" />,
    color: 'amber',
    predicates: [
      { type: 'humanity',        label: 'Verified human' },
      { type: 'trust-threshold', min: 70, label: 'Trust ≥ 70' },
      { type: 'no-prior-ban',    label: 'No prior fraud ban' },
    ],
    description: 'A peer-to-peer marketplace. Higher trust bar, nullifier check for fraud history.',
  },
  {
    id: 'gated',
    name: '18+ Content',
    icon: <Globe className="w-5 h-5" />,
    color: 'red',
    predicates: [
      { type: 'humanity',  label: 'Verified human' },
      { type: 'age-range', label: 'Age ≥ 18' },
    ],
    description: 'Age-gated service. Proves age in range without revealing the exact number.',
  },
  {
    id: 'edu',
    name: 'OpenEdu DAO',
    icon: <GraduationCap className="w-5 h-5" />,
    color: 'cyan',
    predicates: [
      { type: 'humanity',   label: 'Verified human' },
      { type: 'membership', label: 'Member: verified-humans' },
    ],
    description: 'Educational collective. Membership proof gates voting rights.',
  },
]

interface ProofResult {
  predicate: string
  type: ProofType
  commitment: string
  challenge: string
  response: string
  verified: boolean
  duration: number
}

export default function Playground() {
  const { registered, identity, trustScore, humanityVerified, keyReady } = useTrust()
  const [selectedService, setSelectedService] = useState<string>('forum')
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<ProofResult[]>([])
  const [sessionGranted, setSessionGranted] = useState<boolean | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const svc = SERVICES.find(s => s.id === selectedService)!

  async function runHandshake() {
    if (!identity) return
    setRunning(true)
    setResults([])
    setSessionGranted(null)
    setSessionToken(null)

    const out: ProofResult[] = []
    let allOk = true

    try {
      for (const pred of svc.predicates) {
        const start = performance.now()

        const witness =
          pred.type === 'trust-threshold' ? String(trustScore) :
          pred.type === 'humanity'        ? 'verified_human' :
          pred.type === 'age-range'       ? '25' :
          pred.type === 'no-prior-ban'    ? 'clean_record' :
          'member_verified'

        const p = await generateProof(pred.type, witness, identity.publicKeyHex, String(pred.min ?? ''))
        const ok = await verifyProof(p, identity.publicKeyHex)

        let passes = ok
        if (pred.type === 'trust-threshold' && pred.min !== undefined) {
          passes = passes && trustScore >= pred.min
        }
        if (pred.type === 'humanity' && !humanityVerified) passes = false
        if (!passes) allOk = false

        out.push({
          predicate: pred.label,
          type: pred.type,
          commitment: p.commitment,
          challenge: p.challenge,
          response: p.response,
          verified: passes,
          duration: Math.round(performance.now() - start),
        })

        setResults([...out])
        await new Promise(r => setTimeout(r, 400))
      }

      setSessionGranted(allOk)
      if (allOk) {
        const tokBytes = crypto.getRandomValues(new Uint8Array(16))
        const tok = Array.from(tokBytes).map(b => b.toString(16).padStart(2, '0')).join('')
        setSessionToken(tok)
      }
    } catch {
      setSessionGranted(false)
    } finally {
      setRunning(false)
    }
  }

  if (!registered) {
    return (
      <div className="pt-28 pb-20 px-4 min-h-screen">
        <div className="max-w-lg mx-auto text-center card p-10">
          <FlaskConical className="w-10 h-10 text-slate-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Register first</h2>
          <p className="text-slate-400 mb-6">The Playground simulates logging into mock services with your TrustNet identity. You need an identity to proceed.</p>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2">
            Register <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  if (!keyReady) {
    return (
      <div className="pt-28 pb-20 px-4 min-h-screen">
        <div className="max-w-lg mx-auto text-center card">
          <Loader2 className="w-10 h-10 text-trust-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-slate-100 mb-2">Restoring keypair…</h2>
          <p className="text-slate-400 text-sm">Re-importing your private key from secure browser storage.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-28 pb-20 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-trust-900/30 border border-trust-700/40 text-trust-300 text-xs font-mono mb-4">
            <FlaskConical className="w-3 h-3" /> PLAYGROUND · PROOF INSPECTOR
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-100">
            Try logging in <span className="text-trust-400">without an account</span>
          </h1>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">
            Pick a mock service. Watch your client negotiate the predicates. Inspect the proofs byte-for-byte.
          </p>
        </div>

        {/* Service selector */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {SERVICES.map(s => {
            const active = s.id === selectedService
            return (
              <button
                key={s.id}
                onClick={() => { setSelectedService(s.id); setResults([]); setSessionGranted(null) }}
                className={`text-left p-4 rounded-xl border transition-all duration-150
                           ${active
                              ? 'border-trust-500/60 bg-trust-500/10 shadow-lg shadow-trust-500/5'
                              : 'border-void-700/50 bg-void-900/40 hover:border-trust-600/40'}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center
                                  ${active ? 'bg-trust-500/20 text-trust-300' : 'bg-void-800 text-slate-400'}`}>
                    {s.icon}
                  </div>
                  <div className="font-semibold text-slate-100">{s.name}</div>
                </div>
                <div className="text-[11px] text-slate-500 mt-2 leading-relaxed">{s.description}</div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {s.predicates.map(p => (
                    <span key={p.label} className="text-[10px] px-1.5 py-0.5 rounded bg-void-950/60 border border-void-700/60 text-slate-400 font-mono">
                      {p.label}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        {/* Main handshake panel */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Left: service simulator */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-trust-400" />
              <h2 className="font-semibold text-slate-100">{svc.name}</h2>
              <span className="ml-auto text-[10px] font-mono text-slate-500">mock service</span>
            </div>

            <div className="mb-4">
              <div className="text-xs font-mono text-slate-500 mb-2">REQUIRES</div>
              <ul className="space-y-1.5">
                {svc.predicates.map(p => (
                  <li key={p.label} className="flex items-center gap-2 text-sm text-slate-300">
                    <Shield className="w-3.5 h-3.5 text-trust-400 shrink-0" />
                    {p.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <div className="text-xs font-mono text-slate-500 mb-2">YOUR IDENTITY</div>
              <div className="space-y-1.5 text-xs">
                <StatRow label="humanity" value={humanityVerified ? 'verified' : 'unverified'} ok={humanityVerified} />
                <StatRow label="trust_score" value={String(trustScore)} ok={trustScore > 0} />
                <StatRow label="public_key" value={`${identity!.publicKeyHex.slice(0, 14)}…`} ok={true} />
              </div>
            </div>

            <button onClick={runHandshake} disabled={running} className="btn-primary w-full flex items-center justify-center gap-2">
              {running
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Negotiating…</>
                : <>Attempt login <ArrowRight className="w-4 h-4" /></>}
            </button>

            {sessionGranted === true && sessionToken && (
              <div className="mt-5 p-3 rounded-lg border border-trust-600/40 bg-trust-950/20 text-sm">
                <div className="flex items-center gap-2 text-trust-300 font-semibold mb-1">
                  <Check className="w-4 h-4" /> Session granted
                </div>
                <div className="flex items-center gap-2">
                  <code className="hex-text flex-1 truncate">session_{sessionToken}</code>
                  <button onClick={() => { navigator.clipboard.writeText(sessionToken); setCopied(true); setTimeout(() => setCopied(false), 1200) }}
                          className="text-slate-500 hover:text-trust-400">
                    {copied ? <Check className="w-3.5 h-3.5 text-trust-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
            {sessionGranted === false && (
              <div className="mt-5 p-3 rounded-lg border border-red-600/40 bg-red-950/20 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-red-300 font-semibold">Access denied</div>
                  <div className="text-xs text-slate-400">One or more predicates failed. Raise your trust score or verify humanity.</div>
                </div>
              </div>
            )}
          </div>

          {/* Right: proof inspector */}
          <div className="card lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-trust-400" />
              <h2 className="font-semibold text-slate-100">Proof bundle inspector</h2>
              <span className="ml-auto text-[10px] font-mono text-slate-500">byte-for-byte · never leaves browser</span>
            </div>

            {results.length === 0 && !running && (
              <div className="text-center py-16 text-slate-500">
                <FlaskConical className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <div className="text-sm">Run a login to see the proof bundle.</div>
              </div>
            )}

            <div className="space-y-3">
              {results.map((r, i) => (
                <div key={i} className={`rounded-lg border p-4 transition-colors ${
                  r.verified ? 'border-trust-700/40 bg-trust-950/10' : 'border-red-700/40 bg-red-950/10'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {r.verified
                      ? <Check className="w-4 h-4 text-trust-400" />
                      : <X     className="w-4 h-4 text-red-400" />}
                    <span className="font-semibold text-slate-100">{r.predicate}</span>
                    <span className="text-[10px] font-mono text-slate-500">{r.type}</span>
                    <span className="ml-auto text-[10px] font-mono text-slate-500">{r.duration}ms</span>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-2 text-xs font-mono">
                    <ByteField label="commit"    value={r.commitment} />
                    <ByteField label="challenge" value={r.challenge} />
                    <ByteField label="response"  value={r.response} />
                  </div>
                </div>
              ))}
              {running && (
                <div className="flex items-center gap-2 text-sm text-slate-400 p-4">
                  <Loader2 className="w-4 h-4 animate-spin text-trust-400" />
                  Generating next proof…
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footnote */}
        <div className="mt-10 text-center text-xs text-slate-500 font-mono">
          Every proof is a fresh interaction with a real challenge — no replay, no identity linkage across services.
        </div>
      </div>
    </div>
  )
}

function StatRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500 w-24">{label}</span>
      <span className={`font-mono ${ok ? 'text-trust-300' : 'text-amber-300'}`}>{value}</span>
    </div>
  )
}

function ByteField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-slate-500 text-[10px] mb-1">{label}</div>
      <div className="p-2 rounded bg-void-950/70 border border-void-800 text-trust-300/80 break-all overflow-hidden max-h-14">
        {value.slice(0, 40)}…
      </div>
    </div>
  )
}
