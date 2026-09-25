'use client'
import { formatDate } from '@/lib/utils/formatters'

import Link from 'next/link'
import {
  ChevronRight,
  MapPin,
  Users,
  ClipboardCheck,
  BarChart3,
  BookOpen,
  MessageSquare,
  MoreVertical,
  School,
  Inbox,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { EmptyState } from '@/components/shared/EmptyState'

interface CourseData {
  id: string
  code: string
  name: string
  category?: { id: string; name: string } | string | null
  duration?: number | null
}

interface ClassData {
  id: string
  name: string
  course: CourseData
  semester?: { id: string; name: string } | string | null
  academicYear?: { id: string; name: string } | string | null
  startDate: string | Date
  endDate: string | Date
  currentStudents: number
  maxStudents: number
  classroom?: { id: string; name: string } | null
}

interface IntakeGroup {
  intakeKey: string
  academicYear: { id: string; name: string } | null
  semester: { id: string; name: string } | null
  classes: ClassData[]
}

interface IntakeGroupTableProps {
  groups: IntakeGroup[]
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

function getCategoryTextColor(category?: string | null) {
  switch (category?.toUpperCase()) {
    case 'CORE':
      return 'text-white'
    case 'AVIONICS':
      return 'text-white'
    case 'SPECIALIST':
      return 'text-slate-900 dark:text-white'
    case 'SAFETY':
      return 'text-white'
    default:
      return 'text-white'
  }
}

function getStatusBadge(cls: ClassData) {
  const now = new Date()
  const start = new Date(cls.startDate)
  const end = new Date(cls.endDate)

  if (start > now)
    return {
      label: 'Upcoming',
      className: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    }
  if (end < now)
    return {
      label: 'Completed',
      className: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400',
    }
  return {
    label: 'Active',
    className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  }
}

function ClassRow({ cls }: { cls: ClassData }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)

  const categoryName =
    typeof cls.course.category === 'object' && cls.course.category
      ? cls.course.category.name
      : typeof cls.course.category === 'string'
        ? cls.course.category
        : undefined

  const categoryColor = getCategoryColor(categoryName)
  const categoryTextColor = getCategoryTextColor(categoryName)
  const enrollmentPercentage =
    cls.maxStudents > 0 ? Math.round((cls.currentStudents / cls.maxStudents) * 100) : 0
  const status = getStatusBadge(cls)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
        setMenuPosition(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX - 176,
      })
    }
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <tr className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl', categoryColor)}>
            <School className={cn('h-4 w-4', categoryTextColor)} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900 dark:text-slate-100">
              {cls.course.code}
            </p>
            <p className="max-w-50 truncate text-sm text-slate-500 dark:text-slate-400">
              {cls.course.name}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase',
            categoryColor,
            categoryTextColor
          )}
        >
          {categoryName || 'General'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase',
              status.className
            )}
          >
            {status.label}
          </span>
          <span className="text-xs text-slate-400">
            {formatDate(cls.startDate)} – {formatDate(cls.endDate)}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {cls.currentStudents} / {cls.maxStudents}
          </span>
          <div className="hidden h-1 w-24 overflow-hidden rounded-full bg-slate-200 sm:block dark:bg-slate-700">
            <div
              className={cn('h-full transition-all duration-500', categoryColor)}
              style={{ width: `${enrollmentPercentage}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {cls.classroom?.name && (
          <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
            <MapPin className="h-3.5 w-3.5" />
            {cls.classroom.name}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Link
              href={`/instructor/attendance/${cls.id}`}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all',
                'bg-aerojet-sky hover:bg-aerojet-blue text-white'
              )}
            >
              <ClipboardCheck className="h-3 w-3" />
              Attendance
            </Link>
            <Link
              href={`/instructor/classes/${cls.id}`}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all',
                'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              )}
            >
              Roster
            </Link>
          </div>
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={handleMenuToggle}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              aria-label="More actions"
              aria-expanded={isMenuOpen}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {isMenuOpen && menuPosition
              ? createPortal(
                  <div
                    className="animate-in fade-in zoom-in-95 fixed z-50 w-44 origin-top-right rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-900"
                    style={{ top: menuPosition.top, left: menuPosition.left }}
                  >
                    <Link
                      href={`/instructor/classes/${cls.id}?tab=grades`}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <BarChart3 className="h-4 w-4" />
                      Grades
                    </Link>
                    <Link
                      href={`/instructor/classes/${cls.id}?tab=materials`}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <BookOpen className="h-4 w-4" />
                      Materials
                    </Link>
                    <Link
                      href={`/instructor/messages?class=${cls.id}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Message Students
                    </Link>
                  </div>,
                  document.body
                )
              : null}
          </div>
        </div>
      </td>
    </tr>
  )
}

