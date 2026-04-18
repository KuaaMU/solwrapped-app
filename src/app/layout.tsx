import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#050505",
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "SolWrapped — Your Wallet Tells A Story",
  description:
    "AI scans your Solana wallet. Reveals your on-chain personality. Generates a data-driven card.",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/favicon-256.png", sizes: "256x256", type: "image/png" },
      { url: "/assets/logo-mark.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "SolWrapped — Your Wallet Tells A Story",
    description: "AI reveals your on-chain personality. Built for Colosseum Frontier 2026.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SolWrapped",
    description: "Reveal your Solana personality.",
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
