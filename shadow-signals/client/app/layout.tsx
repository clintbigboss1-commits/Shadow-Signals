import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shadow Signals — We See What the Market Misses',
  description: "Australia's #1 betting intelligence platform. GHOST signals, real-time edge detection across 12 AU bookmakers.",
  openGraph: {
    title: 'Shadow Signals — We See What the Market Misses',
    description: 'GHOST signals the market never shows you. Real-time +EV scanner. 12 AU bookmakers.',
    siteName: 'Shadow Signals',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&family=Bebas+Neue&family=DM+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
