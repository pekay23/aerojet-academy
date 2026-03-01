'use client'

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

  return (
    <div className="rounded-md border bg-white shadow-sm dark:bg-slate-900">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Enrolled Date</TableHead>
            <TableHead>Amount Paid</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-slate-500 dark:text-slate-400"
              >
                No enrollments found.
              </TableCell>
            </TableRow>
          ) : (
            enrollments.map((enrollment) => (
              <TableRow key={enrollment.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {enrollment.user.profile
                        ? `${enrollment.user.profile.firstName} ${enrollment.user.profile.lastName}`
                        : 'Unknown'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {enrollment.user.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{enrollment.course.name}</span>
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
                <TableCell>{format(new Date(enrollment.enrolledAt), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  {enrollment.amountPaid !== null && enrollment.amountPaid !== undefined
                    ? `€${Number(enrollment.amountPaid).toFixed(2)}`
                    : '€0.00'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
