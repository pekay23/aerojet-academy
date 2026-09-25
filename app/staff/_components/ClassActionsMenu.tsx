'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { MoreHorizontal, Eye, Pencil, Trash2, Loader2, Users } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

interface ClassActionsMenuProps {
  classId: string
  className: string
  onActionComplete?: () => void
}

export default function ClassActionsMenu({
  classId,
  className,
  onActionComplete,
}: ClassActionsMenuProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete the class "${className}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setLoading('delete')
    try {
      const res = await fetch(`/api/staff/classes/${classId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      toast.success('Class deleted successfully')
      onActionComplete?.()
      router.refresh()
    } catch {
      toast.error('Failed to delete class')
    } finally {
      setLoading(null)
    }
  }

  const actions = [
    {
      label: 'View Class',
      icon: Eye,
      href: `/staff/classes/${classId}`,
    },
    {
      label: 'View Roster',
      icon: Users,
      href: `/staff/classes/${classId}/roster`,
    },
    {
      label: 'Edit Class',
      icon: Pencil,
      href: `/staff/classes/${classId}/edit`,
    },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={!!loading}
          className="focus:ring-aerojet-blue inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all outline-none hover:bg-slate-100 hover:text-slate-700 focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
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
              className="text-slate-700 focus:bg-slate-50 focus:text-slate-900 dark:bg-slate-800/50 dark:text-slate-100"
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
          onClick={handleDelete}
          className="flex w-full cursor-pointer items-center gap-2.5 px-2 py-2 text-red-600 focus:bg-red-50 focus:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Class
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
