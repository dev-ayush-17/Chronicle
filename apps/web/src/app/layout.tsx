import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/web3/providers";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Chronicle – Preserve Digital Evidence",
  description:
    "Generate verifiable evidence records, preserve integrity, and prepare for future witness verification. The standard for immutable digital forensics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/* Google Fonts: Inter + JetBrains Mono */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400&display=swap"
          rel="stylesheet"
        />
        {/* Material Symbols Outlined */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-background font-sans">
        <Providers>
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
