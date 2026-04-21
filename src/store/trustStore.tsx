// Global trust store — persists to localStorage, never stores raw identity
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { TrustIdentity, SerializedKeyPair } from '../crypto/identity'
import type { ZKProof } from '../crypto/zkp'
import type { Commitment } from '../crypto/commitment'

export interface TrustAttestation {
  id: string
  action: string
  delta: number
  timestamp: number
  issuer: string
}

export interface TrustState {
  identity: TrustIdentity | null
  serializedKeys: SerializedKeyPair | null
  proofs: ZKProof[]
  attestations: TrustAttestation[]
  trustScore: number
  humanityVerified: boolean
  powHash: string | null
  registered: boolean
}

interface TrustContextValue extends TrustState {
  setIdentity: (id: TrustIdentity, keys: SerializedKeyPair) => void
  addProof: (p: ZKProof) => void
  addAttestation: (a: TrustAttestation) => void
  setPowHash: (h: string) => void
  setHumanityVerified: (v: boolean) => void
  setRegistered: (v: boolean) => void
  reset: () => void
}

const STORAGE_KEY = 'trustnet_state_v1'

const defaultState: TrustState = {
  identity: null,
  serializedKeys: null,
  proofs: [],
  attestations: [],
  trustScore: 0,
  humanityVerified: false,
  powHash: null,
  registered: false,
}

function loadState(): TrustState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultState, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return defaultState
}

function saveState(s: TrustState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch { /* ignore */ }
}

const TrustContext = createContext<TrustContextValue | null>(null)

export function TrustProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TrustState>(loadState)

  useEffect(() => { saveState(state) }, [state])

  const update = (partial: Partial<TrustState>) =>
    setState(prev => ({ ...prev, ...partial }))

  const addAttestation = (a: TrustAttestation) =>
    setState(prev => ({
      ...prev,
      attestations: [...prev.attestations, a],
      trustScore: Math.min(100, prev.trustScore + a.delta),
    }))

  return (
    <TrustContext.Provider value={{
      ...state,
      setIdentity: (identity, serializedKeys) => update({ identity, serializedKeys }),
      addProof: (p) => setState(prev => ({ ...prev, proofs: [...prev.proofs, p] })),
      addAttestation,
      setPowHash: (powHash) => update({ powHash }),
      setHumanityVerified: (humanityVerified) => update({ humanityVerified }),
      setRegistered: (registered) => update({ registered }),
      reset: () => { localStorage.removeItem(STORAGE_KEY); setState(defaultState) },
    }}>
      {children}
    </TrustContext.Provider>
  )
}

export function useTrust(): TrustContextValue {
  const ctx = useContext(TrustContext)
  if (!ctx) throw new Error('useTrust must be used inside TrustProvider')
  return ctx
}