function IntakeSection({
  group,
  isLast,
}: {
  group: IntakeGroup
  isFirst: boolean
  isLast: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const totalStudents = group.classes.reduce((sum, c) => sum + c.currentStudents, 0)
  const totalCapacity = group.classes.reduce((sum, c) => sum + c.maxStudents, 0)

  return (
    <>
      {/* Intake Section Header — spans all columns */}
      <tr className="bg-slate-100 dark:bg-slate-800/50">
        <td colSpan={6} className="px-4 py-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center gap-3 text-left focus:outline-none"
          >
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded border border-slate-300 text-slate-500 transition-transform',
                isExpanded ? 'rotate-90' : ''
              )}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/10">
                <School className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  {group.academicYear?.name || 'Unknown Year'}
                  {group.semester && ` • ${group.semester.name}`}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {group.classes.length} class{group.classes.length !== 1 ? 'es' : ''} •
                  {totalStudents} / {totalCapacity} students
                </p>
              </div>
            </div>
          </button>
        </td>
      </tr>

      {/* Class Rows */}
      {isExpanded && group.classes.length === 0 ? (
        <tr>
          <td colSpan={6} className="p-0">
            <EmptyState
              icon={Inbox}
              title="No classes in this intake"
              description="There are no classes assigned to this intake group yet."
            />
          </td>
        </tr>
      ) : (
        isExpanded && group.classes.map((cls) => <ClassRow key={cls.id} cls={cls} />)
      )}

      {/* Section Divider */}
      {!isLast && <tr className="h-px bg-slate-100 dark:bg-slate-800" />}
    </>
  )
}

export default function IntakeGroupTable({ groups }: IntakeGroupTableProps) {
  // Defensive: deduplicate classes by ID within each group to prevent
  // React "two children with the same key" warnings from data anomalies
  const dedupedGroups = (groups || []).map((group) => {
    const seen = new Set<string>()
    return {
      ...group,
      classes: group.classes.filter((cls) => {
        if (seen.has(cls.id)) return false
        seen.add(cls.id)
        return true
      }),
    }
  })

  if (!dedupedGroups || dedupedGroups.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-20 text-center dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
          <School className="h-10 w-10 text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          No classes assigned
        </h3>
        <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
          You haven&apos;t been assigned to any instructional classes for the current filters.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50">
            <th className="px-4 py-3 text-left text-xs font-bold tracking-widest text-slate-400 uppercase">
              Course
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold tracking-widest text-slate-400 uppercase">
              Category
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold tracking-widest text-slate-400 uppercase">
              Status & Dates
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold tracking-widest text-slate-400 uppercase">
              Enrollment
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold tracking-widest text-slate-400 uppercase">
              Classroom
            </th>
            <th className="px-4 py-3 text-right text-xs font-bold tracking-widest text-slate-400 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {dedupedGroups.map((group, index) => (
            <IntakeSection
              key={group.intakeKey}
              group={group}
              isFirst={index === 0}
              isLast={index === dedupedGroups.length - 1}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
