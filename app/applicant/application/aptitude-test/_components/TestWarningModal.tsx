'use client'

import { AlertTriangle, X, Play, Loader2 } from 'lucide-react'

interface TestWarningModalProps {
  onCancel: () => void
  onConfirm: () => void
  starting: boolean
}

export default function TestWarningModal({ onCancel, onConfirm, starting }: TestWarningModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="bg-amber-500 p-6 text-center text-white">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10" />
          <h3 className="text-xl font-black">Before you begin</h3>
        </div>
        
        <div className="p-6">
          <ul className="mb-6 space-y-4 text-sm font-medium text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800">1</span>
              <span>The timer will start immediately and cannot be paused.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800">2</span>
              <span>Your browser will enter full-screen mode. Exiting full-screen will flag your test.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800">3</span>
              <span>Switching tabs or opening other applications is strictly prohibited.</span>
            </li>
          </ul>

          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              disabled={starting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-aerojet-blue px-4 py-3 font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5 fill-current" />}
              I'm Ready, Start
            </button>
            <button
              onClick={onCancel}
              className="flex items-center justify-center rounded-xl bg-slate-100 p-3 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
