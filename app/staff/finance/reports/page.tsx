import { Metadata } from 'next'
export const metadata: Metadata = { title: 'Financial Reports | Staff Portal' }

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">Reports</h1>
          <p className="text-slate-500 dark:text-slate-400">Financial reports and analytics</p>
        </div>
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-900 p-12 text-center text-slate-500 dark:text-slate-400">
        <p className="text-lg font-medium">Coming Soon</p>
        <p>Financial reports are under development.</p>
      </div>
    </div>
  )
}
