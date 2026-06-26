const fileStore = new Map<string, Blob>();

export function saveFile(fileId: string, blob: Blob) {
    fileStore.set(fileId, blob);
}

export function getFile(fileId: string) {
    return fileStore.get(fileId) || null;
}