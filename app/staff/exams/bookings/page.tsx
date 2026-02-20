import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { ClipboardList, BookCheck, Calendar, Search, CreditCard } from 'lucide-react'
import prisma from '@/lib/prisma/client'
import { format } from 'date-fns'
import { Metadata } from 'next'
import SearchInput from '@/components/SearchInput'

export const metadata: Metadata = { title: 'Exam Bookings | Staff Portal' }

interface PageProps {
  searchParams: Promise<{ query?: string }>
}

export default async function ExamBookingsPage({ searchParams }: PageProps) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { query } = await searchParams
  const bookings = await prisma.examBooking.findMany({
    where: query
      ? {
          OR: [
            {
              user: {
                OR: [
                  { email: { contains: query } },
                  { profile: { firstName: { contains: query } } },
                  { profile: { lastName: { contains: query } } },
                ],
              },
            },
            { moduleCode: { contains: query } },
            { event: { name: { contains: query } } },
            { exam: { name: { contains: query } } },
          ],
        }
      : undefined,
    include: {
      user: {
        include: {
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      event: {
        select: {
          name: true,
          startDate: true,
        },
      },
      exam: {
        select: {
          name: true,
          examDate: true,
          course: {
            select: {
              code: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">Exam Bookings</h1>
          <p className="text-slate-500 dark:text-slate-400">Track student registrations and financial status</p>
        </div>
        <div className="w-full max-w-sm">
          <SearchInput placeholder="Search students, modules, or events..." />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Module / Type</th>
                <th className="px-6 py-4">Event / Date</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Booked On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
                      <ClipboardList className="h-6 w-6 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">No bookings found</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {query
                        ? 'Try adjusting your search terms.'
                        : 'Bookings will appear here as students register for exams.'}
                    </p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="group hover:bg-slate-50 dark:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-[#002a5c]">
                          {booking.user.profile?.firstName?.charAt(0)}
                          {booking.user.profile?.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {booking.user.profile?.firstName} {booking.user.profile?.lastName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{booking.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{booking.moduleCode}</span>
                        <span className="text-xs capitalize text-slate-500 dark:text-slate-400">
                          {booking.bookingType.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {booking.event ? (
                        <div>
                          <div className="font-medium text-slate-700">{booking.event.name}</div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Calendar className="h-3 w-3" />
                            {format(booking.event.startDate, 'MMM d, yyyy')}
                          </div>
                        </div>
                      ) : booking.exam ? (
                        <div>
                          <div className="font-medium text-slate-700">
                            {booking.exam.course.code} Exam
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Calendar className="h-3 w-3" />
                            {format(booking.exam.examDate, 'MMM d, yyyy')}
                          </div>
                        </div>
                      ) : (
                        <span className="italic text-slate-400">Not scheduled</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                          booking.status === 'APPROVED' || booking.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : booking.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700'
                              : booking.status === 'REJECTED' || booking.status === 'FAILED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-medium text-slate-700">
                        <CreditCard className="h-3 w-3 text-slate-400" />
                        {Number(booking.amountPaid).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {format(booking.bookedAt, 'MMM d, h:mm a')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

