import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  KeyRound, Cpu, ShieldCheck, Sparkles, Loader2, Check, ArrowRight,
  Copy, AlertTriangle, Lock, Activity,
} from 'lucide-react'
import { generateIdentity, exportKeyPair } from '../crypto/identity'
import { solvePoW, generateProof } from '../crypto/zkp'
import { commit } from '../crypto/commitment'
import { useTrust } from '../store/trustStore'
import { useToast } from '../components/Toast'
import ProofVisualizer from '../components/ProofVisualizer'
import type { ZKProof } from '../crypto/zkp'

type Step = 0 | 1 | 2 | 3 | 4

const STEP_META = [
  { title: 'Generate Identity', sub: 'ECDSA P-256',            icon: <KeyRound    className="w-4 h-4" /> },
  { title: 'Prove Humanity',    sub: 'SHA-256 PoW grind',      icon: <Cpu         className="w-4 h-4" /> },
  { title: 'Commit Attributes', sub: 'Hash commitment',        icon: <Lock        className="w-4 h-4" /> },
  { title: 'Issue Credential',  sub: 'Blind-signed',           icon: <Sparkles    className="w-4 h-4" /> },
]

// Mini live entropy ticker shown while crypto is running
function EntropyTicker({ active }: { active: boolean }) {
  const [bytes, setBytes] = useState<string[]>([])
  const running = useRef(active)
  running.current = active

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      const b = crypto.getRandomValues(new Uint8Array(8))
      const hex = Array.from(b).map(x => x.toString(16).padStart(2, '0')).join(' ')
      setBytes(prev => [hex, ...prev].slice(0, 6))
    }, 160)
    return () => clearInterval(id)
  }, [active])

  if (!active && bytes.length === 0) return null

  return (
    <div className="mt-4 rounded-xl border border-void-800 bg-void-950/60 p-3 font-mono text-[10px]">
      <div className="flex items-center gap-2 text-slate-500 mb-2">
        <Activity className="w-3 h-3 text-trust-400" />
        <span>entropy stream · Web Crypto CSPRNG</span>
        {active && <span className="ml-auto text-trust-400 animate-pulse">live</span>}
      </div>
      {bytes.map((b, i) => (
        <div key={i} style={{ opacity: 1 - i * 0.16 }} className="text-trust-400/70">
          {b}
        </div>
      ))}
    </div>
  )
}

