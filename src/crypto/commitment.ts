// Pedersen-style hash commitments: commit(value, blinding) = SHA-256(value || blinding)
// A commitment hides the value but binds the committer — you can reveal later.

import { bufToHex } from './identity'

export interface Commitment {
  commitment: string   // hex SHA-256
  blinding: string     // secret random salt — never share
  value: string        // the actual value — reveal only when needed
}

export async function commit(value: string): Promise<Commitment> {
  const blindingBuf = crypto.getRandomValues(new Uint8Array(32))
  const blinding = bufToHex(blindingBuf.buffer)

  const encoded = new TextEncoder().encode(value + blinding)
  const hashBuf = await crypto.subtle.digest('SHA-256', encoded)

  return {
    commitment: bufToHex(hashBuf),
    blinding,
    value,
  }
}

export async function verifyCommitment(commitment: string, value: string, blinding: string): Promise<boolean> {
  const encoded = new TextEncoder().encode(value + blinding)
  const hashBuf = await crypto.subtle.digest('SHA-256', encoded)
  return bufToHex(hashBuf) === commitment
}

// Build a Merkle root from a list of leaf values (each leaf is SHA-256 hashed)
export async function buildMerkleRoot(leaves: string[]): Promise<string> {
  if (leaves.length === 0) return '0'.repeat(64)

  let layer = await Promise.all(leaves.map(l => sha256(l)))

  while (layer.length > 1) {
    const next: string[] = []
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i]
      const right = layer[i + 1] ?? layer[i]  // duplicate last node if odd
      next.push(await sha256(left + right))
    }
    layer = next
  }

  return layer[0]
}

export async function sha256(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input)
  const hashBuf = await crypto.subtle.digest('SHA-256', encoded)
  return bufToHex(hashBuf)
}
