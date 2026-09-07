'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type Theme = 'light' | 'dark' | 'system'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: string) => void
  resolvedTheme: 'light' | 'dark'
  systemTheme: 'light' | 'dark'
  forcedTheme?: Theme
  themes: Theme[]
}

type ThemeProviderProps = {
  children: ReactNode
  attribute?: 'class' | `data-${string}`
  defaultTheme?: Theme
  forcedTheme?: Theme
  storageKey?: string
  disableTransitionOnChange?: boolean
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
const themes: Theme[] = ['light', 'dark', 'system']

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(theme: Theme, systemTheme: 'light' | 'dark') {
  return theme === 'system' ? systemTheme : theme
}

function applyTheme(
  theme: Theme,
  systemTheme: 'light' | 'dark',
  attribute: ThemeProviderProps['attribute']
) {
  if (typeof document === 'undefined') return

  const resolvedTheme = resolveTheme(theme, systemTheme)
  const root = document.documentElement

  if (attribute === 'class') {
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
  } else if (attribute?.startsWith('data-')) {
    root.setAttribute(attribute, resolvedTheme)
  }

  root.style.colorScheme = resolvedTheme
}

export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'light',
  forcedTheme,
  storageKey = 'theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(forcedTheme || defaultTheme)
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const updateSystemTheme = () => setSystemTheme(getSystemTheme())
    updateSystemTheme()

    if (!forcedTheme) {
      const storedTheme = localStorage.getItem(storageKey)
      if (storedTheme && themes.includes(storedTheme as Theme)) {
   
  // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeState(storedTheme as Theme)
      }
    }

    media.addEventListener('change', updateSystemTheme)
    return () => media.removeEventListener('change', updateSystemTheme)
  }, [forcedTheme, storageKey])

  useEffect(() => {
    applyTheme(forcedTheme || theme, systemTheme, attribute)
  }, [attribute, forcedTheme, systemTheme, theme])

  const setTheme = useCallback(
    (nextTheme: string) => {
      if (forcedTheme || !themes.includes(nextTheme as Theme)) return
      const normalizedTheme = nextTheme as Theme
      setThemeState(normalizedTheme)
      localStorage.setItem(storageKey, normalizedTheme)
    },
    [forcedTheme, storageKey]
  )

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: forcedTheme || theme,
      setTheme,
      forcedTheme,
      resolvedTheme: resolveTheme(forcedTheme || theme, systemTheme),
      systemTheme,
      themes,
    }),
    [forcedTheme, setTheme, systemTheme, theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    return {
      theme: 'light' as Theme,
      setTheme: () => {},
      resolvedTheme: 'light' as const,
      systemTheme: 'light' as const,
      themes,
    }
  }

  return context
}
