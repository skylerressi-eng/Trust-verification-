// Hand-crafted SVG diagrams — no external diagram library

export function LayerDiagram() {
  return (
    <div className="my-8 rounded-xl border border-void-800 bg-void-950/60 p-6 overflow-x-auto">
      <svg viewBox="0 0 760 340" className="w-full min-w-[640px]">
        <defs>
          <linearGradient id="layerGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(34,197,94,0.1)" />
            <stop offset="100%" stopColor="rgba(74,222,128,0.03)" />
          </linearGradient>
        </defs>

        {/* Top boundary label */}
        <text x="380" y="18" textAnchor="middle" className="fill-slate-500" fontSize="11" fontFamily="JetBrains Mono">
          ▼ User's device · private data never crosses this line ▼
        </text>

        {/* Layer 1: Client */}
        <Layer x={30} y={40}  w={700} h={60} label="CLIENT (device)" detail="keypair · attestations · local Merkle tree · ZK prover" color="#22c55e" />
        {/* Layer 2: Verification */}
        <Layer x={30} y={120} h={60} w={700} label="VERIFICATION (stateless nodes)" detail="issuers · verifiers · blind-signature gateway" color="#06b6d4" />
        {/* Layer 3: Trust */}
        <Layer x={30} y={200} h={60} w={700} label="TRUST / REPUTATION" detail="attestation log · nullifier banlist · CT-style anchor" color="#8b5cf6" />
        {/* Layer 4: Sybil */}
        <Layer x={30} y={280} h={40} w={700} label="SYBIL DEFENSE" detail="PoW · device attestation · vouch staking · optional ID anchor" color="#f59e0b" />

        {/* Arrows between layers */}
        <Arrow x1={380} y1={100} x2={380} y2={118} />
        <Arrow x1={380} y1={180} x2={380} y2={198} />
        <Arrow x1={380} y1={260} x2={380} y2={278} />
      </svg>
    </div>
  )
}

export function LoginSequenceDiagram() {
  return (
    <div className="my-8 rounded-xl border border-void-800 bg-void-950/60 p-6 overflow-x-auto">
      <svg viewBox="0 0 720 380" className="w-full min-w-[640px]">
        {/* Actor lanes */}
        <Lane x={110} label="USER CLIENT" />
        <Lane x={360} label="SERVICE" />
        <Lane x={610} label="VERIFIER" />

        {/* Lifelines */}
        {[110, 360, 610].map(x => (
          <line key={x} x1={x} y1={56} x2={x} y2={360}
                stroke="rgba(71,85,105,0.4)" strokeDasharray="3 4" />
        ))}

        {/* Steps */}
        <Step y={90}  from={360} to={110} label="① random challenge (32B nonce)" />
        <Step y={140} from={110} to={360} label="② signed challenge + ZK proof bundle" />
        <Step y={190} from={360} to={610} label="③ forward proof for verification" />
        <Step y={240} from={610} to={360} label="④ verdict: predicate satisfied" dashed />
        <Step y={290} from={360} to={110} label="⑤ session token bound to pubkey" />

        <text x={360} y={344} textAnchor="middle" className="fill-trust-400" fontSize="11" fontFamily="JetBrains Mono">
          no email · no password · no CAPTCHA · no identity disclosed
        </text>
      </svg>
    </div>
  )
}

