'use client'

import React from 'react'
import {
  School,
  Users,
  Calendar,
  ArrowRight,
  ClipboardCheck,
  BarChart3,
  BookOpen,
  MessageSquare,
  MoreVertical,
  MapPin,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'

interface ClassData {
  id: string
  course: {
    code: string
    name: string
    category?: { id: string; name: string } | string | null
    duration?: number
  }
  semester?: { id: string; name: string } | string | null
  academicYear?: { id: string; name: string } | string | null
  startDate: string | Date
  endDate: string | Date
  currentStudents: number
  maxStudents: number
  classroom?: { name: string } | null
}

interface ModuleCardProps {
  cls: ClassData
}

function getCategoryColor(category?: string | null) {
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

function getStatusBadge(cls: ClassData) {
  const now = new Date()
  const start = new Date(cls.startDate)
  const end = new Date(cls.endDate)

  if (start > now)
    return {
      label: 'Upcoming',
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    }
  if (end < now)
    return {
      label: 'Completed',
      color: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400',
    }
  return {
    label: 'Active',
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  }
}

function QuickActionsDropdown({
  cls,
  isOpen,
  onClose,
}: {
  cls: ClassData
  isOpen: boolean
  onClose: () => void
}) {
  if (!isOpen) return null

  return createPortal(
    <div
      className="animate-in fade-in zoom-in-95 fixed z-50 w-48 origin-top-right rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-900"
      style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
    >
      <Link
        href={`/instructor/classes/${cls.id}?tab=grades`}
        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
        onClick={onClose}
      >
        <BarChart3 className="h-4 w-4" />
        Grades
      </Link>
      <Link
        href={`/instructor/classes/${cls.id}?tab=materials`}
        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
        onClick={onClose}
      >
        <BookOpen className="h-4 w-4" />
        Materials
      </Link>
      <Link
        href={`/instructor/messages?class=${cls.id}`}
        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
        onClick={onClose}
      >
        <MessageSquare className="h-4 w-4" />
        Message Students
      </Link>
    </div>,
    document.body
  )
}

export default function ModuleCard({ cls }: ModuleCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const categoryName =
    typeof cls.course.category === 'object' && cls.course.category
      ? cls.course.category.name
      : typeof cls.course.category === 'string'
        ? cls.course.category
        : null

  const categoryColor = getCategoryColor(categoryName)
  const enrollmentPercentage =
    cls.maxStudents > 0 ? Math.round((cls.currentStudents / cls.maxStudents) * 100) : 0

  const semesterName =
    typeof cls.semester === 'string' ? cls.semester : (cls.semester?.name ?? 'Unassigned')
  const academicYearName =
    typeof cls.academicYear === 'string'
      ? cls.academicYear
      : (cls.academicYear?.name ?? 'Current Year')
  const status = getStatusBadge(cls)

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative flex flex-col rounded-3xl border border-slate-100 bg-white transition-all hover:border-blue-100 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900/30"
    >
      {/* Decorative top bar */}
      <div className={cn('h-1.5 w-full rounded-t-3xl', categoryColor)} />

      <div className="flex flex-1 flex-col p-6 sm:p-8">
        {/* Header with Status Badge */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-2xl',
                categoryColor.replace('bg-', 'text-')
              )}
            >
              <School className={cn('h-6 w-6', categoryColor.replace('bg-', 'text-'))} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-aerojet-sky text-[10px] font-black tracking-widest uppercase">
                  {cls.course.code}
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                <span className="text-[10px] font-bold text-slate-400 uppercase dark:text-slate-300">
                  {semesterName} {academicYearName}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
                {cls.course.name}
              </h3>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={cn('rounded-lg px-2.5 py-1 text-[10px] font-black uppercase', status.color)}
          >
            {status.label}
          </span>
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
            {/* Progress bar */}
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={cn('h-full transition-all duration-1000', categoryColor)}
                style={{ width: `${enrollmentPercentage}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase">
              {enrollmentPercentage}% Full
            </p>
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
              {new Date(cls.endDate).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <p className="mt-1 text-xs font-bold text-slate-400 uppercase">
              {cls.course.duration || 'Variable'} Hours Total
            </p>
          </div>
        </div>

        {/* Classroom Info */}
        {cls.classroom?.name && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {cls.classroom.name}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-auto flex gap-2">
          <Link
            href={`/instructor/attendance/${cls.id}`}
            className="bg-aerojet-sky hover:bg-aerojet-blue flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black tracking-widest text-white uppercase transition-all"
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

          {/* Quick Actions Dropdown - Using Portal */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={handleMenuToggle}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              aria-label="More actions"
              aria-expanded={isMenuOpen}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            <QuickActionsDropdown
              cls={cls}
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
