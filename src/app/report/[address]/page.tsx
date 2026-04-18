"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Logo } from "@/components/Logo";
import { ScanScreen } from "@/components/report/ScanScreen";
import { ShareModal } from "@/components/report/ShareModal";
import {
  BadgePill,
  StatBlock,
  MiniStat,
  Bar,
  formatFee,
} from "@/components/report/ReportAtoms";
import type { FullReport, AnalyzeResponse } from "@/lib/types";
import { getThemeById } from "@/lib/themes";

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

const LOADING_STAGES = [
  { at: 10, text: "FETCHING SIGNATURES..." },
  { at: 25, text: "PARSING TRANSACTIONS..." },
  { at: 45, text: "CLASSIFYING PROTOCOLS..." },
  { at: 65, text: "AGGREGATING BEHAVIOR..." },
  { at: 80, text: "RUNNING AI ANALYSIS..." },
  { at: 92, text: "BUILDING REPORT..." },
];

export default function ReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const address = params.address as string;
  const rawMode = searchParams.get("mode");
  const mode: "on" | "festival-only" | "off" =
    rawMode === "off" || rawMode === "festival-only" ? rawMode : "on";
  const cardQuery = mode === "on" ? "" : `?mode=${mode}`;
  const [report, setReport] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("CONNECTING...");
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (!address) return;

    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + Math.random() * 8, 95);
        const stage = LOADING_STAGES.findLast((s) => s.at <= next);
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
          // Warm the AI card cache in the background so the share modal is instant.
          fetch(`/api/card/${address}${cardQuery}`).catch(() => {});
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
  }, [address, cardQuery]);

  if (loading) return <ScanScreen progress={progress} status={statusText} address={address} />;

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center flex-col gap-4 font-mono min-h-screen ambient-glow">
        <p className="text-[var(--danger)] text-sm tracking-widest">{`> ERR · ${error}`}</p>
        <a href="/" className="tag hover:border-[var(--sol-purple-bright)] hover:text-[var(--sol-purple)]">
          ← BACK
        </a>
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
          <motion.div variants={fadeUp} className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 group">
              <span className="h-display text-sm tracking-[0.25em] text-[var(--text)] group-hover:text-white transition-colors">
                SolWrapped
              </span>
            </a>
            <span className="tag">{shortAddr}</span>
          </motion.div>

          <motion.div variants={scalePop} className="flex flex-col items-center gap-4 py-4">
            <Logo profile={p} accent={theme.accent} size="min(300px, 72vw)" pulse />
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

          {badges.length > 0 && (
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2 justify-center">
              {badges.slice(0, 6).map((b) => (
                <BadgePill key={b.id} badge={b} />
              ))}
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBlock label="TXS" value={p.totalTransactions.toLocaleString()} />
            <StatBlock label="DAYS" value={String(p.activeDays)} />
            <StatBlock label="PROTOCOLS" value={String(p.activeProtocols.length)} />
            <StatBlock label="VOLUME" value={`${p.estimatedVolumeSOL.toFixed(1)}◎`} accent />
          </motion.div>

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

          {p.activeProtocols.length > 0 && (
            <motion.div variants={fadeUp} className="surface contour p-5">
              <div className="mono-label mb-3">PROTOCOL USAGE</div>
              <div className="flex flex-wrap gap-2">
                {p.activeProtocols.slice(0, 10).map((proto, i) => (
                  <span key={proto} className={`tag ${i === 0 ? "tag-purple" : ""}`}>
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

          <motion.div variants={fadeUp} className="surface contour p-5">
            <div className="mono-label mb-4">BEHAVIOR</div>
            <div className="grid grid-cols-2 gap-4">
              <MiniStat label="PEAK HOUR" value={`${String(p.peakHour).padStart(2, "0")}:00 UTC`} />
              <MiniStat label="FREQUENCY" value={`${p.tradingFrequency.toFixed(1)} tx/day`} />
              <MiniStat label="WEEKDAY %" value={`${Math.round(p.weekdayRatio * 100)}%`} />
              <MiniStat label="FEES PAID" value={`${formatFee(p.totalFeesPaid)} SOL`} />
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="surface contour p-5 relative">
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

          <motion.button
            variants={fadeUp}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setShowShare(true)}
            className="btn btn-primary w-full py-4"
          >
            UNWRAP & SHARE
          </motion.button>

          <ShareModal
            open={showShare}
            onClose={() => setShowShare(false)}
            address={address}
            ai={ai}
            profile={p}
            badges={badges}
            mode={mode}
          />

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
