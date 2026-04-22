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

export type SocialPlatform = 'twitter' | 'github' | 'discord' | 'reddit' | 'linkedin'

export interface LinkedAccounts {
  twitter:  boolean
  github:   boolean
  discord:  boolean
  reddit:   boolean
  linkedin: boolean
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
  keyReady: boolean
  // New fields (back-filled from defaultState for existing users)
  faceScanDone:   boolean
  linkedAccounts: LinkedAccounts
  subscribed:     boolean
  displayName:    string
}

interface TrustContextValue extends TrustState {
  setIdentity:         (id: TrustIdentity, keys: SerializedKeyPair) => void
  addProof:            (p: ZKProof) => void
  addAttestation:      (a: TrustAttestation) => void
  setPowHash:          (h: string) => void
  setHumanityVerified: (v: boolean) => void
  setRegistered:       (v: boolean) => void
  setFaceScanDone:     () => void
  linkAccount:         (platform: SocialPlatform) => void
  setSubscribed:       (v: boolean) => void
  setDisplayName:      (name: string) => void
  reset:               () => void
}

const STORAGE_KEY = 'trustnet_state_v1'

const DEFAULT_LINKED: LinkedAccounts = {
  twitter: false, github: false, discord: false, reddit: false, linkedin: false,
}

const defaultState: TrustState = {
  identity:        null,
  serializedKeys:  null,
  proofs:          [],
  attestations:    [],
  trustScore:      0,
  humanityVerified: false,
  powHash:         null,
  registered:      false,
  keyReady:        false,
  faceScanDone:    false,
  linkedAccounts:  DEFAULT_LINKED,
  subscribed:      false,
  displayName:     '',
}

function loadState(): TrustState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...defaultState,
        ...parsed,
        // Ensure nested objects are merged, not replaced
        linkedAccounts: { ...DEFAULT_LINKED, ...(parsed.linkedAccounts ?? {}) },
        keyReady: false,
      }
    }
  } catch { /* ignore */ }
  return defaultState
}

function saveState(s: TrustState) {
  try {
    const { keyReady: _kr, ...toSave } = s
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch { /* ignore */ }
}

const TrustContext = createContext<TrustContextValue | null>(null)

export function TrustProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TrustState>(loadState)

  useEffect(() => {
    if (state.serializedKeys && !state.keyReady) {
      importKeyPair(state.serializedKeys)
        .then(() => setState(prev => ({ ...prev, keyReady: true })))
        .catch(() => {
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
      setPowHash:           (powHash)         => update({ powHash }),
      setHumanityVerified:  (humanityVerified) => update({ humanityVerified }),
      setRegistered:        (registered)       => update({ registered }),
      setFaceScanDone: () => update({ faceScanDone: true }),
      setDisplayName:  (displayName) => update({ displayName }),
      setSubscribed:   (subscribed)  => update({ subscribed }),
      linkAccount: (platform) =>
        setState(prev => {
          if (prev.linkedAccounts[platform]) return prev
          const attestation: TrustAttestation = {
            id: crypto.randomUUID(),
            action: `social_linked_${platform}`,
            delta: 10,
            timestamp: Date.now(),
            issuer: 'trustnet-social-v1',
          }
          return {
            ...prev,
            linkedAccounts: { ...prev.linkedAccounts, [platform]: true },
            attestations: [...prev.attestations, attestation],
            trustScore: Math.min(100, prev.trustScore + 10),
          }
        }),
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
