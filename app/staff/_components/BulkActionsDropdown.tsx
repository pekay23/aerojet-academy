'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical, LucideIcon } from 'lucide-react'

export interface BulkAction {
  label: string
  icon: LucideIcon
  onClick: (ids: string[]) => Promise<void>
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'primary'
  confirmTitle?: string
  confirmMessage?: string
}

interface BulkActionsDropdownProps {
  selectedIds: string[]
  actions: BulkAction[]
  onClear: () => void
}

const VARIANT_STYLES: Record<
  string,
  { text: string; bg: string; hover: string; confirmBg: string }
> = {
  danger: {
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    hover: 'hover:bg-red-50 dark:hover:bg-red-900/20',
    confirmBg: 'bg-red-500 hover:bg-red-600',
  },
  warning: {
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    hover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
    confirmBg: 'bg-amber-500 hover:bg-amber-600',
  },
  success: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
    confirmBg: 'bg-emerald-500 hover:bg-emerald-600',
  },
  primary: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
    confirmBg: 'bg-blue-500 hover:bg-blue-600',
  },
  default: {
    text: 'text-slate-600 dark:text-slate-300',
    bg: '',
    hover: 'transition-all duration-150 ease-out hover:bg-white/80 dark:hover:bg-slate-800/60',
    confirmBg: 'bg-slate-800 hover:bg-slate-900',
  },
}

export default function BulkActionsDropdown({
  selectedIds,
  actions,
  onClear,
}: BulkActionsDropdownProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeAction, setActiveAction] = useState<BulkAction | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const count = selectedIds.length

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleExecute = async (action: BulkAction) => {
    setLoading(true)
    try {
      await action.onClick(selectedIds)
      onClear()
      setActiveAction(null)
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const getStyles = (variant?: string) => VARIANT_STYLES[variant || 'default']

  return (
    <>
      <div ref={dropdownRef} className="relative">
        {/* Trigger button — shows count badge when items are selected */}
        <button
          onClick={() => setOpen(!open)}
          className={`relative flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-all ${
            count > 0
              ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'
              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          disabled={count === 0}
          title={count > 0 ? `Actions for ${count} selected` : 'Select items first'}
        >
          <MoreVertical className="h-4 w-4" />
          {count > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-black text-slate-900 dark:bg-slate-900 dark:text-white">
              {count}
            </span>
          )}
        </button>

        {/* Dropdown menu */}
        {open && count > 0 && (
          <div className="animate-fade-in absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                {count} selected
              </span>
              <button
                onClick={() => {
                  onClear()
                  setOpen(false)
                }}
                className="text-[10px] font-bold text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
              >
                Clear
              </button>
            </div>

            {/* Action items */}
            <div className="py-1">
              {actions.map((action, idx) => {
                const styles = getStyles(action.variant)
                return (
                  <button
                    key={idx}
                    disabled={loading}
                    onClick={() => {
                      if (action.confirmTitle) {
                        setActiveAction(action)
                        setOpen(false)
                      } else {
                        handleExecute(action)
                      }
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium transition-all disabled:opacity-50 ${styles.hover}`}
                  >
                    <action.icon className={`h-4 w-4 ${styles.text}`} />
                    <span className={styles.text}>{action.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation modal — same pattern as BulkActionsBar */}
      {activeAction && (
        <div className="animate-fade-in fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-scale-in w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex flex-col items-center text-center">
              <div
                className={`mb-4 flex h-16 w-16 items-center justify-center rounded-3xl ${getStyles(activeAction.variant).bg}`}
              >
                <activeAction.icon className={`h-8 w-8 ${getStyles(activeAction.variant).text}`} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {activeAction.confirmTitle || 'Confirm Action'}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {activeAction.confirmMessage ||
                  `Are you sure you want to perform this action on ${count} items?`}
              </p>

              <div className="mt-8 flex w-full flex-col gap-2">
                <button
                  disabled={loading}
                  onClick={() => handleExecute(activeAction)}
                  className={`w-full rounded-2xl py-3 text-sm font-black text-white transition-all ${getStyles(activeAction.variant).confirmBg}`}
                >
                  {loading ? 'Processing...' : 'Confirm Action'}
                </button>
                <button
                  disabled={loading}
                  onClick={() => setActiveAction(null)}
                  className="w-full rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
