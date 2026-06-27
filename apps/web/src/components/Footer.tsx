import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest border-t border-surface-variant mt-auto text-sm text-on-surface-variant pt-16 pb-8">
      <div className="max-w-[1440px] mx-auto px-gutter">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-xl mb-16">
          <div className="flex flex-col gap-sm col-span-1 md:col-span-2">
            <div className="flex items-center gap-sm mb-xs">
              <span className="material-symbols-outlined text-primary text-[28px]">
                fingerprint
              </span>
              <span className="font-mono text-lg font-bold text-primary tracking-wide">CHRONICLE</span>
            </div>
            <p className="max-w-[400px] leading-relaxed">
              Generate verifiable evidence records, preserve integrity, and prepare for future witness verification. The standard for immutable digital forensics.
            </p>
          </div>
          
          <div className="flex flex-col gap-md">
            <h4 className="font-semibold text-on-surface">Resources</h4>
            <div className="flex flex-col gap-sm">
              <Link href="#" className="https://github.com/dev-ayush-17/Chronicle">Documentation</Link>

              <Link href="#" className="hover:text-primary transition-colors">API Reference</Link>
              <Link href="https://github.com/dev-ayush-17/Chronicle" className="hover:text-primary transition-colors">GitHub</Link>
            </div>
          </div>

          <div className="flex flex-col gap-md">
            <h4 className="font-semibold text-on-surface">Legal</h4>
            <div className="flex flex-col gap-sm">
              <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-primary transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-md pt-8 border-t border-surface-variant/50">
          <span className="text-sm">© {new Date().getFullYear()} Chronicle. All rights reserved.</span>
          <div className="flex items-center gap-1.5 text-sm">
            <span>Developed with</span>

            <span>🔮 by</span>
            <a href="https://github.com/lbyarinth" target="_blank" rel="noopener noreferrer" className="font-medium text-on-surface hover:text-primary transition-colors">
              lbyarinth
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
