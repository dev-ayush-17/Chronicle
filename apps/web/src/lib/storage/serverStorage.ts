export interface ServerStorage {
    put(fileId: string, blob: Blob): Promise<void>;
    get(fileId: string): Promise<Blob | null>;
}

const memoryStore = new Map<string, Blob>();

export const InMemoryServerStorage: ServerStorage = {
    async put(fileId, blob) {
        memoryStore.set(fileId, blob);
    },

    async get(fileId) {
        return memoryStore.get(fileId) || null;
    }
};