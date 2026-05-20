'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

/**
 * Self-service privacy toggle for "show last seen". Off by default. When
 * off, other (non-admin) users only see the green online dot — never an
 * exact timestamp. Admins always see the exact timestamp regardless of
 * this setting.
 *
 * Self-fetches its current value from `/api/me/privacy` and PATCHes the
 * same endpoint on change. Drop into any profile/settings page.
 */
export default function PrivacyToggle() {
  const [value, setValue] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/me/privacy', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setValue(!!(j?.data?.showLastSeen ?? j?.showLastSeen)))
      .catch(() => setValue(false))
  }, [])

  const toggle = async () => {
    if (value == null || busy) return
    setBusy(true)
    const next = !value
    const res = await fetch('/api/me/privacy', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showLastSeen: next }),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || json?.success === false) {
      toast.error(json?.error ?? 'Could not save privacy setting')
    } else {
      setValue(next)
      toast.success(next ? 'Last seen is visible to others' : 'Last seen is hidden from others')
    }
    setBusy(false)
  }

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {value ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 dark:text-slate-100">Show my last-seen time</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          When off, others only see a green "online" dot while you're active. When on, your last-seen
          timestamp is visible in messages. Admins can always see your last-seen for support
          purposes.
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={value == null || busy}
        role="switch"
        aria-checked={value ?? false}
        className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
          value ? 'bg-aerojet-blue' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        >
          {busy && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
        </span>
      </button>
    </div>
  )
}
