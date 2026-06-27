"use client";

import Link from "next/link";
export function EvidenceEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-gutter">
      {/* Illustration circle */}
      <div className="w-64 h-64 mb-8 rounded-full bg-surface-container-low flex items-center justify-center relative overflow-hidden shadow-sm border border-outline-variant">
        {/* Decorative spinning border */}
        <div className="absolute inset-0 border-4 border-dashed border-outline-variant opacity-20 rounded-full animate-[spin_60s_linear_infinite]" />
        {/* Glow */}
        <div className="w-48 h-48 rounded-full bg-primary-fixed-dim opacity-10 absolute blur-xl" />
        {/* Icon */}
        <span className="material-symbols-outlined text-primary opacity-40 z-10" style={{ fontSize: "80px" }}>
          folder_open
        </span>
      </div>

      {/* Text */}
      <h2 className="text-2xl md:text-4xl font-semibold text-on-surface mb-4">
        No evidence records yet
      </h2>
      <p className="text-base text-on-surface-variant max-w-2xl mx-auto mb-8 text-center leading-7">
       Every piece of digital evidence deserves a trustworthy history. Upload your
       first file to create a permanent, cryptographically verifiable evidence
       record.
      </p>

      {/* CTA */}
      <Link href="/evidence/create" className="flex items-center gap-2 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-xs font-medium px-6 py-3 rounded-lg shadow-sm inner-highlight transition-colors select-none">
        <span className="material-symbols-outlined">upload_file</span>
        Add Your First Evidence
      </Link>
    </div>
  );
}
