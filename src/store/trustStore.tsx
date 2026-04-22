// Global trust store — persists to localStorage, never stores raw identity
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { TrustIdentity, SerializedKeyPair } from '../crypto/identity'
import { importKeyPair } from '../crypto/identity'
import type { ZKProof } from '../crypto/zkp'

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
  // whether the in-memory _keyPair has been re-imported after a page reload
  keyReady: boolean
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
  keyReady: false,
}

function loadState(): TrustState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultState, ...JSON.parse(raw), keyReady: false }
  } catch { /* ignore */ }
  return defaultState
}

function saveState(s: TrustState) {
  try {
    // Don't persist the transient keyReady flag
    const { keyReady: _kr, ...toSave } = s
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch { /* ignore */ }
}

const TrustContext = createContext<TrustContextValue | null>(null)

export function TrustProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TrustState>(loadState)

  // On first mount, if serialized keys exist in localStorage, re-import them
  // into the in-memory _keyPair so signChallenge() works after a page reload.
  useEffect(() => {
    if (state.serializedKeys && !state.keyReady) {
      importKeyPair(state.serializedKeys)
        .then(() => setState(prev => ({ ...prev, keyReady: true })))
        .catch(() => {
          // Keys corrupted — clear everything so the user can re-register
          localStorage.removeItem(STORAGE_KEY)
          setState(defaultState)
        })
    } else if (!state.serializedKeys) {
      setState(prev => ({ ...prev, keyReady: false }))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      setIdentity: (identity, serializedKeys) =>
        update({ identity, serializedKeys, keyReady: true }),
      addProof:   (p) => setState(prev => ({ ...prev, proofs: [...prev.proofs, p] })),
      addAttestation,
      setPowHash:           (powHash)          => update({ powHash }),
      setHumanityVerified:  (humanityVerified)  => update({ humanityVerified }),
      setRegistered:        (registered)        => update({ registered }),
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
