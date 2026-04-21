// Real cryptographic identity using Web Crypto API (ECDSA P-256)
// The private key NEVER leaves this module — only proofs and public material are exported.

export interface TrustIdentity {
  publicKeyHex: string
  keyFingerprint: string   // first 16 hex chars of SHA-256(pubkey) — shown to user
  createdAt: number
}

export interface SignedChallenge {
  challenge: string
  signature: string
  publicKeyHex: string
  timestamp: number
}

// Exported only for serialization into IndexedDB
export interface SerializedKeyPair {
  publicKeyJwk: JsonWebKey
  privateKeyJwk: JsonWebKey
}

let _keyPair: CryptoKeyPair | null = null

export async function generateIdentity(): Promise<TrustIdentity> {
  _keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,   // extractable so we can persist to IndexedDB
    ['sign', 'verify']
  )

  const pubKeyRaw = await crypto.subtle.exportKey('raw', _keyPair.publicKey)
  const pubKeyHex = bufToHex(pubKeyRaw)

  const hashBuf = await crypto.subtle.digest('SHA-256', pubKeyRaw)
  const fingerprint = bufToHex(hashBuf).slice(0, 32)

  return {
    publicKeyHex: pubKeyHex,
    keyFingerprint: fingerprint,
    createdAt: Date.now(),
  }
}

export async function signChallenge(challenge: string): Promise<SignedChallenge | null> {
  if (!_keyPair) return null

  const pubKeyRaw = await crypto.subtle.exportKey('raw', _keyPair.publicKey)
  const pubKeyHex = bufToHex(pubKeyRaw)

  const encoded = new TextEncoder().encode(challenge)
  const sigBuf = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    _keyPair.privateKey,
    encoded
  )

  return {
    challenge,
    signature: bufToHex(sigBuf),
    publicKeyHex: pubKeyHex,
    timestamp: Date.now(),
  }
}

export async function verifySig(
  challenge: string,
  signatureHex: string,
  publicKeyHex: string
): Promise<boolean> {
  try {
    const pubKeyRaw = hexToBuf(publicKeyHex)
    const pubKey = await crypto.subtle.importKey(
      'raw',
      pubKeyRaw,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    )
    const sig = hexToBuf(signatureHex)
    const data = new TextEncoder().encode(challenge)
    return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pubKey, sig, data)
  } catch {
    return false
  }
}

export async function exportKeyPair(): Promise<SerializedKeyPair | null> {
  if (!_keyPair) return null
  return {
    publicKeyJwk: await crypto.subtle.exportKey('jwk', _keyPair.publicKey),
    privateKeyJwk: await crypto.subtle.exportKey('jwk', _keyPair.privateKey),
  }
}

export async function importKeyPair(serialized: SerializedKeyPair): Promise<TrustIdentity> {
  const publicKey = await crypto.subtle.importKey(
    'jwk', serialized.publicKeyJwk,
    { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']
  )
  const privateKey = await crypto.subtle.importKey(
    'jwk', serialized.privateKeyJwk,
    { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']
  )
  _keyPair = { publicKey, privateKey }

  const pubKeyRaw = await crypto.subtle.exportKey('raw', publicKey)
  const pubKeyHex = bufToHex(pubKeyRaw)
  const hashBuf = await crypto.subtle.digest('SHA-256', pubKeyRaw)
  const fingerprint = bufToHex(hashBuf).slice(0, 32)

  return { publicKeyHex: pubKeyHex, keyFingerprint: fingerprint, createdAt: Date.now() }
}

export function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function hexToBuf(hex: string): ArrayBuffer {
  const arr = new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)))
  return arr.buffer
}
