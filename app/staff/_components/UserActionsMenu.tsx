'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  MoreHorizontal,
  Eye,
  UserCheck,
  UserX,
  KeyRound,
  Trash2,
  Mail,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import ChangeRoleDialog from '../users/[id]/_components/ChangeRoleDialog'

interface UserActionsMenuProps {
  userId: string
  userStatus: string
  userEmail: string
  userRole?: string
  userName?: string
  isEmailVerified?: boolean
  onActionComplete?: () => void
}

export default function UserActionsMenu({
  userId,
  userStatus,
  userEmail,
  userRole,
  userName = 'this user',
  isEmailVerified = true,
  onActionComplete,
}: UserActionsMenuProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)

  const handleAction = async (action: string, label: string) => {
    setLoading(action)
    try {
      const url =
        action === 'delete'
          ? `/api/staff/users/${userId}`
          : action === 'hard-delete'
            ? `/api/staff/users/${userId}?hard=true`
            : `/api/staff/users/${userId}/${action}`

      const res = await fetch(url, {
        method: action === 'delete' || action === 'hard-delete' ? 'DELETE' : 'POST',
      })
      if (!res.ok) throw new Error()
      toast.success(`${label} successful`)
      onActionComplete?.()
    } catch {
      toast.error(`Failed to ${label.toLowerCase()}`)
    } finally {
      setLoading(null)
    }
  }

  const isSuspended = userStatus === 'SUSPENDED'
  const isArchived = userStatus === 'ARCHIVED'

  const actions = isArchived
    ? [
        {
          label: 'View Profile',
          icon: Eye,
          href: `/staff/users/${userId}`,
          variant: 'default',
        },
        {
          label: 'Restore User',
          icon: UserCheck,
          action: 'restore',
          variant: 'success',
        },
        {
          label: 'Permanently Delete',
          icon: Trash2,
          action: 'hard-delete',
          variant: 'danger',
        },
      ]
    : [
        {
          label: 'View Profile',
          icon: Eye,
          href: `/staff/users/${userId}`,
          variant: 'default',
        },
        {
          label: 'Change Role',
          icon: ShieldCheck,
          onClick: () => setRoleDialogOpen(true),
          variant: 'default',
        },
        {
          label: 'Reset Password',
          icon: KeyRound,
          action: 'reset-password',
          variant: 'default',
        },
        !isEmailVerified && {
          label: 'Resend Verification Email',
          icon: ShieldCheck,
          action: 'resend-verification',
          variant: 'default',
        },
        {
          label: 'Send Email',
          icon: Mail,
          href: `mailto:${userEmail}`,
          variant: 'default',
        },
        {
          label: 'Resend Login Credentials',
          icon: ShieldCheck,
          action: 'resend-credentials',
          variant: 'default',
        },
        isSuspended
          ? { label: 'Activate Account', icon: UserCheck, action: 'activate', variant: 'success' }
          : { label: 'Suspend Account', icon: UserX, action: 'suspend', variant: 'warning' },
        {
          label: 'Archive User',
          icon: Trash2,
          action: 'delete',
          variant: 'danger',
        },
      ]

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            disabled={!!loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all outline-none hover:bg-slate-100 hover:text-slate-700 focus:ring-2 focus:ring-[#002a5c] focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" side="bottom" collisionPadding={10} className="w-48 p-1">
          {actions.filter(Boolean).map((item: any) => {
            const Icon = item.icon
            const colorClass =
              item.variant === 'danger'
                ? 'text-red-600 focus:text-red-600 focus:bg-red-50'
                : item.variant === 'warning'
                  ? 'text-amber-600 focus:text-amber-600 focus:bg-amber-50'
                  : item.variant === 'success'
                    ? 'text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50'
                    : 'text-slate-700 focus:text-slate-900 focus:bg-slate-50'

            if ('href' in item) {
              return (
                <DropdownMenuItem key={item.label} asChild className={colorClass}>
                  <Link
                    href={item.href}
                    className="flex w-full cursor-pointer items-center gap-2.5 px-2 py-2"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              )
            }

            if ('onClick' in item) {
              return (
                <DropdownMenuItem
                  key={item.label}
                  onClick={item.onClick}
                  className={`${colorClass} flex w-full cursor-pointer items-center gap-2.5 px-2 py-2`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </DropdownMenuItem>
              )
            }

            return (
              <DropdownMenuItem
                key={item.label}
                onClick={() => handleAction(item.action!, item.label)}
                className={`${colorClass} flex w-full cursor-pointer items-center gap-2.5 px-2 py-2`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangeRoleDialog
        userId={userId}
        currentRole={userRole || ''}
        userName={userName}
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
      />
    </>
  )
}
