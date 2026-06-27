/**
 * Converts a raw 64-character SHA-256 hex string (no 0x prefix, as produced by
 * packages/shared/src/evidence/hash.ts) into a viem-compatible 0x-prefixed
 * bytes32 hex string suitable for passing to the ChronicleAnchor contract.
 *
 * @example
 *   sha256ToBytes32("a1b2...c3d4") → "0xa1b2...c3d4"
 */
export function sha256ToBytes32(sha256Hex: string): `0x${string}` {
  // Strip 0x if someone passes it in already
  const clean = sha256Hex.startsWith("0x") ? sha256Hex.slice(2) : sha256Hex;

  if (clean.length !== 64) {
    throw new Error(
      `SHA-256 hex must be 64 characters long (got ${clean.length})`
    );
  }

  return `0x${clean}`;
}

/**
 * Shortens a transaction hash for display purposes.
 *
 * @example
 *   shortenTxHash("0xabcdef...123456") → "0xabcd…3456"
 */
export function shortenTxHash(txHash: string, chars = 6): string {
  if (txHash.length <= chars * 2 + 2) return txHash;
  return `${txHash.slice(0, chars + 2)}…${txHash.slice(-chars)}`;
}

/**
 * Returns the Sepolia block explorer URL for a given tx hash.
 */
export function sepoliaExplorerTxUrl(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}
