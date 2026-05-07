'use client'

import { useRouter } from 'next/navigation'
import { CheckSquare, Square } from 'lucide-react'
import UserActionsMenu from '../UserActionsMenu'
import type { User } from './types'
import { ROLE_STYLE, STATUS_STYLE } from './types'

export default function UsersTableRow({
  user,
  isSelected,
  onToggleSelect,
  onActionComplete,
}: {
  user: User
  isSelected: boolean
  onToggleSelect: () => void
  onActionComplete: () => void
}) {
  const router = useRouter()

  const fullName = user.profile
    ? [user.profile.firstName, user.profile.middleName, user.profile.lastName]
        .filter(Boolean)
        .join(' ')
    : user.email
  const initials = user.profile
    ? `${user.profile.firstName[0]}${user.profile.lastName[0]}`
    : user.email[0].toUpperCase()

  return (
    <tr
      onClick={() =>
        router.push(
          user.role === 'STUDENT' || user.role === 'APPLICANT'
            ? `/staff/students/${user.id}`
            : `/staff/users/${user.id}`
        )
      }
      className={`cursor-pointer transition-all duration-150 ease-out hover:bg-accent hover:shadow-[0_1px_4px_rgba(0,0,0,0.06)] dark:hover:bg-accent ${isSelected ? 'bg-aerojet-blue/5' : ''}`}
    >
      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onToggleSelect}
          className="hover:text-aerojet-blue text-slate-300 transition-colors"
          aria-label={`Select ${fullName}`}
        >
          {isSelected ? (
            <CheckSquare className="text-aerojet-blue h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="bg-aerojet-blue/10 text-aerojet-blue relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-black">
            {user.profile?.profilePhotoUrl ? (
              <img
                src={user.profile.profilePhotoUrl}
                alt={fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{fullName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${ROLE_STYLE[user.role] ?? 'bg-slate-100 text-slate-500'}`}
        >
          {user.role}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${STATUS_STYLE[user.status] ?? 'bg-slate-100 text-slate-500'}`}
        >
          {user.status}
        </span>
      </td>
      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
        {new Date(user.createdAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </td>
      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
        <UserActionsMenu
          userId={user.id}
          userStatus={user.status}
          userEmail={user.email}
          userRole={user.role}
          userName={fullName}
          isEmailVerified={!!user.emailVerified}
          mustChangePassword={user.mustChangePassword}
          onActionComplete={onActionComplete}
        />
      </td>
    </tr>
  )
}
