import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { Metadata } from 'next'
import { format } from 'date-fns'
import { getAttendanceReport } from '@/lib/analytics/reports'
import { AttendanceChart } from '@/components/charts/AttendanceChart'

export const metadata: Metadata = { title: 'Attendance Report | Staff Reports' }

export default async function AttendanceReportPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { records, chartData } = await getAttendanceReport()

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Calendar className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">Attendance Reports</h1>
          <p className="text-slate-500 dark:text-slate-400">Student attendance tracking and history</p>
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="col-span-2 lg:col-span-1">
          <AttendanceChart data={chartData} />
        </div>
        {/* Could add another chart here later, e.g. absence by course */}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-6 py-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Recent Attendance Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Class/Event</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Recorded At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 dark:bg-slate-800/50">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {format(new Date(record.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                      {record.user.profile
                        ? `${record.user.profile.firstName} ${record.user.profile.lastName}`
                        : record.user.email}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {record.class?.name || 'Unknown Class'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium uppercase ${
                          record.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-700'
                            : record.status === 'ABSENT'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                        } `}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-slate-400">
                      {format(new Date(record.createdAt), 'HH:mm')}
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

