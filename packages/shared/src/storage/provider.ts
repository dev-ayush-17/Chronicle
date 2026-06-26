import type { StoredFile } from "./types";

export interface StorageProvider {
    store(
        blob: Blob,
        metadata: {
            fileName: string
            mimeType: string
        }
    ): Promise<StoredFile>

    get(fileId: string): Promise<Blob | null>

    getMetaData(fileId: string): Promise<StoredFile | null>

    delete(fileId: string): Promise<void>
}