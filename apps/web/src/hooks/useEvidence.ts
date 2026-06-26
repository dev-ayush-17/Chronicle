"use client";

import { useState } from "react";

import { hashFile } from "@chronicle/shared";
import { saveEvidence, createEvidenceRecord } from "@chronicle/shared";

export function useEvidence() {
  const [loading, setLoading] = useState(false);

  async function addFile(file: File) {
    setLoading(true);

    try {
      const hash = await hashFile(file);

      const record = createEvidenceRecord(file, hash);

      await saveEvidence(record);

      return record;
    } finally {
      setLoading(false);
    }
  }

  return { addFile, loading };
}