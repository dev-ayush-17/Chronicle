"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { hashFile, createEvidenceRecord, saveEvidence } from "@chronicle/shared";
import { uploadEvidenceFile } from "@/lib/storage/uploadFile";
import { sepoliaExplorerTxUrl } from "@/lib/web3/format";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function CreateEvidencePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorTxHash, setAnchorTxHash] = useState<string | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsHashing(true);
    setError(null);
    try {
      const computedHash = await hashFile(selectedFile);
      setHash(computedHash);
    } catch (err) {
      setError("Failed to compute file hash.");
      setFile(null);
    } finally {
      setIsHashing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      handleFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      handleFile(dropped);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setHash(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!file || !hash) return;
    
    setIsSaving(true);
    setError(null);
    setAnchorTxHash(null);
    
    try {
      const parsedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const trimmedDescription = description.trim() || undefined;
      const parsedTagsFiltered = parsedTags.length > 0 ? parsedTags : undefined;

      // Upload file + metadata to server (anchoring happens server-side)
      const storedFile = await uploadEvidenceFile(file, hash, {
        description: trimmedDescription,
        tags: parsedTagsFiltered,
      });

      // Store tx hash locally if anchoring succeeded
      if (storedFile.blockchainTxHash) {
        setAnchorTxHash(storedFile.blockchainTxHash);
      }

      const record = createEvidenceRecord(file, hash, {
        description: trimmedDescription,
        tags: parsedTagsFiltered,
        fileId: storedFile.id,
        blockchainTxHash: storedFile.blockchainTxHash,
      });
      
      await saveEvidence(record);
      router.push("/evidence");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save evidence.");
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-body-md antialiased pt-16">
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
        </div>
      </header>

      {/* Content Canvas */}
      <main className="flex-grow w-full max-w-container-max mx-auto px-gutter py-xl">
        {/* Page Header */}
        <header className="mb-lg">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs">Create Evidence Record</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Review a file, verify its cryptographic fingerprint, and preserve evidence metadata.</p>
        </header>

        {error && (
          <div className="bg-error-container text-on-error-container rounded-lg p-md mb-lg flex items-center gap-sm">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Main Content Area */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-[0_2px_4px_rgba(0,0,0,0.04)] overflow-hidden max-w-4xl">
          <div className="p-lg">
            {/* Section 1: Upload Zone */}
            <section className="mb-xl">
              <h2 className="font-body-lg text-body-lg font-medium text-on-surface mb-md">1. Target File</h2>
              
              {!file ? (
                <>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-2 border-dashed ${isDragOver ? 'border-primary bg-primary/5' : 'border-outline-variant bg-surface-container-low hover:bg-surface-container'} rounded-lg p-xl flex flex-col items-center justify-center transition-colors cursor-pointer mb-md group`}
                  >
                    <span className={`material-symbols-outlined text-[48px] ${isDragOver ? 'text-primary' : 'text-outline group-hover:text-primary'} mb-md transition-colors`}>upload_file</span>
                    <p className="font-body-md text-body-md text-on-surface-variant font-medium mb-xs">Drag and drop file here</p>
                    <p className="font-body-md text-body-md text-outline">or click to browse</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </>
              ) : (
                <div className="border border-surface-variant rounded-lg p-md bg-surface flex items-start gap-md">
                  <div className="bg-surface-container-high rounded-md p-sm flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {file.type.includes("zip") ? "folder_zip" : file.type.includes("image") ? "image" : file.type.includes("pdf") ? "picture_as_pdf" : "draft"}
                    </span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-xs">
                      <h3 className="font-body-md text-body-md font-medium text-on-surface truncate pr-md" title={file.name}>{file.name}</h3>
                      <button aria-label="Remove file" onClick={handleRemoveFile} className="text-on-surface-variant hover:text-error transition-colors p-xs rounded-full hover:bg-surface-container-high">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-md mb-md">
                      <span className="font-label-md text-label-md text-outline">{file.type || "Unknown File Type"}</span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span className="font-label-md text-label-md text-outline">{formatFileSize(file.size)}</span>
                    </div>
                    {/* Cryptographic Fingerprint */}
                    <div className="bg-surface-container-lowest border border-surface-variant rounded-md p-sm flex items-center gap-sm mt-sm w-full">
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant shrink-0">tag</span>
                      <div className="flex-grow min-w-0">
                        <p className="font-label-md text-label-md text-on-surface-variant mb-[2px]">SHA-256 Checksum</p>
                        {isHashing ? (
                          <div className="h-[18px] flex items-center">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-2 text-xs text-on-surface-variant">Computing...</span>
                          </div>
                        ) : (
                          <p className="font-mono-sm text-mono-sm text-on-surface truncate" title={hash || ""}>{hash}</p>
                        )}
                      </div>
                      {!isHashing && hash && (
                        <button 
                          aria-label="Copy Hash" 
                          onClick={() => navigator.clipboard.writeText(hash)}
                          className="text-on-surface-variant hover:text-primary transition-colors p-xs shrink-0"
                        >
                          <span className="material-symbols-outlined text-[16px]">content_copy</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
            
            <hr className="border-t border-surface-variant my-lg" />
            
            {/* Section 2: Evidence Metadata */}
            <section>
              <h2 className="font-body-lg text-body-lg font-medium text-on-surface mb-md">2. Preservation Metadata</h2>
              <div className="space-y-md">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="description">Description (Optional)</label>
                  <textarea 
                    id="description" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-outline-variant rounded-md bg-surface-container-lowest p-sm font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none" 
                    placeholder="Provide context regarding the collection of this artifact..." 
                    rows={3}
                  ></textarea>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="tags">Tags (Optional)</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-[18px] text-outline">label</span>
                    <input 
                      id="tags" 
                      type="text" 
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full pl-[36px] pr-sm py-sm border border-outline-variant rounded-md bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all" 
                      placeholder="Add tags separated by commas (e.g., incident-001, critical)" 
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
          
          {/* Section 3: Action Footer */}
          <div className="bg-surface border-t border-surface-variant px-lg py-md flex flex-col gap-sm">
            {/* Blockchain anchoring note */}
            <p className="text-xs text-on-surface-variant text-right">
              <span className="material-symbols-outlined text-[14px] align-middle mr-1">link</span>
              Evidence will be anchored on Sepolia after upload
            </p>
            <div className="flex items-center justify-end gap-md">
              <Link 
                href="/evidence"
                className="px-md py-sm rounded border border-outline-variant bg-surface-container-lowest text-on-surface font-label-md text-label-md font-medium hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </Link>
              <button 
                type="button" 
                onClick={handleSubmit}
                disabled={!file || !hash || isSaving}
                className="px-md py-sm rounded bg-primary text-on-primary font-label-md text-label-md font-medium hover:bg-on-primary-fixed-variant transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving && <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>}
                {isSaving ? "Uploading & Anchoring…" : "Create Evidence Record"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>

  );
}
