export interface User {
  id: string
  email: string
  personalEmail?: string | null
  academyEmail?: string | null
  role: string
  status: string
  emailVerified: string | null
  mustChangePassword?: boolean
  createdAt: string
  profile?: {
    firstName: string
    middleName?: string | null
    lastName: string
    phone?: string | null
    profilePhotoUrl?: string | null
  } | null
}

export const ROLE_FILTERS = ['all', 'STUDENT', 'APPLICANT', 'INSTRUCTOR', 'STAFF', 'ADMIN']
export const STATUS_FILTERS = ['all', 'ACTIVE', 'PENDING', 'SUSPENDED', 'ARCHIVED']

export const ROLE_STYLE: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  ADMIN: 'bg-red-100 text-red-700',
  STAFF: 'bg-purple-100 text-purple-700',
  INSTRUCTOR: 'bg-blue-100 text-blue-700',
  STUDENT: 'bg-emerald-100 text-emerald-700',
  APPLICANT: 'bg-amber-100 text-amber-700',
}

export const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  SUSPENDED: 'bg-red-100 text-red-600',
  ARCHIVED: 'bg-slate-100 text-slate-500',
  DELETED: 'bg-slate-100 text-slate-400',
}
