'use client'

import { useState } from 'react'
import { MoreVertical, UserMinus, XCircle } from 'lucide-react'
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
      const res = await fetch('/api/admin/exams/mark-no-show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to mark no-show')
      } else {
        router.refresh()
      }
    } catch {
      alert('Network error')
    }
    setLoading(false)
  }

  const canRemove = ['RESERVED', 'CONFIRMED'].includes(status)
  const canMarkNoShow = status === 'CONFIRMED'

  if (!canRemove && !canMarkNoShow) return null

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
        {canMarkNoShow && (
          <DropdownMenuItem
            onClick={handleNoShow}
            disabled={loading}
            className="flex cursor-pointer items-center gap-2 text-amber-600 hover:bg-amber-50 hover:text-amber-700 focus:bg-amber-50 focus:text-amber-700 dark:hover:bg-amber-900/20 dark:focus:bg-amber-900/20"
          >
            <XCircle className="h-4 w-4" />
            Mark No-Show
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
