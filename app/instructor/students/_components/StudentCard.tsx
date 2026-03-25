'use client'

import React from 'react'
import { User, Mail, Phone, BookOpen, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'

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
}

export default function StudentCard({ student }: { student: Student }) {
  const [firstName, lastName] = student.name.split(' ')

  return (
    <Link href={`/instructor/students/${student.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="group relative flex flex-col items-center overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-aerojet-sky/30 hover:shadow-xl hover:shadow-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-aerojet-sky/30"
      >
        {/* Background Accent */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-24 w-24 rounded-full bg-blue-50/50 transition-all group-hover:bg-blue-100/50 dark:bg-blue-900/10 dark:group-hover:bg-blue-900/20" />

        <div className="relative mb-4">
          <UserAvatar
            src={student.image || undefined}
            firstName={firstName}
            lastName={lastName}
            className="h-20 w-20 ring-4 ring-white dark:ring-slate-800"
          />
          <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white ring-2 ring-white dark:ring-slate-900">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          </div>
        </div>

        <div className="text-center">
          <h3 className="line-clamp-1 text-lg font-black text-slate-900 transition-colors group-hover:text-aerojet-sky dark:text-white">
            {student.name}
          </h3>
          <p className="mt-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
            {student.studentId || 'No Student ID'}
          </p>
        </div>

        <div className="mt-6 w-full space-y-3">
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <Mail className="h-4 w-4 shrink-0 text-slate-300" />
            <span className="truncate">{student.email || 'No email provided'}</span>
          </div>
          {student.phone && (
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <Phone className="h-4 w-4 shrink-0 text-slate-300" />
              <span>{student.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <BookOpen className="h-4 w-4 shrink-0 text-slate-300" />
            <div className="flex flex-wrap gap-1">
              {student.courses.map((course) => (
                <Badge
                  key={course.id}
                  variant="secondary"
                  className="bg-blue-50 text-[10px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                >
                  {course.code}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex w-full items-center justify-between border-t border-slate-50 pt-4 dark:border-slate-800/50">
          <span className="text-[10px] font-black tracking-widest text-aerojet-sky uppercase">
            View Profile
          </span>
          <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-aerojet-sky" />
        </div>
      </motion.div>
    </Link>
  )
}
