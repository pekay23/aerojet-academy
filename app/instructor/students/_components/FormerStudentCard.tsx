'use client'

import React from 'react'
import { Mail, Phone, BookOpen, ChevronRight, UserMinus } from 'lucide-react'
import Link from 'next/link'
import { UserAvatar } from '@/components/shared/UserAvatar'
import dynamic from 'next/dynamic'
import { Badge } from '@/components/ui/badge'

const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false })

interface Student {
  id: string
  name: string
  email?: string | null
  image?: string | null
  studentId?: string | null
  phone?: string | null
  courses: Array<{
    id: string
    code: string
    name: string
  }>
  status?: string
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  WITHDRAWN: { label: 'Withdrawn', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  EXPELLED: { label: 'Expelled', className: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  GRADUATED: { label: 'Graduated', className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  SUSPENDED: { label: 'Suspended', className: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  DEFERRED: { label: 'Deferred', className: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  REJECTED: { label: 'Rejected', className: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
}

function StatusBadge({ status }: { status?: string }) {
  const style = STATUS_STYLES[status ?? ''] ?? { label: status ?? 'Unknown', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' }
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${style.className}`}>
      {style.label}
    </span>
  )
}

export default function FormerStudentCard({ student }: { student: Student }) {
  const [firstName, lastName] = student.name.split(' ')

  return (
    <Link href={`/instructor/students/${student.id}`}>
      <MotionDiv
        whileHover={{ y: -4 }}
        className="group relative flex flex-col items-center overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
      >
        {/* Background Accent */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-24 w-24 rounded-full bg-slate-100/50 transition-all group-hover:bg-slate-200/50 dark:bg-slate-800/50 dark:group-hover:bg-slate-700/50" />

        <div className="relative mb-4">
          <UserAvatar
            src={student.image || undefined}
            firstName={firstName}
            lastName={lastName}
            className="h-20 w-20 ring-4 ring-white opacity-75 dark:ring-slate-800"
          />
          <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-400 text-white ring-2 ring-white dark:ring-slate-900">
            <UserMinus className="h-3 w-3" />
          </div>
        </div>

        <div className="text-center">
          <h3 className="line-clamp-1 text-lg font-black text-slate-700 transition-colors group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white">
            {student.name}
          </h3>
          <p className="mt-1 text-xs font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            {student.studentId || 'No Student ID'}
          </p>
        </div>

        <div className="mt-3">
          <StatusBadge status={student.status} />
        </div>

        <div className="mt-5 w-full space-y-3">
          <div className="flex items-center gap-3 text-sm text-slate-400 dark:text-slate-500">
            <Mail className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
            <span className="truncate">{student.email || 'No email provided'}</span>
          </div>
          {student.phone && (
            <div className="flex items-center gap-3 text-sm text-slate-400 dark:text-slate-500">
              <Phone className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
              <span>{student.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm text-slate-400 dark:text-slate-500">
            <BookOpen className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
            <div className="flex flex-wrap gap-1">
              {student.courses.map((course) => (
                <Badge
                  key={course.id}
                  variant="secondary"
                  className="bg-slate-50 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                >
                  {course.code}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex w-full items-center justify-between border-t border-slate-50 pt-4 dark:border-slate-800/50">
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
            View Profile
          </span>
          <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-slate-500 dark:text-slate-600" />
        </div>
      </MotionDiv>
    </Link>
  )
}
