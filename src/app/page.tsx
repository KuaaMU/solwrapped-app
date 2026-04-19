"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import { SocialLinks } from "@/components/SocialLinks";
import { validateAddress } from "@/lib/address";

type GenMode = "on" | "festival-only" | "off";
const MODE_STORAGE_KEY = "solwrapped-mode";

export default function Home() {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const [mode, setMode] = useState<GenMode>("on");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_STORAGE_KEY);
      if (saved === "on" || saved === "festival-only" || saved === "off") {
        setMode(saved);
      }
    } catch {
      // localStorage unavailable — silently keep default
    }
  }, []);

  const updateMode = (next: GenMode) => {
    setMode(next);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {
      // no-op
    }
  };

  const handleAnalyze = () => {
    const check = validateAddress(address);
    if (!check.ok) {
      setError(check.reason);
      inputRef.current?.focus();
      return;
    }
    setError("");
    const query = mode === "on" ? "" : `?mode=${mode}`;
    router.push(`/report/${check.address}${query}`);
  };

  const handleDemoSelect = (value: string) => {
    setAddress(value);
    setError("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen relative overflow-hidden ambient-glow scanlines">
      <div className="scan-bar" aria-hidden="true" />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 z-10">
        <div className="max-w-xl w-full flex flex-col items-center gap-10">

          {/* Tags row */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <span className="tag tag-purple">SOLANA</span>
            <span className="tag">FRONTIER 2026</span>
          </motion.div>

          {/* Logo hero — static brand version with mouse interactivity */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <Logo
              size="min(280px, 72vw)"
              pulse
              interactive
              className="select-none"
            />
          </motion.div>

          {/* Brand typography */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col items-center gap-3 -mt-4"
          >
            <h1 className="h-display-xl" style={{ letterSpacing: "0.3em" }}>
              SolWrapped
            </h1>
            <p className="h-tagline">YOUR WALLET TELLS A STORY</p>
          </motion.div>

          {/* Input block with world-line convergence rings */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full flex flex-col gap-3 mt-2 relative"
          >
            <label className="mono-label text-center">ENTER YOUR WALLET TO BEGIN</label>

            <div className="relative">
              {/* Convergence rings — visible when input focused, pulsing inward */}
              <AnimatePresence>
                {focused && (
                  <>
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute rounded-md pointer-events-none"
                        style={{
                          border: `1.5px dashed rgba(153, 69, 255, ${0.5 - i * 0.15})`,
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                        }}
                        initial={{ scale: 1 + (i + 1) * 0.15, opacity: 0 }}
                        animate={{
                          scale: [1 + (i + 1) * 0.15, 1],
                          opacity: [0, 0.6 - i * 0.1, 0],
                        }}
                        exit={{ opacity: 0, scale: 1 + (i + 1) * 0.15 }}
                        transition={{
                          duration: 2,
                          delay: i * 0.3,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>

              <div className="flex flex-col sm:flex-row gap-2 relative z-10">
                <input
                  ref={inputRef}
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setError("");
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  placeholder="Solana address or demo-*"
                  spellCheck={false}
                  className="input flex-1"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleAnalyze}
                  disabled={!address.trim()}
                  className="btn btn-primary whitespace-nowrap"
                >
                  UNWRAP
                </motion.button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-[var(--danger)] text-xs font-mono text-center tracking-widest mt-1"
                >
                  {`> ERR · ${error}`}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Generation mode — seasonal / festival / none */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col items-center gap-2 -mt-2"
          >
            <span className="mono-label">GENERATION MODE</span>
            <div className="flex gap-1" role="radiogroup" aria-label="Generation mode">
              <ModeOption
                active={mode === "on"}
                label="SEASONAL"
                hint="Festival + solar term + season context"
                onClick={() => updateMode("on")}
              />
              <ModeOption
                active={mode === "festival-only"}
                label="FESTIVAL"
                hint="Only major festivals — no seasons"
                onClick={() => updateMode("festival-only")}
              />
              <ModeOption
                active={mode === "off"}
                label="OFF"
                hint="Pure archetype — no time context"
                onClick={() => updateMode("off")}
              />
            </div>
          </motion.div>

          <div className="divider" />

          {/* Demo pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col items-center gap-3 w-full"
          >
            <span className="mono-label">TRY A DEMO WALLET</span>
            <div className="flex flex-wrap gap-2 justify-center">
              <DemoPill label="MIDNIGHT DEGEN" onClick={() => handleDemoSelect("demo-degen")} />
              <DemoPill label="YIELD MONK" onClick={() => handleDemoSelect("demo-farmer")} />
              <DemoPill label="PIXEL HUNTER" onClick={() => handleDemoSelect("demo-collector")} />
            </div>
          </motion.div>

          <div className="divider" />

          {/* Three features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-3 gap-6 w-full"
          >
            <Feature num="01" label="PERSONALITY" desc="AI archetype from tx patterns" />
            <Feature num="02" label="INSIGHTS" desc="Hidden fees · missed alpha" />
            <Feature num="03" label="CARD" desc="Data-driven share artifact" />
          </motion.div>

          {/* Footer */}
          <div className="flex flex-col items-center gap-3 pt-4">
            <div className="flex items-center gap-3 text-[var(--text-disabled)] text-[10px] font-mono uppercase tracking-[0.3em]">
              <span>COLOSSEUM FRONTIER 2026</span>
              <span>·</span>
              <span>HELIUS</span>
              <span>·</span>
              <span>CLAUDE</span>
            </div>
            <SocialLinks />
          </div>
        </div>
      </main>
    </div>
  );
}

function DemoPill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="tag hover:border-[var(--sol-purple)] hover:text-[var(--sol-purple)] hover:bg-[var(--sol-purple-faint)] hover:shadow-[0_0_14px_rgba(153,69,255,0.3)] transition-all cursor-pointer active:shadow-[0_0_20px_rgba(153,69,255,0.5)]"
    >
      {label}
    </motion.button>
  );
}

function ModeOption({
  active,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      title={hint}
      aria-pressed={active}
      className={`tag cursor-pointer transition-all ${
        active
          ? "border-[var(--sol-teal)] text-[var(--sol-teal)] bg-[var(--sol-teal-faint)] shadow-[0_0_14px_rgba(20,241,149,0.25)]"
          : "text-[var(--text-tertiary)] hover:text-[var(--text)] hover:border-[var(--border-strong)]"
      }`}
    >
      {label}
    </motion.button>
  );
}

function Feature({ num, label, desc }: { num: string; label: string; desc: string }) {
  return (
    <div className="flex flex-col gap-1.5 items-center text-center">
      <span className="font-mono text-[11px] text-[var(--sol-purple)] tracking-[0.3em] font-medium">
        {num}
      </span>
      <span className="h-display text-[12px] tracking-[0.25em] text-[var(--text)] font-medium">
        {label}
      </span>
      <span className="text-[var(--text-tertiary)] text-[11px] leading-relaxed">
        {desc}
      </span>
    </div>
  );
}
