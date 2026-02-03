import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";
import MobileStickyBar from "@/components/MobileStickyBar";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from 'sonner';
import { SpeedInsights } from '@vercel/speed-insights/next';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Add the icons and manifest properties back to the metadata object
export const metadata: Metadata = { 
  title: "Aerojet Academy", 
  description: "Premier Training for Aviation Professionals",
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <ScrollToTop />
        <MobileStickyBar />
        <Toaster richColors position="top-right" />
        <SpeedInsights />
      </body>
    </html>
  );
}
