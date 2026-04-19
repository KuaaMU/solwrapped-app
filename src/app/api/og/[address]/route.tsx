import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getCachedReport } from '@/lib/cache';
import { getDemoReport } from '@/lib/demo-data';
import { getThemeById } from '@/lib/themes';
import { generateLogo, profileToLogoParams } from '@/lib/logo-svg';
import { BADGE_COLORS } from '@/lib/badges';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const report = getCachedReport(address) || getDemoReport(address);

  const personality = report?.ai.personality || 'SOLANA USER';
  const description = report?.ai.personalityDescription || 'Your wallet tells a story';
  const themeId = report?.ai.themeId || 'violet';
  const theme = getThemeById(themeId);
  const badges = report?.badges || [];

  const totalTxs = report?.profile.totalTransactions || 0;
  const activeDays = report?.profile.activeDays || 0;
  const protocols = report?.profile.activeProtocols.length || 0;
  const volume = report?.profile.estimatedVolumeSOL?.toFixed(1) || '0';
  const shortAddr = `${address.slice(0, 6)}···${address.slice(-4)}`;

  // Build data-driven logo SVG → base64 data URI for Satori
  const logoSvg = report?.profile
    ? generateLogo(profileToLogoParams({
        totalTransactions: report.profile.totalTransactions,
        tradingFrequency: report.profile.tradingFrequency,
        activeProtocols: report.profile.activeProtocols,
        swapCount: report.profile.swapCount,
        peakHour: report.profile.peakHour,
        address,
      }, theme.accent))
    : generateLogo({ accent: theme.accent });

  // Satori supports data:image/svg+xml, preferring base64
  const logoDataUri = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(logoSvg)))}`;

  // Display top 4 badges
  const topBadges = badges.slice(0, 4);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#050505',
          fontFamily: 'sans-serif',
          color: '#e0e0e0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient purple glow top-left */}
        <div
          style={{
            position: 'absolute',
            top: '-150px',
            left: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(153, 69, 255, 0.15), transparent 60%)',
            display: 'flex',
          }}
        />
        {/* Ambient teal glow bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(20, 241, 149, 0.12), transparent 60%)',
            display: 'flex',
          }}
        />

        {/* Left column: Logo */}
        <div
          style={{
            width: '520px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoDataUri}
            width={460}
            height={460}
            alt="logo"
            style={{ display: 'block' }}
          />
        </div>

        {/* Right column: Info panel */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '50px 60px 50px 20px',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{
                padding: '4px 12px',
                fontSize: '11px',
                color: '#9945FF',
                background: 'rgba(153, 69, 255, 0.1)',
                border: '1px solid rgba(153, 69, 255, 0.5)',
                borderRadius: '100px',
                letterSpacing: '0.25em',
                display: 'flex',
                textTransform: 'uppercase',
              }}>
                SOLANA
              </span>
              <span style={{
                padding: '4px 12px',
                fontSize: '11px',
                color: '#999',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '100px',
                letterSpacing: '0.25em',
                display: 'flex',
                textTransform: 'uppercase',
              }}>
                FRONTIER 2026
              </span>
            </div>
            <span style={{
              fontSize: '11px',
              color: '#666',
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
              display: 'flex',
            }}>
              {shortAddr}
            </span>
          </div>

          {/* Personality */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '11px', color: '#666', letterSpacing: '0.4em', display: 'flex' }}>
              ON-CHAIN PERSONALITY
            </span>
            <span
              style={{
                fontSize: '52px',
                fontWeight: 300,
                color: '#e0e0e0',
                letterSpacing: '0.05em',
                lineHeight: 1,
                display: 'flex',
              }}
            >
              {personality.toUpperCase()}
            </span>
            <span style={{
              fontSize: '14px',
              color: '#999',
              lineHeight: 1.5,
              fontWeight: 300,
              maxWidth: '540px',
              display: 'flex',
            }}>
              {description}
            </span>

            {/* Badges row */}
            {topBadges.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                {topBadges.map((b) => {
                  const color = BADGE_COLORS[b.rarity];
                  return (
                    <span
                      key={b.id}
                      style={{
                        padding: '4px 10px',
                        fontSize: '10px',
                        color,
                        background: `${color}18`,
                        border: `1px solid ${color}`,
                        borderRadius: '100px',
                        letterSpacing: '0.2em',
                        fontFamily: 'monospace',
                        display: 'flex',
                      }}
                    >
                      {b.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div style={{
            display: 'flex',
            gap: '28px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}>
            <Stat label="TXS" value={totalTxs.toLocaleString()} />
            <Stat label="DAYS" value={String(activeDays)} />
            <Stat label="PROTO" value={String(protocols)} />
            <Stat label="VOLUME" value={`${volume} SOL`} accent />
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              fontSize: '13px',
              color: '#e0e0e0',
              letterSpacing: '0.3em',
              fontWeight: 300,
              display: 'flex',
            }}>
              SolWrapped
            </span>
            <span style={{
              fontSize: '10px',
              color: '#444',
              letterSpacing: '0.3em',
              fontFamily: 'monospace',
              display: 'flex',
            }}>
              YOUR WALLET TELLS A STORY
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

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{
        fontSize: '10px',
        color: '#666',
        letterSpacing: '0.25em',
        fontFamily: 'monospace',
        display: 'flex',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: '28px',
        fontWeight: 300,
        color: accent ? '#14F195' : '#e0e0e0',
        fontFamily: 'monospace',
        display: 'flex',
      }}>
        {value}
      </span>
    </div>
  );
}
