'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/components/shared/theme-provider'
import { Monitor, Moon, Sun } from 'lucide-react'

export default function ThemeToggle({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const renderIcon = () => {
    if (!mounted) return <div className="h-4 w-4 shrink-0" />
    if (theme === 'light') return <Sun className="h-4 w-4 shrink-0" />
    if (theme === 'dark') return <Moon className="h-4 w-4 shrink-0" />
    return <Monitor className="h-4 w-4 shrink-0" />
  }

  const renderLabel = () => {
    if (!mounted) return 'System Mode'
    if (theme === 'light') return 'Light Mode'
    if (theme === 'dark') return 'Dark Mode'
    return 'System Mode'
  }

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-3 rounded-lg p-2 text-sm font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-white ${
        isCollapsed ? 'justify-center' : ''
      }`}
      title={isCollapsed ? renderLabel() : undefined}
      aria-label="Toggle theme"
    >
      {mounted ? (
        theme === 'light' ? (
          <Sun className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : theme === 'dark' ? (
          <Moon className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <Monitor className="h-4 w-4 shrink-0" aria-hidden="true" />
        )
      ) : (
        <div className="h-4 w-4 shrink-0" />
      )}
      {!isCollapsed && <span className="flex-1 text-left">{renderLabel()}</span>}
    </button>
  )
}
