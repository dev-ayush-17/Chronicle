import { createSupabaseClient } from "../lib/supabase/client";
import type { StorageProvider } from "./provider";
import type { StoredFile } from "./types";

export class SupabaseStorageProvider implements StorageProvider {
  async store(
    blob: Blob | File,
    metadata: { fileName: string; mimeType: string }
  ): Promise<StoredFile> {
    const supabase = createSupabaseClient();
    const fileId = crypto.randomUUID();
    const safeFileName =
      metadata.fileName.split(/[/\\]/).pop()?.replace(/[/\\]/g, "_") ||
      "file";
    const path = `${fileId}/${safeFileName}`;
    const contentType = metadata.mimeType || "application/octet-stream";

    const { error } = await supabase.storage
      .from("chronicle")
      .upload(path, blob, {
        contentType,
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }

    return {
      id: fileId,
      fileName: safeFileName,
      size: blob.size,
      mimeType: contentType,
      provider: "supabase",
      createdAt: new Date().toISOString()
    };
  }

  async get(fileId: string): Promise<Blob | null> {
    return null;
  }

  async getMetaData(fileId: string): Promise<StoredFile | null> {
    return null;
  }

  async delete(fileId: string): Promise<void> {
  }
}

// Export a singleton instance
export const storage = new SupabaseStorageProvider();