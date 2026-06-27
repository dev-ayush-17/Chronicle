import { EvidenceRecord } from "./types";

export function createEvidenceRecord(
    file: File,
    hash: string,
    options?: CreateEvidenceOptions
): EvidenceRecord {
    const timestamp = new Date().toISOString()

    return {
        id: crypto.randomUUID(),

        schemaVersion: 1,

        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,

        hash,

        fileId: options?.fileId,

        description: options?.description,
        tags: options?.tags,

        blockchainTxHash: options?.blockchainTxHash,

        createdAt: timestamp,
        updatedAt: timestamp,

        encrypted: false,
    }
}

export interface CreateEvidenceOptions {
    description?: string
    tags?: string[]
    fileId?: string
    /** Polygon Amoy transaction hash from server-side blockchain anchoring */
    blockchainTxHash?: string
}