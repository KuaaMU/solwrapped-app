import type { Metadata } from "next";
import { getCachedReport } from "@/lib/cache";
import { getDemoReport } from "@/lib/demo-data";
import { ReportClient } from "./ReportClient";

type PageParams = { params: Promise<{ address: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

function pickString(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

export async function generateMetadata({ params, searchParams }: PageParams): Promise<Metadata> {
  const { address } = await params;
  const sp = await searchParams;
  const mode = pickString(sp.mode) ?? "on";
  const v = pickString(sp.v);

  const report = getDemoReport(address) ?? getCachedReport(address);
  const personality = report?.ai.personality;
  const shortAddr = `${address.slice(0, 4)}···${address.slice(-4)}`;

  const title = personality
    ? `${personality} — SolWrapped`
    : `SolWrapped — ${shortAddr}`;

  const description = report?.ai.personalityDescription
    ?? "Your wallet tells a story. Discover your on-chain archetype.";

  const cardQuery = new URLSearchParams();
  if (mode !== "on") cardQuery.set("mode", mode);
  if (v) cardQuery.set("v", v);
  const qs = cardQuery.toString();
  const cardPath = `/api/card/${address}${qs ? `?${qs}` : ""}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/report/${address}${qs ? `?${qs}` : ""}`,
      images: [{ url: cardPath, width: 1200, height: 630, alt: `${personality ?? "SolWrapped"} — on-chain archetype card` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [cardPath],
      creator: "@X_SwarmMind",
    },
  };
}

export default async function ReportPage({ params }: PageParams) {
  const { address } = await params;
  return <ReportClient address={address} />;
}
