import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { NewsPopup } from '@/components/news-popup'
import { VisitorTracker } from '@/components/visitor-tracker'
import { MaintenanceGate } from '@/components/maintenance-gate'
import './globals.css'

export const metadata: Metadata = {
  title: 'Delta | Your server, your soundtrack',
  description: 'A fast, expressive Discord music bot for shared listening, playlists, audio effects, and always-on rooms.',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <body className="antialiased bg-background text-foreground">
        <MaintenanceGate>
          {children}
          <NewsPopup />
        </MaintenanceGate>
        <VisitorTracker />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

