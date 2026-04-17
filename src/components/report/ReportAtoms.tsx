"use client";

import { motion } from "framer-motion";
import type { Badge } from "@/lib/types";
import { BADGE_COLORS } from "@/lib/badges";

export function formatFee(sol: number): string {
  if (sol >= 1) return sol.toFixed(2);
  if (sol >= 0.001) return sol.toFixed(4);
  return sol.toFixed(6);
}

export function BadgePill({ badge }: { badge: Badge }) {
  const color = BADGE_COLORS[badge.rarity];
  return (
    <span
      className="tag relative"
      title={badge.description}
      style={{
        borderColor: color,
        color: color,
        background: `${color}15`,
        boxShadow: badge.rarity === "gold" ? `0 0 12px ${color}30` : undefined,
      }}
    >
      <span className="w-1 h-1 rounded-full mr-1" style={{ background: color }} />
      {badge.label}
    </span>
  );
}

export function StatBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="surface p-4 flex flex-col gap-1.5">
      <span className="mono-label">{label}</span>
      <span
        className={`mono-data text-xl font-light tracking-tight ${accent ? "text-[var(--sol-teal)]" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="mono-label">{label}</span>
      <span className="text-[var(--text)] text-sm font-mono tracking-wide">{value}</span>
    </div>
  );
}

export function Bar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[var(--text-tertiary)] text-[10px] font-mono w-12 shrink-0 tracking-[0.2em]">
        {label}
      </span>
      <div className="flex-1 h-1 bg-[var(--border)] overflow-hidden rounded-full">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-[var(--text-secondary)] text-[10px] font-mono w-10 text-right tabular-nums">
        {count}
      </span>
    </div>
  );
}
