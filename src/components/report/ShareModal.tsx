"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AIReport, WalletProfile, Badge } from "@/lib/types";
import { formatFee } from "./ReportAtoms";

type CardTab = "ai" | "standard";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  address: string;
  ai: AIReport;
  profile: WalletProfile;
  badges: Badge[];
}

export function ShareModal({
  open,
  onClose,
  address,
  ai,
  profile,
  badges,
}: ShareModalProps) {
  const [tab, setTab] = useState<CardTab>("ai");
  const [loadedTabs, setLoadedTabs] = useState<Record<CardTab, boolean>>({
    ai: false,
    standard: false,
  });
  const [copied, setCopied] = useState<string | null>(null);

  const standardUrl = `/api/og/${address}`;
  const aiUrl = `/api/card/${address}`;
  const activeUrl = tab === "ai" ? aiUrl : standardUrl;

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/report/${address}`
    : `/report/${address}`;

  const tweetText = useMemo(() => {
    const goldBadge = badges.find((b) => b.rarity === "gold");
    const badgeFlex = goldBadge ? ` — ${goldBadge.label} tier.` : "";
    return `I'm a ${ai.personality} on Solana.${badgeFlex}\n${profile.totalTransactions.toLocaleString()} txs · ${profile.activeDays} active days · ${formatFee(profile.totalFeesPaid)} SOL burned.\n\nWhat's your on-chain archetype?`;
  }, [ai.personality, badges, profile.totalTransactions, profile.activeDays, profile.totalFeesPaid]);

  const flash = useCallback((key: string) => {
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleCopyImage = useCallback(async () => {
    try {
      const res = await fetch(activeUrl);
      const blob = await res.blob();
      const pngBlob = blob.type === "image/png"
        ? blob
        : await createImageBitmap(blob).then((bmp) => {
            const canvas = document.createElement("canvas");
            canvas.width = bmp.width;
            canvas.height = bmp.height;
            canvas.getContext("2d")!.drawImage(bmp, 0, 0);
            return new Promise<Blob>((resolve) =>
              canvas.toBlob((b) => resolve(b!), "image/png")
            );
          });
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": pngBlob }),
      ]);
      flash("copy");
    } catch {
      await navigator.clipboard.writeText(shareUrl);
      flash("link");
    }
  }, [activeUrl, shareUrl, flash]);

  const handleDownload = useCallback(async () => {
    const res = await fetch(activeUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solwrapped-${tab}-${address.slice(0, 8)}.png`;
    a.click();
    URL.revokeObjectURL(url);
    flash("download");
  }, [activeUrl, address, tab, flash]);

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl);
    flash("link");
  }, [shareUrl, flash]);

  const handleShareX = useCallback(() => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}&hashtags=Solana,SolWrapped`;
    window.open(url, "_blank");
  }, [tweetText, shareUrl]);

  const handleShareTelegram = useCallback(() => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(tweetText)}`;
    window.open(url, "_blank");
  }, [tweetText, shareUrl]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const markLoaded = (key: CardTab) =>
    setLoadedTabs((prev) => (prev[key] ? prev : { ...prev, [key]: true }));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            className="relative w-full max-w-2xl surface contour overflow-hidden"
            initial={{ scale: 0.94, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--sol-purple)] to-transparent opacity-60" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-7 h-7 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text)] transition-colors cursor-pointer bg-transparent border-none font-mono"
            >
              ✕
            </button>

            <div className="px-6 pt-5 pb-3">
              <div className="mono-label text-[var(--sol-purple)]">SHARE YOUR CARD</div>
            </div>

            {/* Tab switch */}
            <div className="px-6 pb-3 flex gap-1">
              <TabButton active={tab === "ai"} onClick={() => setTab("ai")}>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--sol-teal)] mr-2" />
                AI CARD
              </TabButton>
              <TabButton active={tab === "standard"} onClick={() => setTab("standard")}>
                STANDARD
              </TabButton>
            </div>

            {/* Card preview */}
            <div className="px-6">
              <div className="relative w-full aspect-[1200/630] bg-[var(--bg)] border border-[var(--border)] overflow-hidden rounded-sm">
                {!loadedTabs[tab] && (
                  <LoadingOverlay label={tab === "ai" ? "GENERATING ARTWORK" : "LOADING CARD"} />
                )}
                {/* Render both images so switching tabs is instant after first load */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={aiUrl}
                  alt="AI share card preview"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{
                    opacity: tab === "ai" && loadedTabs.ai ? 1 : 0,
                    transition: "opacity 0.3s",
                    pointerEvents: tab === "ai" ? "auto" : "none",
                  }}
                  onLoad={() => markLoaded("ai")}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={standardUrl}
                  alt="Standard share card preview"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{
                    opacity: tab === "standard" && loadedTabs.standard ? 1 : 0,
                    transition: "opacity 0.3s",
                    pointerEvents: tab === "standard" ? "auto" : "none",
                  }}
                  onLoad={() => markLoaded("standard")}
                />
              </div>
            </div>

            {/* Tweet preview */}
            <div className="px-6 pt-4">
              <div className="bg-[var(--bg)] border border-[var(--border)] rounded-md p-3 font-mono text-[11px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                {tweetText}
                <span className="block mt-1 text-[var(--sol-purple)]">
                  {shareUrl} #Solana #SolWrapped
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="px-6 pt-4 pb-6 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={handleShareX}
                  className="flex-1 flex items-center justify-center gap-2 py-3 font-mono font-medium text-[11px] uppercase tracking-[0.25em] cursor-pointer border border-[var(--sol-purple-bright)] bg-[var(--sol-purple-faint)] text-[var(--sol-purple)] hover:bg-[var(--sol-purple)] hover:text-white transition-all rounded-md"
                >
                  <XIcon />
                  SHARE ON X
                </button>
                <button
                  onClick={handleShareTelegram}
                  className="flex items-center justify-center gap-2 px-5 py-3 font-mono font-medium text-[11px] uppercase tracking-[0.25em] cursor-pointer border border-[var(--border-strong)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--sol-teal)] hover:text-[var(--sol-teal)] transition-all rounded-md"
                >
                  <TelegramIcon />
                  TG
                </button>
              </div>

              <div className="flex gap-2">
                <SecondaryAction
                  label={copied === "copy" ? "COPIED" : "COPY IMG"}
                  icon={copied === "copy" ? <CheckIcon /> : <ClipboardIcon />}
                  onClick={handleCopyImage}
                />
                <SecondaryAction
                  label={copied === "download" ? "SAVED" : "DOWNLOAD"}
                  icon={copied === "download" ? <CheckIcon /> : <DownloadIcon />}
                  onClick={handleDownload}
                />
                <SecondaryAction
                  label={copied === "link" ? "COPIED" : "COPY LINK"}
                  icon={copied === "link" ? <CheckIcon /> : <LinkIcon />}
                  onClick={handleCopyLink}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] cursor-pointer rounded-sm transition-colors ${
        active
          ? "bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border-strong)]"
          : "bg-transparent text-[var(--text-tertiary)] border border-[var(--border)] hover:text-[var(--text-secondary)]"
      }`}
    >
      {children}
    </button>
  );
}

function LoadingOverlay({ label }: { label: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 250);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <div className="w-2 h-2 rounded-full bg-[var(--sol-purple)] animate-pulse" />
      <span className="text-[var(--text-tertiary)] text-[10px] font-mono cursor-blink tracking-[0.2em]">
        {label}
      </span>
      <span className="text-[var(--text-disabled)] text-[10px] font-mono tabular-nums tracking-wider">
        {elapsed}s
      </span>
    </div>
  );
}

function SecondaryAction({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] uppercase tracking-[0.25em] cursor-pointer border border-[var(--border)] bg-transparent text-[var(--text-tertiary)] hover:border-[var(--border-strong)] hover:text-[var(--text)] transition-colors rounded-md"
    >
      {icon}
      {label}
    </button>
  );
}

/* ---- Icons ---- */
function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function TelegramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}
function ClipboardIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
