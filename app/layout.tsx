import type { Metadata } from 'next'
import { Inter, Outfit, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import './globals.css'
// import '@uploadthing/react/styles.css'
import { Providers } from './providers'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.webp',
  },
  manifest: '/manifest.json',
  metadataBase: new URL('https://aerojet-academy.com'),
  title: {
    default: 'Aerojet Aviation Training Academy | EASA Part-66 Training',
    template: '%s | Aerojet Academy',
  },
  description:
    "Africa's leading institution for EASA Part-66 Aviation Maintenance Training. Become a B1 or B2 Licensed Aircraft Engineer in Accra, Ghana.",
  keywords: [
    'EASA Part-66',
    'aviation training',
    'aircraft maintenance',
    'Ghana',
    'B1',
    'B2',
    'Aviation Academy Africa',
    'Aircraft Engineering',
  ],
  authors: [{ name: 'Aerojet Aviation Training Academy' }],
  creator: 'Aerojet Aviation Training Academy',
  publisher: 'Aerojet Aviation Training Academy',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Aerojet Aviation Training Academy',
    description: 'EASA Part-66 Aviation Maintenance Training in Accra, Ghana',
    url: 'https://aerojet-academy.com',
    siteName: 'Aerojet Academy',
    images: [
      {
        url: '/og-image.jpg', // We should ensure this exists or generate one
        width: 1200,
        height: 630,
        alt: 'Aerojet Aviation Training Academy',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aerojet Aviation Training Academy',
    description: 'EASA Part-66 Aviation Maintenance Training in Accra, Ghana',
    site: '@aerojet_academy',
    creator: '@aerojet_academy',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="relative">
      <head>
        <link rel="preconnect" href="https://gx1g03nvpo.ufs.sh" />
        <link rel="preconnect" href="https://utfs.io" />
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} ${playfair.variable} ${jetbrainsMono.variable} relative font-sans antialiased`}
        suppressHydrationWarning
      >
        <div className="relative">
          <a
            href="#main-content"
            className="focus:text-aerojet-blue sr-only focus:not-sr-only focus:fixed focus:inset-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-bold focus:shadow-lg"
          >
            Skip to main content
          </a>
          <Providers>
            {children}
            <SpeedInsights />
            <Analytics />
          </Providers>
        </div>
      </body>
    </html>
  )
}
