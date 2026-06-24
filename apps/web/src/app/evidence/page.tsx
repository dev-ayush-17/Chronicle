"use client";

import { useRef, useCallback } from "react";
import { TopNavBar } from "@/components/TopNavBar";
import { EvidenceCard } from "@/components/EvidenceCard";
import { EvidenceEmptyState } from "@/components/EvidenceEmptyState";
import { EvidenceSkeleton } from "@/components/EvidenceSkeleton";
import { useEvidenceStore } from "@/hooks/useEvidenceStore";

export default function EvidenceDashboard() {
  const { records, loading, error, addEvidence, refresh } = useEvidenceStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        await addEvidence(file);
      } catch (err) {
        console.error("Failed to add evidence:", err);
      }

      // Reset the input so the same file can be added again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [addEvidence]
  );

  return (
    <>
      <TopNavBar />
      <main className="pt-24 pb-xl px-gutter max-w-[1440px] mx-auto min-h-screen">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
          <div>
            <h1 className="text-3xl font-semibold text-on-surface mb-xs" style={{ letterSpacing: "-0.02em" }}>
              Evidence Records
            </h1>
            <p className="text-sm text-on-surface-variant">
              Securely stored digital evidence.
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-sm bg-primary text-on-primary text-xs font-medium px-md py-sm rounded-[0.25rem] inner-highlight hover:bg-primary-container hover:text-on-primary-container active:scale-[0.98] transition-all duration-150 ease-in-out whitespace-nowrap w-full md:w-auto"
          >
            <span className="material-symbols-outlined text-[18px]">
              add_box
            </span>
            Add Evidence
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
          />
        </header>

        {/* Error State */}
        {error && (
          <div className="bg-error-container text-on-error-container rounded-lg p-md mb-lg flex items-center gap-sm">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <p className="text-sm">{error}</p>
            <button
              onClick={refresh}
              className="ml-auto text-xs font-medium underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <EvidenceSkeleton />
        ) : records.length === 0 ? (
          <EvidenceEmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {records.map((record) => (
              <EvidenceCard key={record.id} record={record} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
