import { EvidenceRecord } from "./types";

export function createEvidenceRecord(
    file: File,
    hash: string
): EvidenceRecord {
    const timestamp = new Date().toISOString()

    return {
        id: crypto.randomUUID(),

        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,

        hash,

        createdAt: timestamp,
        updatedAt: timestamp,

        encrypted: false,
    }
}