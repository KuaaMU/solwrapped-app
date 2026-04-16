import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const { address } = await params;
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return {
    title: `SolWrapped — ${shortAddr}`,
    description: `Discover the on-chain personality of ${shortAddr}. Powered by AI.`,
    openGraph: {
      title: `SolWrapped — ${shortAddr}`,
      description: `Discover the on-chain personality of ${shortAddr}`,
      images: [
        {
          url: `/api/og/${address}`,
          width: 1200,
          height: 630,
          alt: `SolWrapped report for ${shortAddr}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `SolWrapped — ${shortAddr}`,
      description: `Discover the on-chain personality of ${shortAddr}`,
      images: [`/api/og/${address}`],
    },
  };
}

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
