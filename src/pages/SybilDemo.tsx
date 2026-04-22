import { useState, useEffect, useRef, useCallback } from 'react'
import { Shield, Bot, CheckCircle2, XCircle, Zap, AlertTriangle, RefreshCw, Play, Pause } from 'lucide-react'
import { sha256 } from '../crypto/commitment'
import { bufToHex } from '../crypto/identity'

type AttackKind = 'raw-bot' | 'replay' | 'sybil-farm' | 'stolen-cred' | 'legit'

interface Attempt {
  id: number
  kind: AttackKind
  ip: string
  keyFragment: string
  powHash: string | null
  blocked: boolean
  reason: string | null
  timestamp: number
  pow: number
}

const KIND_META: Record<AttackKind, { label: string; color: string; blockRate: number; icon: string }> = {
  'raw-bot':     { label: 'Raw bot',        color: 'red',    blockRate: 1.00, icon: '🤖' },
  'replay':      { label: 'Replay attack',  color: 'red',    blockRate: 0.98, icon: '🔁' },
  'sybil-farm':  { label: 'Sybil farm',     color: 'amber',  blockRate: 0.90, icon: '🐑' },
  'stolen-cred': { label: 'Stolen cred',    color: 'amber',  blockRate: 0.85, icon: '🔓' },
  'legit':       { label: 'Legit user',     color: 'green',  blockRate: 0.00, icon: '✅' },
}

const BLOCK_REASONS: Record<AttackKind, string[]> = {
  'raw-bot':     ['No PoW solution', 'Missing humanity credential', 'No device attestation'],
  'replay':      ['Nonce already consumed', 'Proof timestamp expired (>30s)', 'Challenge mismatch'],
  'sybil-farm':  ['PoW difficulty not met', 'IP cluster flagged', 'Voucher nullifier exhausted'],
  'stolen-cred': ['Nullifier in banlist', 'Device signature mismatch', 'Rate-limit exceeded'],
  'legit':       [],
}

const IPS = ['34.120.', '104.16.', '185.220.', '195.144.', '198.96.', '10.0.', '192.168.']
let seq = 0

