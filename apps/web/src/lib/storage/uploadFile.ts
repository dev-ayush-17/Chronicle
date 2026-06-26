import type { StoredFile } from "@chronicle/shared";

export async function uploadEvidenceFile(file: File): Promise<StoredFile> {
  const formData = new FormData();
  formData.append("file", file);

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
