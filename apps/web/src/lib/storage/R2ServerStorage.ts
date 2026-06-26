import type { ServerStorage } from "./serverStorage";

export class R2ServerStorage implements ServerStorage {
    async put(fileId: string, blob: Blob): Promise<void> {
        // future: PUT to signed R2 URL
        console.log("R2 PUT:", fileId);
    }

    async get(fileId: string): Promise<Blob | null> {
        // future: GET from R2 public/private URL
        console.log("R2 GET:", fileId);
        return null;
    }
}