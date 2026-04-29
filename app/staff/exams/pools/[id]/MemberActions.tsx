'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, MoreVertical, UserMinus, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MemberActionsProps {
  membershipId: string
  memberName: string
  status: string
  poolId: string
}

export default function MemberActions({
  membershipId,
  memberName,
  status,
  poolId,
}: MemberActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRemove() {
    const reason = window.prompt(
      `Why are you removing ${memberName} from this pool? (Mandatory reason, min 5 chars)`
    )

    if (reason === null) return // Cancelled

    if (reason.trim().length < 5) {
      alert('A valid reason is required to remove a candidate.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/staff/exam-pools/${poolId}/members/${membershipId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to remove member')
      } else {
        router.refresh()
      }
    } catch {
      alert('Network error')
    }
    setLoading(false)
  }

  async function handleNoShow() {
    if (!confirm(`Mark ${memberName} as NO_SHOW?`)) return
    setLoading(true)
    try {
      const res = await fetch('/api/staff/exam-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId, status: 'ABSENT' }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to mark absent')
      } else {
        router.refresh()
      }
    } catch {
      alert('Network error')
    }
    setLoading(false)
  }

  async function handlePresent() {
    if (!confirm(`Mark ${memberName} as PRESENT?`)) return
    setLoading(true)
    try {
      const res = await fetch('/api/staff/exam-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId, status: 'PRESENT' }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to mark present')
      } else {
        router.refresh()
      }
    } catch {
      alert('Network error')
    }
    setLoading(false)
  }

  async function handleExcused() {
    if (!confirm(`Mark ${memberName} as EXCUSED?`)) return
    setLoading(true)
    try {
      const res = await fetch('/api/staff/exam-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId, status: 'EXCUSED' }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to mark excused')
      } else {
        router.refresh()
      }
    } catch {
      alert('Network error')
    }
    setLoading(false)
  }

  const canRemove = ['RESERVED', 'CONFIRMED'].includes(status)
  const canMarkAttendance = ['CONFIRMED', 'NO_SHOW'].includes(status)

  if (!canRemove && !canMarkAttendance) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={loading}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="z-50 w-48 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
      >
        {canRemove && (
          <DropdownMenuItem
            onClick={handleRemove}
            disabled={loading}
            className="flex cursor-pointer items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 dark:hover:bg-red-900/20 dark:focus:bg-red-900/20"
          >
            <UserMinus className="h-4 w-4" />
            Remove from Pool
          </DropdownMenuItem>
        )}
        {canMarkAttendance && (
          <DropdownMenuItem
            onClick={handlePresent}
            disabled={loading}
            className="flex cursor-pointer items-center gap-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700 dark:hover:bg-emerald-900/20 dark:focus:bg-emerald-900/20"
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark Present
          </DropdownMenuItem>
        )}
        {canMarkAttendance && (
          <DropdownMenuItem
            onClick={handleNoShow}
            disabled={loading}
            className="flex cursor-pointer items-center gap-2 text-amber-600 hover:bg-amber-50 hover:text-amber-700 focus:bg-amber-50 focus:text-amber-700 dark:hover:bg-amber-900/20 dark:focus:bg-amber-900/20"
          >
            <XCircle className="h-4 w-4" />
            Mark Absent
          </DropdownMenuItem>
        )}
        {canMarkAttendance && (
          <DropdownMenuItem
            onClick={handleExcused}
            disabled={loading}
            className="flex cursor-pointer items-center gap-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 dark:hover:bg-blue-900/20 dark:focus:bg-blue-900/20"
          >
            <AlertCircle className="h-4 w-4" />
            Mark Excused
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
