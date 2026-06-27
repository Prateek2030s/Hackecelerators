import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Forge — Build Real Software';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(245,158,11,0.2) 0%, transparent 60%)',
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 16 }}>⚒️</div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: '#fafafa',
            letterSpacing: '-0.02em',
          }}
        >
          Forge
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#a1a1aa',
            marginTop: 16,
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          Where students build real software. Where startups discover real talent.
        </div>
      </div>
    ),
    { ...size }
  );
}
