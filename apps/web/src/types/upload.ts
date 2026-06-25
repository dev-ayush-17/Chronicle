export type UploadStatus = 
    | "idle"
    | "hashing"
    | "confirming"
    | "saving"
    | "success"
    | "error"

export interface UploadDraft {
    file: File
    hash: string
}

export interface UploadInput {
    description?: string
    tags?: string[]
}