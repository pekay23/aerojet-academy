'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

/**
 * Admin-only override for a target user's `showLastSeen` privacy flag.
 * Renders as an inline toggle; the change is written to the server via
 * `PATCH /api/staff/users/[id]/privacy`, audit-logged, and reflected in
 * future presence queries by other users.
 *
 * Self-fetches nothing — the parent passes the current value. Mount this
 * inside any staff user-detail page where the admin already loads the
 * user record server-side.
 */
export default function AdminPrivacyToggle({
  userId,
  initialShowLastSeen,
}: {
  userId: string
  initialShowLastSeen: boolean
}) {
  const router = useRouter()
  const [value, setValue] = useState(initialShowLastSeen)
  const [busy, setBusy] = useState(false)

  const toggle = async () => {
    if (busy) return
    setBusy(true)
    const next = !value
    const res = await fetch(`/api/staff/users/${userId}/privacy`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showLastSeen: next }),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || json?.success === false) {
      toast.error(json?.error ?? 'Could not update privacy setting')
    } else {
      setValue(next)
      toast.success(
        next
          ? 'Last-seen is now visible to others (admin override)'
          : 'Last-seen is now hidden from others (admin override)'
      )
      router.refresh()
    }
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      {value ? (
        <Eye className="h-4 w-4 text-emerald-600" />
      ) : (
        <EyeOff className="h-4 w-4 text-slate-400" />
      )}
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Show last-seen to other users
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Admin override — affects what other (non-admin) users see in messages.
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={busy}
        role="switch"
        aria-checked={value}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          value ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
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
