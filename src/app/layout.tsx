import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SolWrapped — Your On-Chain Identity",
  description:
    "AI scans your Solana wallet. Discovers your personality. Builds your card. Share it.",
  openGraph: {
    title: "SolWrapped — Your On-Chain Identity",
    description: "AI scans your Solana wallet and reveals your on-chain personality.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SolWrapped",
    description: "Reveal your Solana personality in 30 seconds.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
