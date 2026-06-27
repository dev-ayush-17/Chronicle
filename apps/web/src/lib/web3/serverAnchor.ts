/**
 * serverAnchor.ts
 *
 * Server-side blockchain anchoring using viem + a private-key wallet.
 * This runs inside the Next.js API Route (route.ts) — NOT in the browser.
 *
 * The backend wallet signs and broadcasts anchor() to ChronicleAnchor on
 * Sepolia. The user never needs to approve a MetaMask transaction.
 *
 * Required environment variables:
 *   BLOCKCHAIN_PRIVATE_KEY              — 0x-prefixed private key of the server wallet
 *   NEXT_PUBLIC_CHRONICLE_CONTRACT_ADDRESS — deployed ChronicleAnchor contract address
 */

import {
  createWalletClient,
  createPublicClient,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { chronicleAbi } from "./abi";
import { sha256ToBytes32 } from "./format";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getConfig() {
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
  const contractAddress = process.env
    .NEXT_PUBLIC_CHRONICLE_CONTRACT_ADDRESS as `0x${string}` | undefined;

  if (!privateKey) {
    throw new Error(
      "BLOCKCHAIN_PRIVATE_KEY is not set. " +
        "Add it to .env.local to enable blockchain anchoring."
    );
  }

  if (!contractAddress) {
    throw new Error(
      "NEXT_PUBLIC_CHRONICLE_CONTRACT_ADDRESS is not set. " +
        "Deploy ChronicleAnchor and add the address to .env.local."
    );
  }

  // Ensure the key is 0x-prefixed (viem requires it)
  const normalizedKey: `0x${string}` = privateKey.startsWith("0x")
    ? (privateKey as `0x${string}`)
    : `0x${privateKey}`;

  return { normalizedKey, contractAddress };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface AnchorResult {
  txHash: string;
  success: true;
}

/**
 * Anchors a SHA-256 hash onto the Sepolia blockchain by calling
 * ChronicleAnchor.anchor(bytes32 fileHash).
 *
 * @param sha256Hex  The 64-character hex SHA-256 hash (no 0x prefix),
 *                   as returned by hashFile() in @chronicle/shared.
 * @returns          The transaction hash string (0x-prefixed).
 *
 * @throws           If env vars are missing or the tx fails.
 */
export async function anchorHashOnChain(sha256Hex: string): Promise<AnchorResult> {
  const { normalizedKey, contractAddress } = getConfig();

  // Create a server-side account from the private key
  const account = privateKeyToAccount(normalizedKey);

  // Build a wallet client that can sign and send transactions
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(), // uses the default public Sepolia RPC
  });

  // Build a public client to wait for receipt
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  // Convert SHA-256 string → bytes32 (0x + 64 hex chars)
  const fileHashBytes32 = sha256ToBytes32(sha256Hex);

  // Submit the transaction
  const txHash = await walletClient.writeContract({
    address: contractAddress,
    abi: chronicleAbi,
    functionName: "anchor",
    args: [fileHashBytes32],
  });

  // Optionally wait for 1 confirmation (costs ~2-5s but gives a real receipt)
  // You can remove this await if you prefer fire-and-forget speed.
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return { txHash, success: true };
}
