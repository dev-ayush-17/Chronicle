import type { StoredFile } from "@chronicle/shared";

export interface UploadEvidenceOptions {
  description?: string;
  tags?: string[];
}

/**
 * Uploads an evidence file to the server-side upload API.
 * Also passes description + tags so they get saved to Postgres.
 * Returns a StoredFile that may include blockchainTxHash if anchoring succeeded.
 */
export async function uploadEvidenceFile(
  file: File,
  sha256Hash: string,
  options?: UploadEvidenceOptions
): Promise<StoredFile> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("sha256Hash", sha256Hash);

  if (options?.description) {
    formData.append("description", options.description);
  }
  if (options?.tags && options.tags.length > 0) {
    formData.append("tags", JSON.stringify(options.tags));
  }

  const response = await fetch("/api/evidence/upload", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as StoredFile & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to upload evidence file.");
  }

  return data;
}
