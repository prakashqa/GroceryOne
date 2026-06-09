import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { StoreProvider } from '@/lib/store/providers';
import './globals.css';

// Inter is self-hosted by next/font at BUILD time (no runtime network), so the
// offline desktop app bundles the font files. `--font-sans` is consumed by
// Tailwind's fontFamily.sans, with system-ui as the fallback.
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'GroOne',
  description: 'Multi-tenant grocery store management platform by GroOne',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased font-sans">
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
