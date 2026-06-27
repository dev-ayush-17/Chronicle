/**
 * anchor.ts — CLIENT-SIDE anchor function (user-wallet signed).
 *
 * This is for future flows where the user signs the anchor transaction
 * themselves via their connected MetaMask/RainbowKit wallet.
 *
 * For the upload pipeline, the server-side anchorHashOnChain() in
 * serverAnchor.ts is used instead.
 */

import { writeContract } from "@wagmi/core";
import { config } from "./wagmi";
import { chronicleAbi } from "./abi";
import { sha256ToBytes32 } from "./format";

// ---------------------------------------------------------------------------
// ⚠️  USER ACTION REQUIRED
// After deploying ChronicleAnchor.sol to Sepolia, set this in .env.local:
//   NEXT_PUBLIC_CHRONICLE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
// ---------------------------------------------------------------------------

/**
 * Anchors a SHA-256 hash on-chain using the user's connected wallet.
 *
 * @param sha256Hex  64-character hex SHA-256 (no 0x prefix).
 * @returns          The transaction hash.
 */
export async function anchorToChain(sha256Hex: string): Promise<`0x${string}`> {
  const contractAddress = process.env
    .NEXT_PUBLIC_CHRONICLE_CONTRACT_ADDRESS as `0x${string}` | undefined;

  if (!contractAddress) {
    throw new Error(
      "NEXT_PUBLIC_CHRONICLE_CONTRACT_ADDRESS is not set. " +
        "Deploy ChronicleAnchor.sol and add the address to .env.local."
    );
  }

  const txHash = await writeContract(config, {
    address: contractAddress,
    abi: chronicleAbi,
    functionName: "anchor",
    args: [sha256ToBytes32(sha256Hex)],
  });

  return txHash;
}