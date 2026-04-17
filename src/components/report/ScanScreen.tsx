"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

export function ScanScreen({
  progress,
  status,
  address,
}: {
  progress: number;
  status: string;
  address: string;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 250);
    return () => clearInterval(id);
  }, []);

  // When we've been stuck at the late stage for a while, show a reassurance
  // message — real wallets with thousands of transactions can take 30-60s.
  const stuck = progress >= 92 && elapsed > 20;
  const shownStatus = stuck ? "LARGE WALLET — STILL SCANNING..." : status;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 min-h-screen relative ambient-glow scanlines">
      <div className="scan-bar" aria-hidden="true" />

      <motion.div
        className="flex flex-col items-center gap-8 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Logo size={180} pulse />

        <div className="flex flex-col items-center gap-2">
          <span className="h-tagline">UNWRAPPING</span>
          <span className="h-display text-xl tracking-[0.15em]">
            {address.slice(0, 8)}...
          </span>
        </div>

        <div className="surface contour p-5 w-80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--sol-purple)] animate-pulse" />
              <span className="text-[var(--text-tertiary)] text-[10px] font-mono tracking-[0.3em]">
                SCANNING
              </span>
            </div>
            <span className="text-[var(--text-tertiary)] text-[10px] font-mono tabular-nums tracking-wider">
              {elapsed}s
            </span>
          </div>

          <p className="text-[var(--text)] text-xs font-mono cursor-blink tracking-wider">
            {shownStatus}
          </p>

          <div className="progress-track mt-4">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[var(--text-tertiary)] text-[10px] mt-2 text-right font-mono">
            {Math.round(progress)}%
          </p>
        </div>
      </motion.div>
    </div>
  );
}