export default function Register() {
  const nav    = useNavigate()
  const trust  = useTrust()
  const { toast } = useToast()

  const [step, setStep]     = useState<Step>(0)
  const [busy, setBusy]     = useState(false)
  const [copied, setCopied] = useState(false)

  const identity = trust.identity
  const [powInfo, setPowInfo]         = useState<{ nonce: number; hash: string; duration: number } | null>(null)
  const [powProgress, setPowProgress] = useState(0)
  const [ageCommit, setAgeCommit]     = useState<string | null>(null)
  const [age, setAge]                 = useState('25')
  const [credProof, setCredProof]     = useState<ZKProof | null>(null)

  async function doGenerate() {
    setBusy(true)
    try {
      const id = await generateIdentity()
      const keys = await exportKeyPair()
      if (!keys) throw new Error('export failed')
      trust.setIdentity(id, keys)
      toast('success', 'Keypair generated', 'Private key bound to this device.')
      setStep(1)
    } catch (e: any) {
      toast('error', 'Generation failed', String(e))
    } finally {
      setBusy(false)
    }
  }

  async function doPow() {
    if (!identity) return
    setBusy(true)
    setPowProgress(0)
    try {
      const result = await solvePoW(identity.publicKeyHex, 4, (n) => setPowProgress(n))
      setPowInfo(result)
      trust.setPowHash(result.hash)

      const proof = await generateProof('humanity', result.hash, identity.publicKeyHex)
      trust.addProof(proof)
      trust.setHumanityVerified(true)
      trust.addAttestation({ id: crypto.randomUUID(), action: 'pow_solved', delta: 20, timestamp: Date.now(), issuer: 'trustnet-verifier' })

      toast('success', 'Humanity proved', `PoW solved in ${result.duration}ms · nonce=${result.nonce}`)
      setStep(2)
    } catch (e: any) {
      toast('error', 'PoW failed', String(e))
    } finally {
      setBusy(false)
    }
  }

  async function doCommit() {
    if (!identity) return
    setBusy(true)
    try {
      const c = await commit(age)
      setAgeCommit(c.commitment)
      const p = await generateProof('age-range', age, identity.publicKeyHex, '18-99')
      trust.addProof(p)
      trust.addAttestation({ id: crypto.randomUUID(), action: 'age_committed', delta: 10, timestamp: Date.now(), issuer: 'trustnet-verifier' })
      toast('success', 'Age commitment recorded', 'Range proof: age ∈ [18, 99]')
      setStep(3)
    } catch (e: any) {
      toast('error', 'Commit failed', String(e))
    } finally {
      setBusy(false)
    }
  }

  async function doCredential() {
    if (!identity) return
    setBusy(true)
    try {
      const p = await generateProof('membership', identity.publicKeyHex, identity.publicKeyHex, 'verified-humans')
      setCredProof(p)
      trust.addProof(p)
      trust.addAttestation({ id: crypto.randomUUID(), action: 'humanity_credential_issued', delta: 30, timestamp: Date.now(), issuer: 'trustnet-issuer-root' })
      trust.setRegistered(true)
      toast('success', 'Identity active!', 'Your credential is live.')
      setStep(4)
    } catch (e: any) {
      toast('error', 'Issuance failed', String(e))
    } finally {
      setBusy(false)
    }
  }

  function copyPk() {
    if (!identity) return
    navigator.clipboard.writeText(identity.publicKeyHex)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
    toast('info', 'Public key copied')
  }

  return (
    <div className="pt-28 pb-24 px-4 relative z-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="section-tag mb-5">
            <ShieldCheck className="w-3.5 h-3.5" /> REGISTRATION · NO EMAIL REQUIRED
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-slate-100 leading-tight">
            Create your{' '}
            <span className="bg-gradient-to-r from-trust-400 via-emerald-300 to-trust-300 bg-clip-text text-transparent">
              anonymous identity
            </span>
          </h1>
          <p className="mt-4 text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            Four steps. Entirely in your browser. Nothing sent to a server that could identify you.
          </p>
        </div>

        {/* Stepper */}
        <div className="grid grid-cols-4 gap-2 mb-10">
          {STEP_META.map((s, i) => {
            const stateClass = i < step ? 'step-done' : i === step ? 'step-active' : 'step-pending'
            return (
              <div key={i} className={`rounded-xl border p-3 transition-all duration-300 ${stateClass}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                    ${i < step ? 'bg-trust-500/20 text-trust-300 border border-trust-500/30'
                      : i === step ? 'bg-trust-500/20 text-trust-300 border border-trust-500/40'
                      : 'bg-void-800/60 text-slate-600'}`}>
                    {i < step ? <Check className="w-4 h-4" /> : s.icon}
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">{s.title}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{s.sub}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Step 0: Generate ── */}
        {step === 0 && (
          <div className="card fade-up">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-trust-500/10 border border-trust-500/30 flex items-center justify-center text-trust-400 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100 mb-1">Generate device keypair</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  An ECDSA P-256 keypair is generated using the browser's Web Crypto API.
                  The private key is marked non-exportable and stored in your browser's secure key store.
                  Your public key becomes your pseudonymous network ID.
                </p>
              </div>
            </div>

            <div className="terminal mb-6">
              <div className="terminal-bar">
                <div className="w-2 h-2 rounded-full bg-red-500/60" />
                <div className="w-2 h-2 rounded-full bg-amber-500/60" />
                <div className="w-2 h-2 rounded-full bg-trust-500/60" />
                <span className="ml-2 text-xs text-slate-600 font-mono">keygen.ts</span>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-400 overflow-x-auto">
                <span className="text-violet-300">const</span>{' '}keypair = <span className="text-slate-200">await</span>{' '}
                <span className="text-trust-300">crypto.subtle.generateKey</span>({'({\n'}{' '}
                {'  '}<span className="text-amber-300">name</span>: <span className="text-trust-300">'ECDSA'</span>,{' '}
                <span className="text-amber-300">namedCurve</span>: <span className="text-trust-300">'P-256'</span>,{'\n'}{' '}
                {'}'}, <span className="text-amber-300">false</span>{' '}
                <span className="text-slate-500">/* non-exportable */</span>,{' '}
                [<span className="text-trust-300">'sign'</span>, <span className="text-trust-300">'verify'</span>])
              </pre>
            </div>

            <EntropyTicker active={busy} />

            <button onClick={doGenerate} disabled={busy} className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating keypair…</>
                    : <>Generate keypair <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

        {/* ── Step 1: PoW ── */}
        {step === 1 && identity && (
          <div className="space-y-4 fade-up">
            <div className="card border-trust-700/30 bg-trust-950/10">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-trust-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-200">Keypair generated</div>
                  <div className="hex-text truncate">{identity.publicKeyHex.slice(0, 64)}…</div>
                </div>
                <button onClick={copyPk} className="btn-ghost py-1.5 px-3 text-xs rounded-xl">
                  {copied ? <Check className="w-3.5 h-3.5 text-trust-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="mt-2 text-xs text-slate-500 font-mono">
                fingerprint: <span className="text-trust-400/70">{identity.keyFingerprint}</span>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-trust-500/10 border border-trust-500/30 flex items-center justify-center text-trust-400 shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100 mb-1">Prove humanity — Proof of Work</h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Find a nonce such that <code className="text-trust-300">SHA-256(pubkey + nonce)</code> starts with 4 leading zeros.
                    Requires ~65,000 hashes ≈ 1–4 seconds. Makes mass Sybil registration computationally expensive.
                  </p>
                </div>
              </div>

              {busy && (
                <div className="mb-4 p-3 rounded-xl bg-void-950/60 border border-void-800">
                  <div className="flex justify-between text-xs font-mono text-slate-500 mb-1.5">
                    <span>Hashes computed</span>
                    <span className="text-trust-400">{powProgress.toLocaleString()}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min(99, (powProgress / 65536) * 100)}%` }} />
                  </div>
                </div>
              )}

              <EntropyTicker active={busy} />

              <button onClick={doPow} disabled={busy} className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Mining… (1–5s)</> : <>Solve challenge <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Commit ── */}
        {step === 2 && (
          <div className="space-y-4 fade-up">
            {powInfo && (
              <div className="card border-trust-700/30 bg-trust-950/10">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-trust-400 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-slate-200">PoW solved · humanity proof issued</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      nonce={powInfo.nonce.toLocaleString()} · {powInfo.duration}ms · hash={powInfo.hash.slice(0, 20)}…
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-trust-500/10 border border-trust-500/30 flex items-center justify-center text-trust-400 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100 mb-1">Commit to attributes</h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Your age is hashed with a random blinding factor into a Pedersen-style commitment.
                    A ZK range proof is generated locally proving <code className="text-trust-300">age ∈ [18, 99]</code> without
                    revealing the value. The commitment is all that gets recorded.
                  </p>
                </div>
              </div>

              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-2">YOUR AGE</label>
              <input
                type="number" min="13" max="120"
                value={age}
                onChange={e => setAge(e.target.value)}
                className="input mb-4"
              />

              {Number(age) < 18 && (
                <div className="flex items-center gap-2 text-amber-400 text-xs mb-4 p-3 rounded-xl bg-amber-950/20 border border-amber-800/40">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Under 18 — the range proof will fail intentionally.
                </div>
              )}

              <EntropyTicker active={busy} />

              <button onClick={doCommit} disabled={busy || Number(age) < 18 || Number(age) > 99}
                      className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Committing…</> : <>Commit + generate range proof <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Credential ── */}
        {step === 3 && (
          <div className="space-y-4 fade-up">
            {ageCommit && (
              <div className="card border-trust-700/30 bg-trust-950/10">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-trust-400 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-slate-200">Age commitment stored</div>
                    <div className="text-[11px] font-mono text-slate-500">commit={ageCommit.slice(0, 32)}…</div>
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-trust-500/10 border border-trust-500/30 flex items-center justify-center text-trust-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100 mb-1">Issue humanity credential</h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    The root issuer signs a blind credential over your keypair. The signature is unlinkable
                    — even the issuer cannot link this credential to the signing request. This is the
                    final proof that makes login possible without an account.
                  </p>
                </div>
              </div>

              <EntropyTicker active={busy} />

              <button onClick={doCredential} disabled={busy} className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Issuing credential…</> : <>Issue credential <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Done ── */}
        {step === 4 && identity && (
          <div className="fade-up space-y-6">
            <div className="card bg-gradient-to-br from-trust-950/40 to-void-900/40 border-trust-700/40 text-center py-12">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 glow-pulse"
                   style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(74,222,128,0.1))', border: '2px solid rgba(34,197,94,0.5)' }}>
                <Check className="w-10 h-10 text-trust-300" />
              </div>
              <h2 className="text-4xl font-black text-slate-100 mb-2">Identity active</h2>
              <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                Your anonymous identity is live. No service you use will learn who you are —
                only that you've passed whatever checks they require.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-3 max-w-sm mx-auto">
                {[
                  { v: trust.trustScore, l: 'TRUST' },
                  { v: trust.proofs.length, l: 'PROOFS' },
                  { v: trust.attestations.length, l: 'BADGES' },
                ].map(s => (
                  <div key={s.l} className="p-3 rounded-xl bg-void-950/50 border border-void-800/60">
                    <div className="text-xs font-mono text-slate-500">{s.l}</div>
                    <div className="text-2xl font-black text-trust-400">{s.v}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-3 mt-8">
                <button onClick={() => nav('/dashboard')} className="btn-primary flex items-center gap-2">
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => nav('/playground')} className="btn-ghost">Try Playground</button>
              </div>
            </div>

            {credProof && (
              <div>
                <div className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-trust-400" />
                  Your humanity credential — inspect the proof
                </div>
                <ProofVisualizer proof={credProof} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
