import { VerificationResult } from "./types";

export function verifyHash(
  expectedHash: string,
  actualHash:string
): VerificationResult {
  const valid = expectedHash === actualHash

  return {
    valid, 
    expectedHash,
    actualHash,
    verifiedAt: new Date().toISOString(),
    reason: valid ? undefined : "Hash mismatch"
  }
}