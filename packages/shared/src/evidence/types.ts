export interface EncryptionMetadata {
  algorithm: "AES-GCM"
  keyId: string
  iv: Uint8Array
  encryptedAt: string
}

export interface VerificationResult {
  valid: boolean
  expectedHash: string
  verifiedAt: string
  actualHash: string
  reason?: string
}

export interface EvidenceRecord {
  id: string

  schemaVersion: 1

  fileName: string
  fileSize: number
  fileType: string

  description?: string
  tags?: string[]

  hash: string

  fileId?: string

  /**
   * Transaction hash from the Polygon Amoy blockchain anchor.
   * Populated after the file is anchored via ChronicleAnchor.sol.
   * null/undefined means the file has not yet been anchored on-chain.
   */
  blockchainTxHash?: string

  createdAt: string
  updatedAt: string

  encrypted: boolean

  encryption?: EncryptionMetadata
  verification?: VerificationResult
}