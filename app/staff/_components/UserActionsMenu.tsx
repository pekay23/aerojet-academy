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
  LockOpen,
  Lock,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import ChangeRoleDialog from '../users/[id]/_components/ChangeRoleDialog'

interface UserActionsMenuProps {
  userId: string
  userStatus: string
  userEmail: string
  userRole?: string
  userName?: string
  isEmailVerified?: boolean
  mustChangePassword?: boolean
  onActionComplete?: () => void
}


function slugify(text: string) {
  return text?.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-') || '';
}

export default function UserActionsMenu({
  userId,
  userStatus,
  userEmail,
  userRole,
  userName = 'this user',
  isEmailVerified = true,
  mustChangePassword,
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

  interface ActionItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  action?: string
  variant: string
  onClick?: () => void
}

  const actions = isArchived
    ? [
        {
          label: 'View Profile',
          icon: Eye,
          href: `/staff/users/${slugify(userName) || userId}`,
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
          href: `/staff/users/${slugify(userName) || userId}`,
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
        } as ActionItem,
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
        mustChangePassword !== undefined && {
          label: mustChangePassword ? 'Bypass Password Change' : 'Require Password Change',
          icon: mustChangePassword ? LockOpen : Lock,
          action: 'toggle-password-change',
          variant: 'default',
        } as ActionItem,
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
            onClick={(e) => e.stopPropagation()}
            aria-label={`Actions for ${userName}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all outline-none hover:bg-slate-100 hover:text-slate-700 focus:ring-2 focus:ring-aerojet-blue focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" side="bottom" collisionPadding={10} className="w-48 p-1">
          {(actions.filter((a): a is ActionItem => Boolean(a))).map((item) => {
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
                    href={item.href ?? ''}
                    onClick={(e) => e.stopPropagation()}
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
                  onClick={(e) => {
                    e.stopPropagation()
                    item.onClick?.()
                  }}
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
                onClick={(e) => {
                  e.stopPropagation()
                  handleAction(item.action!, item.label)
                }}
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
