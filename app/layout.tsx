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
    <html lang="en">
      <head>
        <link rel="icon" href="/intro.png" />
      </head>
      {/* Actualiza el título con el precio BTC en vivo */}
      <BtcTitleUpdater />
      <body className="bg-black min-h-screen">
        <ClientProviders>
          {children}
        </ClientProviders>
        <Analytics />
      </body>
    </html>
  );
}
