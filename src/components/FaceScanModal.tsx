import { useState, useEffect, useRef } from 'react'
import { X, Camera, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react'
import { useTrust } from '../store/trustStore'
import { useToast } from './Toast'

type ScanPhase = 'requesting' | 'scanning' | 'analyzing' | 'complete' | 'error'

const PHASE_LABELS: Record<ScanPhase, string> = {
  requesting: 'Requesting camera access…',
  scanning:   'Scanning face geometry…',
  analyzing:  'Analyzing biometric data…',
  complete:   'Verification complete',
  error:      'Camera access denied',
}

export default function FaceScanModal({ onClose }: { onClose: () => void }) {
  const trust = useTrust()
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [phase, setPhase] = useState<ScanPhase>('requesting')
  const [progress, setProgress] = useState(0)
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    let iv: ReturnType<typeof setInterval>

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setPhase('scanning')

        let p = 0
        iv = setInterval(() => {
          p += 1.8
          setProgress(Math.min(100, p))
          if (p >= 60 && p < 62) setPhase('analyzing')
          if (p >= 100) {
            clearInterval(iv)
            setPhase('complete')
            setTimeout(() => {
              if (!cancelled) {
                if (!trust.faceScanDone) {
                  trust.setFaceScanDone()
                  trust.addAttestation({
                    id: crypto.randomUUID(),
                    action: 'face_scan_verified',
                    delta: 25,
                    timestamp: Date.now(),
                    issuer: 'trustnet-biometric-v1',
                  })
                  toast('success', 'Biometric verified', '+25 trust · face geometry confirmed')
                }
                onClose()
              }
            }, 1200)
          }
        }, 55)
      })
      .catch(err => {
        if (cancelled) return
        setErrMsg(err instanceof Error ? err.message : 'Camera unavailable')
        setPhase('error')
        toast('error', 'Camera denied', 'Grant camera permission to verify biometrics.')
      })

    return () => {
      cancelled = true
      clearInterval(iv)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void-950/90 backdrop-blur-sm">
      <div className="card max-w-sm w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-trust-500/10 border border-trust-500/30 flex items-center justify-center">
            <Camera className="w-4 h-4 text-trust-400" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100">Biometric Verification</h2>
            <p className="text-[11px] text-slate-500">Face geometry · never stored · +25 trust</p>
          </div>
        </div>

        {/* Camera viewport */}
        <div className="relative rounded-xl overflow-hidden bg-void-950 border border-void-800" style={{ height: 240 }}>
          {phase === 'error' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
              <AlertTriangle className="w-10 h-10 text-amber-400" />
              <p className="text-sm text-slate-400 text-center">{errMsg || 'Camera access was denied.'}</p>
            </div>
          ) : phase === 'complete' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                 style={{ background: 'rgba(5,46,22,0.6)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center glow-pulse"
                   style={{ background: 'rgba(34,197,94,0.2)', border: '2px solid rgba(34,197,94,0.6)' }}>
                <ShieldCheck className="w-8 h-8 text-trust-400" />
              </div>
              <p className="text-trust-300 font-semibold">Identity Confirmed</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay playsInline muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* Corner brackets */}
              {(['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'] as const).map((pos, i) => {
                const isTop    = pos.includes('top')
                const isLeft   = pos.includes('left')
                return (
                  <div key={i} className={`absolute ${pos} w-8 h-8 pointer-events-none`}>
                    <div className={`absolute w-full h-0.5 bg-trust-400 ${isTop ? 'top-0' : 'bottom-0'}`} />
                    <div className={`absolute h-full w-0.5 bg-trust-400 ${isLeft ? 'left-0' : 'right-0'}`} />
                  </div>
                )
              })}

              {(phase === 'scanning' || phase === 'analyzing') ? (
                <div className="absolute left-0 right-0 h-0.5 face-scan-line pointer-events-none"
                     style={{ background: 'linear-gradient(90deg, transparent, rgba(74,222,128,0.8), transparent)' }} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-trust-400 animate-spin" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Progress bar */}
        {(phase === 'scanning' || phase === 'analyzing') && (
          <div className="mt-4 progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Status */}
        <div className="mt-3 flex items-center gap-2">
          {(phase === 'requesting' || phase === 'scanning' || phase === 'analyzing') &&
            <Loader2 className="w-3.5 h-3.5 text-trust-400 animate-spin shrink-0" />}
          {phase === 'complete' && <ShieldCheck className="w-3.5 h-3.5 text-trust-400 shrink-0" />}
          {phase === 'error'    && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          <span className={`text-sm ${
            phase === 'error'    ? 'text-amber-400' :
            phase === 'complete' ? 'text-trust-300' :
            'text-slate-400'
          }`}>{PHASE_LABELS[phase]}</span>
        </div>

        {phase === 'error' && (
          <button onClick={onClose} className="btn-ghost w-full mt-4 text-sm py-2">Close</button>
        )}
      </div>
    </div>
  )
}
