import { Link } from 'react-router-dom'
import {
  Shield, Eye, Fingerprint, Lock, Zap, Users, CheckCircle2, ArrowRight,
  KeyRound, CircuitBoard, Ban, X, Cpu, Hash, Sparkles, Terminal, Layers,
} from 'lucide-react'
import TrustNetwork from '../components/TrustNetwork'
import LiveCryptoStream from '../components/LiveCryptoStream'
import CodeBlock from '../components/CodeBlock'

export default function Landing() {
  return (
    <div className="relative">
      {/* HERO with animated network */}
      <section className="relative pt-14 pb-24 sm:pb-36 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <TrustNetwork height={720} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-void-950/40 via-void-950/70 to-void-950 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 sm:pt-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-trust-900/30 border border-trust-700/40 text-trust-300 text-xs font-mono mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-trust-400 animate-pulse" />
              v0.1 · zero-knowledge trust layer
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-[-0.04em] text-slate-50 leading-[0.95]">
              Prove who you are.
              <br />
              <span className="bg-gradient-to-r from-trust-400 via-trust-300 to-emerald-200 bg-clip-text text-transparent">
                Reveal nothing.
              </span>
            </h1>

            <p className="mt-8 max-w-xl text-lg sm:text-xl text-slate-300/90 leading-relaxed">
              TrustNet replaces accounts, CAPTCHAs, and public profiles with
              cryptographic proofs. Keep your name, email, and history —
              services get the guarantees they need.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-start gap-3">
              <Link to="/register" className="btn-primary group flex items-center gap-2">
                Create Anonymous Identity
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/playground" className="btn-ghost">Open Playground</Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-2">
              {['I am human', 'Trust ≥ 80', '18+', 'Never banned', 'Unique device'].map(s => (
                <span key={s} className="proof-badge">
                  <CheckCircle2 className="w-3 h-3" /> {s}
                </span>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-24 grid grid-cols-2 sm:grid-cols-4 gap-px bg-void-800/50 rounded-xl overflow-hidden border border-void-800">
            {[
              { v: '0', l: 'emails required' },
              { v: '0', l: 'CAPTCHAs shown' },
              { v: '<2ms', l: 'proof verify p99' },
              { v: '256-bit', l: 'key entropy' },
            ].map(s => (
              <div key={s.l} className="bg-void-950/80 backdrop-blur-sm p-5">
                <div className="text-2xl sm:text-3xl font-bold text-trust-400 font-mono tracking-tight">{s.v}</div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE CRYPTO + EXPLAIN */}
      <section className="px-4 py-20 border-t border-void-800/50">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-trust-900/30 border border-trust-700/40 text-trust-300 text-xs font-mono mb-4">
              <Cpu className="w-3 h-3" /> LIVE
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-100 leading-tight">
              Every byte here was generated
              <br />
              <span className="text-trust-400">in your browser</span>, just now.
            </h2>
            <p className="mt-5 text-slate-400 leading-relaxed">
              The feed on the right is not a mock. Each line is a fresh cryptographic operation —
              entropy draws, SHA-256 digests, commitments, simulated proof bundles — computed by
              the Web Crypto API on your device. TrustNet's whole philosophy is here:
              <span className="text-slate-300"> the hard work happens with you, not about you.</span>
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <InfoPill icon={<Hash className="w-4 h-4" />}            title="Real SHA-256" sub="WebCrypto digest" />
              <InfoPill icon={<KeyRound className="w-4 h-4" />}        title="Real ECDSA"   sub="P-256 keypair" />
              <InfoPill icon={<Shield className="w-4 h-4" />}          title="Real PoW"      sub="client-side grind" />
              <InfoPill icon={<Sparkles className="w-4 h-4" />}        title="ZK proofs"     sub="simulated for v0.1" />
            </div>
          </div>

          <LiveCryptoStream />
        </div>
      </section>

      {/* PROBLEM / SOLUTION comparison */}
      <section className="px-4 py-24 bg-void-900/30 border-y border-void-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-100">Old web vs TrustNet</h2>
            <p className="mt-3 text-slate-400">One login flow, two philosophies.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card border-red-900/40 bg-red-950/10 p-7">
              <div className="flex items-center gap-2 mb-6">
                <Ban className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold text-red-300 text-lg">Traditional login</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Enter email + password',
                  'Store password hash on their server',
                  'Click the traffic lights',
                  'Receive 2FA code via SMS',
                  'Service now knows: email, IP, device, timing',
                  'Leaks + correlations build a shadow profile',
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                    <X className="w-4 h-4 text-red-400/70 shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-6 border-t border-red-900/40 text-xs text-red-300/70 font-mono">
                data_leaked = { '{'}email, phone, IP, password_hash, session_cookies{'}'}
              </div>
            </div>

            <div className="card border-trust-700/50 bg-trust-950/20 p-7 glow-pulse">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-trust-400" />
                <h3 className="font-semibold text-trust-300 text-lg">TrustNet login</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Service sends a 32-byte random challenge',
                  'Your device signs it with your private key',
                  'Attach ZK proof: "human ∧ trust ≥ T"',
                  'Service verifies in <2ms, grants session',
                  'Service knows: predicate was satisfied',
                  'That is all it knows. Forever.',
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-trust-400 shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-6 border-t border-trust-700/40 text-xs text-trust-300/80 font-mono">
                data_leaked = {'{}'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-trust-900/30 border border-trust-700/40 text-trust-300 text-xs font-mono mb-3">
              <Layers className="w-3 h-3" /> FOUR LAYERS
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-100">How it works</h2>
            <p className="mt-4 text-slate-400">No accounts. No profiles. No leakage.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Fingerprint className="w-6 h-6" />, n: '01', title: 'Device Identity',
                body: 'Generate an ECDSA keypair in-browser. Private key never leaves your device; public key becomes your pseudonymous ID.' },
              { icon: <CircuitBoard className="w-6 h-6" />, n: '02', title: 'Humanity Credential',
                body: 'Solve a PoW + device attestation. The network issues a blind-signed credential — anonymous and unlinkable.' },
              { icon: <Lock className="w-6 h-6" />, n: '03', title: 'Commit Attributes',
                body: 'Age, reputation, region — stored as hash commitments. The value is hidden; the binding is permanent.' },
              { icon: <Eye className="w-6 h-6" />, n: '04', title: 'Zero-Knowledge Prove',
                body: 'Generate proofs like "trust ≥ 70" without revealing the actual value — or your identity.' },
            ].map(step => (
              <div key={step.n} className="card hover:border-trust-600/40 hover:-translate-y-0.5 transition-all duration-200 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-lg bg-trust-500/10 border border-trust-500/30 flex items-center justify-center text-trust-400 group-hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                  <span className="font-mono text-xs text-void-500">{step.n}</span>
                </div>
                <h3 className="font-semibold text-slate-100 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SDK CODE */}
      <section className="px-4 py-24 bg-void-900/30 border-y border-void-800/60">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-trust-900/30 border border-trust-700/40 text-trust-300 text-xs font-mono mb-4">
              <Terminal className="w-3 h-3" /> SDK
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-100">Integrate in four lines</h2>
            <p className="mt-4 text-slate-400 leading-relaxed">
              The SDK handles keypair lifecycle, credential storage, proof generation, and verification.
              Your service asks for a predicate; the SDK handles the rest — no PII in, no PII out.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li className="flex gap-3"><CheckCircle2 className="w-4 h-4 text-trust-400 shrink-0 mt-0.5" />
                <span><code className="text-trust-300">200&nbsp;kB</code> gzipped incl. wasm ZK prover</span>
              </li>
              <li className="flex gap-3"><CheckCircle2 className="w-4 h-4 text-trust-400 shrink-0 mt-0.5" />
                <span>Works in browsers, Node, Deno, React&nbsp;Native</span>
              </li>
              <li className="flex gap-3"><CheckCircle2 className="w-4 h-4 text-trust-400 shrink-0 mt-0.5" />
                <span>Verifier is a stateless gRPC call — &lt;2ms p99</span>
              </li>
            </ul>
          </div>

          <CodeBlock
            label="your-login-flow.ts"
            code={`
import { TrustNet } from '@trustnet/sdk'

const tn = await TrustNet.init()

// Ask the user to prove a predicate (no identity disclosed)
const { proof, session } = await tn.prove({
  humanity: true,
  trustScore: { min: 70 },
  ageRange:   { min: 18 },
})

// Send to your backend; verify in 2ms
const ok = await fetch('/verify', { method: 'POST', body: proof })

// That's it. No email. No password. No CAPTCHA.
`.trim()}
          />
        </div>
      </section>

      {/* TRUST RING */}
      <section className="px-4 py-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-trust-900/40 border border-trust-700/40 text-trust-300 text-xs font-mono mb-4">
              <Zap className="w-3 h-3" /> TRUST LAYER
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-100">
              Reputation that travels with you
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed">
              Every positive action — a helpful post, a completed transaction, a vouch from an existing
              user — is a signed attestation. Attestations aggregate into a Merkle tree whose root lives
              under your control.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-trust-400 shrink-0" />Services verify "score ≥ X" without seeing any action</li>
              <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-trust-400 shrink-0" />Trust is portable — carry it from a forum to a marketplace</li>
              <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-trust-400 shrink-0" />Bad actors are flagged via nullifier sets, never real names</li>
            </ul>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-80 h-80">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(51,65,85,0.4)" strokeWidth="2" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="url(#g)" strokeWidth="3"
                        strokeDasharray="283" strokeDashoffset="57" strokeLinecap="round" className="ring-anim" />
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#4ade80" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-7xl font-bold text-trust-400 font-mono">80</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Trust Score</div>
                <div className="text-[10px] text-slate-600 mt-3 font-mono">zkp_verified · no leak</div>
              </div>
              <div className="absolute inset-0 rounded-full glow-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="px-4 py-24 bg-void-900/30 border-y border-void-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-slate-100">Built for the real web</h2>
            <p className="mt-4 text-slate-400">Drop-in trust for the services that need it most.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: <Users className="w-5 h-5" />, title: 'Social platforms',
                body: 'Discord-style communities with no doxxing risk. Ban the bad actor, not the person.' },
              { icon: <Zap className="w-5 h-5" />, title: 'Marketplaces',
                body: 'Buyers prove reliability without giving sellers their address until escrow closes.' },
              { icon: <Shield className="w-5 h-5" />, title: 'Age-gated content',
                body: 'Prove 18+ without handing a license to a 25-year-old marketing startup.' },
            ].map(c => (
              <div key={c.title} className="card hover:-translate-y-0.5 transition-transform">
                <div className="w-10 h-10 rounded-lg bg-trust-500/10 border border-trust-500/30 flex items-center justify-center text-trust-400 mb-4">
                  {c.icon}
                </div>
                <h3 className="font-semibold text-slate-100 mb-2">{c.title}</h3>
                <p className="text-sm text-slate-400">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24">
        <div className="max-w-3xl mx-auto text-center card border-trust-700/40 bg-gradient-to-br from-trust-950/40 to-void-900/60 p-10">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-100">
            Ready to create your identity?
          </h2>
          <p className="mt-4 text-slate-400 max-w-md mx-auto">
            No email. No name. No tracking. Just a keypair generated on your device and a proof the network trusts.
          </p>
          <Link to="/register" className="btn-primary mt-8 inline-flex items-center gap-2">
            Register Anonymously <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="mt-4 text-xs text-slate-500 font-mono">~2 minutes · entirely in your browser</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-4 py-10 border-t border-void-800/60">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-trust-400" />
            trustnet://v0.1
          </div>
          <div className="flex gap-5">
            <Link to="/architecture" className="hover:text-trust-400">Architecture</Link>
            <Link to="/playground" className="hover:text-trust-400">Playground</Link>
            <Link to="/login" className="hover:text-trust-400">Login Demo</Link>
          </div>
          <div>zero-knowledge identity · no accounts harmed</div>
        </div>
      </footer>
    </div>
  )
}

function InfoPill({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-void-800 bg-void-950/50">
      <div className="w-8 h-8 rounded-md bg-trust-500/10 border border-trust-500/30 flex items-center justify-center text-trust-400">
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-slate-200">{title}</div>
        <div className="text-[10px] font-mono text-slate-500">{sub}</div>
      </div>
    </div>
  )
}
