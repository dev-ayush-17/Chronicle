/**
 * verifyAnchor.ts
 *
 * Client-side utility to verify that a given transaction hash corresponds
 * to an EvidenceAnchored event on the ChronicleAnchor contract, and that
 * the event's fileHash matches the expected SHA-256.
 *
 * Used on the verify page (/evidence/[id]/verify) to provide on-chain proof.
 */

import { createPublicClient, http, decodeEventLog } from "viem";
import { sepolia } from "viem/chains";
import { chronicleAbi } from "./abi";
import { sha256ToBytes32, sepoliaExplorerTxUrl } from "./format";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnchorVerificationResult {
  verified: boolean;
  txHash: string;
  explorerUrl: string;
  blockNumber?: bigint;
  anchoredHash?: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Verifies that a blockchain transaction contains an EvidenceAnchored event
 * matching the expected SHA-256 hash.
 *
 * @param txHash      The 0x-prefixed transaction hash stored in Postgres.
 * @param sha256Hex   The expected 64-char SHA-256 hex (no 0x prefix).
 * @returns           Verification result with status and details.
 */
export async function verifyAnchorOnChain(
  txHash: string,
  sha256Hex: string
): Promise<AnchorVerificationResult> {
  const explorerUrl = sepoliaExplorerTxUrl(txHash);

  try {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    // Fetch the transaction receipt from the chain
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    if (!receipt) {
      return {
        verified: false,
        txHash,
        explorerUrl,
        reason: "Transaction not found on chain.",
      };
    }

    if (receipt.status !== "success") {
      return {
        verified: false,
        txHash,
        explorerUrl,
        blockNumber: receipt.blockNumber,
        reason: "Transaction was reverted on chain.",
      };
    }

    // Parse the logs to find EvidenceAnchored event
    const expectedBytes32 = sha256ToBytes32(sha256Hex);

    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: chronicleAbi,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === "EvidenceAnchored") {
          // Cast via unknown to satisfy TypeScript — viem types args as readonly unknown[]
          const args = decoded.args as unknown as { fileHash: `0x${string}`; sender: `0x${string}` };
          const anchoredHash = args.fileHash;

          // Compare the anchored hash to what we expect
          const hashMatches =
            anchoredHash.toLowerCase() === expectedBytes32.toLowerCase();

          return {
            verified: hashMatches,
            txHash,
            explorerUrl,
            blockNumber: receipt.blockNumber,
            anchoredHash,
            reason: hashMatches
              ? undefined
              : `Hash mismatch: expected ${expectedBytes32}, got ${anchoredHash}`,
          };
        }
      } catch {
        // Log wasn't an EvidenceAnchored event — skip it
        continue;
      }
    }

    // No matching event found in the receipt
    return {
      verified: false,
      txHash,
      explorerUrl,
      blockNumber: receipt.blockNumber,
      reason: "EvidenceAnchored event not found in transaction logs.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      verified: false,
      txHash,
      explorerUrl,
      reason: `Failed to fetch transaction from chain: ${message}`,
    };
  }
}
