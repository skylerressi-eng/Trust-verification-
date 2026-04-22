import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Terminal, Check, Loader2, ShieldCheck, X, KeyRound, ArrowRight } from 'lucide-react'
import { signChallenge, verifySig } from '../crypto/identity'
import { generateProof, verifyProof } from '../crypto/zkp'
import { useTrust } from '../store/trustStore'

type PhaseKey = 'challenge' | 'sign' | 'proof' | 'verify' | 'granted'

interface Phase {
  key: PhaseKey
  label: string
  detail: string
}

const PHASES: Phase[] = [
  { key: 'challenge', label: 'Service issues random challenge',  detail: '32-byte nonce, single-use' },
  { key: 'sign',      label: 'You sign it with your private key', detail: 'ECDSA P-256 · device-local only' },
  { key: 'proof',     label: 'You attach ZK proof bundle',        detail: 'humanity · trust ≥ threshold' },
  { key: 'verify',    label: 'Service verifies — no identity seen', detail: 'O(1) pairing check in production' },
  { key: 'granted',   label: 'Access granted',                    detail: 'session bound to public key, not account' },
]

export default function Login() {
  const { identity, registered, trustScore, humanityVerified, keyReady } = useTrust()
  const [phase, setPhase] = useState<number>(-1)
  const [challenge, setChallenge] = useState<string>('')
  const [sigHex, setSigHex] = useState<string>('')
  const [proofId, setProofId] = useState<string>('')
  const [sigValid, setSigValid] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [sigError, setSigError] = useState(false)

  async function runLogin() {
    if (!identity) return
    setBusy(true)
    setPhase(0)
    setSigValid(null)
    setSigError(false)

    // Phase 0: service issues challenge
    const challengeBytes = crypto.getRandomValues(new Uint8Array(32))
    const chal = Array.from(challengeBytes).map(b => b.toString(16).padStart(2, '0')).join('')
    setChallenge(chal)
    await delay(700)

    // Phase 1: sign
    setPhase(1)
    const signed = await signChallenge(chal)
    if (!signed) {
      // keyReady should prevent this, but guard anyway
      setSigError(true)
      setBusy(false)
      setPhase(-1)
      return
    }
    setSigHex(signed.signature)
    await delay(700)

    // Phase 2: attach ZK proof
    setPhase(2)
    const proof = await generateProof('trust-threshold', String(trustScore), identity.publicKeyHex, '50')
    setProofId(proof.id)
    await delay(700)

    // Phase 3: service-side verify
    setPhase(3)
    const sigOk = await verifySig(chal, signed.signature, identity.publicKeyHex)
    const proofOk = await verifyProof(proof, identity.publicKeyHex)
    setSigValid(sigOk && proofOk)
    await delay(800)

    // Phase 4: granted
    if (sigOk && proofOk) setPhase(4)
    setBusy(false)
  }

  function reset() {
    setPhase(-1)
    setChallenge(''); setSigHex(''); setProofId('')
    setSigValid(null)
  }

  if (!registered) {
    return (
      <div className="pt-28 pb-20 px-4 min-h-screen">
        <div className="max-w-lg mx-auto text-center card">
          <Terminal className="w-10 h-10 text-slate-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">No identity on this device</h2>
          <p className="text-slate-400 mb-6">Register first to see the no-CAPTCHA login in action.</p>
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
          <p className="text-slate-400 text-sm">Re-importing your device key from secure storage.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-28 pb-20 px-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-trust-900/30 border border-trust-700/40 text-trust-300 text-xs font-mono mb-4">
            <Terminal className="w-3 h-3" /> LOGIN DEMO · NO CAPTCHA · NO PASSWORD
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-slate-100">
            Watch login happen
            <br />
            <span className="bg-gradient-to-r from-trust-400 to-emerald-300 bg-clip-text text-transparent">without you</span>
          </h1>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">
            This simulates a third-party service (say, a forum) asking you to log in. No email, no password, no CAPTCHA,
            no profile — just a sign-and-prove handshake.
          </p>
        </div>

        {/* Terminal */}
        <div className="card font-mono text-sm p-0 overflow-hidden">
          <div className="px-4 py-2 border-b border-void-800 bg-void-950/80 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-trust-500/70" />
            <span className="ml-2 text-xs text-slate-500">service.example.com ⇄ trustnet-client</span>
          </div>

          <div className="p-6 min-h-[380px] bg-void-950/40">
            {phase < 0 && !sigError && (
              <div className="text-slate-400 space-y-1">
                <div><span className="text-trust-400">$</span> trustnet login --service forum.example.com</div>
                <div className="text-slate-600 text-xs mt-2">Press <kbd className="px-1.5 py-0.5 rounded bg-void-800 border border-void-700 text-slate-300">Run</kbd> to simulate a round-trip login.</div>
              </div>
            )}
            {sigError && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <X className="w-4 h-4" />
                Signing failed — private key not available. Try refreshing the page.
              </div>
            )}

            {phase >= 0 && (
              <div className="space-y-3">
                {PHASES.map((p, i) => {
                  if (i > phase) return null
                  const active = i === phase
                  return (
                    <div key={p.key} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2">
                        {active
                          ? <Loader2 className="w-4 h-4 text-trust-400 animate-spin" />
                          : <Check    className="w-4 h-4 text-trust-400" />}
                        <span className="text-slate-200">{p.label}</span>
                        <span className="text-xs text-slate-500">— {p.detail}</span>
                      </div>

                      {p.key === 'challenge' && challenge && (
                        <div className="ml-6 mt-1.5 text-xs text-trust-400/70 break-all">
                          ← challenge: {challenge.slice(0, 48)}…
                        </div>
                      )}
                      {p.key === 'sign' && sigHex && (
                        <div className="ml-6 mt-1.5 text-xs text-trust-400/70 break-all">
                          → signature: {sigHex.slice(0, 48)}…
                        </div>
                      )}
                      {p.key === 'proof' && proofId && (
                        <div className="ml-6 mt-1.5 text-xs text-trust-400/70">
                          → zkp_{proofId} · statement: "trust ≥ 50 ∧ humanity"
                        </div>
                      )}
                      {p.key === 'verify' && sigValid !== null && (
                        <div className="ml-6 mt-1.5 text-xs flex items-center gap-1">
                          {sigValid
                            ? <><Check className="w-3 h-3 text-trust-400" /><span className="text-trust-400">verified ✓</span></>
                            : <><X     className="w-3 h-3 text-red-400" /><span className="text-red-400">failed</span></>}
                        </div>
                      )}
                    </div>
                  )
                })}

                {phase === 4 && (
                  <div className="mt-6 p-4 rounded-lg border border-trust-600/40 bg-trust-950/30 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-trust-400" />
                    <div>
                      <div className="text-trust-300 font-semibold">Session granted</div>
                      <div className="text-xs text-slate-400">
                        forum.example.com now knows: "an anonymous human with trust ≥ 50 is active in this session".
                        That is all it knows.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-void-800 bg-void-950/80 flex gap-2">
            <button onClick={runLogin} disabled={busy} className="btn-primary py-1.5 px-4 text-sm">
              {busy ? <><Loader2 className="w-3.5 h-3.5 animate-spin inline mr-2" />Running</> : 'Run login'}
            </button>
            {phase >= 0 && (
              <button onClick={reset} className="btn-ghost py-1.5 px-4 text-sm">Reset</button>
            )}
          </div>
        </div>

        {/* Identity snapshot */}
        <div className="mt-8 grid md:grid-cols-3 gap-3">
          <div className="card">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-2">
              <KeyRound className="w-3.5 h-3.5" /> PUBLIC KEY
            </div>
            <div className="hex-text">{identity?.publicKeyHex.slice(0, 24)}…</div>
          </div>
          <div className="card">
            <div className="text-xs font-mono text-slate-500 mb-2">HUMANITY</div>
            <div className={`text-lg font-semibold ${humanityVerified ? 'text-trust-400' : 'text-slate-500'}`}>
              {humanityVerified ? 'Verified' : 'Unverified'}
            </div>
          </div>
          <div className="card">
            <div className="text-xs font-mono text-slate-500 mb-2">TRUST SCORE</div>
            <div className="text-lg font-semibold text-trust-400">{trustScore}/100</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }
