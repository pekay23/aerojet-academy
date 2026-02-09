import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";
import MobileStickyBar from "@/app/components/marketing/MobileStickyBar";
import ScrollToTop from "@/app/components/marketing/ScrollToTop";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CommandMenu } from '@/app/components/marketing/CommandMenu';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = { 
  title: {
    default: "Aerojet Academy",
    template: "%s | Aerojet Academy" 
  },
  description: "Premier Training for Aviation Professionals",
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased bg-background text-foreground`}>
        <AuthProvider>
          {children}
          {/* MOVED INSIDE AUTH PROVIDER 👇 */}
          <CommandMenu />
        </AuthProvider>
        
        <ScrollToTop />
        <MobileStickyBar />
        <Toaster richColors position="top-right" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

