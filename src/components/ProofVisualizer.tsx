// Interactive ZK proof structure visualizer.
// Renders the three components of a proof (commitment, challenge, response) as
// an SVG circuit diagram with expandable byte fields and hover explanations.

import { useState } from 'react'
import type { ZKProof } from '../crypto/zkp'

interface Props { proof: ZKProof }

export default function ProofVisualizer({ proof }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const fields: Array<{ key: string; label: string; value: string; color: string; description: string }> = [
    {
      key: 'commitment',
      label: 'Commitment',
      value: proof.commitment,
      color: '#8b5cf6',
      description: 'commit(witness, r) = SHA-256(witness || random_blinding). Binds the prover to a value without revealing it.',
    },
    {
      key: 'challenge',
      label: 'Challenge',
      value: proof.challenge,
      color: '#06b6d4',
      description: 'Random 32-byte nonce issued by the verifier. Prevents the prover from pre-computing responses.',
    },
    {
      key: 'response',
      label: 'Response',
      value: proof.response,
      color: '#22c55e',
      description: 'response = SHA-256(privkey || challenge || witness). Binds identity + challenge + secret in one digest.',
    },
  ]

  return (
    <div className="rounded-xl border border-void-700/50 bg-void-950/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-void-800/60 bg-void-900/40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-trust-400 animate-pulse" />
          <span className="text-xs font-mono text-slate-400">ZK Proof · {proof.type}</span>
        </div>
        <span className="text-[10px] font-mono text-slate-600">id:{proof.id.slice(0, 8)}</span>
      </div>

      {/* SVG diagram */}
      <div className="px-4 pt-4 pb-2">
        <svg viewBox="0 0 420 80" className="w-full max-w-lg">
          {/* Wire */}
          <line x1="60" y1="40" x2="360" y2="40" stroke="rgba(71,85,105,0.5)" strokeWidth="1" />

          {/* Nodes */}
          {fields.map((f, i) => {
            const x = 70 + i * 140
            return (
              <g key={f.key}>
                <circle cx={x} cy={40} r={18}
                  fill={`${f.color}22`}
                  stroke={f.color}
                  strokeWidth={expanded === f.key ? 2 : 1}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setExpanded(e => e === f.key ? null : f.key)}
                />
                <text x={x} y={44} textAnchor="middle" fontSize="7" fontFamily="JetBrains Mono" fill={f.color}>
                  {f.value.slice(0, 6)}…
                </text>
                <text x={x} y={67} textAnchor="middle" fontSize="9" fontFamily="Inter" fill="rgba(148,163,184,0.8)">
                  {f.label}
                </text>

                {/* Connector arrows */}
                {i < fields.length - 1 && (
                  <g>
                    <line x1={x + 20} y1={40} x2={x + 118} y2={40}
                          stroke="rgba(34,197,94,0.3)" strokeWidth="1" markerEnd="url(#arr)" />
                  </g>
                )}
              </g>
            )
          })}

          <defs>
            <marker id="arr" markerWidth="6" markerHeight="4" refX="3" refY="2" orient="auto">
              <path d="M0,0 L6,2 L0,4" fill="rgba(34,197,94,0.4)" />
            </marker>
          </defs>

          {/* Labels */}
          <text x="210" y="15" textAnchor="middle" fontSize="9" fontFamily="JetBrains Mono" fill="rgba(100,116,139,0.7)">
            click a node to inspect
          </text>
        </svg>
      </div>

      {/* Expanded field */}
      {expanded && (() => {
        const f = fields.find(f => f.key === expanded)!
        return (
          <div className="mx-4 mb-4 p-3 rounded-xl border border-void-700/50 bg-void-950/60"
               style={{ borderColor: `${f.color}40` }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
              <span className="text-sm font-semibold" style={{ color: f.color }}>{f.label}</span>
            </div>
            <p className="text-xs text-slate-400 mb-2 leading-relaxed">{f.description}</p>
            <code className="text-[10px] font-mono break-all leading-relaxed" style={{ color: `${f.color}cc` }}>
              {f.value}
            </code>
          </div>
        )
      })()}

      {/* Statement */}
      <div className="px-4 pb-3 text-[11px] font-mono text-slate-500">
        statement: <span className="text-trust-400/80">{proof.statement}</span>
      </div>
    </div>
  )
}
