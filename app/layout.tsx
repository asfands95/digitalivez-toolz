import type { Metadata, Viewport } from 'next'
import './globals.css'
import { NavigationProgress } from '@/components/navigation-progress'
import { CookieConsent } from '@/components/cookie-consent'
import { SiteSchema } from '@/components/site-schema'
import { FloatingActions } from '@/components/floating-actions'

export const metadata: Metadata = {
  metadataBase: new URL('https://tools.digitalivez.com'),
  title: { default: 'Free Business Calculators, PDF & Image Tools | Digitalivez', template: '%s | Digitalivez' },
  description: 'Free business calculators, browser-based PDF tools, and image tools for freelancers, small businesses, and independent professionals. Smarter tools. Better business decisions.',
  openGraph: {
    title: 'Free Business Calculators, PDF & Image Tools | Digitalivez',
    description: 'Free calculators, PDF utilities, and image tools for small businesses and independent professionals.',
    url: 'https://tools.digitalivez.com/',
    siteName: 'Digitalivez Tools',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1424, height: 752, alt: 'Digitalivez Tools — free business calculators, PDF and image tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Business Calculators, PDF & Image Tools | Digitalivez',
    description: 'Free calculators, PDF utilities, and image tools for small businesses and independent professionals.',
    images: ['/og-image.png'],
  },
  applicationName: 'Digitalivez Tools',
  generator: 'Next.js',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="antialiased">
        <NavigationProgress>
          {children}
        </NavigationProgress>
        <SiteSchema />
        <CookieConsent />
        <FloatingActions />
      </body>
    </html>
  )
}
