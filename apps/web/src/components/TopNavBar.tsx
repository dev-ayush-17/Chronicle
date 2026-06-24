"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function TopNavBar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/evidence", label: "Evidence" },
  ];

  return (
    <nav className="bg-surface fixed top-0 w-full z-50 border-b border-outline-variant">
      <div className="flex justify-between items-center h-16 px-gutter max-w-[1440px] mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-lg">
          <Link href="/" className="flex items-center gap-sm group">
            <span className="material-symbols-outlined text-primary text-[28px] group-hover:scale-110 transition-transform">
              fingerprint
            </span>
            <span className="text-2xl font-bold text-primary tracking-tight">
              Chronicle
            </span>
          </Link>

          {/* Search Bar (desktop) */}
          <div className="hidden md:flex items-center bg-surface-container-low rounded-[0.25rem] border border-outline-variant px-md py-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all w-64">
            <span className="material-symbols-outlined text-on-surface-variant mr-sm text-[18px]">
              search
            </span>
            <input
              className="bg-transparent border-none outline-none w-full text-sm text-on-surface placeholder:text-on-surface-variant p-0 focus:ring-0"
              placeholder="Search hash, ID, or file..."
              type="text"
            />
          </div>
        </div>

        {/* Navigation Links */}
        <ul className="hidden md:flex items-center gap-md h-full">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <li key={link.href} className="h-full flex items-center">
                <Link
                  href={link.href}
                  className={
                    isActive
                      ? "text-primary font-bold border-b-2 border-primary pb-1 h-full flex items-center px-sm transition-all hover:bg-surface-container-low"
                      : "text-on-surface-variant hover:text-primary transition-colors h-full flex items-center px-sm border-b-2 border-transparent pb-1 hover:bg-surface-container-low"
                  }
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Trailing Action */}
        <div className="flex items-center gap-md">
          <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus="avatar"
          />
        </div>
      </div>
    </nav>
  );
}
