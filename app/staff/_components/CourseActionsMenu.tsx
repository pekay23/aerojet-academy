'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { MoreHorizontal, Eye, Pencil, Trash2, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

interface CourseActionsMenuProps {
  courseId: string
  courseCode?: string
  courseName: string
  onActionComplete?: () => void
}

export default function CourseActionsMenu({
  courseId,
  courseCode,
  courseName,
  onActionComplete,
}: CourseActionsMenuProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const slug = courseCode || courseId

  const handleDelete = async (force = false) => {
    const msg = force
      ? `FORCE DELETE "${courseName}"? This will remove all enrollments, classes, exam components, bookings, and related records. This cannot be undone.`
      : `Are you sure you want to delete the course "${courseName}"? This action cannot be undone.`
    if (!confirm(msg)) return

    setLoading('delete')
    try {
      const url = force
        ? `/api/staff/courses/${courseId}?force=true`
        : `/api/staff/courses/${courseId}`
      const res = await fetch(url, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        // If 409 conflict (has related records), offer force-delete
        if (res.status === 409) {
          const doForce = confirm(
            `${data.error || 'Course has related records.'}\n\nWould you like to force-delete and remove all related data?`
          )
          if (doForce) {
            setLoading(null)
            return handleDelete(true)
          }
          return
        }
        throw new Error(data.error || 'Failed to delete course')
      }
      toast.success('Course deleted successfully')
      onActionComplete?.()
      router.push('/staff/courses')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete course')
    } finally {
      setLoading(null)
    }
  }

  const actions = [
    {
      label: 'View Details',
      icon: Eye,
      href: `/staff/courses/${slug}`,
    },
    {
      label: 'Edit Course',
      icon: Pencil,
      href: `/staff/courses/${slug}/edit`,
    },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={!!loading}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 outline-none transition-all hover:bg-slate-100 hover:text-slate-700 focus:ring-2 focus:ring-aerojet-blue focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="bottom" collisionPadding={10} className="w-48 p-1">
        {actions.map((item) => {
          const Icon = item.icon
          return (
            <DropdownMenuItem
              key={item.label}
              asChild
              className="text-slate-700 focus:bg-slate-50 dark:bg-slate-800/50 focus:text-slate-900 dark:text-slate-100"
            >
              <Link
                href={item.href}
                className="flex w-full cursor-pointer items-center gap-2.5 px-2 py-2"
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator className="my-1 bg-slate-100" />
        <DropdownMenuItem
          onClick={() => handleDelete(false)}
          className="flex w-full cursor-pointer items-center gap-2.5 px-2 py-2 text-red-600 focus:bg-red-50 focus:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Course
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
