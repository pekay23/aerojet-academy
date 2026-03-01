'use client'

import { ThemeProvider } from 'next-themes'

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
