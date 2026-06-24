"use client";

import { useState } from "react";

import { hashFile } from "@chronicle/shared";
import { saveEvidence } from "@chronicle/shared";

export function useEvidence() {
  const [loading, setLoading] = useState(false);

  async function addFile(file: File) {
    setLoading(true);

    try {
      const hash = await hashFile(file);

      const record = {
        id: crypto.randomUUID(),
        fileName: file.name,
        hash,
        createdAt: Date.now(),
        encrypted: false,
      };

      await saveEvidence(record);

      return record;
    } finally {
      setLoading(false);
    }
  }

  return { addFile, loading };
}