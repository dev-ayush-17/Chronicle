
async function digestBuffer(
    buffer: ArrayBuffer
): Promise<ArrayBuffer> {
    return crypto.subtle.digest("SHA-256", buffer)
}

function toHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function hashBuffer(
    buffer: ArrayBuffer
): Promise<string> {
    try {
        const digest = await digestBuffer(buffer)
        return toHex(digest)

    }
    catch (error) {
        throw new Error(
            `Failed to hash buffer: ${error instanceof Error ? error.message : "Unknown error"}`
        )
    }
}

export async function hashBlob(
    blob: Blob
): Promise<string> {
    const buffer = await blob.arrayBuffer()

    return hashBuffer(buffer)
}

export async function hashFile(
    file: File,
): Promise<string> {
    return hashBlob(file)
}

export async function hashString(
    value: string
): Promise<string> {
    const encoded = new TextEncoder().encode(value)
    return hashBuffer(encoded.buffer)
}