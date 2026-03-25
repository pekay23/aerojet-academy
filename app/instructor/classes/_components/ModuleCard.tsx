'use client'

import React from 'react'
import { School, Users, Calendar, ArrowRight, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ModuleCardProps {
  cls: any // To be typed properly or handled with serializePrisma types
}

export default function ModuleCard({ cls }: ModuleCardProps) {
  // Determine category color (same logic as calendar)
  const getCategoryColor = (category?: string) => {
    switch (category?.toUpperCase()) {
      case 'CORE':
        return 'bg-blue-500'
      case 'AVIONICS':
        return 'bg-purple-500'
      case 'SPECIALIST':
        return 'bg-amber-500'
      case 'SAFETY':
        return 'bg-rose-500'
      default:
        return 'bg-slate-500'
    }
  }

  const categoryColor = getCategoryColor(cls.course.category)
  const enrollmentPercentage = Math.round((cls.currentStudents / cls.maxStudents) * 100)

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white transition-all hover:border-blue-100 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900/30"
    >
      {/* Decorative top bar */}
      <div className={cn('h-1.5 w-full', categoryColor)} />

      <div className="flex flex-1 flex-col p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'bg-opacity-10 flex h-12 w-12 items-center justify-center rounded-2xl',
                categoryColor.replace('bg-', 'text-')
              )}
            >
              <School className={cn('h-6 w-6', categoryColor.replace('bg-', 'text-'))} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-aerojet-sky uppercase">
                  {cls.course.code}
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {cls.semester} {cls.academicYear}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
                {cls.course.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50">
            <div className="mb-1 flex items-center gap-1.5">
              <Users className="h-3 w-3 text-slate-400" />
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Students
              </span>
            </div>
            <p className="text-sm font-black text-slate-700 dark:text-slate-300">
              {cls.currentStudents} / {cls.maxStudents}
            </p>
            {/* Tiny progress bar */}
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={cn('h-full transition-all duration-1000', categoryColor)}
                style={{ width: `${enrollmentPercentage}%` }}
              />
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50">
            <div className="mb-1 flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Duration
              </span>
            </div>
            <p className="truncate text-sm font-black text-slate-700 dark:text-slate-300">
              {new Date(cls.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} -{' '}
              {new Date(cls.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </p>
            <p className="mt-1 text-[9px] font-bold text-slate-400 uppercase">
              {cls.course.duration || 'Variable'} Hours Total
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto flex gap-2">
          <Link
            href={`/instructor/attendance/${cls.id}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-aerojet-sky py-3 text-[10px] font-black tracking-widest text-white uppercase transition-all hover:bg-aerojet-blue"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            Attendance
          </Link>
          <Link
            href={`/instructor/classes/${cls.id}`}
            className="flex items-center justify-center rounded-xl bg-slate-100 px-5 py-3 text-[10px] font-black tracking-widest text-slate-600 uppercase transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            Roster <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
