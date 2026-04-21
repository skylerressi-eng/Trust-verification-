import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Cpu, ShieldCheck, Sparkles, Loader2, Check, ArrowRight, Copy, AlertTriangle } from 'lucide-react'
import { generateIdentity, exportKeyPair } from '../crypto/identity'
import { solvePoW, generateProof } from '../crypto/zkp'
import { commit } from '../crypto/commitment'
import { useTrust } from '../store/trustStore'

type Step = 0 | 1 | 2 | 3 | 4

interface StepMeta { title: string; sub: string; icon: React.ReactNode }
const STEPS: StepMeta[] = [
  { title: 'Generate Identity', sub: 'ECDSA P-256 keypair, in-browser', icon: <KeyRound className="w-4 h-4" /> },
  { title: 'Prove Humanity',    sub: 'Proof-of-work challenge',         icon: <Cpu className="w-4 h-4" /> },
  { title: 'Commit Attributes', sub: 'Hash commitments, never values',  icon: <ShieldCheck className="w-4 h-4" /> },
  { title: 'Issue Credential',  sub: 'Anonymous humanity certificate',   icon: <Sparkles className="w-4 h-4" /> },
]

export default function Register() {
  const nav = useNavigate()
  const trust = useTrust()
  const [step, setStep] = useState<Step>(0)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  // Step 1 artifacts
  const identity = trust.identity

  // Step 2 artifacts
  const [powInfo, setPowInfo] = useState<{ nonce: number; hash: string; duration: number } | null>(null)

  // Step 3 artifacts
  const [ageCommit, setAgeCommit] = useState<string | null>(null)
  const [age, setAge] = useState('25')

  // ---- Step handlers ----

  async function doGenerate() {
    setBusy(true)
    try {
      const id = await generateIdentity()
      const keys = await exportKeyPair()
      if (!keys) throw new Error('keypair export failed')
      trust.setIdentity(id, keys)
      setStep(1)
    } finally { setBusy(false) }
  }

  async function doPow() {
    if (!identity) return
    setBusy(true)
    try {
      // Difficulty 4 ≈ 65k hashes ≈ 1–3s on modern hw. Adjust for real sybil cost.
      const result = await solvePoW(identity.publicKeyHex, 4)
      setPowInfo(result)
      trust.setPowHash(result.hash)

      // Generate the humanity proof
      const proof = await generateProof('humanity', result.hash, identity.publicKeyHex)
      trust.addProof(proof)
      trust.setHumanityVerified(true)

      // Issue first attestation (PoW bonus)
      trust.addAttestation({
        id: crypto.randomUUID(),
        action: 'proof_of_work_solved',
        delta: 20,
        timestamp: Date.now(),
        issuer: 'trustnet-verifier-1',
      })
      setStep(2)
    } finally { setBusy(false) }
  }

  async function doCommit() {
    if (!identity) return
    setBusy(true)
    try {
      const c = await commit(age)
      setAgeCommit(c.commitment)
      // Proof that age is in [18, 99] without revealing the number
      const p = await generateProof('age-range', age, identity.publicKeyHex, '18-99')
      trust.addProof(p)
      trust.addAttestation({
        id: crypto.randomUUID(),
        action: 'age_commitment_registered',
        delta: 10,
        timestamp: Date.now(),
        issuer: 'trustnet-verifier-1',
      })
      setStep(3)
    } finally { setBusy(false) }
  }

  async function doCredential() {
    if (!identity) return
    setBusy(true)
    try {
      const p = await generateProof('membership', identity.publicKeyHex, identity.publicKeyHex, 'verified-humans')
      trust.addProof(p)
      trust.addAttestation({
        id: crypto.randomUUID(),
        action: 'humanity_credential_issued',
        delta: 30,
        timestamp: Date.now(),
        issuer: 'trustnet-issuer-root',
      })
      trust.setRegistered(true)
      setStep(4)
    } finally { setBusy(false) }
  }

  function copyPk() {
    if (!identity) return
    navigator.clipboard.writeText(identity.publicKeyHex)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="pt-28 pb-20 px-4 relative z-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-trust-900/30 border border-trust-700/40 text-trust-300 text-xs font-mono mb-4">
            <ShieldCheck className="w-3 h-3" /> REGISTRATION · NO EMAIL REQUIRED
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-100">Create your anonymous identity</h1>
          <p className="mt-3 text-slate-400">Everything happens in this browser tab. Nothing is sent to a server that could identify you.</p>
        </div>

        {/* Stepper */}
        <div className="grid grid-cols-4 gap-2 mb-10">
          {STEPS.map((s, i) => {
            const state = i < step ? 'step-done' : i === step ? 'step-active' : 'step-pending'
            return (
              <div key={i} className={`rounded-lg border p-3 transition-all duration-300 ${state}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center ${i < step ? 'bg-trust-500/20 text-trust-300' : i === step ? 'bg-trust-500/30 text-trust-300' : 'bg-void-800 text-slate-500'}`}>
                    {i < step ? <Check className="w-4 h-4" /> : s.icon}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-semibold text-slate-200">{s.title}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{s.sub}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Step 0: Generate identity */}
        {step === 0 && (
          <div className="card">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-trust-500/10 border border-trust-500/30 flex items-center justify-center text-trust-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Generate device keypair</h2>
                <p className="text-sm text-slate-400 mt-1">
                  An ECDSA P-256 keypair will be generated in your browser using the Web Crypto API.
                  The private key stays on this device. The public key becomes your pseudonymous ID.
                </p>
              </div>
            </div>

            <div className="bg-void-950/60 border border-void-800 rounded-lg p-4 font-mono text-xs text-slate-400 mb-6">
              <span className="text-trust-400">$</span> crypto.subtle.generateKey({'{'}<br />
              &nbsp;&nbsp;name: <span className="text-amber-300">'ECDSA'</span>,<br />
              &nbsp;&nbsp;namedCurve: <span className="text-amber-300">'P-256'</span>,<br />
              {'}'}, true, [<span className="text-amber-300">'sign'</span>, <span className="text-amber-300">'verify'</span>])
            </div>

            <button onClick={doGenerate} disabled={busy} className="btn-primary w-full justify-center flex items-center gap-2">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <>Generate keypair <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

        {/* Step 1: PoW */}
        {step === 1 && identity && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-trust-500/10 border border-trust-500/30 flex items-center justify-center text-trust-400">
                  <Check className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-slate-100">Identity generated</h2>
                  <p className="text-sm text-slate-400 mt-1">Public key (your pseudonymous ID):</p>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="hex-text flex-1 bg-void-950 border border-void-800 rounded p-2">
                      {identity.publicKeyHex.slice(0, 60)}…
                    </code>
                    <button onClick={copyPk} className="btn-ghost py-2 px-3 text-xs">
                      {copied ? <Check className="w-3.5 h-3.5 text-trust-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Fingerprint: <span className="text-trust-400/80 font-mono">{identity.keyFingerprint}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-trust-500/10 border border-trust-500/30 flex items-center justify-center text-trust-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">Prove you're human</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Solve a proof-of-work puzzle (find a nonce producing a hash with 4 leading zeros).
                    This makes mass account creation expensive — the first line of Sybil defense.
                  </p>
                </div>
              </div>
              <div className="bg-void-950/60 border border-void-800 rounded-lg p-4 font-mono text-xs text-slate-400 mb-6">
                <span className="text-trust-400">find</span>(<span className="text-cyan-300">nonce</span>) where{' '}
                <span className="text-amber-300">SHA256(pubkey + nonce).startsWith(</span>
                <span className="text-trust-400">"0000"</span>
                <span className="text-amber-300">)</span>
              </div>
              <button onClick={doPow} disabled={busy} className="btn-primary w-full justify-center flex items-center gap-2">
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Mining… (expect 1–5s)</> : <>Solve challenge <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Commit attributes */}
        {step === 2 && (
          <div className="space-y-4">
            {powInfo && (
              <div className="card bg-trust-950/10 border-trust-700/30">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-trust-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200">Humanity proof generated</div>
                    <div className="text-xs text-slate-500 font-mono truncate">
                      nonce={powInfo.nonce} · hash={powInfo.hash.slice(0, 16)}… · {powInfo.duration}ms
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-trust-500/10 border border-trust-500/30 flex items-center justify-center text-trust-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">Commit to attributes</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Enter your age (it will never leave your browser). We'll compute a hash commitment
                    and generate a ZK range proof that your age ∈ [18, 99] — without revealing the value.
                  </p>
                </div>
              </div>

              <label className="block text-xs font-mono text-slate-500 mb-2">AGE</label>
              <input
                type="number" min="13" max="120"
                value={age}
                onChange={e => setAge(e.target.value)}
                className="w-full bg-void-950 border border-void-700 rounded-lg px-4 py-3 text-slate-100 font-mono focus:outline-none focus:border-trust-500/60 mb-4"
              />

              {Number(age) < 18 && (
                <div className="flex items-center gap-2 text-amber-400 text-xs mb-4">
                  <AlertTriangle className="w-4 h-4" />
                  Under 18 — the range proof will fail. (That's the point.)
                </div>
              )}

              <button onClick={doCommit} disabled={busy || Number(age) < 18 || Number(age) > 99}
                      className="btn-primary w-full justify-center flex items-center gap-2">
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Committing…</> : <>Commit + prove range <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Issue credential */}
        {step === 3 && (
          <div className="space-y-4">
            {ageCommit && (
              <div className="card bg-trust-950/10 border-trust-700/30">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-trust-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200">Age commitment stored</div>
                    <div className="text-xs text-slate-500 font-mono truncate">commit={ageCommit.slice(0, 32)}…</div>
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-trust-500/10 border border-trust-500/30 flex items-center justify-center text-trust-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">Issue humanity credential</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    The network signs a blind credential on your keypair. This credential proves you're a verified
                    human — but is <em>unlinkable</em> to the issuer, so no one can trace your activity back.
                  </p>
                </div>
              </div>
              <button onClick={doCredential} disabled={busy} className="btn-primary w-full justify-center flex items-center gap-2">
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Issuing…</> : <>Issue credential & finish <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && identity && (
          <div className="card bg-gradient-to-br from-trust-950/30 to-void-900/40 border-trust-700/40 text-center py-12">
            <div className="w-20 h-20 rounded-full bg-trust-500/20 border-2 border-trust-400 mx-auto flex items-center justify-center mb-6 glow-pulse">
              <Check className="w-10 h-10 text-trust-300" />
            </div>
            <h2 className="text-3xl font-bold text-slate-100 mb-2">Identity active</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              You now have a verified anonymous identity. No service you use will learn who you are —
              only that you've passed the checks they require.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="p-3 rounded-lg bg-void-950/50 border border-void-800">
                <div className="text-xs text-slate-500 font-mono">TRUST</div>
                <div className="text-2xl font-bold text-trust-400">{trust.trustScore}</div>
              </div>
              <div className="p-3 rounded-lg bg-void-950/50 border border-void-800">
                <div className="text-xs text-slate-500 font-mono">PROOFS</div>
                <div className="text-2xl font-bold text-trust-400">{trust.proofs.length}</div>
              </div>
              <div className="p-3 rounded-lg bg-void-950/50 border border-void-800">
                <div className="text-xs text-slate-500 font-mono">BADGES</div>
                <div className="text-2xl font-bold text-trust-400">{trust.attestations.length}</div>
              </div>
            </div>

            <button onClick={() => nav('/dashboard')} className="btn-primary mt-8 inline-flex items-center gap-2">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
