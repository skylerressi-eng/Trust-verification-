import { Shield, Cpu, Lock, Users, Ban, AlertTriangle, Layers, Zap, CheckCircle2, XCircle, Code2 } from 'lucide-react'

export default function Architecture() {
  return (
    <div className="pt-28 pb-20 px-4 relative z-10">
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-trust-900/30 border border-trust-700/40 text-trust-300 text-xs font-mono mb-4">
            <Layers className="w-3 h-3" /> SYSTEM DESIGN · v0.1
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-100">
            TrustNet Architecture
          </h1>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">
            A deep dive into every layer: identity, verification, trust, sybil defense,
            and the cryptographic primitives that hold it together.
          </p>
        </div>

        {/* TOC */}
        <div className="card mb-10">
          <div className="text-xs font-mono text-slate-500 mb-3">CONTENTS</div>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            {[
              ['#overview',   '1. System Overview'],
              ['#layers',     '2. Core Architecture'],
              ['#trust',      '3. How Trust Is Built'],
              ['#login',      '4. No-CAPTCHA Login'],
              ['#security',   '5. Security Model'],
              ['#stack',      '6. Technology Stack'],
              ['#mvp',        '7. MVP (3–6 months)'],
              ['#limits',     '8. Limitations'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="text-trust-400 hover:text-trust-300 transition-colors">→ {label}</a>
            ))}
          </div>
        </div>

        {/* 1. Overview */}
        <Section id="overview" icon={<Shield className="w-5 h-5" />} title="1. System Overview">
          <p>
            TrustNet is a privacy-preserving identity layer. Instead of creating accounts on each service,
            a user creates one cryptographic identity — a keypair — on their own device. Trust accumulates
            against the public key, and services verify claims using zero-knowledge proofs.
          </p>
          <p>
            The result: a user can prove they are human, have a good reputation, and meet age or behavior
            requirements — without revealing their name, email, history, or any cross-service linkage.
          </p>

          <div className="grid md:grid-cols-3 gap-3 not-prose my-6">
            <MiniCard title="Joining" body="Generate keypair → solve PoW → receive blind-signed humanity credential." />
            <MiniCard title="Interacting" body="Sign service challenge, attach relevant ZK proofs, no account needed." />
            <MiniCard title="Proving trust" body="Services check a proof like 'score ≥ 70' without learning identity." />
          </div>
        </Section>

        {/* 2. Layers */}
        <Section id="layers" icon={<Layers className="w-5 h-5" />} title="2. Core Architecture">
          <p>The system is organized as four cooperating layers:</p>

          <ArchLayer num="01" title="Client (device)" tone="green">
            <ul>
              <li>Keypair generation & storage in <code>WebCrypto</code> / Secure Enclave</li>
              <li>Proof generation (ZK circuits compile to wasm)</li>
              <li>Attestation aggregator that builds a local Merkle tree of signed actions</li>
              <li>Nothing leaves the device unless the user's proof request says it can</li>
            </ul>
          </ArchLayer>

          <ArchLayer num="02" title="Verification layer (stateless, replicated)" tone="cyan">
            <ul>
              <li>Issuers sign anonymous credentials (blind signatures) after PoW / attestation</li>
              <li>Verifier endpoints check proofs in O(1) — they learn only the public predicate</li>
              <li>Runs on commodity nodes; no central database of users required</li>
            </ul>
          </ArchLayer>

          <ArchLayer num="03" title="Trust / Reputation layer" tone="violet">
            <ul>
              <li>Each action produces a signed <code>Attestation</code> (issuer, timestamp, delta, context)</li>
              <li>Attestations are aggregated into a Merkle tree rooted at the user's key</li>
              <li>Roots are optionally anchored on a public log (e.g. Certificate-Transparency-style)</li>
              <li>Range proofs let a user prove <em>score ≥ X</em> without revealing the tree contents</li>
            </ul>
          </ArchLayer>

          <ArchLayer num="04" title="Sybil resistance" tone="amber">
            <ul>
              <li>Per-registration PoW (variable difficulty under attack)</li>
              <li>Device-bound keys (WebAuthn / Secure Enclave attestation)</li>
              <li>Social vouching — existing high-trust users can vouch; bad vouches cost trust</li>
              <li>Optional uniqueness anchor: blind-signed government ID or phone (user choice)</li>
            </ul>
          </ArchLayer>

          <Callout tone="green" title="Decentralized vs. centralized — be critical">
            The verification layer is replicated, not blockchain-based. Blockchains add latency and cost
            without helping here — a Merkle-rooted, signature-verified attestation log delivered via
            gossip (like Certificate Transparency) is faster, cheaper, and equally tamper-evident.
            Use a blockchain only if you need censorship-resistant issuance in adversarial nation-state contexts.
          </Callout>
        </Section>

        {/* 3. Trust */}
        <Section id="trust" icon={<Zap className="w-5 h-5" />} title="3. How Trust Is Built">
          <h3>What increases trust</h3>
          <ul>
            <li>Completing verifications (PoW, device attestation, optional KYC) — one-time boost</li>
            <li>Time-on-network with no negative reports (slow linear growth with decay)</li>
            <li>Positive in-service signals: completed transactions, helpful posts, upvotes</li>
            <li>Social vouching: existing high-trust users sign a vouch (their trust is staked)</li>
          </ul>

          <h3>How trust is stored without exposing identity</h3>
          <p>
            The user's device keeps a Merkle tree of signed attestations. The leaves are never revealed;
            only the root is public. When a proof is required, the user runs a ZK circuit that takes:
          </p>
          <ul>
            <li>Public input: Merkle root, threshold <code>T</code></li>
            <li>Private witness: the attestation set, blinding factors</li>
            <li>Output: one boolean — <code>sum(attestations) ≥ T</code></li>
          </ul>
          <p>
            The verifier learns whether the threshold is met. They do not learn which attestations exist,
            who issued them, or what actions the user has taken.
          </p>

          <h3>Revocation & bad actors</h3>
          <p>
            Malicious behavior produces negative attestations. A nullifier (derived from the user's key
            and action) is added to a public banlist. On next interaction, the user must prove their
            nullifier is <em>not</em> in the set — a standard ZK membership exclusion proof.
          </p>
        </Section>

        {/* 4. Login */}
        <Section id="login" icon={<Cpu className="w-5 h-5" />} title="4. No-CAPTCHA Login">
          <p>Traditional: email + password + "click all traffic lights" + 2FA + session cookie.</p>
          <p><strong>TrustNet:</strong></p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Service sends a 32-byte random <code>challenge</code>.</li>
            <li>Client signs <code>challenge</code> with the device's private key.</li>
            <li>Client attaches a ZK proof bundle: <code>humanity ∧ trust ≥ T</code> (service-defined).</li>
            <li>Service verifies signature (proves key control) and proof (proves predicate).</li>
            <li>Session token is bound to the public key — a throwaway handle, not an account.</li>
          </ol>
          <p>
            No passwords, no CAPTCHA, no identity disclosure. The service knows it is talking to
            <em> some </em>trustworthy human; it does not know which one.
          </p>
        </Section>

        {/* 5. Security */}
        <Section id="security" icon={<Lock className="w-5 h-5" />} title="5. Security Model">
          <h3>Defended attacks</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-void-700">
                <th className="py-2 pr-4 text-slate-400 font-semibold">Attack</th>
                <th className="py-2 text-slate-400 font-semibold">Mitigation</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {[
                ['Sybil / bot farms',   'PoW + device attestation + vouch-staking + rate-limited issuance'],
                ['Credential theft',   'Keys never leave device; Secure Enclave when available'],
                ['Replay attacks',     'Per-session nonce + signed challenge + proof freshness timestamp'],
                ['Identity linking',   'Blind-signed credentials; per-service pseudonyms; unlinkable proofs'],
                ['Bad actor recycling','Nullifier banlist tied to credential, not public key'],
                ['Proof grinding',     'Trust predicates use cryptographic range proofs, not bit truncation'],
              ].map(([a, m]) => (
                <tr key={a} className="border-b border-void-800/50">
                  <td className="py-2 pr-4">{a}</td>
                  <td className="py-2 text-slate-400">{m}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="mt-6">Residual risks</h3>
          <ul>
            <li><strong>Device compromise:</strong> root access on the user's device ⇒ proof forgery. Partially mitigated by hardware-backed keys.</li>
            <li><strong>Issuer collusion:</strong> if all credential issuers collude, they can de-anonymize on timing. Mitigated by diverse issuer set + blind signatures.</li>
            <li><strong>Coercion:</strong> a user forced to reveal their key is unprotected. Standard crypto limitation — social/legal layer must handle.</li>
          </ul>
        </Section>

        {/* 6. Stack */}
        <Section id="stack" icon={<Code2 className="w-5 h-5" />} title="6. Technology Stack">
          <div className="grid md:grid-cols-2 gap-4 not-prose">
            <StackCard title="Cryptography">
              <li>ECDSA / Ed25519 for signatures</li>
              <li>BLS for attestation aggregation</li>
              <li>Groth16 or PLONK (via <code>snarkjs</code> / <code>halo2</code>) for ZK proofs</li>
              <li>Bulletproofs for range proofs</li>
              <li>BBS+ or Pointcheval-Sanders for anonymous credentials</li>
              <li>Poseidon hash (ZK-friendly) for Merkle tree</li>
            </StackCard>
            <StackCard title="Client">
              <li>Browser: WebCrypto API + wasm ZK prover</li>
              <li>Mobile: iOS Secure Enclave / Android Keystore</li>
              <li>IndexedDB for local attestation tree</li>
              <li>React / Swift / Kotlin UIs</li>
            </StackCard>
            <StackCard title="Verification layer">
              <li>Rust / Go verifier microservices</li>
              <li>gRPC / HTTP/3 transport</li>
              <li>Stateless: horizontally scalable</li>
              <li>Issuer HSMs for credential root keys</li>
            </StackCard>
            <StackCard title="Anchoring (optional)">
              <li>Certificate-Transparency-style signed log</li>
              <li>Public gossip network for Merkle roots</li>
              <li>Blockchain anchor <em>only</em> if regulatory requires</li>
            </StackCard>
          </div>
        </Section>

        {/* 7. MVP */}
        <Section id="mvp" icon={<Zap className="w-5 h-5" />} title="7. MVP in 3–6 months">
          <p>A realistic first target: a <strong>Discord-style community platform</strong> where every server gets:</p>
          <ul>
            <li>No-CAPTCHA signup: PoW + device attestation, 90 seconds</li>
            <li>Per-server moderation via nullifier bans (bad actors can't just make a new account)</li>
            <li>Age-gated rooms: posts require a live "18+" ZK proof — no IDs stored</li>
            <li>Reputation portability: a trust-30 user on Server A enters Server B with that reputation</li>
          </ul>
          <p><strong>What ships in v1:</strong></p>
          <ul>
            <li>Client SDK (TypeScript, 200kb gz incl. ZK wasm prover)</li>
            <li>Verifier node (Rust, &lt;2ms proof-verify p99)</li>
            <li>Issuer service with HSM integration</li>
            <li>Reference Discord-like app to demonstrate the UX (you're looking at the on-ramp right now)</li>
          </ul>
          <p><strong>What's deferred:</strong> mobile SDKs, multi-device key sync, regulatory KYC integrations, incentive token.</p>
        </Section>

        {/* 8. Limits */}
        <Section id="limits" icon={<AlertTriangle className="w-5 h-5" />} title="8. Limitations (be honest)">
          <div className="space-y-3">
            <LimitRow title="ZK proof size & prove time" ok={false}>
              Client-side proofs today are 100ms–2s on mobile for non-trivial circuits. Good enough for
              login, too slow for high-frequency actions. Needs folding schemes or recursive SNARKs to scale.
            </LimitRow>
            <LimitRow title="UX of losing your device" ok={false}>
              No password recovery without an identity anchor. Multi-device sync needs a threshold scheme
              (Shamir / MPC) that is still research-heavy for consumer UX.
            </LimitRow>
            <LimitRow title="Regulatory compliance" ok={false}>
              KYC/AML regimes demand identified counterparties. TrustNet can bind a blind-signed KYC credential,
              but jurisdictional acceptance is unsolved policy work, not engineering.
            </LimitRow>
            <LimitRow title="Bootstrapping trust" ok={false}>
              New users start at trust-0. Without social vouching or KYC, certain actions are gated.
              This is intentional but can feel hostile on first visit.
            </LimitRow>
            <LimitRow title="Quantum threat" ok={true}>
              ECDSA is vulnerable post-Shor. Migrate to Dilithium / Falcon when NIST PQC lands;
              attestations carry algorithm tags so rotation is painless.
            </LimitRow>
            <LimitRow title="Identity ≠ personhood" ok={true}>
              A strong humanity credential is not "one person, one account." It's "one verified-human check."
              True personhood uniqueness requires either biometric-on-device or state ID — both have tradeoffs.
            </LimitRow>
          </div>
        </Section>

        <div className="text-center mt-16 text-xs text-slate-500 font-mono">
          end of document · v0.1 · feedback welcome
        </div>
      </div>
    </div>
  )
}

// ---------- helpers ----------

function Section({ id, icon, title, children }: { id: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16 scroll-mt-20">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-trust-500/10 border border-trust-500/30 flex items-center justify-center text-trust-400">
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
      </div>
      <div className="prose prose-invert prose-slate max-w-none text-slate-300
                      prose-p:leading-relaxed prose-li:my-0.5
                      prose-code:text-trust-300 prose-code:bg-void-900/60 prose-code:px-1.5 prose-code:py-0.5
                      prose-code:rounded prose-code:font-mono prose-code:text-[0.85em] prose-code:before:hidden
                      prose-code:after:hidden prose-h3:text-slate-100 prose-strong:text-slate-100">
        {children}
      </div>
    </section>
  )
}

function MiniCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-4 rounded-lg bg-void-900/50 border border-void-800">
      <div className="text-sm font-semibold text-trust-400 mb-1">{title}</div>
      <div className="text-xs text-slate-400 leading-relaxed">{body}</div>
    </div>
  )
}

function ArchLayer({ num, title, tone, children }: { num: string; title: string; tone: 'green' | 'cyan' | 'violet' | 'amber'; children: React.ReactNode }) {
  const tones = {
    green:  'border-trust-700/40 bg-trust-950/20',
    cyan:   'border-cyan-700/30 bg-cyan-950/10',
    violet: 'border-violet-700/30 bg-violet-950/10',
    amber:  'border-amber-700/30 bg-amber-950/10',
  }
  return (
    <div className={`rounded-xl border p-5 my-3 ${tones[tone]} not-prose`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono text-xs text-slate-500">{num}</span>
        <h3 className="font-semibold text-slate-100">{title}</h3>
      </div>
      <div className="prose prose-invert prose-sm max-w-none text-slate-300 prose-li:my-0.5 prose-code:text-trust-300 prose-code:bg-void-900/60 prose-code:px-1 prose-code:rounded prose-code:text-[0.85em] prose-code:before:hidden prose-code:after:hidden">
        {children}
      </div>
    </div>
  )
}

function Callout({ tone, title, children }: { tone: 'green' | 'amber'; title: string; children: React.ReactNode }) {
  const colors = tone === 'green'
    ? 'border-trust-700/40 bg-trust-950/20 text-trust-300'
    : 'border-amber-700/40 bg-amber-950/20 text-amber-300'
  return (
    <div className={`rounded-xl border p-5 my-6 not-prose ${colors}`}>
      <div className="font-semibold mb-2">{title}</div>
      <div className="text-sm text-slate-300 leading-relaxed">{children}</div>
    </div>
  )
}

function StackCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="font-semibold text-trust-400 mb-3">{title}</div>
      <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside marker:text-trust-600">
        {children}
      </ul>
    </div>
  )
}

function LimitRow({ title, ok, children }: { title: string; ok: boolean; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 not-prose">
      {ok
        ? <CheckCircle2 className="w-5 h-5 text-trust-400 shrink-0 mt-0.5" />
        : <XCircle      className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
      <div>
        <div className="font-semibold text-slate-100">{title}</div>
        <div className="text-sm text-slate-400 leading-relaxed mt-0.5">{children}</div>
      </div>
    </div>
  )
}
