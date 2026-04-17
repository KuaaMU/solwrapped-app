// Shared Solana address validation — used by homepage, analyze API, report API.
// Kept dependency-free so it runs in edge, node, and client contexts.

// Base58 charset (no 0, O, I, l — avoids lookalikes)
const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]+$/;

export type AddressValidation =
  | { ok: true; address: string }
  | { ok: false; reason: string };

/**
 * Validate a Solana address or demo alias.
 * - Demo aliases ("demo", "demo-degen", ...) are always valid.
 * - Real addresses must be base58, length 32-44.
 */
export function validateAddress(raw: string): AddressValidation {
  const address = raw.trim();
  if (!address) return { ok: false, reason: "EMPTY ADDRESS" };
  if (address.startsWith("demo-") || address.toLowerCase() === "demo") {
    return { ok: true, address };
  }
  if (address.length < 32 || address.length > 44) {
    return { ok: false, reason: "INVALID LENGTH (32-44 CHARS)" };
  }
  if (!BASE58_RE.test(address)) {
    return { ok: false, reason: "INVALID CHARS (BASE58 ONLY)" };
  }
  return { ok: true, address };
}
