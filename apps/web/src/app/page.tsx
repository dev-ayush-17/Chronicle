import Link from "next/link";
import { TopNavBar } from "@/components/TopNavBar";

export default function Home() {
  return (
    <>
      <TopNavBar />
      <main className="flex-1 pt-16 flex flex-col">
        {/* ── Hero Section ── */}
        <section className="relative pt-24 pb-32 px-gutter max-w-[1440px] mx-auto w-full flex flex-col items-center text-center overflow-hidden">
          {/* Grid background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-5"
            style={{
              backgroundSize: "24px 24px",
              backgroundImage:
                "linear-gradient(to right, #777682 1px, transparent 1px), linear-gradient(to bottom, #777682 1px, transparent 1px)",
            }}
          />

          <div className="relative z-10 max-w-[800px] flex flex-col items-center">
            {/* Eyebrow */}
            <span className="font-mono text-xs text-secondary tracking-widest uppercase mb-lg bg-secondary-fixed-dim px-sm py-xs rounded-[0.25rem]">
              Forensic Precision Systems
            </span>

            {/* Headline – Desktop */}
            <h1 className="hidden md:block text-5xl font-bold text-primary mb-md tracking-tight leading-tight" style={{ letterSpacing: "-0.02em" }}>
              Preserve Digital Evidence With Confidence
            </h1>
            {/* Headline – Mobile */}
            <h1 className="block md:hidden text-2xl font-semibold text-primary mb-md tracking-tight leading-tight">
              Preserve Digital Evidence With Confidence
            </h1>

            {/* Sub-headline */}
            <p className="text-base text-on-surface-variant mb-xl max-w-[600px]">
              Generate verifiable evidence records, preserve integrity, and
              prepare for future witness verification. The standard for
              immutable digital forensics.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-md items-center">
              <Link
                href="/evidence"
                className="bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-sm px-lg py-sm rounded-[0.25rem] transition-all duration-150 ease-in-out inner-highlight flex items-center gap-sm shadow-sm"
              >
                Open Dashboard
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </Link>
              <button className="bg-surface-container-lowest border border-outline-variant hover:border-primary hover:text-primary text-on-surface text-sm px-lg py-sm rounded-[0.25rem] transition-all duration-150 ease-in-out flex items-center gap-sm">
                Learn More
              </button>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-24 w-full max-w-[1000px] aspect-[21/9] rounded-xl overflow-hidden border border-surface-variant relative shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-surface-container-lowest flex items-center justify-center p-xs">
            <div className="w-full h-full rounded-lg bg-surface-container-low flex items-center justify-center relative overflow-hidden">
              {/* Abstract pattern */}
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundSize: "48px 48px",
                  backgroundImage:
                    "linear-gradient(45deg, #1a146b 25%, transparent 25%, transparent 75%, #1a146b 75%), linear-gradient(45deg, #1a146b 25%, transparent 25%, transparent 75%, #1a146b 75%)",
                  backgroundPosition: "0 0, 24px 24px",
                }}
              />
              <div className="flex flex-col items-center gap-4 z-10">
                <span className="material-symbols-outlined text-primary opacity-30" style={{ fontSize: "64px" }}>
                  security
                </span>
                <span className="font-mono text-xs text-outline uppercase tracking-widest">
                  Cryptographic Evidence Vault
                </span>
              </div>
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-surface/50 to-transparent" />
            </div>
          </div>
        </section>

        {/* ── Features Section (Bento Grid) ── */}
        <section className="py-24 px-gutter max-w-[1440px] mx-auto w-full bg-surface-bright border-t border-surface-variant">
          <div className="mb-xl text-center flex flex-col items-center">
            <h2 className="hidden md:block text-3xl font-semibold text-primary mb-sm" style={{ letterSpacing: "-0.02em" }}>
              Core Capabilities
            </h2>
            <h2 className="block md:hidden text-2xl font-semibold text-primary mb-sm">
              Core Capabilities
            </h2>
            <p className="text-sm text-on-surface-variant max-w-[500px]">
              Engineered for high-stakes environments, our platform ensures
              absolute data permanence and verifiability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {/* Card 1: Evidence Integrity */}
            <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-lg flex flex-col shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-primary/50 transition-colors group">
              <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center mb-md text-secondary border border-outline-variant/30 group-hover:bg-secondary-fixed transition-colors">
                <span className="material-symbols-outlined fill-icon">
                  security
                </span>
              </div>
              <h3 className="text-xl font-semibold text-on-surface mb-xs">
                Evidence Integrity
              </h3>
              <p className="text-sm text-on-surface-variant flex-1">
                Maintain the unbroken chain of custody. Every upload generates a
                unique cryptographic hash, ensuring that files remain exactly as
                they were when preserved.
              </p>
              <div className="mt-md pt-md border-t border-surface-variant flex items-center justify-between">
                <span className="font-mono text-xs text-outline">
                  SHA-256 Validated
                </span>
                <span className="material-symbols-outlined text-outline text-[16px]">
                  check_circle
                </span>
              </div>
            </div>

            {/* Card 2: Cryptographic Verification */}
            <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-lg flex flex-col shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-primary/50 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-fixed-dim rounded-bl-full opacity-20 -z-0" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center mb-md text-secondary border border-outline-variant/30 group-hover:bg-secondary-fixed transition-colors">
                  <span className="material-symbols-outlined fill-icon">
                    verified_user
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-on-surface mb-xs">
                  Cryptographic Verification
                </h3>
                <p className="text-sm text-on-surface-variant flex-1">
                  Anchor evidence to immutable ledgers. Prepare your records for
                  independent witness verification without relying on
                  centralized authority.
                </p>
                <div className="mt-md pt-md border-t border-surface-variant flex items-center justify-between">
                  <span className="font-mono text-xs text-outline">
                    Ledger Anchored
                  </span>
                  <span className="material-symbols-outlined text-outline text-[16px]">
                    link
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Secure Record Management */}
            <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-lg flex flex-col shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-primary/50 transition-colors group">
              <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center mb-md text-secondary border border-outline-variant/30 group-hover:bg-secondary-fixed transition-colors">
                <span className="material-symbols-outlined fill-icon">
                  folder_managed
                </span>
              </div>
              <h3 className="text-xl font-semibold text-on-surface mb-xs">
                Secure Record Management
              </h3>
              <p className="text-sm text-on-surface-variant flex-1">
                Organize complex case files with systematic precision. Granular
                access controls and comprehensive audit logs track every
                interaction.
              </p>
              <div className="mt-md pt-md border-t border-surface-variant flex items-center justify-between">
                <span className="font-mono text-xs text-outline">
                  Zero-Knowledge Ready
                </span>
                <span className="material-symbols-outlined text-outline text-[16px]">
                  lock
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}