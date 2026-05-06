'use client'

import { ThemeProvider } from '@/components/shared/theme-provider'

export function AuthThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      forcedTheme="light"
      disableTransitionOnChange
      storageKey="auth-theme"
    >
      {children}
    </ThemeProvider>
  )
}
