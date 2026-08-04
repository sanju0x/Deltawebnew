import type { Metadata } from 'next'
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { NewsPopup } from '@/components/news-popup'
import { VisitorTracker } from '@/components/visitor-tracker'
import './globals.css'

const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
})

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
})

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
    <html lang="en" className="bg-background">
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased bg-background text-foreground`}>
        {children}
        <NewsPopup />
        <VisitorTracker />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
