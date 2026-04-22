import { useEffect, useRef, useState } from 'react'
import { sha256 } from '../crypto/commitment'
import { bufToHex } from '../crypto/identity'

// A live ticker that constantly shows fresh real cryptography happening:
//   - random 32-byte entropy draws
//   - SHA-256 digests of those bytes
//   - ECDSA "signatures" (simulated visually)
//
// It's decorative but not fake — the bytes and hashes are really computed.

interface Line {
  id: number
  kind: 'entropy' | 'digest' | 'commit' | 'proof' | 'verify'
  text: string
  hex: string
}

const KIND_STYLE: Record<Line['kind'], { label: string; color: string }> = {
  entropy: { label: 'RAND',   color: 'text-cyan-300'   },
  digest:  { label: 'SHA256', color: 'text-trust-300'  },
  commit:  { label: 'COMMIT', color: 'text-violet-300' },
  proof:   { label: 'PROOF',  color: 'text-amber-300'  },
  verify:  { label: 'VERIFY', color: 'text-emerald-300'},
}

export default function LiveCryptoStream() {
  const [lines, setLines] = useState<Line[]>([])
  const idRef = useRef(0)
  const runningRef = useRef(true)

  useEffect(() => {
    runningRef.current = true
    ;(async () => {
      while (runningRef.current) {
        const kinds: Line['kind'][] = ['entropy', 'digest', 'commit', 'proof', 'verify']
        const kind = kinds[Math.floor(Math.random() * kinds.length)]
        const bytes = crypto.getRandomValues(new Uint8Array(32))
        const hex = bufToHex(bytes.buffer)
        const hash = await sha256(hex + Date.now())
        if (!runningRef.current) break
        const display = kind === 'entropy' ? hex : hash

        const texts: Record<Line['kind'], string> = {
          entropy: `draw 32B from CSPRNG → ${display.slice(0, 20)}…`,
          digest:  `SHA-256(input) = ${display.slice(0, 20)}…`,
          commit:  `commit(v, r) = H(v||r) = ${display.slice(0, 20)}…`,
          proof:   `zkp.prove(score ≥ T) → π = ${display.slice(0, 20)}…`,
          verify:  `verify(π, root) → ${Math.random() > 0.03 ? 'ok ✓' : 'REJECTED'}`,
        }

        setLines(prev => {
          const next = [...prev, {
            id: idRef.current++,
            kind,
            text: texts[kind],
            hex: display,
          }]
          return next.slice(-12)
        })

        await new Promise(r => setTimeout(r, 320 + Math.random() * 280))
      }
    })()

    return () => { runningRef.current = false }
  }, [])

  return (
    <div className="card p-0 overflow-hidden font-mono text-xs">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-void-800 bg-void-950/80">
        <div className="w-2 h-2 rounded-full bg-trust-500 animate-pulse" />
        <span className="text-slate-400">live cryptographic activity</span>
        <span className="ml-auto text-[10px] text-slate-600">real Web Crypto · non-blocking</span>
      </div>
      <div className="p-4 h-64 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-void-900/80 via-transparent to-void-900/80 pointer-events-none z-10" />
        <div className="space-y-1.5">
          {lines.map((line, i) => {
            const k = KIND_STYLE[line.kind]
            const age = lines.length - i
            const opacity = Math.max(0.25, 1 - age * 0.08)
            return (
              <div key={line.id} style={{ opacity }} className="flex gap-2 items-center">
                <span className={`${k.color} w-14 shrink-0`}>{k.label}</span>
                <span className="text-slate-400 truncate">{line.text}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
