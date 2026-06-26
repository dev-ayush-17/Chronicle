export type StorageProviderType = 
    | "indexeddb"
    | "r2"
    | "s3"
    | "supabase"

export interface StoredFile {
    id: string
    fileName: string
    size: number
    mimeType: string
    provider: StorageProviderType
    createdAt: string
}