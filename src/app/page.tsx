"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAnalyze = () => {
    const trimmed = address.trim();
    if (!trimmed) {
      setError("EMPTY ADDRESS");
      return;
    }
    // Allow demo addresses and real Solana addresses (32+ chars)
    const isDemo = trimmed.startsWith("demo-") || trimmed.toLowerCase() === "demo";
    if (!isDemo && trimmed.length < 32) {
      setError("INVALID ADDRESS");
      return;
    }
    setError("");
    router.push(`/report/${trimmed}`);
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center noise scan-grid min-h-screen relative">
      {/* Scan line effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="scanline absolute left-0 right-0 h-px bg-[var(--accent)] opacity-20" />
      </div>

      <main className="flex flex-col items-start gap-10 px-6 py-20 max-w-xl w-full z-10">
        {/* ASCII hero */}
        <pre
          className="text-[var(--accent)] text-[10px] leading-tight opacity-60 select-none hidden md:block"
          aria-hidden="true"
        >{`
  ╔═══════════════════════════════════════╗
  ║  ███████╗ ██████╗ ██╗     ██╗    ██╗ ║
  ║  ██╔════╝██╔═══██╗██║     ██║    ██║ ║
  ║  ███████╗██║   ██║██║     ██║ █╗ ██║ ║
  ║  ╚════██║██║   ██║██║     ██║███╗██║ ║
  ║  ███████║╚██████╔╝███████╗╚███╔███╔╝ ║
  ║  ╚══════╝ ╚═════╝ ╚══════╝ ╚══╝╚══╝ ║
  ╚═══════════════════════════════════════╝`}
        </pre>

        {/* Header block */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="tag tag-accent">SOLANA</span>
            <span className="tag">FRONTIER 2026</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[0.9] mt-4">
            SOL
            <br />
            <span style={{ color: "var(--accent)" }}>WRAPPED</span>
          </h1>

          <p className="text-[var(--text-dim)] text-sm mt-2 max-w-sm leading-relaxed font-mono">
            Your wallet tells a story. AI reads the chain,
            <br />
            finds your personality, builds your card.
          </p>
        </div>

        {/* Input block */}
        <div className="w-full flex flex-col gap-3">
          <label className="mono-label">WALLET ADDRESS</label>
          <div className="flex gap-0">
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="Paste your Solana address..."
              spellCheck={false}
              className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] border-r-0 px-4 py-3 text-[var(--text)] placeholder-[var(--text-dim)] outline-none font-mono text-sm focus:border-[var(--accent)] transition-colors"
            />
            <button
              onClick={handleAnalyze}
              disabled={!address.trim()}
              className="btn-accent whitespace-nowrap"
            >
              SCAN →
            </button>
          </div>

          {error && (
            <p className="text-[var(--danger)] text-xs font-mono">{`> ERR: ${error}`}</p>
          )}
        </div>

        {/* Feature chips */}
        <div className="flex flex-col gap-4 w-full">
          <div className="divider" />
          <div className="grid grid-cols-3 gap-4">
            <FeatureBlock num="01" label="PERSONALITY" desc="AI-generated archetype from your tx patterns" />
            <FeatureBlock num="02" label="INSIGHTS" desc="Hidden losses, missed airdrops, protocol stats" />
            <FeatureBlock num="03" label="SHARE" desc="Export card to Twitter. Flex your on-chain identity" />
          </div>
        </div>

        {/* Demo links */}
        <div className="flex flex-col gap-2 w-full">
          <div className="divider" />
          <div className="mono-label">DEMO WALLETS</div>
          <div className="flex gap-2">
            <button onClick={() => { setAddress("demo-degen"); }} className="tag tag-accent cursor-pointer hover:opacity-80">
              DEGEN
            </button>
            <button onClick={() => { setAddress("demo-farmer"); }} className="tag cursor-pointer hover:opacity-80">
              YIELD FARMER
            </button>
            <button onClick={() => { setAddress("demo-collector"); }} className="tag cursor-pointer hover:opacity-80">
              NFT COLLECTOR
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 text-[var(--text-dim)] text-[10px] font-mono uppercase tracking-widest">
          <span>Colosseum Frontier 2026</span>
          <span>·</span>
          <span>Helius</span>
          <span>·</span>
          <span>Claude</span>
        </div>
      </main>
    </div>
  );
}

function FeatureBlock({
  num,
  label,
  desc,
}: {
  num: string;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[var(--accent)] font-mono text-xs">{num}</span>
      <span className="text-[var(--text)] font-bold text-xs tracking-wider">{label}</span>
      <span className="text-[var(--text-dim)] text-[10px] leading-relaxed">{desc}</span>
    </div>
  );
}
