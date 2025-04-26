import type { Metadata } from 'next'

import './globals.css'
import { DeviceModeProvider } from '../context/device-mode-context'
import { AuthProvider } from '../context/auth-context'
import { AchievementProvider } from '../context/achievement-context'
import { GameProvider } from '../context/game-context'
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'Candle Rush!',
  description: 'Created by Carlos Freire',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {


  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/btcc.png" />
      </head>
      <body className="bg-black min-h-screen">
        <DeviceModeProvider>
          <AuthProvider>
            <AchievementProvider>
              <GameProvider>
                {children}
              </GameProvider>
            </AchievementProvider>
          </AuthProvider>
        </DeviceModeProvider>
        <Analytics />
      </body>
    </html>
  );
}
