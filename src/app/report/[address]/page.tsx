"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import type { FullReport, AnalyzeResponse } from "@/lib/types";
import { getThemeById, defaultTheme, type Theme } from "@/lib/themes";

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
};

const scalePop: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export default function ReportPage() {
  const params = useParams();
  const address = params.address as string;
  const [report, setReport] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("CONNECTING...");

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
      <div className="flex flex-1 items-center justify-center flex-col gap-4 font-mono">
        <p className="text-[var(--danger)] text-sm">{`> ERR: ${error}`}</p>
        <a href="/" className="text-[var(--accent)] text-xs underline">← BACK</a>
      </div>
    );
  }

  if (!report) return null;

  const { profile: p, ai } = report;
  const theme = getThemeById(ai.themeId);
  const shortAddr = `${address.slice(0, 6)}···${address.slice(-4)}`;

  return (
    <div
      className="flex flex-col items-center min-h-screen noise scan-grid px-4 py-6 relative overflow-hidden"
      style={{
        "--accent": theme.primary,
        "--accent-dim": theme.primaryDim,
        "--accent-glow": theme.glow,
      } as React.CSSProperties}
    >
      {/* Glow blobs */}
      <div
        className="absolute -top-32 -right-24 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: theme.glow, filter: "blur(100px)" }}
      />
      <div
        className="absolute -bottom-40 -left-32 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: theme.glow, filter: "blur(120px)", opacity: 0.5 }}
      />

      <AnimatePresence>
        <motion.div
          className="max-w-lg w-full z-10 flex flex-col gap-4"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Topbar */}
          <motion.div variants={fadeUp} className="flex items-center justify-between">
            <a href="/" className="font-bold text-sm font-mono tracking-wider" style={{ color: theme.primary }}>
              SOLWRAPPED
            </a>
            <span className="tag">{shortAddr}</span>
          </motion.div>

          {/* Personality Hero */}
          <motion.div
            variants={scalePop}
            className="bcard p-6 flex flex-col items-center gap-3"
            style={{ borderTopColor: theme.primary, borderTopWidth: "2px" }}
          >
            <span className="text-5xl">{ai.personalityEmoji}</span>
            <h1 className="big-num text-center" style={{ color: theme.primary }}>
              {ai.personality}
            </h1>
            <p className="text-[var(--text-dim)] text-xs text-center max-w-xs font-mono">
              {ai.personalityDescription}
            </p>
          </motion.div>

          {/* Stats Row */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatBlock label="TXS" value={p.totalTransactions.toLocaleString()} theme={theme} />
            <StatBlock label="DAYS" value={String(p.activeDays)} theme={theme} />
            <StatBlock label="PROTOS" value={String(p.activeProtocols.length)} theme={theme} />
            <StatBlock label="VOL" value={`${p.estimatedVolumeSOL.toFixed(0)}◎`} theme={theme} />
          </motion.div>

          {/* Tx Breakdown */}
          <motion.div variants={fadeUp} className="bcard p-4">
            <div className="mono-label mb-3">TX BREAKDOWN</div>
            <div className="flex flex-col gap-2">
              <Bar label="SWAP" count={p.swapCount} total={p.totalTransactions} color={theme.barColors.swap} />
              <Bar label="XFER" count={p.transferCount} total={p.totalTransactions} color={theme.barColors.transfer} />
              <Bar label="NFT" count={p.nftCount} total={p.totalTransactions} color={theme.barColors.nft} />
              <Bar label="STAKE" count={p.stakeCount} total={p.totalTransactions} color={theme.barColors.stake} />
              {p.otherCount > 0 && (
                <Bar label="OTHER" count={p.otherCount} total={p.totalTransactions} color="var(--text-dim)" />
              )}
            </div>
          </motion.div>

          {/* Protocols */}
          {p.activeProtocols.length > 0 && (
            <motion.div variants={fadeUp} className="bcard p-4">
              <div className="mono-label mb-3">PROTOCOL USAGE</div>
              <div className="flex flex-wrap gap-1">
                {p.activeProtocols.slice(0, 10).map((proto, i) => (
                  <span
                    key={proto}
                    className="tag"
                    style={i === 0 ? { borderColor: theme.primary, color: theme.primary, background: theme.primaryDim } : undefined}
                  >
                    {proto} {p.protocolUsage[proto] && `(${p.protocolUsage[proto]})`}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Behavior */}
          <motion.div variants={fadeUp} className="bcard p-4">
            <div className="mono-label mb-3">BEHAVIOR</div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="PEAK HOUR" value={`${String(p.peakHour).padStart(2, "0")}:00 UTC`} />
              <MiniStat label="FREQUENCY" value={`${p.tradingFrequency.toFixed(1)} tx/day`} />
              <MiniStat label="WEEKDAY %" value={`${Math.round(p.weekdayRatio * 100)}%`} />
              <MiniStat label="FEES PAID" value={`${formatFee(p.totalFeesPaid)} SOL`} />
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div
            variants={fadeUp}
            className="bcard p-4"
            style={{ borderTopColor: theme.primary, borderTopWidth: "2px" }}
          >
            <div className="mono-label mb-3" style={{ color: theme.primary }}>AI INSIGHTS</div>
            <div className="flex flex-col gap-3">
              {ai.insights.map((insight, i) => (
                <motion.div
                  key={i}
                  className="flex gap-3 items-start"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.12 }}
                >
                  <span className="font-mono text-[10px] mt-0.5 shrink-0 w-5" style={{ color: theme.primary }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[var(--text-muted)] text-xs leading-relaxed font-mono">
                    {insight}
                  </p>
                </motion.div>
              ))}
            </div>
            {ai.recommendation && (
              <>
                <div className="divider my-3" />
                <div className="flex gap-3 items-start">
                  <span className="tag tag-hot">REC</span>
                  <p className="text-[var(--text-muted)] text-xs leading-relaxed font-mono">
                    {ai.recommendation}
                  </p>
                </div>
              </>
            )}
          </motion.div>

          {/* Share */}
          <motion.button
            variants={fadeUp}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const text = `My Solana personality: "${ai.personality}" ${ai.personalityEmoji}\n${p.totalTransactions} txs · ${p.activeProtocols.length} protocols · ${p.activeDays} active days\n\nReveal yours:`;
              const url = `${window.location.origin}/report/${address}`;
              window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
                "_blank"
              );
            }}
            className="w-full text-center font-mono font-bold text-sm uppercase tracking-wider py-3 border-none cursor-pointer"
            style={{ background: theme.primary, color: "#09090b" }}
          >
            SHARE ON X →
          </motion.button>

          {/* Data footer */}
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-between text-[var(--text-dim)] text-[9px] font-mono uppercase tracking-wider py-2"
          >
            <span>{p.analyzedTransactionCount} TXS ANALYZED</span>
            <span>{p.classifiedPercentage}% CLASSIFIED</span>
            <span>HELIUS API</span>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ---- SCAN / LOADING SCREEN ---- */
function ScanScreen({ progress, status, address }: { progress: number; status: string; address: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 noise scan-grid min-h-screen relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="scanline absolute left-0 right-0 h-px bg-[var(--accent)] opacity-30" />
      </div>

      <motion.div
        className="flex flex-col items-center gap-6 z-10 font-mono"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Terminal-style output */}
        <div className="bcard p-6 w-80">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[var(--danger)]" />
            <div className="w-2 h-2 rounded-full bg-[var(--hot)]" />
            <div className="w-2 h-2 rounded-full bg-[var(--success)]" />
            <span className="text-[var(--text-dim)] text-[10px] ml-2">solwrapped</span>
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <p className="text-[var(--text-dim)]">
              <span className="text-[var(--accent)]">$</span> scan --address {address.slice(0, 8)}...
            </p>
            <p className="text-[var(--text-muted)] cursor-blink">{status}</p>
          </div>

          <div className="progress-track mt-4">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[var(--text-dim)] text-[10px] mt-2 text-right">{Math.round(progress)}%</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ---- SUB COMPONENTS ---- */
function StatBlock({ label, value, theme }: { label: string; value: string; theme: Theme }) {
  return (
    <div className="bcard p-3 flex flex-col gap-1">
      <span className="mono-label">{label}</span>
      <span className="text-[var(--text)] font-bold text-lg tracking-tight">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="mono-label">{label}</span>
      <span className="text-[var(--text-muted)] text-xs font-mono">{value}</span>
    </div>
  );
}

function Bar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--text-dim)] text-[10px] font-mono w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--border)] overflow-hidden">
        <motion.div
          className="h-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-[var(--text-dim)] text-[10px] font-mono w-8 text-right">{count}</span>
    </div>
  );
}

function formatFee(sol: number): string {
  if (sol >= 1) return sol.toFixed(2);
  if (sol >= 0.001) return sol.toFixed(4);
  return sol.toFixed(6);
}