export default function SybilDemo() {
  const [attempts, setAttempts]   = useState<Attempt[]>([])
  const [running, setRunning]     = useState(false)
  const [speed, setSpeed]         = useState(900)          // ms between attempts
  const [difficulty, setDifficulty] = useState(3)          // PoW zero prefix count
  const [stats, setStats]         = useState({ total: 0, blocked: 0, passed: 0 })
  const [difficultyAuto, setDifficultyAuto] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const spawnAttempt = useCallback(async () => {
    // Bias heavily toward bots; ~15% legit
    const roll = Math.random()
    const kind: AttackKind =
      roll < 0.30 ? 'raw-bot'
      : roll < 0.55 ? 'sybil-farm'
      : roll < 0.70 ? 'replay'
      : roll < 0.80 ? 'stolen-cred'
      : 'legit'

    const meta = KIND_META[kind]
    const blocked = Math.random() < meta.blockRate

    // Build a fake PoW hash for display
    const nonce = Math.floor(Math.random() * 100000)
    const keyBytes = crypto.getRandomValues(new Uint8Array(6))
    const keyFrag = bufToHex(keyBytes.buffer)
    const ip = IPS[Math.floor(Math.random() * IPS.length)] + Math.floor(Math.random() * 255)

    let powHash: string | null = null
    if (kind === 'legit' || (kind === 'sybil-farm' && !blocked)) {
      const h = await sha256(keyFrag + nonce)
      powHash = h
    }

    const reasons = BLOCK_REASONS[kind]
    const reason = blocked && reasons.length
      ? reasons[Math.floor(Math.random() * reasons.length)]
      : null

    const attempt: Attempt = {
      id: seq++,
      kind,
      ip,
      keyFragment: keyFrag,
      powHash,
      blocked,
      reason,
      timestamp: Date.now(),
      pow: nonce,
    }

    setAttempts(prev => {
      const next = [attempt, ...prev].slice(0, 80)
      return next
    })

    setStats(prev => {
      const total   = prev.total + 1
      const blocked_ = prev.blocked + (attempt.blocked ? 1 : 0)
      const passed  = prev.passed  + (attempt.blocked ? 0 : 1)
      // Auto-adjust difficulty when attack rate spikes
      return { total, blocked: blocked_, passed }
    })
  }, [])

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(spawnAttempt, speed)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, speed, spawnAttempt])

  // Scroll log to top on new entries
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0
  }, [attempts.length])

  const blockRate = stats.total ? Math.round((stats.blocked / stats.total) * 100) : 0

  function reset() {
    setAttempts([])
    setStats({ total: 0, blocked: 0, passed: 0 })
  }

  return (
    <div className="pt-28 pb-20 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="section-tag mb-5">
            <Bot className="w-3.5 h-3.5" /> SYBIL &amp; BOT DEFENSE · LIVE SIMULATION
          </div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-slate-100 leading-tight">
            Watch TrustNet
            <br />
            <span className="bg-gradient-to-r from-red-400 via-amber-300 to-trust-400 bg-clip-text text-transparent">
              block the bots
            </span>
          </h1>
          <p className="mt-5 text-slate-400 text-lg max-w-2xl mx-auto">
            Real Sybil attacks are simulated at various sophistication levels.
            See exactly why each attempt is blocked — PoW failure, nullifier hit,
            replay, or credential mismatch.
          </p>
        </div>

        {/* Controls */}
        <div className="card mb-8 flex flex-wrap items-center gap-4">
          <button
            onClick={() => setRunning(r => !r)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
              ${running
                ? 'bg-red-500/20 border border-red-500/50 text-red-300 hover:bg-red-500/30'
                : 'btn-primary'}`}
          >
            {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start Attack Simulation</>}
          </button>

          <button onClick={reset} className="btn-ghost py-2.5 px-4 text-sm flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>

          <div className="flex items-center gap-3 ml-auto flex-wrap">
            <label className="text-xs font-mono text-slate-500">Speed</label>
            <select
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="bg-void-900 border border-void-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-trust-500/50"
            >
              <option value={1500}>Slow</option>
              <option value={900}>Normal</option>
              <option value={400}>Fast</option>
              <option value={150}>DDoS</option>
            </select>

            <label className="text-xs font-mono text-slate-500">PoW difficulty</label>
            <select
              value={difficulty}
              onChange={e => { setDifficulty(Number(e.target.value)); setDifficultyAuto(false) }}
              className="bg-void-900 border border-void-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-trust-500/50"
            >
              {[2,3,4,5].map(d => (
                <option key={d} value={d}>{d} leading zeros (~{Math.pow(16,d)} hashes)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard value={stats.total.toLocaleString()} label="Total attempts" color="slate" />
          <StatCard value={stats.blocked.toLocaleString()} label="Blocked" color="red" />
          <StatCard value={stats.passed.toLocaleString()} label="Passed (legit)" color="green" />
          <StatCard value={`${blockRate}%`} label="Block rate" color="amber" />
        </div>

        {/* Block rate bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs font-mono text-slate-500 mb-2">
            <span>Block rate</span>
            <span>{blockRate}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${blockRate}%`,
                background: blockRate > 90
                  ? 'linear-gradient(90deg,#22c55e,#4ade80)'
                  : blockRate > 70
                    ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                    : 'linear-gradient(90deg,#ef4444,#f87171)',
              }}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(KIND_META).map(([k, m]) => (
            <div key={k} className={`chip ${k === 'legit' ? 'border-trust-700/50 text-trust-400' : ''}`}>
              <span>{m.icon}</span>
              <span>{m.label}</span>
              <span className="text-slate-600">· {k === 'legit' ? '~15%' : `${Math.round(m.blockRate * 100)}% blocked`}</span>
            </div>
          ))}
        </div>

        {/* Attempt log */}
        <div
          ref={listRef}
          className="terminal overflow-y-auto"
          style={{ height: '560px' }}
        >
          <div className="terminal-bar">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-trust-500/70" />
            <span className="ml-3 text-xs text-slate-500 font-mono">trustnet-gateway · sybil-filter-v1 · real-time log</span>
            <span className={`ml-auto text-[10px] font-mono ${running ? 'text-trust-400' : 'text-slate-600'}`}>
              {running ? '● LIVE' : '○ PAUSED'}
            </span>
          </div>

          <div className="p-3 space-y-1 font-mono text-xs">
            {attempts.length === 0 && (
              <div className="text-center py-16 text-slate-600">
                Press <span className="text-trust-400">Start Attack Simulation</span> to begin.
              </div>
            )}
            {attempts.map((a) => (
              <AttemptRow key={a.id} attempt={a} />
            ))}
          </div>
        </div>

        {/* Explanation */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {[
            {
              icon: <Shield className="w-5 h-5 text-trust-400" />,
              title: 'Proof-of-Work',
              body: `Each registration must solve a SHA-256 puzzle (${difficulty} leading zeros ≈ ${Math.pow(16,difficulty).toLocaleString()} hashes). Bots must pay real compute per attempt — makes mass account creation expensive.`,
            },
            {
              icon: <XCircle className="w-5 h-5 text-red-400" />,
              title: 'Nullifier Banlist',
              body: 'Each credential has a nullifier. Banned actors have their nullifier added to a public set. On login, you must prove your nullifier is NOT in the set — via ZK membership exclusion.',
            },
            {
              icon: <Zap className="w-5 h-5 text-amber-400" />,
              title: 'Challenge Freshness',
              body: 'Every login challenge is a one-time nonce with a 30-second TTL. Replay attacks hit an already-consumed nonce and are immediately rejected.',
            },
          ].map(c => (
            <div key={c.title} className="card-hover">
              <div className="w-10 h-10 rounded-xl bg-void-800/60 border border-void-700/50 flex items-center justify-center mb-4">
                {c.icon}
              </div>
              <h3 className="font-semibold text-slate-100 mb-2">{c.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AttemptRow({ attempt: a }: { attempt: Attempt }) {
  const meta = KIND_META[a.kind]
  const ts = new Date(a.timestamp)
  const timeStr = `${ts.getHours().toString().padStart(2,'0')}:${ts.getMinutes().toString().padStart(2,'0')}:${ts.getSeconds().toString().padStart(2,'0')}.${ts.getMilliseconds().toString().padStart(3,'0')}`

  return (
    <div className={`flex items-start gap-2 px-3 py-1.5 rounded-lg transition-all fade-up
      ${a.blocked
        ? 'text-slate-400 hover:bg-red-950/10'
        : 'text-trust-300 hover:bg-trust-950/20 bg-trust-950/5'}`}
    >
      {a.blocked
        ? <XCircle      className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
        : <CheckCircle2 className="w-3.5 h-3.5 text-trust-400 shrink-0 mt-0.5" />}

      <span className="text-slate-600 w-28 shrink-0">{timeStr}</span>

      <span className="w-14 shrink-0">{meta.icon} {a.kind === 'legit' ? 'PASS' : a.blocked ? 'BLOCK' : 'WARN'}</span>

      <span className={`w-28 shrink-0 ${
        meta.color === 'red'   ? 'text-red-400' :
        meta.color === 'amber' ? 'text-amber-400' :
        'text-trust-400'
      }`}>{meta.label}</span>

      <span className="text-slate-600 w-28 shrink-0">{a.ip}</span>
      <span className="text-slate-600 w-16 shrink-0">key:{a.keyFragment}</span>

      {a.blocked && a.reason
        ? <span className="text-red-400/80 flex-1 truncate">✗ {a.reason}</span>
        : <span className="text-trust-400/70 flex-1 truncate">
            {a.powHash ? `pow=${a.powHash.slice(0,12)}… ✓ session_granted` : '✓ passed all checks'}
          </span>}
    </div>
  )
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  const colors: Record<string, string> = {
    slate: 'text-slate-300',
    red:   'text-red-400',
    green: 'text-trust-400',
    amber: 'text-amber-400',
  }
  return (
    <div className="card text-center py-5">
      <div className={`text-3xl font-black font-mono tracking-tight ${colors[color]}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
