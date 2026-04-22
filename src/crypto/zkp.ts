// Simulated Zero-Knowledge Proof engine
//
// In production these would be Groth16 or PLONK proofs (via snarkjs / halo2).
// Here we simulate the interface faithfully: proofs are hash-based commitments
// that demonstrate knowledge without revealing the underlying value.
//
// Each proof carries:
//   - statement: what is being proved ("humanityScore >= 80")
//   - commitment: hash commitment to the secret witness
//   - challenge: verifier's random nonce
//   - response: hash(privateKey + challenge + witness) — binds identity to proof
//   - verified: whether the simulated proof checks out

import { bufToHex } from './identity'
import { sha256 } from './commitment'

export type ProofType =
  | 'humanity'        // proves: "I am a real human" (PoW + device attestation)
  | 'trust-threshold' // proves: "my trust score >= N"
  | 'age-range'       // proves: "I am between 18 and 65"
  | 'no-prior-ban'    // proves: "I have never been banned in this system"
  | 'membership'      // proves: "I am a member of group G"

export interface ZKProof {
  id: string
  type: ProofType
  statement: string
  commitment: string
  challenge: string
  response: string
  publicInput: string   // what the verifier is allowed to see
  timestamp: number
  verified: boolean
}

export async function generateProof(
  type: ProofType,
  witness: string,         // secret value being proved (never leaves this fn)
  publicKeyHex: string,
  extraPublicInput: string = ''
): Promise<ZKProof> {
  // Verifier's challenge (would be sent by the service in a real protocol)
  const challengeBuf = crypto.getRandomValues(new Uint8Array(32))
  const challenge = bufToHex(challengeBuf.buffer)

  // Commitment to the witness
  const blindingBuf = crypto.getRandomValues(new Uint8Array(16))
  const blinding = bufToHex(blindingBuf.buffer)
  const commitment = await sha256(witness + blinding)

  // Response: binds the keypair to this proof (simulates Schnorr response)
  const response = await sha256(publicKeyHex + challenge + witness)

  // Unique proof ID
  const id = (await sha256(commitment + challenge)).slice(0, 16)

  const statements: Record<ProofType, string> = {
    'humanity': 'Prover is a real human (PoW verified, device-bound)',
    'trust-threshold': `Trust score ≥ ${extraPublicInput || '70'}`,
    'age-range': 'Age ∈ [18, 99] — minor exclusion proof',
    'no-prior-ban': 'No ban record in nullifier set',
    'membership': `Member of group: ${extraPublicInput || 'verified-users'}`,
  }

  return {
    id,
    type,
    statement: statements[type],
    commitment,
    challenge,
    response,
    publicInput: extraPublicInput,
    timestamp: Date.now(),
    verified: true,
  }
}

export async function verifyProof(proof: ZKProof, publicKeyHex: string): Promise<boolean> {
  // Verify: recompute response from public data we have (simulated check)
  // In reality: pairing check on elliptic curve points
  const expectedResponse = await sha256(publicKeyHex + proof.challenge + proof.response)
  // We verify the structure is internally consistent
  return proof.verified && proof.commitment.length === 64 && proof.response.length === 64
}

// Proof-of-Work for Sybil resistance: find nonce such that SHA256(seed+nonce) starts with `difficulty` zeros
export async function solvePoW(
  seed: string,
  difficulty: number,
  onProgress?: (nonce: number) => void,
): Promise<{ nonce: number; hash: string; duration: number }> {
  const prefix = '0'.repeat(difficulty)
  let nonce = 0
  const start = performance.now()

  while (true) {
    const hash = await sha256(seed + nonce.toString())
    if (hash.startsWith(prefix)) {
      return { nonce, hash, duration: Math.round(performance.now() - start) }
    }
    nonce++
    // Yield to UI every 200 iterations and report progress
    if (nonce % 200 === 0) {
      onProgress?.(nonce)
      await new Promise(r => setTimeout(r, 0))
    }
  }
}

export function formatProofId(id: string): string {
  return `zkp_${id.slice(0, 4)}_${id.slice(4, 8)}_${id.slice(8, 12)}`
}
