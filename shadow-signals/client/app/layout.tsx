import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shadow Syndicate — Beat the Closing Line',
  description: "Australia's #1 +EV betting intelligence platform. Real-time edge detection across 12 AU bookmakers.",
  openGraph: {
    title: 'Shadow Syndicate — Beat the Closing Line',
    description: 'Real-time +EV scanner. 12 AU bookmakers. Grade S+ confidence ratings.',
    siteName: 'Shadow Syndicate',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap"
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
