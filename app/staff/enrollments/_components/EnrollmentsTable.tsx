'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckSquare, Square, CheckCircle2, XCircle, Trash2 } from 'lucide-react'
import { bulkUpdateEnrollmentStatus, bulkDeleteEnrollments } from '../../actions'
import { toast } from 'sonner'

import TablePagination from '../../_components/TablePagination'
import BulkActionsDropdown from '../../_components/BulkActionsDropdown'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Enrollment, Course, User, Profile } from '@prisma/client'

type EnrollmentWithDetails = Omit<Enrollment, 'amountPaid'> & {
  amountPaid: number | null
  user: Omit<User, 'registrationFee'> & {
    registrationFee: number
    profile: Profile | null
  }
  course: Omit<Course, 'price'> & {
    price: number
  }
}

interface EnrollmentsTableProps {
  enrollments: EnrollmentWithDetails[]
}

export default function EnrollmentsTable({ enrollments }: EnrollmentsTableProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const total = enrollments.length
  const paged = enrollments.slice((page - 1) * perPage, page * perPage)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE':
      case 'COMPLETED':
      case 'ENROLLED':
        return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
      case 'PENDING':
        return 'bg-amber-100 text-amber-700 hover:bg-amber-100'
      case 'REJECTED':
      case 'WITHDRAWN':
      case 'CANCELLED':
      case 'SUSPENDED':
      case 'EXPELLED':
        return 'bg-red-100 text-red-700 hover:bg-red-100'
      default:
        return 'bg-slate-100 text-slate-700 hover:bg-slate-100'
    }
  }

  const toggleAll = () => {
    if (selectedIds.length === paged.length && paged.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(paged.map((e) => e.id))
    }
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-end">
        <BulkActionsDropdown
          selectedIds={selectedIds}
          onClear={() => setSelectedIds([])}
          actions={[
            {
              label: 'Approve',
              icon: CheckCircle2,
              variant: 'success',
              confirmTitle: 'Approve Enrollments',
              confirmMessage: `Are you sure you want to approve ${selectedIds.length} selected enrollments?`,
              onClick: async (ids) => {
                const res = await bulkUpdateEnrollmentStatus(ids, 'APPROVED')
                if (res.success) {
                  toast.success(`Approved ${ids.length} enrollments`)
                  router.refresh()
                } else toast.error(res.error)
              },
            },
            {
              label: 'Cancel',
              icon: XCircle,
              variant: 'warning',
              confirmTitle: 'Cancel Enrollments',
              confirmMessage: `Are you sure you want to cancel ${selectedIds.length} selected enrollments?`,
              onClick: async (ids) => {
                const res = await bulkUpdateEnrollmentStatus(ids, 'CANCELLED')
                if (res.success) {
                  toast.success(`Cancelled ${ids.length} enrollments`)
                  router.refresh()
                } else toast.error(res.error)
              },
            },
            {
              label: 'Delete',
              icon: Trash2,
              variant: 'danger',
              confirmTitle: 'Delete Enrollments',
              confirmMessage: `Are you sure you want to delete ${selectedIds.length} selected enrollments?`,
              onClick: async (ids) => {
                const res = await bulkDeleteEnrollments(ids)
                if (res.success) {
                  toast.success(`Deleted ${ids.length} enrollments`)
                  router.refresh()
                } else toast.error(res.error)
              },
            },
          ]}
        />
      </div>
      <div className="rounded-md border bg-white shadow-sm dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 px-6">
                <button
                  onClick={toggleAll}
                  className="hover:text-aerojet-blue text-slate-400 transition-colors"
                >
                  {selectedIds.length === paged.length && paged.length > 0 ? (
                    <CheckSquare className="text-aerojet-blue h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrolled Date</TableHead>
              <TableHead>Amount Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-slate-500 dark:text-slate-400"
                >
                  No enrollments found.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((enrollment) => (
                <TableRow
                  key={enrollment.id}
                  className={selectedIds.includes(enrollment.id) ? 'bg-aerojet-blue/5' : ''}
                >
                  <TableCell className="px-6">
                    <button
                      onClick={() => toggleOne(enrollment.id)}
                      className="hover:text-aerojet-blue text-slate-300 transition-colors"
                    >
                      {selectedIds.includes(enrollment.id) ? (
                        <CheckSquare className="text-aerojet-blue h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="font-bold text-[#002a5c] dark:text-white">
                        {enrollment.user.profile
                          ? [
                              enrollment.user.profile.firstName,
                              enrollment.user.profile.middleName,
                              enrollment.user.profile.lastName,
                            ]
                              .filter(Boolean)
                              .join(' ')
                          : 'Unknown'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {enrollment.user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {enrollment.course.name}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {enrollment.course.code || 'No Code'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(enrollment.status)} variant="secondary">
                      {enrollment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(enrollment.enrolledAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {enrollment.amountPaid !== null && enrollment.amountPaid !== undefined
                      ? `€${Number(enrollment.amountPaid).toFixed(2)}`
                      : '€0.00'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          page={page}
          perPage={perPage}
          total={total}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        />
      </div>
    </div>
  )
}
