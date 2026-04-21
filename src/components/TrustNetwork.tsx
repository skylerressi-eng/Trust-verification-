import { useEffect, useRef } from 'react'

// Animated force-directed graph of "identity nodes" connected by trust edges.
// Pure canvas — no physics library. Efficient enough for ~60fps on a phone.

interface Node {
  x: number; y: number
  vx: number; vy: number
  radius: number
  hue: number
  verified: boolean
  pulse: number
}

interface Edge { a: number; b: number; strength: number }

export default function TrustNetwork({ height = 520 }: { height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf = 0
    let w = canvas.clientWidth
    let h = canvas.clientHeight

    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    // Seed nodes
    const N = 34
    const nodes: Node[] = Array.from({ length: N }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      radius: 2 + Math.random() * 2.5,
      hue: 140 + Math.random() * 30,
      verified: Math.random() > 0.2,
      pulse: Math.random() * Math.PI * 2,
    }))

    // Build edges between nearby-ish nodes
    const edges: Edge[] = []
    for (let i = 0; i < N; i++) {
      const peers = 2 + Math.floor(Math.random() * 2)
      for (let k = 0; k < peers; k++) {
        const b = Math.floor(Math.random() * N)
        if (b !== i) edges.push({ a: i, b, strength: 0.3 + Math.random() * 0.6 })
      }
    }

    const onResize = () => resize()
    window.addEventListener('resize', onResize)

    let mouseX = -1000, mouseY = -1000
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      mouseX = e.clientX - r.left
      mouseY = e.clientY - r.top
    }
    const onLeave = () => { mouseX = -1000; mouseY = -1000 }
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)

    let t0 = performance.now()
    const draw = () => {
      const now = performance.now()
      const dt = Math.min(32, now - t0)
      t0 = now

      ctx.clearRect(0, 0, w, h)

      // Update physics
      for (const n of nodes) {
        n.x += n.vx * dt
        n.y += n.vy * dt
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1
        n.x = Math.max(0, Math.min(w, n.x))
        n.y = Math.max(0, Math.min(h, n.y))
        n.pulse += 0.01 + dt * 0.0003

        // Gentle attraction to mouse
        const dx = mouseX - n.x
        const dy = mouseY - n.y
        const d = Math.hypot(dx, dy)
        if (d < 140 && d > 1) {
          n.vx += (dx / d) * 0.0008 * dt
          n.vy += (dy / d) * 0.0008 * dt
        }
        // Damping
        n.vx *= 0.995
        n.vy *= 0.995
      }

      // Draw edges
      for (const e of edges) {
        const a = nodes[e.a], b = nodes[e.b]
        const dx = a.x - b.x, dy = a.y - b.y
        const dist = Math.hypot(dx, dy)
        if (dist > 240) continue
        const alpha = (1 - dist / 240) * 0.35 * e.strength
        ctx.strokeStyle = `rgba(74, 222, 128, ${alpha})`
        ctx.lineWidth = 0.6
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()

        // Occasionally animate a proof packet moving across the edge
        const packetT = ((now / 3000) + (e.a * 0.1 + e.b * 0.17)) % 1
        if (e.strength > 0.6) {
          const px = a.x + (b.x - a.x) * packetT
          const py = a.y + (b.y - a.y) * packetT
          ctx.fillStyle = `rgba(134, 239, 172, ${0.6 * alpha * 3})`
          ctx.beginPath()
          ctx.arc(px, py, 1.6, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Draw nodes
      for (const n of nodes) {
        const pulseR = n.radius + Math.sin(n.pulse) * 0.8
        // Halo
        if (n.verified) {
          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 18)
          grad.addColorStop(0, 'rgba(74, 222, 128, 0.25)')
          grad.addColorStop(1, 'rgba(74, 222, 128, 0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(n.x, n.y, 18, 0, Math.PI * 2)
          ctx.fill()
        }
        // Core
        ctx.fillStyle = n.verified
          ? `hsla(${n.hue}, 75%, 65%, 0.95)`
          : 'rgba(148, 163, 184, 0.5)'
        ctx.beginPath()
        ctx.arc(n.x, n.y, pulseR, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        style={{ height, width: '100%' }}
        className="w-full pointer-events-auto"
      />
    </div>
  )
}
