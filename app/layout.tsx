import type { Metadata } from 'next'
import './globals.css'
import ClientProviders from '@/components/ClientProviders'
import { Analytics } from '@vercel/analytics/react';
import BtcTitleUpdater from "./BtcTitleUpdater";

export const metadata: Metadata = {
  title: 'Candle Rush!',
  description: 'Created by Carlos Freire',
  openGraph: {
    title: 'Candle Rush!',
    description: 'Created by Carlos Freire',
    images: [
      {
        url: '/intro.png',
        width: 1200,
        height: 630,
        alt: 'Candle Rush',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Candle Rush!',
    description: 'Created by Carlos Freire',
    images: ['/intro.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/intro.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      {/* Actualiza el título con el precio BTC en vivo */}
      <BtcTitleUpdater />
      <body className="min-h-screen bg-background text-foreground">
        <ClientProviders>
          <main className="flex flex-col min-h-screen">
            {children}
          </main>
        </ClientProviders>
        <Analytics />
      </body>
    </html>
  );
}
