import { useState } from 'react'
import { Shield, KeyRound, Sparkles, Loader2, Plus, Copy, Check, LogOut, Hash } from 'lucide-react'
import { useTrust } from '../store/trustStore'
import { generateProof, formatProofId, ProofType } from '../crypto/zkp'

export default function Dashboard() {
  const trust = useTrust()
  const { identity, proofs, attestations, trustScore } = trust
  const [busy, setBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function mkProof(type: ProofType, witness: string, label: string) {
    if (!identity) return
    setBusy(label)
    try {
      const p = await generateProof(type, witness, identity.publicKeyHex, label)
      trust.addProof(p)
      trust.addAttestation({
        id: crypto.randomUUID(),
        action: `generated_proof:${type}`,
        delta: 5,
        timestamp: Date.now(),
        issuer: 'self',
      })
    } finally { setBusy(null) }
  }

  function copyPk() {
    if (!identity) return
    navigator.clipboard.writeText(identity.publicKeyHex)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (!identity) return null

  const ringPct = Math.min(trustScore, 100)
  const ringOffset = 283 - (283 * ringPct) / 100

  return (
    <div className="pt-24 pb-20 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Your Trust Dashboard</h1>
            <p className="text-slate-400 mt-1">Manage your proofs, attestations, and credentials.</p>
          </div>
          <button
            onClick={() => { if (confirm('Reset identity? This is irreversible.')) trust.reset() }}
            className="btn-ghost py-2 px-4 text-sm flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" /> Reset identity
          </button>
        </div>

        {/* Top: Trust ring + identity + stats */}
        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          {/* Trust ring */}
          <div className="card flex flex-col items-center justify-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(51,65,85,0.4)" strokeWidth="3" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="url(#trustGrad)" strokeWidth="3.5"
                        strokeDasharray="283" strokeDashoffset={ringOffset} strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
                <defs>
                  <linearGradient id="trustGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%"   stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#4ade80" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold text-trust-400 font-mono">{trustScore}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">TRUST SCORE</div>
              </div>
            </div>
            <div className="text-xs text-slate-500 font-mono mt-2 text-center">
              Composed from {attestations.length} signed attestation{attestations.length === 1 ? '' : 's'}
            </div>
          </div>

          {/* Identity card */}
          <div className="card lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-4 h-4 text-trust-400" />
              <h2 className="font-semibold text-slate-100">Device Identity</h2>
              <span className="ml-auto proof-badge"><Shield className="w-3 h-3" /> ECDSA P-256</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs font-mono text-slate-500 mb-1">PUBLIC KEY</div>
                <div className="flex items-center gap-2">
                  <code className="hex-text flex-1 bg-void-950 border border-void-800 rounded p-2">
                    {identity.publicKeyHex}
                  </code>
                  <button onClick={copyPk} className="btn-ghost py-2 px-3 text-xs">
                    {copied ? <Check className="w-3.5 h-3.5 text-trust-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-mono text-slate-500 mb-1">FINGERPRINT</div>
                  <code className="hex-text">{identity.keyFingerprint}</code>
                </div>
                <div>
                  <div className="text-xs font-mono text-slate-500 mb-1">CREATED</div>
                  <code className="hex-text">{new Date(identity.createdAt).toLocaleString()}</code>
                </div>
              </div>

              <div className="pt-2 border-t border-void-800 text-xs text-slate-500">
                <span className="text-amber-400">⚠</span> Your private key lives in browser-secure storage.
                Wiping this origin or resetting clears it forever.
              </div>
            </div>
          </div>
        </div>

        {/* Generate proofs */}
        <div className="card mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-trust-400" />
            <h2 className="font-semibold text-slate-100">Generate a new proof</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { type: 'humanity' as const,         label: 'I am human',       witness: 'humanity_ok' },
              { type: 'trust-threshold' as const,  label: 'Trust ≥ 80',       witness: String(trustScore) },
              { type: 'age-range' as const,        label: 'Age 18-99',        witness: '25' },
              { type: 'no-prior-ban' as const,     label: 'Never banned',     witness: 'clean_record' },
            ].map(p => (
              <button
                key={p.label}
                onClick={() => mkProof(p.type, p.witness, p.label)}
                disabled={busy === p.label}
                className="p-3 rounded-lg border border-void-700 hover:border-trust-500/50 bg-void-900/40
                           text-left transition-all duration-150 active:scale-95 disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  {busy === p.label
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-trust-400" />
                    : <Plus className="w-3.5 h-3.5 text-trust-400" />}
                  <span className="text-sm font-medium text-slate-200">{p.label}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">{p.type}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Proofs + attestations */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Proofs */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-trust-400" />
                <h2 className="font-semibold text-slate-100">Zero-Knowledge Proofs</h2>
              </div>
              <span className="text-xs font-mono text-slate-500">{proofs.length} total</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {proofs.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-sm">No proofs yet.</div>
              )}
              {[...proofs].reverse().map(p => (
                <div key={p.id} className="p-3 rounded-lg bg-void-950/50 border border-void-800 hover:border-trust-700/40 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-xs text-trust-400 font-mono">{formatProofId(p.id)}</code>
                    <span className="text-[10px] font-mono text-slate-500">{new Date(p.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-sm text-slate-300 mb-1">{p.statement}</div>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="proof-badge">{p.type}</span>
                    <span className="text-slate-600 truncate">commit: {p.commitment.slice(0, 16)}…</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attestations */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-trust-400" />
                <h2 className="font-semibold text-slate-100">Trust Attestations</h2>
              </div>
              <span className="text-xs font-mono text-slate-500">+{attestations.reduce((s, a) => s + a.delta, 0)} total</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {attestations.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-sm">No attestations yet.</div>
              )}
              {[...attestations].reverse().map(a => (
                <div key={a.id} className="p-3 rounded-lg bg-void-950/50 border border-void-800">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-200 font-mono truncate">{a.action}</div>
                      <div className="text-[10px] font-mono text-slate-500 truncate">by {a.issuer} · {new Date(a.timestamp).toLocaleString()}</div>
                    </div>
                    <span className="text-trust-400 font-bold font-mono text-sm shrink-0 ml-2">+{a.delta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
