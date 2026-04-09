import type { Metadata } from 'next';
import { StoreProvider } from '@/lib/store/providers';
import './globals.css';

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
