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

  createdAt: string
  updatedAt: string

  encrypted: boolean

  encryption?: EncryptionMetadata
  verification?: VerificationResult
}