"use client";

import { useState, useEffect, useCallback } from "react";
import type { EvidenceRecord } from "@chronicle/shared";
import {
  getAllEvidence,
  saveEvidence,
  deleteEvidence as deleteEvidenceFromStore,
  hashFile,
  createEvidenceRecord,
} from "@chronicle/shared";

interface UseEvidenceStoreReturn {
  records: EvidenceRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addEvidence: (file: File) => Promise<EvidenceRecord>;
  removeEvidence: (id: string) => Promise<void>;
}

export function useEvidenceStore(): UseEvidenceStoreReturn {
  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allRecords = await getAllEvidence();
      // Sort by creation date descending (newest first)
      allRecords.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecords(allRecords);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load evidence records";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEvidence = useCallback(
    async (file: File): Promise<EvidenceRecord> => {
      const hash = await hashFile(file);
      const record = createEvidenceRecord(file, hash);
      await saveEvidence(record);
      await refresh();
      return record;
    },
    [refresh]
  );

  const removeEvidence = useCallback(
    async (id: string): Promise<void> => {
      await deleteEvidenceFromStore(id);
      await refresh();
    },
    [refresh]
  );

  return {
    records,
    loading,
    error,
    refresh,
    addEvidence,
    removeEvidence,
  };
}
