import Link from "next/link";
import Image from "next/image";
import { TopNavBar } from "@/components/TopNavBar";
import screenImg from "../screen.png";

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
              <Link 
              href="https://github.com/dev-ayush-17/Chronicle"
              className="bg-surface-container-lowest border border-outline-variant hover:border-primary hover:text-primary text-on-surface text-sm px-lg py-sm rounded-[0.25rem] transition-all duration-150 ease-in-out flex items-center gap-sm">
                Learn More
              </Link>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-20 w-full max-w-[900px] rounded-xl overflow-hidden border border-surface-variant/50 relative shadow-2xl shadow-primary/5 bg-surface-container-lowest flex flex-col">
            {/* Browser Header Mock */}
            <div className="h-10 w-full bg-surface-container-low border-b border-surface-variant flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <div className="ml-4 h-5 flex-1 max-w-[200px] bg-surface-container-highest rounded-md"></div>
            </div>
            
            <div className="w-full relative bg-surface-container-lowest flex items-center justify-center overflow-hidden aspect-[16/10]">
              <Image 
                src={screenImg}
                alt="Chronicle Dashboard Interface"
                fill
                className="object-cover object-top"
                priority
              />
              {/* Subtle inner shadow for depth */}
              <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] pointer-events-none" />
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