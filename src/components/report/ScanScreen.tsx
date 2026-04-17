"use client";

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
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--sol-purple)] animate-pulse" />
            <span className="text-[var(--text-tertiary)] text-[10px] font-mono tracking-[0.3em]">
              SCANNING
            </span>
          </div>

          <p className="text-[var(--text)] text-xs font-mono cursor-blink tracking-wider">
            {status}
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
