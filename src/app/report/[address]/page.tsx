"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Logo } from "@/components/Logo";
import type { FullReport, AnalyzeResponse, AIReport, WalletProfile, Badge } from "@/lib/types";
import { getThemeById, defaultTheme, type Theme } from "@/lib/themes";
import { BADGE_COLORS } from "@/lib/badges";

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const scalePop: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function ReportPage() {
  const params = useParams();
  const address = params.address as string;
  const [report, setReport] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("CONNECTING...");
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (!address) return;

    const stages = [
      { at: 10, text: "FETCHING SIGNATURES..." },
      { at: 25, text: "PARSING TRANSACTIONS..." },
      { at: 45, text: "CLASSIFYING PROTOCOLS..." },
      { at: 65, text: "AGGREGATING BEHAVIOR..." },
      { at: 80, text: "RUNNING AI ANALYSIS..." },
      { at: 92, text: "BUILDING REPORT..." },
    ];

    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + Math.random() * 8, 95);
        const stage = stages.findLast((s) => s.at <= next);
        if (stage) setStatusText(stage.text);
        return next;
      });
    }, 400);

    fetch(`/api/analyze/${address}?mode=full`)
      .then((res) => res.json())
      .then((data: AnalyzeResponse) => {
        clearInterval(interval);
        setProgress(100);
        setStatusText("COMPLETE");
        if (data.status === "complete" && data.report) {
          setTimeout(() => {
            setReport(data.report!);
            setLoading(false);
          }, 600);
        } else {
          setError(data.error || "ANALYSIS_FAILED");
          setLoading(false);
        }
      })
      .catch((err) => {
        clearInterval(interval);
        setError(err.message);
        setLoading(false);
      });

    return () => clearInterval(interval);
  }, [address]);

  if (loading) return <ScanScreen progress={progress} status={statusText} address={address} />;

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center flex-col gap-4 font-mono min-h-screen ambient-glow">
        <p className="text-[var(--danger)] text-sm tracking-widest">{`> ERR · ${error}`}</p>
        <a href="/" className="tag hover:border-[var(--sol-purple-bright)] hover:text-[var(--sol-purple)]">← BACK</a>
      </div>
    );
  }

  if (!report) return null;

  const { profile: p, ai, badges } = report;
  const theme = getThemeById(ai.themeId);
  const shortAddr = `${address.slice(0, 6)}···${address.slice(-4)}`;

  return (
    <div
      className="flex flex-col items-center min-h-screen px-4 py-8 relative overflow-hidden ambient-glow scanlines"
      style={{
        "--accent": theme.accent,
        "--accent-faint": theme.accentFaint,
        "--accent-glow": theme.accentGlow,
      } as React.CSSProperties}
    >
      <div className="scan-bar" aria-hidden="true" />

      {/* Ambient glitch field */}
      <div className="glitch-field" aria-hidden="true">
        <span /><span /><span /><span /><span /><span /><span />
      </div>

      <AnimatePresence>
        <motion.div
          className="max-w-xl w-full z-10 flex flex-col gap-6"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Topbar */}
          <motion.div variants={fadeUp} className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 group">
              <span className="h-display text-sm tracking-[0.25em] text-[var(--text)] group-hover:text-white transition-colors">
                SolWrapped
              </span>
            </a>
            <span className="tag">{shortAddr}</span>
          </motion.div>

          {/* Logo Hero — data-driven */}
          <motion.div variants={scalePop} className="flex flex-col items-center gap-4 py-4">
            <Logo profile={p} accent={theme.accent} size={300} pulse />
            <div className="flex flex-col items-center gap-2 -mt-6">
              <span className="mono-label">ON-CHAIN PERSONALITY</span>
              <h1 className="h-display-xl text-center" style={{ letterSpacing: "0.12em" }}>
                {ai.personality}
              </h1>
              <p className="text-[var(--text-secondary)] text-sm text-center max-w-sm font-light leading-relaxed">
                {ai.personalityDescription}
              </p>
            </div>
          </motion.div>

          {/* Badges */}
          {badges.length > 0 && (
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2 justify-center">
              {badges.slice(0, 6).map((b) => (
                <BadgePill key={b.id} badge={b} />
              ))}
            </motion.div>
          )}

          {/* Stats Row */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBlock label="TXS" value={p.totalTransactions.toLocaleString()} />
            <StatBlock label="DAYS" value={String(p.activeDays)} />
            <StatBlock label="PROTOCOLS" value={String(p.activeProtocols.length)} />
            <StatBlock label="VOLUME" value={`${p.estimatedVolumeSOL.toFixed(0)}◎`} accent />
          </motion.div>

          {/* Tx Breakdown */}
          <motion.div variants={fadeUp} className="surface contour p-5">
            <div className="mono-label mb-4">TX BREAKDOWN</div>
            <div className="flex flex-col gap-3">
              <Bar label="SWAP" count={p.swapCount} total={p.totalTransactions} color="var(--sol-purple)" />
              <Bar label="XFER" count={p.transferCount} total={p.totalTransactions} color="var(--sol-teal)" />
              <Bar label="NFT" count={p.nftCount} total={p.totalTransactions} color="var(--text)" />
              <Bar label="STAKE" count={p.stakeCount} total={p.totalTransactions} color="var(--text-secondary)" />
              {p.otherCount > 0 && (
                <Bar label="OTHER" count={p.otherCount} total={p.totalTransactions} color="var(--text-disabled)" />
              )}
            </div>
          </motion.div>

          {/* Protocols */}
          {p.activeProtocols.length > 0 && (
            <motion.div variants={fadeUp} className="surface contour p-5">
              <div className="mono-label mb-3">PROTOCOL USAGE</div>
              <div className="flex flex-wrap gap-2">
                {p.activeProtocols.slice(0, 10).map((proto, i) => (
                  <span
                    key={proto}
                    className={`tag ${i === 0 ? 'tag-purple' : ''}`}
                  >
                    {proto}
                    {p.protocolUsage[proto] && (
                      <span className="text-[var(--text-disabled)] ml-1">
                        {p.protocolUsage[proto]}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Behavior */}
          <motion.div variants={fadeUp} className="surface contour p-5">
            <div className="mono-label mb-4">BEHAVIOR</div>
            <div className="grid grid-cols-2 gap-4">
              <MiniStat label="PEAK HOUR" value={`${String(p.peakHour).padStart(2, "0")}:00 UTC`} />
              <MiniStat label="FREQUENCY" value={`${p.tradingFrequency.toFixed(1)} tx/day`} />
              <MiniStat label="WEEKDAY %" value={`${Math.round(p.weekdayRatio * 100)}%`} />
              <MiniStat label="FEES PAID" value={`${formatFee(p.totalFeesPaid)} SOL`} />
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div variants={fadeUp} className="surface contour p-5 relative">
            {/* Subtle purple glow accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--sol-purple)] to-transparent opacity-40" />
            <div className="mono-label mb-4 text-[var(--sol-purple)]">AI INSIGHTS</div>
            <div className="flex flex-col gap-4">
              {ai.insights.map((insight, i) => (
                <motion.div
                  key={i}
                  className="flex gap-3 items-start"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.12 }}
                >
                  <span className="font-mono text-[10px] mt-0.5 shrink-0 w-5 text-[var(--sol-purple)] tracking-wider">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[var(--text-secondary)] text-[13px] leading-relaxed font-light">
                    {insight}
                  </p>
                </motion.div>
              ))}
            </div>
            {ai.recommendation && (
              <>
                <div className="divider my-4" />
                <div className="flex gap-3 items-start">
                  <span className="tag tag-teal shrink-0">REC</span>
                  <p className="text-[var(--text-secondary)] text-[13px] leading-relaxed font-light">
                    {ai.recommendation}
                  </p>
                </div>
              </>
            )}
          </motion.div>

          {/* Share */}
          <motion.button
            variants={fadeUp}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setShowShare(true)}
            className="btn btn-primary w-full py-4"
          >
            UNWRAP & SHARE
          </motion.button>

          {/* Share Modal */}
          <ShareModal
            open={showShare}
            onClose={() => setShowShare(false)}
            address={address}
            ai={ai}
            profile={p}
            badges={badges}
            theme={theme}
          />

          {/* Data footer */}
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-between text-[var(--text-disabled)] text-[9px] font-mono uppercase tracking-[0.25em] py-2"
          >
            <span>{p.analyzedTransactionCount} TX</span>
            <span>·</span>
            <span>{p.classifiedPercentage}% CLASSIFIED</span>
            <span>·</span>
            <span>HELIUS</span>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ---- BADGE PILL ---- */
function BadgePill({ badge }: { badge: Badge }) {
  const color = BADGE_COLORS[badge.rarity];
  return (
    <span
      className="tag relative"
      title={badge.description}
      style={{
        borderColor: color,
        color: color,
        background: `${color}15`,
        boxShadow: badge.rarity === 'gold' ? `0 0 12px ${color}30` : undefined,
      }}
    >
      <span className="w-1 h-1 rounded-full mr-1" style={{ background: color }} />
      {badge.label}
    </span>
  );
}

/* ---- SHARE MODAL ---- */
function ShareModal({
  open,
  onClose,
  address,
  ai,
  profile,
  badges,
  theme,
}: {
  open: boolean;
  onClose: () => void;
  address: string;
  ai: AIReport;
  profile: WalletProfile;
  badges: Badge[];
  theme: Theme;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const ogUrl = `/api/og/${address}`;
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/report/${address}`
    : `/report/${address}`;

  const goldBadge = badges.find((b) => b.rarity === 'gold');
  const badgeFlex = goldBadge ? ` — ${goldBadge.label} tier.` : '';
  const tweetText = `I'm a ${ai.personality} on Solana.${badgeFlex}\n${profile.totalTransactions.toLocaleString()} txs · ${profile.activeDays} active days · ${formatFee(profile.totalFeesPaid)} SOL burned.\n\nWhat's your on-chain archetype?`;

  const flash = useCallback((key: string) => {
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleCopyImage = useCallback(async () => {
    try {
      const res = await fetch(ogUrl);
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
  }, [ogUrl, shareUrl, flash]);

  const handleDownload = useCallback(async () => {
    const res = await fetch(ogUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solwrapped-${address.slice(0, 8)}.png`;
    a.click();
    URL.revokeObjectURL(url);
    flash("download");
  }, [ogUrl, address, flash]);

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
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

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

            {/* OG Image Preview */}
            <div className="px-6">
              <div className="relative w-full aspect-[1200/630] bg-[var(--bg)] border border-[var(--border)] overflow-hidden rounded-sm">
                {!imgLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[var(--text-tertiary)] text-[10px] font-mono cursor-blink tracking-[0.2em]">
                      LOADING CARD
                    </span>
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={ogUrl}
                  alt="Share card preview"
                  className="w-full h-full object-contain"
                  style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.3s" }}
                  onLoad={() => setImgLoaded(true)}
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

            {/* Action Buttons */}
            <div className="px-6 pt-4 pb-6 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={handleShareX}
                  className="flex-1 flex items-center justify-center gap-2 py-3 font-mono font-medium text-[11px] uppercase tracking-[0.25em] cursor-pointer border border-[var(--sol-purple-bright)] bg-[var(--sol-purple-faint)] text-[var(--sol-purple)] hover:bg-[var(--sol-purple)] hover:text-white transition-all rounded-md"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  SHARE ON X
                </button>
                <button
                  onClick={handleShareTelegram}
                  className="flex items-center justify-center gap-2 px-5 py-3 font-mono font-medium text-[11px] uppercase tracking-[0.25em] cursor-pointer border border-[var(--border-strong)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--sol-teal)] hover:text-[var(--sol-teal)] transition-all rounded-md"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  TG
                </button>
              </div>

              <div className="flex gap-2">
                <SecondaryAction label={copied === "copy" ? "COPIED" : "COPY IMG"} icon={copied === "copy" ? <CheckIcon /> : <ClipboardIcon />} onClick={handleCopyImage} />
                <SecondaryAction label={copied === "download" ? "SAVED" : "DOWNLOAD"} icon={copied === "download" ? <CheckIcon /> : <DownloadIcon />} onClick={handleDownload} />
                <SecondaryAction label={copied === "link" ? "COPIED" : "COPY LINK"} icon={copied === "link" ? <CheckIcon /> : <LinkIcon />} onClick={handleCopyLink} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SecondaryAction({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
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

/* ---- ICONS ---- */
function ClipboardIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="4" rx="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/>
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

/* ---- SCAN / LOADING SCREEN ---- */
function ScanScreen({ progress, status, address }: { progress: number; status: string; address: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 min-h-screen relative ambient-glow scanlines">
      <div className="scan-bar" aria-hidden="true" />

      <motion.div
        className="flex flex-col items-center gap-8 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Animated static logo */}
        <Logo size={180} pulse />

        <div className="flex flex-col items-center gap-2">
          <span className="h-tagline">UNWRAPPING</span>
          <span className="h-display text-xl tracking-[0.15em]">{address.slice(0, 8)}...</span>
        </div>

        <div className="surface contour p-5 w-80">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--sol-purple)] animate-pulse" />
            <span className="text-[var(--text-tertiary)] text-[10px] font-mono tracking-[0.3em]">SCANNING</span>
          </div>

          <p className="text-[var(--text)] text-xs font-mono cursor-blink tracking-wider">{status}</p>

          <div className="progress-track mt-4">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[var(--text-tertiary)] text-[10px] mt-2 text-right font-mono">{Math.round(progress)}%</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ---- SUB COMPONENTS ---- */
function StatBlock({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="surface p-4 flex flex-col gap-1.5">
      <span className="mono-label">{label}</span>
      <span
        className={`mono-data text-xl font-light tracking-tight ${accent ? 'text-[var(--sol-teal)]' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="mono-label">{label}</span>
      <span className="text-[var(--text)] text-sm font-mono tracking-wide">{value}</span>
    </div>
  );
}

function Bar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[var(--text-tertiary)] text-[10px] font-mono w-12 shrink-0 tracking-[0.2em]">{label}</span>
      <div className="flex-1 h-1 bg-[var(--border)] overflow-hidden rounded-full">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-[var(--text-secondary)] text-[10px] font-mono w-10 text-right tabular-nums">{count}</span>
    </div>
  );
}

function formatFee(sol: number): string {
  if (sol >= 1) return sol.toFixed(2);
  if (sol >= 0.001) return sol.toFixed(4);
  return sol.toFixed(6);
}
