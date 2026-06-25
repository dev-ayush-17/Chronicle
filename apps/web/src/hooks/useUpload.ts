"use client"

import { useCallback, useState } from "react"
import type { EvidenceRecord } from "@chronicle/shared"

import type {
    UploadDraft,
    UploadInput,
    UploadStatus,
} from "@/types/upload"

import {
    hashFile,
    saveEvidence,
    getAllEvidence,
    createEvidenceRecord,
} from "@chronicle/shared"
import { promises, setDefaultResultOrder } from "dns"
import { useCall } from "wagmi"
import { MaxFeePerGasTooLowError } from "viem"

const MAX_UPLOAD_SIZE = 250 * 1024 * 1024

interface UseUploadReturn {
    status: UploadStatus
    draft: UploadDraft | null
    record: EvidenceRecord | null
    error: string | null

    selectFile: (file: File) => Promise<void>

    confirmUpload:(
        input?: UploadInput
    ) => Promise<EvidenceRecord>

    reset: () => void

}

export function useUpload(): UseUploadReturn {
    
    const [status, setStatus] = useState<UploadStatus>("idle")

    const [draft, setDraft] = useState<UploadDraft | null>(null)

    const [error, setError] = useState<string | null>(null)

    const [record, setRecord] = useState<EvidenceRecord | null>(null)


    const reset = useCallback(() => {
        setStatus("idle")
        setDraft(null)
        setRecord(null)
        setError(null)
    }, [])

    const selectFile = useCallback(
        async (file: File): Promise<void> => {
            try {
                setError(null)
                setRecord(null)

                if (!file) {
                    throw new Error("No file selected.")
                }

                if (file.size > MAX_UPLOAD_SIZE) {
                    throw new Error (
                        `File exceeds maximum  size of ${
                            MAX_UPLOAD_SIZE / (1024 * 1024)
                        } MB.`
                    )
                }

                setStatus("hashing")

                const hash = await hashFile(file)

                setDraft({
                    file, hash
                })

                setStatus("confirming")
            }

            catch (err) {
                const message = err instanceof Error ? err.message : "Failed to process file."

                setError(message)
                setStatus("error")
            }
        }, []
    )

    const confirmUpload = useCallback(
        async (
            input?: UploadInput
        ): Promise<EvidenceRecord> => {
            try {
                if (!draft) {
                    throw new Error (
                        "No file selected for Upload."
                    )
                }

                setError(null)
                setStatus("saving")

                const existingRecords = await getAllEvidence()

                const duplicate = existingRecords.find(
                    (record) => 
                        record.hash === draft.hash
                )

                if (duplicate) {
                    throw new Error(
                        "Evidence with this hash already exists."
                    )
                }

                const record = createEvidenceRecord(
                    draft.file, draft.hash, {
                        description: input?.description,
                        tags: input?.tags,
                    }
                )

                await saveEvidence(record)

                setRecord(record)
                setStatus("success")

                return record
            }
            catch (err) {
                const message = err instanceof Error ? err.message : "Failed to save evidence."

                setError(message)
                setStatus("error")

                throw err
            }
        },
        [draft]
    )

    return {
        status,
        draft,
        record,
        error,
        selectFile,
        confirmUpload,
        reset,
    }
}