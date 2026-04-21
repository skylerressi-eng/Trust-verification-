# TrustNet

**A privacy-preserving trust layer for the internet.** Replace accounts, CAPTCHAs, and public profiles with cryptographic proofs.

Users prove things like *"I am human"*, *"my trust score ≥ 80"*, or *"I am 18+"* — **without** revealing their name, email, identity, or history.

This repo contains the system design and a working in-browser demo.

---

## Quick start

```bash
npm install
npm run dev
```

Then open the URL printed by Vite. Everything runs in your browser — no backend.

## What's in here

- `src/crypto/` — the cryptographic core
  - `identity.ts` — real ECDSA P-256 keypair via Web Crypto API
  - `commitment.ts` — hash commitments + Merkle tree builder
  - `zkp.ts` — simulated zero-knowledge proofs (interface-faithful; in production back this with snarkjs/halo2)
- `src/pages/`
  - `Landing.tsx` — system overview + marketing surface
  - `Register.tsx` — 4-step registration flow (keypair → PoW → commit → credential)
  - `Login.tsx` — no-CAPTCHA login simulator showing the sign-and-prove handshake
  - `Dashboard.tsx` — proofs, attestations, trust score
  - `Architecture.tsx` — full written system design (read this for the long version)

## System overview (short version)

1. **Identity** — Device generates an ECDSA keypair. Private key never leaves the device. Public key is the pseudonymous ID.
2. **Humanity** — User solves a PoW + device attestation. An issuer returns a blind-signed "verified human" credential.
3. **Commitments** — Attributes (age, region, reputation) are stored as hash commitments. Values are hidden; bindings are permanent.
4. **Proofs** — When a service needs a check, the user generates a ZK proof like `trust ≥ 70`. The verifier learns the predicate only.
5. **Trust** — Actions create signed attestations aggregated into a Merkle tree. Range proofs let users prove thresholds without revealing history.

See `/architecture` in the running app for the full spec, including security model, tech stack, MVP scope, and limitations.

## Cryptography used (real & simulated)

| Purpose                    | In this demo            | In production                           |
|----------------------------|-------------------------|-----------------------------------------|
| Keypair / signatures       | **ECDSA P-256 (real)**  | ECDSA or Ed25519                        |
| Commitments                | **SHA-256 (real)**      | Poseidon or Pedersen                    |
| Sybil PoW                  | **SHA-256 grind (real)**| Same, adaptive difficulty                |
| Zero-knowledge proofs      | Simulated (hash-based)  | Groth16 / PLONK / halo2 via snarkjs     |
| Range proofs               | Simulated               | Bulletproofs                            |
| Anonymous credentials      | Simulated               | BBS+ / Pointcheval-Sanders              |

## Is a blockchain needed?

**No.** Stateless verifier nodes + a Merkle-rooted attestation log (Certificate-Transparency style) delivers the same tamper-evidence with lower latency and no token economics. Only reach for a chain if you need censorship-resistant issuance in adversarial jurisdictions.

## Limitations (honest)

- ZK proofs on mobile are still 100ms–2s; too slow for sub-second UX at high frequency
- Losing a device = losing an identity (multi-device sync needs threshold crypto)
- Regulatory KYC/AML compliance is unsolved *policy*, not engineering
- First-time users start at trust-0; some actions must be gated until reputation accumulates
- ECDSA is not post-quantum; algorithm rotation tags are built in for when PQC lands

## MVP scope (3–6 months)

A Discord-style community platform with:
- No-CAPTCHA signup (PoW + device attestation, <90s)
- Per-server moderation via nullifier bans (no "just make a new account")
- Age-gated rooms using live ZK proofs (no ID storage)
- Portable reputation between servers

## Status

Design doc + interactive demo. Not production-ready; cryptographic primitives are either Web Crypto real or faithful simulations. Do not use to secure anything real.
