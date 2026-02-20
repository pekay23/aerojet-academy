import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { TrendingUp } from 'lucide-react'
import { Metadata } from 'next'
import { getEnrollmentTrends } from '@/lib/analytics/reports'
import { EnrollmentChart } from '@/components/charts/EnrollmentChart'

export const metadata: Metadata = { title: 'Enrollment Trends | Staff Reports' }

export default async function EnrollmentTrendsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const data = await getEnrollmentTrends()

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">Enrollment Trends</h1>
          <p className="text-slate-500 dark:text-slate-400">Breakdown of student enrollments by course</p>
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="col-span-2 lg:col-span-2">
          <EnrollmentChart data={data} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-6 py-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Course Enrollment Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Course Code</th>
                <th className="px-6 py-4">Course Name</th>
                <th className="px-6 py-4 text-right">Total Enrollments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No enrollment data available.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.courseCode} className="hover:bg-slate-50 dark:bg-slate-800/50">
                    <td className="px-6 py-4 font-bold text-slate-700">{item.courseCode}</td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100">{item.courseName}</td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-slate-600 dark:text-slate-400">
                      {item.count}
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

