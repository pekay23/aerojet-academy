import type { Metadata } from 'next'
import { Inter, Lexend } from 'next/font/google'
import './globals.css'
// import '@uploadthing/react/styles.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
})

export const metadata: Metadata = {
  title: {
    default: 'Aerojet Aviation Training Academy',
    template: '%s | Aerojet Academy',
  },
  description:
    'EASA Part-66 Aviation Maintenance Training — B1 & B2 Licensed Aircraft Engineer programmes in Accra, Ghana.',
  keywords: ['EASA Part-66', 'aviation training', 'aircraft maintenance', 'Ghana', 'B1', 'B2'],
  authors: [{ name: 'Aerojet Aviation Training Academy' }],
  openGraph: {
    title: 'Aerojet Aviation Training Academy',
    description: 'EASA Part-66 Aviation Maintenance Training in Accra, Ghana',
    type: 'website',
    locale: 'en_GB',
    siteName: 'Aerojet Academy',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} ${lexend.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
