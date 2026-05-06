'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
        <TooltipProvider delayDuration={0}>
          {children}
        </TooltipProvider>
        <Toaster position="top-right" richColors closeButton />
      </ThemeProvider>
    </SessionProvider>
  )
}
