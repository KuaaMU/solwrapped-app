import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getCachedReport } from '@/lib/cache';
import { getDemoReport } from '@/lib/demo-data';
import { getThemeById, defaultTheme } from '@/lib/themes';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const report = getCachedReport(address) || getDemoReport(address);

  const personality = report?.ai.personality || 'SOLANA USER';
  const emoji = report?.ai.personalityEmoji || '◎';
  const themeId = report?.ai.themeId || 'cyan';
  const theme = getThemeById(themeId);

  const totalTxs = report?.profile.totalTransactions || 0;
  const activeDays = report?.profile.activeDays || 0;
  const protocols = report?.profile.activeProtocols.length || 0;
  const volume = report?.profile.estimatedVolumeSOL?.toFixed(0) || '0';
  const shortAddr = `${address.slice(0, 6)}···${address.slice(-4)}`;

  const swaps = report?.profile.swapCount || 0;
  const xfers = report?.profile.transferCount || 0;
  const nfts = report?.profile.nftCount || 0;
  const total = totalTxs || 1;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#09090b',
          padding: '48px 56px',
          fontFamily: 'monospace',
          color: '#fafafa',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Gradient background tint */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 80% 60% at 20% 80%, ${theme.bg}, transparent), radial-gradient(ellipse 60% 50% at 80% 20%, ${theme.bg}, transparent)`,
            display: 'flex',
          }}
        />

        {/* Glow blob top-right */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-60px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: theme.glow,
            filter: 'blur(80px)',
            display: 'flex',
          }}
        />

        {/* Glow blob bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-80px',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: theme.glow,
            filter: 'blur(100px)',
            opacity: 0.6,
            display: 'flex',
          }}
        />

        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              `linear-gradient(${theme.primaryDim.replace('0.15', '0.04')} 1px, transparent 1px), linear-gradient(90deg, ${theme.primaryDim.replace('0.15', '0.04')} 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            display: 'flex',
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
            display: 'flex',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: theme.primary, fontSize: '16px', fontWeight: 700, letterSpacing: '0.15em' }}>
              SOLWRAPPED
            </span>
            <span style={{
              border: `1px solid ${theme.primary}40`,
              padding: '2px 8px',
              fontSize: '10px',
              color: theme.primary,
              letterSpacing: '0.1em',
              display: 'flex',
              opacity: 0.6,
            }}>
              2026
            </span>
          </div>
          <span style={{
            border: '1px solid #27272a',
            padding: '2px 8px',
            fontSize: '11px',
            color: '#a1a1aa',
            fontFamily: 'monospace',
            display: 'flex',
          }}>
            {shortAddr}
          </span>
        </div>

        {/* Main personality */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'center',
            gap: '8px',
            zIndex: 1,
          }}
        >
          <span style={{ fontSize: '14px', color: '#52525b', letterSpacing: '0.15em', display: 'flex' }}>
            ON-CHAIN PERSONALITY
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '48px', display: 'flex' }}>{emoji}</span>
            <span
              style={{
                fontSize: '56px',
                fontWeight: 800,
                color: theme.primary,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                display: 'flex',
              }}
            >
              {personality.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: 'flex',
            gap: '0px',
            borderTop: '1px solid #27272a',
            paddingTop: '20px',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '2px' }}>
            <span style={{ fontSize: '10px', color: '#52525b', letterSpacing: '0.15em', display: 'flex' }}>TXS</span>
            <span style={{ fontSize: '28px', fontWeight: 700, color: '#fafafa', display: 'flex' }}>
              {totalTxs.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '2px' }}>
            <span style={{ fontSize: '10px', color: '#52525b', letterSpacing: '0.15em', display: 'flex' }}>DAYS</span>
            <span style={{ fontSize: '28px', fontWeight: 700, color: '#fafafa', display: 'flex' }}>
              {activeDays}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '2px' }}>
            <span style={{ fontSize: '10px', color: '#52525b', letterSpacing: '0.15em', display: 'flex' }}>PROTOCOLS</span>
            <span style={{ fontSize: '28px', fontWeight: 700, color: '#fafafa', display: 'flex' }}>
              {protocols}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '2px' }}>
            <span style={{ fontSize: '10px', color: '#52525b', letterSpacing: '0.15em', display: 'flex' }}>VOLUME</span>
            <span style={{ fontSize: '28px', fontWeight: 700, color: theme.primary, display: 'flex' }}>
              {volume}◎
            </span>
          </div>

          {/* Mini bar chart */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: '2px', height: '6px' }}>
              <div style={{ width: `${(swaps / total) * 100}%`, background: theme.barColors.swap, display: 'flex', minWidth: swaps > 0 ? '4px' : '0' }} />
              <div style={{ width: `${(xfers / total) * 100}%`, background: theme.barColors.transfer, display: 'flex', minWidth: xfers > 0 ? '4px' : '0' }} />
              <div style={{ width: `${(nfts / total) * 100}%`, background: theme.barColors.nft, display: 'flex', minWidth: nfts > 0 ? '4px' : '0' }} />
            </div>
            <span style={{ fontSize: '9px', color: '#52525b', display: 'flex' }}>
              SWAP · XFER · NFT
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