export function TrustAggregationDiagram() {
  return (
    <div className="my-8 rounded-xl border border-void-800 bg-void-950/60 p-6 overflow-x-auto">
      <svg viewBox="0 0 720 320" className="w-full min-w-[640px]">
        {/* Leaves */}
        {[
          { x: 60,  label: 'post +1',      iss: 'forum' },
          { x: 180, label: 'vouch +5',     iss: 'userX' },
          { x: 300, label: 'trade +3',     iss: 'market' },
          { x: 420, label: 'kyc +10',      iss: 'id-svc' },
          { x: 540, label: 'upvote +1',    iss: 'reddit-fork' },
          { x: 660, label: 'vouch +5',     iss: 'userY' },
        ].map(l => (
          <g key={l.x}>
            <rect x={l.x - 50} y={230} width={100} height={40} rx={6}
                  fill="rgba(34,197,94,0.08)" stroke="rgba(34,197,94,0.5)" />
            <text x={l.x} y={250} textAnchor="middle" className="fill-trust-300" fontSize="11" fontFamily="JetBrains Mono">{l.label}</text>
            <text x={l.x} y={264} textAnchor="middle" className="fill-slate-500" fontSize="9" fontFamily="JetBrains Mono">{l.iss}</text>
          </g>
        ))}

        {/* Intermediate nodes */}
        {[{ x: 120 }, { x: 360 }, { x: 600 }].map((n) => (
          <circle key={n.x} cx={n.x} cy={150} r={12} fill="rgba(139,92,246,0.2)" stroke="rgba(139,92,246,0.6)" />
        ))}

        {/* Top-level nodes */}
        <circle cx={240} cy={80} r={14} fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.7)" />
        <circle cx={480} cy={80} r={14} fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.7)" />

        {/* Root */}
        <rect x={310} y={18} width={100} height={28} rx={6}
              fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.9)" />
        <text x={360} y={37} textAnchor="middle" className="fill-trust-300" fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">
          MERKLE ROOT
        </text>

        {/* Edges */}
        {[
          [60,  230, 120, 162],  [180, 230, 120, 162],
          [300, 230, 360, 162],  [420, 230, 360, 162],
          [540, 230, 600, 162],  [660, 230, 600, 162],
          [120, 138, 240, 94],   [360, 138, 240, 94],
          [360, 138, 480, 94],   [600, 138, 480, 94],
          [240, 66,  360, 46],   [480, 66,  360, 46],
        ].map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(71,85,105,0.6)" strokeWidth="1" />
        ))}

        <text x={360} y={310} textAnchor="middle" className="fill-slate-500" fontSize="10" fontFamily="JetBrains Mono">
          range proof: <tspan className="fill-trust-300">sum(leaves) ≥ 70</tspan> · leaves never revealed
        </text>
      </svg>
    </div>
  )
}

// --- helpers ---

function Layer({
  x, y, w, h, label, detail, color,
}: { x: number; y: number; w: number; h: number; label: string; detail: string; color: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8}
            fill={`${color}11`} stroke={`${color}99`} strokeWidth="1" />
      <text x={x + 16} y={y + 24} className="fill-slate-100" fontSize="12" fontWeight="bold" fontFamily="Inter">
        {label}
      </text>
      <text x={x + 16} y={y + 42} className="fill-slate-400" fontSize="11" fontFamily="JetBrains Mono">
        {detail}
      </text>
      <circle cx={x + w - 16} cy={y + h / 2} r={4} fill={color} />
    </g>
  )
}

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <g stroke="rgba(74,222,128,0.6)" strokeWidth="1.5" fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <polygon points={`${x2},${y2} ${x2 - 4},${y2 - 6} ${x2 + 4},${y2 - 6}`}
               fill="rgba(74,222,128,0.6)" />
    </g>
  )
}

function Lane({ x, label }: { x: number; label: string }) {
  return (
    <g>
      <rect x={x - 65} y={28} width={130} height={28} rx={4}
            fill="rgba(34,197,94,0.1)" stroke="rgba(34,197,94,0.4)" />
      <text x={x} y={46} textAnchor="middle" className="fill-trust-300" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">
        {label}
      </text>
    </g>
  )
}

function Step({ y, from, to, label, dashed = false }: { y: number; from: number; to: number; label: string; dashed?: boolean }) {
  const dir = to > from ? 1 : -1
  const arrowX = to
  return (
    <g>
      <line x1={from} y1={y} x2={to - 6 * dir} y2={y}
            stroke="rgba(74,222,128,0.8)" strokeWidth="1.5"
            strokeDasharray={dashed ? '4 3' : undefined} />
      <polygon points={`${arrowX},${y} ${arrowX - 6 * dir},${y - 4} ${arrowX - 6 * dir},${y + 4}`}
               fill="rgba(74,222,128,0.8)" />
      <text x={(from + to) / 2} y={y - 8} textAnchor="middle" className="fill-slate-200"
            fontSize="11" fontFamily="JetBrains Mono">
        {label}
      </text>
    </g>
  )
}
