"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import type { EvidenceRecord } from "@chronicle/shared";
import { getEvidence } from "@chronicle/shared";

/** Formats bytes into a human-readable string */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]} (${bytes.toLocaleString()} bytes)`;
}

export default function EvidenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [record, setRecord] = useState<EvidenceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const result = await getEvidence(id);
        setRecord(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load evidence"
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="skeleton-block w-16 h-16 rounded-full" />
          <div className="skeleton-block w-48 h-4 rounded-[0.25rem]" />
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-background">
        <header className="fixed top-0 w-full z-50 bg-surface border-b border-outline-variant h-16 flex items-center px-gutter max-w-[1440px] mx-auto shadow-sm">
          <Link
            href="/evidence"
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors group flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
              arrow_back
            </span>
            <span className="text-on-surface-variant group-hover:text-primary text-xs font-medium hidden sm:block">
              Back to Vault
            </span>
          </Link>
        </header>
        <main className="pt-24 px-gutter max-w-[1440px] mx-auto">
          <div className="bg-error-container text-on-error-container rounded-lg p-lg text-center">
            <span className="material-symbols-outlined text-[48px] mb-4 block">
              error
            </span>
            <h2 className="text-xl font-semibold mb-2">
              {error ?? "Evidence record not found"}
            </h2>
            <Link
              href="/evidence"
              className="text-sm underline hover:no-underline"
            >
              Return to dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const metadataRows = [
    { label: "Original Filename", value: record.fileName, mono: true },
    { label: "File Size", value: formatFileSize(record.fileSize), mono: false },
    { label: "File Type", value: record.fileType || "Unknown", mono: false },
  ];
  if (record.description) {
    metadataRows.push({ label: "Description", value: record.description, mono: false });
  }
  if (record.tags && record.tags.length > 0) {
    metadataRows.push({ label: "Tags", value: record.tags.join(", "), mono: false });
  }
  metadataRows.push({ label: "Created Date", value: record.createdAt, mono: true });
  metadataRows.push({ label: "Last Modified", value: record.updatedAt, mono: true });

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="fixed top-0 w-full z-50 bg-surface border-b border-outline-variant h-16 flex items-center px-gutter max-w-[1440px] mx-auto shadow-sm">
        <div className="flex items-center gap-4 w-full">
          <Link
            href="/evidence"
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors group flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
              arrow_back
            </span>
            <span className="text-on-surface-variant group-hover:text-primary text-xs font-medium hidden sm:block">
              Back to Vault
            </span>
          </Link>
          <div className="h-6 w-px bg-outline-variant mx-2" />
          <h1 className="text-xl font-semibold text-primary tracking-tight truncate flex-1">
            {record.fileName}
          </h1>
          <div className="flex items-center gap-3">
            <button className="bg-surface border border-outline text-on-surface text-xs font-medium px-4 py-2 rounded flex items-center gap-2 hover:bg-surface-container-low transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
              <span className="material-symbols-outlined text-on-surface text-[18px]">download</span>
              Export Record
            </button>
            <Link href={`/evidence/${record.id}/verify`} className="bg-primary text-on-primary text-xs font-medium px-4 py-2 rounded flex items-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-on-primary text-[18px]">verified_user</span>
              Verify Evidence
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mt-16 w-full max-w-[1440px] mx-auto px-md sm:px-gutter py-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left Column: Main Evidence View */}
          <div className="lg:col-span-8 flex flex-col gap-gutter">
            {/* Status & Overview */}
            <div className="bg-surface-container-lowest border border-surface-variant rounded-lg p-lg shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
              <div className="flex items-start justify-between mb-6 pb-4 border-b border-surface-container-low">
                <div>
                  <h2 className="text-xl font-semibold text-on-surface mb-1">
                    Evidence Integrity Status
                  </h2>
                  <p className="text-sm text-on-surface-variant">
                    Real-time cryptographic verification
                  </p>
                </div>
                {record.verification?.valid ? (
                  <div className="bg-[#dcfce7] text-[#166534] px-3 py-1.5 rounded-full flex items-center gap-2 border border-[#bbf7d0]">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span className="text-xs font-bold">Verified</span>
                  </div>
                ) : (
                  <div className="bg-secondary-fixed text-on-secondary-fixed px-3 py-1.5 rounded-full flex items-center gap-2 border border-secondary-fixed-dim">
                    <span className="material-symbols-outlined text-[16px]">
                      {record.encrypted ? "lock" : "check_circle"}
                    </span>
                    <span className="text-xs font-bold">
                      {record.encrypted ? "Encrypted" : "Preserved"}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Primary Hash */}
                <div>
                  <span className="block text-xs font-medium text-on-surface-variant mb-1 uppercase tracking-wider">
                    Primary Hash (SHA-256)
                  </span>
                  <div className="bg-surface-container-low p-3 rounded-[0.25rem] border border-outline-variant flex items-center justify-between group">
                    <code className="font-mono text-xs text-primary-container truncate w-full pr-4">
                      {record.hash}
                    </code>
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-surface-variant rounded-[0.25rem]"
                      onClick={() => navigator.clipboard.writeText(record.hash)}
                    >
                      <span className="material-symbols-outlined text-outline text-[16px]">
                        content_copy
                      </span>
                    </button>
                  </div>
                </div>

                {/* Evidence ID */}
                <div>
                  <span className="block text-xs font-medium text-on-surface-variant mb-1 uppercase tracking-wider">
                    Evidence ID
                  </span>
                  <div className="bg-surface-container-low p-3 rounded-[0.25rem] border border-outline-variant flex items-center justify-between group">
                    <code className="font-mono text-xs text-on-surface truncate w-full pr-4">
                      {record.id}
                    </code>
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-surface-variant rounded-[0.25rem]"
                      onClick={() => navigator.clipboard.writeText(record.id)}
                    >
                      <span className="material-symbols-outlined text-outline text-[16px]">
                        content_copy
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata Table */}
            <div className="bg-surface-container-lowest border border-surface-variant rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="p-lg border-b border-surface-variant">
                <h3 className="text-xl font-semibold text-on-surface">
                  File Metadata
                </h3>
              </div>
              <div className="w-full">
                {/* Table Header */}
                <div className="flex border-b border-surface-container-high bg-surface-container-low px-lg py-3">
                  <div className="w-1/3 text-xs font-medium text-on-surface-variant">
                    Property
                  </div>
                  <div className="w-2/3 text-xs font-medium text-on-surface-variant">
                    Value
                  </div>
                </div>
                {/* Rows */}
                {metadataRows.map((row, idx) => (
                  <div
                    key={row.label}
                    className={`flex border-b border-surface-container-high px-lg py-4 hover:bg-surface transition-colors ${
                      idx % 2 === 1 ? "bg-surface-container-low" : ""
                    }`}
                  >
                    <div className="w-1/3 text-xs font-medium text-on-surface">
                      {row.label}
                    </div>
                    <div
                      className={`w-2/3 text-sm text-on-surface ${
                        row.mono ? "font-mono text-xs" : ""
                      }`}
                    >
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview placeholder */}
            <div className="bg-surface-container-lowest border border-surface-variant rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.04)] p-lg flex flex-col items-center justify-center min-h-[200px] border-dashed">
              <span
                className="material-symbols-outlined text-outline-variant mb-2"
                style={{ fontSize: "48px" }}
              >
                visibility_off
              </span>
              <p className="text-sm text-on-surface-variant text-center max-w-md">
                Content preview is unavailable for encrypted archives. Download
                the file to view contents securely.
              </p>
            </div>
          </div>

          {/* Right Column: Timeline */}
          <div className="lg:col-span-4 flex flex-col gap-gutter">
            <div className="bg-surface-container-lowest border border-surface-variant rounded-lg p-lg shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
              <div className="mb-6 pb-4 border-b border-surface-container-low">
                <h3 className="text-xl font-semibold text-on-surface">
                  Chain of Custody
                </h3>
              </div>

              <div className="relative border-l-2 border-surface-variant ml-3 space-y-6">
                {/* Timeline Item: Record Created */}
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 shadow-[0_0_0_4px_var(--color-background)]" />
                  <p className="text-xs font-medium text-on-surface-variant mb-1 uppercase tracking-wide">
                    {record.createdAt}
                  </p>
                  <h4 className="text-base text-on-surface font-medium">
                    Record Created
                  </h4>
                  <p className="text-sm text-outline mt-1">
                    Initial ingestion into Chronicle vault. SHA-256
                    cryptographic hash calculated and sealed.
                  </p>
                </div>

                {/* Timeline Item: Hash Generated */}
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-outline-variant rounded-full -left-[7px] top-1.5 shadow-[0_0_0_4px_var(--color-background)]" />
                  <p className="text-xs font-medium text-on-surface-variant mb-1 uppercase tracking-wide">
                    {record.createdAt}
                  </p>
                  <h4 className="text-base text-on-surface font-medium">
                    Hash Generated
                  </h4>
                  <p className="text-sm text-outline mt-1">
                    SHA-256 cryptographic hash calculated and sealed.
                  </p>
                </div>

                {/* Timeline Item: Updated (if different from created) */}
                {record.updatedAt !== record.createdAt && (
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-outline-variant rounded-full -left-[7px] top-1.5 shadow-[0_0_0_4px_var(--color-background)]" />
                    <p className="text-xs font-medium text-on-surface-variant mb-1 uppercase tracking-wide">
                      {record.updatedAt}
                    </p>
                    <h4 className="text-base text-on-surface font-medium">
                      Record Updated
                    </h4>
                    <p className="text-sm text-outline mt-1">
                      Evidence metadata was updated.
                    </p>
                  </div>
                )}

                {/* Timeline Item: Verified */}
                {record.verification?.valid && (
                  <div className="relative pl-6 mt-6">
                    <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 shadow-[0_0_0_4px_var(--color-background)]" />
                    <p className="text-xs font-medium text-on-surface-variant mb-1 uppercase tracking-wide">
                      {record.verification.verifiedAt}
                    </p>
                    <h4 className="text-base text-on-surface font-medium">
                      Evidence Verified
                    </h4>
                    <p className="text-sm text-outline mt-1">
                      Automated system verification completed against baseline.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
