'use client'

import { X } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'info',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  const variantStyles = {
    danger: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10',
    warning: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10',
    info: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10',
  }

  const confirmStyles = {
    danger: 'bg-red-600 text-white hover:bg-red-700',
    warning: 'bg-amber-600 text-white hover:bg-amber-700',
    info: 'bg-blue-800 text-white hover:bg-blue-800/90',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${variantStyles[variant]}`}>
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
          <button
            onClick={onCancel}
            disabled={loading}
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{description}</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50 ${confirmStyles[variant]}`}
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
