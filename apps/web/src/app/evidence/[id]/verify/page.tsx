"use client";

import { useEffect, useState, use, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EvidenceRecord, VerificationResult } from "@chronicle/shared";
import { getEvidence, updateEvidence } from "@chronicle/shared";
import { hashFile } from "@chronicle/shared/src/evidence/hash";
import { verifyHash } from "@chronicle/shared/src/evidence/verify";
import { verifyAnchorOnChain, type AnchorVerificationResult } from "@/lib/web3/verifyAnchor";
import { sepoliaExplorerTxUrl, shortenTxHash } from "@/lib/web3/format";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]} (${bytes.toLocaleString()} bytes)`;
}

export default function VerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [record, setRecord] = useState<EvidenceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<"initial" | "processing" | "success" | "tampered">("initial");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Need to store the result locally to render the success/tampered states immediately
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  // On-chain anchor verification state
  const [onChainStatus, setOnChainStatus] = useState<"idle" | "checking" | "done">("idle");
  const [onChainResult, setOnChainResult] = useState<AnchorVerificationResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const result = await getEvidence(id);
        setRecord(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load evidence");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const processFile = async (file: File) => {
    if (!record) return;
    
    setUploadedFile(file);
    setStatus("processing");

    try {
      // Simulate slight delay for processing animation to be visible
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const fileHash = await hashFile(file);
      const result = verifyHash(record.hash, fileHash);
      
      setVerificationResult(result);
      
      // Persist the result
      const updatedRecord = { ...record, verification: result };
      await updateEvidence(updatedRecord);
      
      setStatus(result.valid ? "success" : "tampered");
    } catch (err) {
      console.error(err);
      setError("Failed to verify file");
      setStatus("initial");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [record]
  );

  const resetVerification = () => {
    setUploadedFile(null);
    setVerificationResult(null);
    setStatus("initial");
    setOnChainStatus("idle");
    setOnChainResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleVerifyOnChain = async () => {
    if (!record?.blockchainTxHash) return;
    setOnChainStatus("checking");
    try {
      const result = await verifyAnchorOnChain(record.blockchainTxHash, record.hash);
      setOnChainResult(result);
    } catch (err) {
      setOnChainResult({
        verified: false,
        txHash: record.blockchainTxHash,
        explorerUrl: sepoliaExplorerTxUrl(record.blockchainTxHash),
        reason: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setOnChainStatus("done");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="skeleton-block w-16 h-16 rounded-full" />
          <div className="skeleton-block w-48 h-4 rounded-[0.25rem]" />
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-surface">
        <header className="fixed top-0 w-full z-50 bg-surface border-b border-outline-variant h-16 flex items-center px-gutter max-w-[1440px] mx-auto shadow-sm">
          <Link
            href={`/evidence/${id}`}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors group flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
              arrow_back
            </span>
            <span className="text-on-surface-variant group-hover:text-primary text-xs font-medium hidden sm:block">
              Back to Evidence
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

  return (
    <div className="bg-surface text-on-surface min-h-screen font-body-md antialiased selection:bg-primary selection:text-on-primary">
      {/* Header */}
      <header className="bg-surface dark:bg-inverse-surface border-b border-outline-variant dark:border-outline fixed top-0 w-full z-50 h-16">
        <div className="flex justify-between items-center h-16 px-gutter max-w-container-max mx-auto">
          <div className="flex items-center gap-md">
            <span className="text-headline-md font-headline-md font-bold text-primary dark:text-inverse-primary tracking-tight">
              Chronicle
            </span>
            <span className="text-on-surface-variant px-sm text-lg hidden sm:inline">
              /
            </span>
            <span className="font-label-md text-label-md text-on-surface-variant hidden sm:inline">
              {status === "initial"
                ? "Verify Evidence"
                : status === "processing"
                ? "Verification Processing"
                : "Verification Result"}
            </span>
          </div>
          <Link
            href={`/evidence/${record.id}`}
            className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-xs"
          >
            <span className="material-symbols-outlined">close</span>
            <span className="font-label-md text-label-md">Close</span>
          </Link>
        </div>
      </header>

      <main className="pt-[104px] pb-xl px-gutter max-w-container-max mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-lg max-w-5xl mx-auto">
          {/* Left Column */}
          <div className="xl:col-span-8 flex flex-col gap-lg">
            {status === "initial" && (
              <>
                <div className="flex flex-col gap-sm mb-sm">
                  <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background">
                    Verify Evidence
                  </h2>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md md:p-lg shadow-sm flex flex-col gap-md relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-container to-secondary-container"></div>
                  <div className="flex justify-between items-start border-b border-outline-variant pb-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[24px]">
                          description
                        </span>
                      </div>
                      <div>
                        <h3 className="font-body-lg text-body-lg font-semibold text-on-surface truncate max-w-md">
                          {record.fileName}
                        </h3>
                        <p className="font-body-md text-body-md text-on-surface-variant">
                          {record.fileType || "Document"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                    <div>
                      <p className="font-label-md text-label-md text-on-surface-variant mb-xs">
                        Size
                      </p>
                      <p className="font-body-md text-body-md text-on-surface">
                        {formatFileSize(record.fileSize)}
                      </p>
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface-variant mb-xs">
                        Preserved On
                      </p>
                      <p className="font-body-md text-body-md text-on-surface truncate">
                        {record.createdAt}
                      </p>
                    </div>
                    <div className="col-span-2 md:col-span-4">
                      <p className="font-label-md text-label-md text-on-surface-variant mb-xs">
                        Original SHA-256 Hash
                      </p>
                      <div className="bg-surface-container-low p-sm rounded border border-surface-variant flex items-center justify-between group">
                        <code className="font-mono-sm text-mono-sm text-on-surface break-all">
                          {record.hash}
                        </code>
                        <button
                          className="text-on-surface-variant hover:text-primary p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copy Hash"
                          onClick={() => navigator.clipboard.writeText(record.hash)}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            content_copy
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex-1 flex flex-col min-h-[300px]">
                  <div className="border-b border-outline-variant p-md flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      fact_check
                    </span>
                    <h3 className="font-body-lg text-body-lg font-semibold text-on-surface">
                      Verification Workflow
                    </h3>
                  </div>
                  <div className="p-lg flex-1 flex flex-col items-center justify-center">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`w-full max-w-2xl border-2 border-dashed rounded-xl p-xl flex flex-col items-center justify-center text-center transition-colors duration-200 ${
                        isDragging
                          ? "border-[#312E81] bg-[#f2f4f6]"
                          : "border-outline-variant bg-surface-bright"
                      }`}
                    >
                      <div className="w-16 h-16 rounded-full w-full max-w-2xl bg-surface-container-low flex items-center justify-center text-primary mb-md">
                        <span className="material-symbols-outlined text-[32px]">
                          upload_file
                        </span>
                      </div>
                      <h4 className="font-body-lg text-body-lg w-full max-w-2xl font-semibold text-on-surface mb-2 text-center w-full">
                        Upload File for Comparison
                      </h4>
                      <p className="font-body-md text-body-md w-full max-w-2xl text-on-surface-variant mb-lg">
                        Upload the file you wish to compare against the original
                        record to verify its integrity.
                      </p>
                      <label className="cursor-pointer">
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <span className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container font-label-md text-label-md px-6 py-3 rounded-lg shadow-sm hover:shadow transition-all hover:-translate-y-[1px]">
                          <span className="material-symbols-outlined text-[18px]">
                            folder_open
                          </span>
                          Select File
                        </span>
                      </label>
                      <p className="font-label-md text-label-md text-outline mt-sm">
                        or drag and drop here
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {status === "processing" && (
              <>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.04)] mb-lg overflow-hidden">
                  <div className="border-b border-outline-variant px-md py-sm bg-surface-container-low flex justify-between items-center">
                    <h3 className="font-label-md text-label-md text-on-surface font-semibold">
                      Evidence Target Summary
                    </h3>
                    <span className="bg-surface-variant text-on-surface-variant font-mono-sm text-mono-sm px-2 py-1 rounded">
                      ID: {record.id.substring(0, 12).toUpperCase()}
                    </span>
                  </div>
                  <div className="p-md grid grid-cols-2 gap-4 bg-white">
                    <div>
                      <span className="block font-label-md text-label-md text-on-surface-variant mb-1">
                        Source File
                      </span>
                      <span className="font-body-md text-body-md text-on-surface truncate block max-w-[200px]">
                        {uploadedFile?.name || "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span className="block font-label-md text-label-md text-on-surface-variant mb-1">
                        Size
                      </span>
                      <span className="font-body-md text-body-md text-on-surface">
                        {uploadedFile ? formatFileSize(uploadedFile.size) : ""}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-primary-container rounded-lg shadow-[0_4px_12px_rgba(49,46,129,0.08)] overflow-hidden">
                  <div className="p-xl flex flex-col items-center justify-center text-center min-h-[300px] bg-white">
                    <div className="mb-6 relative">
                      <span className="material-symbols-outlined text-[48px] text-primary animate-spin">
                        sync
                      </span>
                    </div>
                    <h2 className="font-headline-md text-headline-md text-primary mb-2">
                      Hashing / Processing
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-8 max-w-2xl">
                      Computing SHA-256 Fingerprint and validating against
                      records. This ensures absolute cryptographic integrity of
                      the evidence payload.
                    </p>
                    <div className="w-full max-w-md">
                      <div className="flex justify-between font-mono-sm text-mono-sm text-on-surface-variant mb-2">
                        <span>Verifying Hash...</span>
                        <span>Processing</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden relative">
                        <div className="absolute top-0 bottom-0 left-0 bg-primary animate-[shimmer_2s_infinite] w-full" style={{
                           backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0, rgba(255,255,255,0.4) 20%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)'
                        }}></div>
                        <div className="h-full bg-primary rounded-full w-[100%] opacity-20"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {status === "success" && (
              <>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)] flex flex-col items-center text-center relative overflow-hidden mb-lg">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[#d1fae5]/30 blur-3xl pointer-events-none rounded-full"></div>
                  <div className="w-20 h-20 bg-[#d1fae5] rounded-full flex items-center justify-center mb-md relative z-10">
                    <span className="material-symbols-outlined text-[40px] text-[#10b981]">
                      check_circle
                    </span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs relative z-10">
                    VERIFIED
                  </h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl relative z-10">
                    Integrity Preserved. The uploaded file exactly matches the
                    original evidence record.
                  </p>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)] overflow-hidden mb-lg">
                  <div className="p-md border-b border-outline-variant bg-surface-container-low/50 flex items-center justify-between">
                    <h2 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">
                      Cryptographic Hash Comparison
                    </h2>
                    <div className="flex items-center gap-xs text-[#10b981] text-sm font-medium">
                      <span className="material-symbols-outlined text-[16px]">
                        verified
                      </span>
                      <span>Exact Match</span>
                    </div>
                  </div>
                  <div className="p-md grid grid-cols-1 lg:grid-cols-2 gap-md">
                    <div className="flex flex-col gap-sm">
                      <div className="flex items-center gap-xs">
                        <span className="material-symbols-outlined text-outline text-[18px]">
                          description
                        </span>
                        <span className="font-label-md text-label-md text-on-surface-variant">
                          Original Evidence Hash (SHA-256)
                        </span>
                      </div>
                      <div className="bg-surface-container-low border border-outline-variant rounded p-sm font-mono-sm text-mono-sm text-on-surface break-all">
                        {verificationResult?.expectedHash}
                      </div>
                    </div>
                    <div className="flex flex-col gap-sm">
                      <div className="flex items-center gap-xs">
                        <span className="material-symbols-outlined text-outline text-[18px]">
                          upload_file
                        </span>
                        <span className="font-label-md text-label-md text-on-surface-variant">
                          Uploaded File Hash (SHA-256)
                        </span>
                      </div>
                      <div className="bg-[#d1fae5]/30 border border-[#10b981]/30 rounded p-sm font-mono-sm text-mono-sm text-on-surface break-all">
                        {verificationResult?.actualHash}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)] overflow-hidden">
                  <div className="p-md border-b border-outline-variant">
                    <h2 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">
                      Verification Metadata
                    </h2>
                  </div>
                  <div className="p-0">
                    <table className="w-full text-left">
                      <tbody className="divide-y divide-outline-variant font-body-md text-body-md">
                        <tr className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3 px-md w-1/3 text-on-surface-variant">
                            Evidence ID
                          </td>
                          <td className="py-3 px-md font-mono-sm text-on-surface">
                            {record.id}
                          </td>
                        </tr>
                        <tr className="hover:bg-surface-container-low transition-colors bg-surface-container-lowest/50">
                          <td className="py-3 px-md w-1/3 text-on-surface-variant">
                            Filename
                          </td>
                          <td className="py-3 px-md text-on-surface font-medium truncate max-w-[200px] inline-block">
                            {record.fileName}
                          </td>
                        </tr>
                        <tr className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3 px-md w-1/3 text-on-surface-variant">
                            Status
                          </td>
                          <td className="py-3 px-md">
                            <span className="inline-flex items-center gap-xs px-2 py-1 rounded-full bg-[#d1fae5] text-[#064e3b] font-label-md text-label-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                              Verified
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-surface-container-low transition-colors bg-surface-container-lowest/50">
                          <td className="py-3 px-md w-1/3 text-on-surface-variant">
                            Verified At
                          </td>
                          <td className="py-3 px-md text-on-surface">
                            {verificationResult?.verifiedAt}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {status === "tampered" && (
              <>
                <section className="bg-error-container border-2 border-error rounded-xl p-lg flex flex-col sm:flex-row items-start sm:items-center gap-lg relative overflow-hidden mb-lg">
                  <div className="absolute -right-8 -top-8 text-error opacity-10 pointer-events-none">
                    <span className="material-symbols-outlined text-[120px]">
                      warning
                    </span>
                  </div>
                  <div className="bg-error text-on-error p-3 rounded-full flex-shrink-0 z-10 shadow-[0_0_15px_rgba(186,26,26,0.3)]">
                    <span className="material-symbols-outlined text-[32px]">
                      warning
                    </span>
                  </div>
                  <div className="z-10">
                    <h2 className="font-headline-md text-headline-md text-on-error-container mb-1 tracking-tight">
                      Integrity Compromised
                    </h2>
                    <p className="font-body-md text-body-md text-on-error-container/90 max-w-2xl">
                      The uploaded file <strong>does not match</strong> the
                      original evidence record. The cryptographic signature is
                      entirely distinct, indicating the file has been modified,
                      corrupted, or replaced since initial preservation.
                    </p>
                  </div>
                </section>

                <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.02)] mb-lg">
                  <div className="bg-surface-container-low px-lg py-md border-b border-outline-variant flex items-center justify-between">
                    <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">
                        memory
                      </span>
                      Cryptographic Analysis (SHA-256)
                    </h3>
                  </div>
                  <div className="p-lg grid grid-cols-1 md:grid-cols-2 gap-lg relative">
                    <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-container-high rounded-full p-2 border border-outline-variant z-10">
                      <span className="material-symbols-outlined text-error text-[20px]">
                        close
                      </span>
                    </div>
                    <div className="flex flex-col gap-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-label-md text-label-md text-on-surface-variant">
                          Original Vault Record
                        </span>
                        <span className="bg-surface-container-high text-on-surface px-2 py-0.5 rounded text-[10px] font-mono-sm uppercase">
                          Immutable
                        </span>
                      </div>
                      <div className="bg-surface-container p-4 rounded-lg border border-outline-variant/50 font-mono-sm text-mono-sm text-on-surface break-all leading-relaxed">
                        {verificationResult?.expectedHash}
                      </div>
                    </div>
                    <div className="flex flex-col gap-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-label-md text-label-md text-error font-bold">
                          Uploaded File Target
                        </span>
                        <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-mono-sm uppercase border border-error/20">
                          Mismatch
                        </span>
                      </div>
                      <div className="bg-error-container/20 p-4 rounded-lg border border-error/30 font-mono-sm text-mono-sm text-on-surface-variant break-all leading-relaxed relative">
                        {verificationResult?.actualHash}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="border-t border-outline-variant pt-lg mt-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-md font-mono-sm text-mono-sm text-on-surface-variant">
                    <div className="flex flex-col gap-1">
                      <span className="uppercase tracking-wider text-[10px]">
                        Verification Timestamp
                      </span>
                      <span className="text-on-surface">
                        {verificationResult?.verifiedAt}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="uppercase tracking-wider text-[10px]">
                        Algorithm
                      </span>
                      <span className="text-on-surface">SHA-256</span>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>

          {/* Right Column */}
          <div className="xl:col-span-4 flex flex-col gap-lg">
            {status === "initial" && (
              <>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
                  <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-md border-b border-outline-variant pb-2">
                    Record Status
                  </h3>
                  <div className="flex flex-col gap-sm">
                    <div className="flex items-center justify-between p-sm bg-surface-container-low rounded">
                      <span className="font-body-md text-body-md text-on-surface">
                        Verification
                      </span>
                      {record.verification?.valid ? (
                        <span className="inline-flex items-center gap-1 bg-[#dcfce7] text-[#166534] font-label-md text-label-md px-2 py-1 rounded-full border border-[#bbf7d0]">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-surface-variant text-on-surface-variant font-label-md text-label-md px-2 py-1 rounded-full">
                          <span className="material-symbols-outlined text-[14px]">pending</span>
                          Not Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-sm bg-surface-container-low rounded">
                      <span className="font-body-md text-body-md text-on-surface">
                        Security
                      </span>
                      <span className="inline-flex items-center gap-1 bg-primary-fixed text-on-primary-fixed font-label-md text-label-md px-2 py-1 rounded-full">
                        <span className="material-symbols-outlined text-[14px]">
                          {record.encrypted ? "lock" : "check_circle"}
                        </span>
                        {record.encrypted ? "Encrypted" : "Preserved"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
                  <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-md border-b border-outline-variant pb-2">
                    Actions
                  </h3>
                  <Link
                    href={`/evidence/${record.id}`}
                    className="w-full flex items-center justify-center gap-2 border border-outline-variant text-on-surface font-body-md text-body-md px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_back
                    </span>
                    Return to Evidence
                  </Link>
                </div>

                <div className="bg-surface-container border border-surface-dim rounded-xl p-md flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                    info
                  </span>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                    Verification is performed locally in your browser. Files are
                    not uploaded to external servers during this process to
                    ensure maximum confidentiality.
                  </p>
                </div>

                {/* Blockchain Proof Panel */}
                {record.blockchainTxHash && (
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
                    <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-md border-b border-outline-variant pb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">link</span>
                      Blockchain Proof
                    </h3>

                    <div className="mb-md">
                      <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Transaction Hash</p>
                      <a
                        href={record.blockchainTxHash ? sepoliaExplorerTxUrl(record.blockchainTxHash) : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-primary hover:underline break-all inline-flex items-center gap-1"
                      >
                        {record.blockchainTxHash ? shortenTxHash(record.blockchainTxHash, 10) : ""}
                        <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                      </a>
                    </div>

                    {/* On-chain verify button */}
                    {onChainStatus === "idle" && (
                      <button
                        onClick={handleVerifyOnChain}
                        className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/20 font-label-md text-label-md px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                        Verify on Chain
                      </button>
                    )}

                    {onChainStatus === "checking" && (
                      <div className="flex items-center justify-center gap-2 py-2 text-on-surface-variant text-sm">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Querying Sepolia…
                      </div>
                    )}

                    {onChainStatus === "done" && onChainResult && (
                      <div className={`rounded-lg p-sm border text-sm ${onChainResult.verified ? "bg-[#dcfce7] border-[#bbf7d0] text-[#166534]" : "bg-error-container border-error text-on-error-container"}`}>
                        <div className="flex items-center gap-2 font-semibold mb-1">
                          <span className="material-symbols-outlined text-[16px]">
                            {onChainResult.verified ? "check_circle" : "cancel"}
                          </span>
                          {onChainResult.verified ? "On-chain hash matches ✓" : "Verification failed"}
                        </div>
                        {onChainResult.blockNumber && (
                          <p className="text-xs opacity-80">Block #{onChainResult.blockNumber.toString()}</p>
                        )}
                        {onChainResult.reason && !onChainResult.verified && (
                          <p className="text-xs mt-1 opacity-80">{onChainResult.reason}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </>
            )}

            {status === "processing" && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.04)] p-md bg-white">
                <h3 className="font-label-md text-label-md text-on-surface font-semibold mb-4 border-b border-outline-variant pb-2">
                  Verification Protocol
                </h3>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <span className="material-symbols-outlined text-secondary text-base mt-0.5">
                      policy
                    </span>
                    <div>
                      <h4 className="font-label-md text-label-md text-on-surface">
                        Immutability Check
                      </h4>
                      <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                        Ensures file has not been altered since initial
                        preservation.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3 opacity-50">
                    <span className="material-symbols-outlined text-on-surface-variant text-base mt-0.5">
                      lock
                    </span>
                    <div>
                      <h4 className="font-label-md text-label-md text-on-surface">
                        Cryptographic Signature
                      </h4>
                      <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                        Validating digital signature.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            )}

            {(status === "success" || status === "tampered") && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col gap-md sticky top-24">
                <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-sm">
                  Current Status
                </h3>
                {status === "success" ? (
                  <div className="flex items-center gap-sm">
                    <div className="w-8 h-8 rounded bg-[#d1fae5] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#10b981] text-[20px]">
                        gpp_good
                      </span>
                    </div>
                    <div>
                      <div className="font-body-md text-body-md font-medium text-on-surface">
                        Verification Complete
                      </div>
                      <div className="font-label-md text-label-md text-[#10b981]">
                        Valid Evidence
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-md bg-error-container/40 p-md rounded-lg border border-error/20">
                      <div className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-error"></span>
                      </div>
                      <span className="font-headline-md text-headline-md text-error tracking-tight">
                        TAMPERED
                      </span>
                    </div>
                    <div className="text-body-md font-body-md text-on-surface-variant mt-sm">
                      File verification failed protocol standard. Do not proceed
                      with this file in legal proceedings.
                    </div>
                  </>
                )}

                <hr className="border-outline-variant my-md" />
                <div className="flex flex-col gap-3">
                  <button
                    onClick={resetVerification}
                    className="w-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors py-3 px-4 rounded-lg font-label-md text-label-md flex justify-center items-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      upload_file
                    </span>
                    Verify Another File
                  </button>
                  <Link
                    href={`/evidence/${record.id}`}
                    className="w-full bg-surface-container text-on-surface border border-outline-variant hover:bg-surface-variant transition-colors py-3 px-4 rounded-lg font-label-md text-label-md flex justify-center items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_back
                    </span>
                    Return to Evidence
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
