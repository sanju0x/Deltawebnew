import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { NewsPopup } from '@/components/news-popup'
import { VisitorTracker } from '@/components/visitor-tracker'
import { ThemeProvider } from '@/components/theme-provider'
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
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <NewsPopup />
          <VisitorTracker />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}
