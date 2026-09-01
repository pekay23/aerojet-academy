'use client'

import { useState, useTransition } from 'react'
import { recordAttendance } from '@/lib/actions/instructor'
import { Check, X, Clock, AlertCircle, Loader2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'

export default function AttendanceRow({
  classId,
  userId,
  studentName,
  initialStatus,
  date,
}: {
  classId: string
  userId: string
  studentName: string
  initialStatus?: string
  date: Date
}) {
  const [status, setStatus] = useState<AttendanceStatus | undefined>(
    initialStatus as AttendanceStatus
  )
  const [isPending, startTransition] = useTransition()

  const handleUpdate = (newStatus: AttendanceStatus) => {
    if (newStatus === status) return

    startTransition(async () => {
      try {
        await recordAttendance({
          classId,
          userId,
          date,
          status: newStatus,
        })
        setStatus(newStatus)
      } catch (error) {
        console.error('Failed to update attendance:', error)
      }
    })
  }

  const statuses: {
    value: AttendanceStatus
    label: string
    icon: LucideIcon
    color: string
    activeColor: string
  }[] = [
    {
      value: 'PRESENT',
      label: 'Present',
      icon: Check,
      color: 'hover:bg-green-50 text-slate-400 dark:text-slate-300 dark:text-slate-300 hover:text-green-600',
      activeColor: 'bg-green-500 text-white',
    },
    {
      value: 'ABSENT',
      label: 'Absent',
      icon: X,
      color: 'hover:bg-red-50 text-slate-400 hover:text-red-600',
      activeColor: 'bg-red-500 text-white',
    },
    {
      value: 'LATE',
      label: 'Late',
      icon: Clock,
      color: 'hover:bg-orange-50 text-slate-400 hover:text-orange-600',
      activeColor: 'bg-orange-500 text-white',
    },
    {
      value: 'EXCUSED',
      label: 'Excused',
      icon: AlertCircle,
      color: 'hover:bg-blue-50 text-slate-400 hover:text-blue-600',
      activeColor: 'bg-blue-400 text-white',
    },
  ]

  return (
    <div className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50/50 sm:p-6 dark:hover:bg-slate-800/30">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800">
          {studentName
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </div>
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{studentName}</p>
          {isPending && (
            <div className="mt-0.5 flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
              <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                Saving...
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {statuses.map((s) => {
          const Icon = s.icon
          const isActive = status === s.value
          return (
            <button
              key={s.value}
              onClick={() => handleUpdate(s.value)}
              disabled={isPending}
              className={cn(
                'flex h-12 w-12 flex-col items-center justify-center rounded-xl border border-transparent transition-all sm:h-14 sm:w-16',
                isActive ? s.activeColor : s.color,
                isActive && 'shadow-lg shadow-current/20',
                isPending && 'cursor-not-allowed opacity-50'
              )}
            >
              <Icon className="mb-1 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-[8px] font-black tracking-widest uppercase sm:text-[9px]">
                {s.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
