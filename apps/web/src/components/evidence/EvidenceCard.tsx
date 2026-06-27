"use client";

import Link from "next/link";
import type { EvidenceRecord } from "@chronicle/shared";
import { sepoliaExplorerTxUrl, shortenTxHash } from "@/lib/web3/format";

interface EvidenceCardProps {
  record: EvidenceRecord;
}

/** Returns a file-type icon name based on file type string */
function getFileIcon(fileType: string): string {
  if (fileType.startsWith("image/")) return "image";
  if (fileType.startsWith("video/")) return "videocam";
  if (fileType.startsWith("audio/")) return "audio_file";
  if (fileType.includes("pdf")) return "description";
  if (fileType.includes("zip") || fileType.includes("gzip") || fileType.includes("tar"))
    return "folder_zip";
  if (fileType.includes("csv") || fileType.includes("spreadsheet")) return "dataset";
  return "description";
}

/** Formats bytes into a human-readable size string */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/** Formats an ISO date string into a readable format */
function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toISOString();
  } catch {
    return isoString;
  }
}

export function EvidenceCard({ record }: EvidenceCardProps) {
  const icon = getFileIcon(record.fileType);
  const isEncrypted = record.encrypted;
  const isAnchored = !!record.blockchainTxHash;

  return (
    <article className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md flex flex-col gap-sm hover:border-primary hover:shadow-[0_2px_12px_-4px_rgba(26,20,107,0.1)] transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-surface-variant pb-sm mb-xs">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-[0.25rem] bg-secondary-fixed-dim flex items-center justify-center text-on-secondary-fixed">
            <span className="material-symbols-outlined fill-icon">{icon}</span>
          </div>
          <div>
            <h3 className="text-xs font-medium text-on-surface truncate w-40">
              {record.fileName}
            </h3>
            <p className="text-on-surface-variant text-[11px]">
              {record.fileType || "Unknown"} • {formatFileSize(record.fileSize)}
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-xs bg-secondary-fixed text-on-secondary-fixed text-xs font-mono px-2 py-1 rounded-[0.25rem]">
          <span className="material-symbols-outlined text-[14px]">
            {isEncrypted ? "lock" : isAnchored ? "link" : "verified"}
          </span>
          {isEncrypted ? "Encrypted" : isAnchored ? "Anchored" : "Preserved"}
        </div>
      </div>

      {/* Timestamp */}
      <div className="flex flex-col gap-xs mt-sm">
        <span className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
          Timestamp
        </span>
        <span className="font-mono text-xs text-on-surface">
          {formatDate(record.createdAt)}
        </span>
      </div>

      {/* Hash */}
      <div className="flex flex-col gap-xs mt-xs">
        <span className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
          SHA-256 Hash
        </span>
        <div className="flex items-center gap-sm bg-surface-container-low p-xs rounded-[0.25rem] border border-surface-variant font-mono text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[14px] opacity-70">
            tag
          </span>
          <span className="truncate flex-1">{record.hash}</span>
          <button
            className="hover:text-primary p-xs rounded-[0.25rem] hover:bg-surface-container-high transition-colors"
            title="Copy Hash"
            onClick={(e) => {
              e.preventDefault();
              navigator.clipboard.writeText(record.hash);
            }}
          >
            <span className="material-symbols-outlined text-[14px]">
              content_copy
            </span>
          </button>
        </div>
      </div>

      {/* Blockchain Anchor Row — only shown when anchored */}
      {isAnchored && record.blockchainTxHash && (
        <div className="flex flex-col gap-xs mt-xs">
          <span className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
            Blockchain Anchor
          </span>
          <a
            href={sepoliaExplorerTxUrl(record.blockchainTxHash)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-sm bg-surface-container-low p-xs rounded-[0.25rem] border border-surface-variant font-mono text-xs text-primary hover:bg-primary/5 transition-colors"
            title={record.blockchainTxHash}
          >
            <span className="material-symbols-outlined text-[14px] opacity-70 text-on-surface-variant">
              link
            </span>
            <span className="truncate flex-1">{shortenTxHash(record.blockchainTxHash)}</span>
            <span className="material-symbols-outlined text-[14px] opacity-70">
              open_in_new
            </span>
          </a>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-md flex justify-end">
        <Link
          href={`/evidence/${record.id}`}
          className="text-primary text-xs font-medium hover:bg-primary-fixed-dim hover:text-on-primary-fixed px-sm py-xs rounded-[0.25rem] transition-colors flex items-center gap-xs"
        >
          View Details
          <span className="material-symbols-outlined text-[16px]">
            arrow_forward
          </span>
        </Link>
      </div>
    </article>
  );
}
