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

  fileName: string
  fileSize: number
  fileType: string

  hash: string

  createdAt: string
  updatedAt: string

  encrypted: boolean

  encryption?: EncryptionMetadata
}