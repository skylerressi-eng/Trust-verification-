import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'

interface ToastMsg {
  id: number
  kind: ToastKind
  title: string
  body?: string
  exiting?: boolean
}

interface ToastCtx {
  toast: (kind: ToastKind, title: string, body?: string) => void
}

const Ctx = createContext<ToastCtx | null>(null)
let seq = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msgs, setMsgs] = useState<ToastMsg[]>([])

  const dismiss = useCallback((id: number) => {
    setMsgs(prev => prev.map(m => m.id === id ? { ...m, exiting: true } : m))
    setTimeout(() => setMsgs(prev => prev.filter(m => m.id !== id)), 280)
  }, [])

  const toast = useCallback((kind: ToastKind, title: string, body?: string) => {
    const id = seq++
    setMsgs(prev => [...prev.slice(-3), { id, kind, title, body }])
    setTimeout(() => dismiss(id), kind === 'error' ? 5000 : 3000)
  }, [dismiss])

  const icons: Record<ToastKind, ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-trust-400 shrink-0" />,
    error:   <XCircle      className="w-4 h-4 text-red-400 shrink-0" />,
    info:    <Info         className="w-4 h-4 text-violet-400 shrink-0" />,
  }

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {msgs.map(m => (
          <div
            key={m.id}
            className={`toast toast-${m.kind} pointer-events-auto${m.exiting ? ' toast-exit' : ''}`}
          >
            {icons[m.kind]}
            <div>
              <div className="font-semibold">{m.title}</div>
              {m.body && <div className="text-xs opacity-70 mt-0.5">{m.body}</div>}
            </div>
            <button onClick={() => dismiss(m.id)} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
