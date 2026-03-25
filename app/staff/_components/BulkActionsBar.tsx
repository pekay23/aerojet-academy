'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, UserCog, Mail, X, CheckCircle2, AlertTriangle, ShieldAlert, LucideIcon } from 'lucide-react'
import { toast } from 'sonner'

export interface BulkAction {
  label: string
  icon: LucideIcon
  onClick: (ids: string[]) => Promise<void>
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'primary'
  confirmTitle?: string
  confirmMessage?: string
}

interface BulkActionsBarProps {
  selectedIds: string[]
  actions: BulkAction[]
  onClear: () => void
}

export default function BulkActionsBar({
  selectedIds,
  actions,
  onClear,
}: BulkActionsBarProps) {
  const [loading, setLoading] = useState(false)
  const [activeAction, setActiveAction] = useState<BulkAction | null>(null)

  const count = selectedIds.length
  if (count === 0) return null

  const handleExecute = async (action: BulkAction) => {
    setLoading(true)
    try {
      await action.onClick(selectedIds)
      onClear()
      setActiveAction(null)
    } finally {
      setLoading(false)
    }
  }

  const getVariantStyles = (variant?: string) => {
    switch (variant) {
      case 'danger':
        return 'bg-red-500/20 text-red-100 hover:bg-red-500/30'
      case 'warning':
        return 'bg-amber-500/20 text-amber-100 hover:bg-amber-500/30'
      case 'success':
        return 'bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30'
      case 'primary':
        return 'bg-blue-500/20 text-blue-100 hover:bg-blue-500/30'
      default:
        return 'bg-white/10 text-white hover:bg-white/20'
    }
  }

  const getIconColor = (variant?: string) => {
    switch (variant) {
      case 'danger': return 'text-red-400'
      case 'warning': return 'text-amber-400'
      case 'success': return 'text-emerald-400'
      case 'primary': return 'text-blue-400'
      default: return 'text-white'
    }
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-6 rounded-2xl bg-aerojet-blue px-6 py-4 text-white shadow-2xl dark:bg-slate-900 border border-white/10">
            <div className="flex items-center gap-3 border-r border-white/10 pr-6">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-aerojet-blue text-[10px] font-black">
                {count}
              </div>
              <span className="text-sm font-bold tracking-tight">Selected</span>
            </div>

            <div className="flex items-center gap-2">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  disabled={loading}
                  onClick={() => {
                    if (action.confirmTitle) {
                      setActiveAction(action)
                    } else {
                      handleExecute(action)
                    }
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all disabled:opacity-50 ${getVariantStyles(action.variant)}`}
                >
                  <action.icon className={`h-3.5 w-3.5 ${getIconColor(action.variant)}`} />
                  {action.label}
                </button>
              ))}
            </div>

            <button
              onClick={onClear}
              className="ml-2 flex items-center justify-center rounded-full p-1.5 transition-all hover:bg-white/10 text-white/50 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {activeAction && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"
            >
              <div className="flex flex-col items-center text-center">
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-3xl ${activeAction.variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                  <activeAction.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black text-aerojet-blue dark:text-white">
                  {activeAction.confirmTitle || 'Confirm Action'}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {activeAction.confirmMessage || `Are you sure you want to perform this action on ${count} items?`}
                </p>

                <div className="mt-8 flex w-full flex-col gap-2">
                  <button
                    disabled={loading}
                    onClick={() => handleExecute(activeAction)}
                    className={`w-full rounded-2xl py-3 text-sm font-black text-white transition-all ${
                      activeAction.variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-aerojet-blue hover:bg-slate-800'
                    }`}
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
