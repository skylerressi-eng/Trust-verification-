import { Link } from 'react-router-dom'
import { Shield, Eye, Fingerprint, Lock, Zap, Users, CheckCircle2, ArrowRight, KeyRound, CircuitBoard, Ban } from 'lucide-react'

export default function Landing() {
  return (
    <div className="relative pt-14">
      {/* HERO */}
      <section className="relative px-4 py-24 sm:py-36 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-trust-900/30 border border-trust-700/40 text-trust-300 text-xs font-mono mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-trust-400 animate-pulse" />
            v0.1 · Zero-knowledge trust layer
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tighter text-slate-50 leading-[1.05]">
            Prove who you are.
            <br />
            <span className="bg-gradient-to-r from-trust-400 via-trust-300 to-emerald-200 bg-clip-text text-transparent">
              Reveal nothing.
            </span>
          </h1>

          <p className="mt-8 max-w-2xl mx-auto text-lg sm:text-xl text-slate-400 leading-relaxed">
            A new internet trust layer that replaces accounts, CAPTCHAs, and public profiles with
            cryptographic proofs. You keep your name, email, and history — services get the guarantees they need.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="btn-primary group flex items-center gap-2">
              Create Anonymous Identity
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link to="/architecture" className="btn-ghost">Read the Architecture</Link>
          </div>

          {/* Proof badges */}
          <div className="mt-14 flex flex-wrap justify-center gap-2">
            {[
              'I am human',
              'Trust ≥ 80',
              '18+',
              'Never banned',
              'Unique device',
            ].map(s => (
              <span key={s} className="proof-badge">
                <CheckCircle2 className="w-3 h-3" />
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Floating key visual */}
        <div className="absolute top-1/2 -translate-y-1/2 left-8 opacity-20 hidden lg:block">
          <KeyRound className="w-24 h-24 text-trust-400 animate-float" />
        </div>
        <div className="absolute top-1/3 right-12 opacity-20 hidden lg:block">
          <Shield className="w-20 h-20 text-trust-400 animate-float" style={{ animationDelay: '1.5s' }} />
        </div>
      </section>

      {/* PROBLEM / SOLUTION */}
      <section className="px-4 py-20 bg-void-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card border-red-900/40 bg-red-950/10">
              <div className="flex items-center gap-2 mb-4">
                <Ban className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold text-red-300">The Old Web</h3>
              </div>
              <ul className="space-y-3 text-slate-400 text-sm leading-relaxed">
                <li>• Every service asks for your email, phone, real name</li>
                <li>• Passwords leak. CAPTCHAs fail. Profiles become surveillance</li>
                <li>• Identity is binary: anonymous (no trust) or doxxed (full trust)</li>
                <li>• Platforms hold your reputation hostage — no portability</li>
                <li>• Sybil attacks are defended by leaking more personal data</li>
              </ul>
            </div>

            <div className="card border-trust-700/40 bg-trust-950/10">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-trust-400" />
                <h3 className="font-semibold text-trust-300">TrustNet</h3>
              </div>
              <ul className="space-y-3 text-slate-300 text-sm leading-relaxed">
                <li>• Your private key lives on your device — nothing else is stored</li>
                <li>• Log in by signing a challenge. No passwords, no CAPTCHAs</li>
                <li>• Prove "I'm human + trust ≥ 80" without revealing who you are</li>
                <li>• Trust is a portable credential, not a platform-locked score</li>
                <li>• Sybil defense via PoW + blind-signed humanity credential</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-100">How it works</h2>
            <p className="mt-4 text-slate-400">Four layers. No accounts. No profiles. No leakage.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <Fingerprint className="w-6 h-6" />,
                n: '01',
                title: 'Device Identity',
                body: 'Generate an ECDSA keypair in-browser. The private key never leaves your device; the public key becomes your pseudonymous ID.',
              },
              {
                icon: <CircuitBoard className="w-6 h-6" />,
                n: '02',
                title: 'Humanity Credential',
                body: 'Solve a proof-of-work challenge + device attestation. The network issues a blind signature on your key — anonymous, unlinkable.',
              },
              {
                icon: <Lock className="w-6 h-6" />,
                n: '03',
                title: 'Commit Attributes',
                body: 'Age, reputation, region, or any attribute is stored as a hash commitment. The value is hidden; the binding is permanent.',
              },
              {
                icon: <Eye className="w-6 h-6" />,
                n: '04',
                title: 'Zero-Knowledge Prove',
                body: 'When a service needs a check, you generate a proof like "trust ≥ 70" without revealing the actual number — or your identity.',
              },
            ].map(step => (
              <div key={step.n} className="card hover:border-trust-600/40 transition-colors duration-200 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-trust-500/10 border border-trust-500/30 flex items-center justify-center text-trust-400 group-hover:scale-110 transition-transform">
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

      {/* TRUST ACCUMULATION */}
      <section className="px-4 py-24 bg-void-900/50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-trust-900/40 border border-trust-700/40 text-trust-300 text-xs font-mono mb-4">
              <Zap className="w-3 h-3" /> TRUST LAYER
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-100">
              Reputation that travels with you
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed">
              Every positive action — a helpful post, a completed transaction, a vouch from an existing user — is a
              signed attestation. Attestations are aggregated into a Merkle tree whose root lives under your control.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-trust-400 shrink-0" />Services verify "score ≥ X" without seeing any individual action</li>
              <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-trust-400 shrink-0" />Trust is portable — carry it from a forum to a marketplace</li>
              <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-trust-400 shrink-0" />Bad actors are flagged via nullifier sets, not real names</li>
            </ul>
          </div>

          {/* Trust ring visual */}
          <div className="flex items-center justify-center">
            <div className="relative w-72 h-72">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(51,65,85,0.4)" strokeWidth="2" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="url(#g)" strokeWidth="3"
                        strokeDasharray="283" strokeDashoffset="57" strokeLinecap="round" className="ring-anim" />
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%"   stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#4ade80" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-6xl font-bold text-trust-400 font-mono">80</div>
                <div className="text-xs text-slate-500 font-mono mt-1">TRUST SCORE</div>
                <div className="text-[10px] text-slate-600 mt-2 font-mono">zkp_verified · no identity leak</div>
              </div>
              <div className="absolute inset-0 rounded-full glow-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-slate-100">Built for the real web</h2>
            <p className="mt-4 text-slate-400">Drop-in trust for the services that need it most.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: <Users className="w-5 h-5" />, title: 'Social platforms', body: 'Discord-style communities with no doxxing risk. Ban the bad actor, not the person.' },
              { icon: <Zap className="w-5 h-5" />, title: 'Marketplaces', body: 'Buyers prove reliability without giving sellers their address until escrow closes.' },
              { icon: <Shield className="w-5 h-5" />, title: 'Age-gated content', body: 'Prove 18+ without handing a license to a 25-year-old marketing startup.' },
            ].map(c => (
              <div key={c.title} className="card">
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
        <div className="max-w-3xl mx-auto text-center card border-trust-700/40 bg-gradient-to-br from-trust-950/40 to-void-900/40">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-100">
            Ready to create your identity?
          </h2>
          <p className="mt-4 text-slate-400">
            No email. No name. No tracking. Just a keypair generated on your device and a proof the network trusts.
          </p>
          <Link to="/register" className="btn-primary mt-8 inline-flex items-center gap-2">
            Register Anonymously <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="mt-4 text-xs text-slate-500 font-mono">takes ~2 minutes · runs entirely in your browser</p>
        </div>
      </section>

      <footer className="px-4 py-10 border-t border-void-800/60 text-center text-xs text-slate-500 font-mono">
        trustnet://v0.1 · zero-knowledge identity · no accounts harmed in the making of this demo
      </footer>
    </div>
  )
}
