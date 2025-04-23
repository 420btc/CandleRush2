import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Candle Rush!',
  description: 'Created by Carlos Freire',
  generator: 'v0.dev',
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
      <body>{children}</body>
    </html>
  )
}
