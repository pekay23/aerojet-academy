import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Pending Grading' }

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          Pending Grading
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Submissions awaiting grades.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center sm:p-12 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
          <span className="text-2xl">🚧</span>
        </div>
        <h2 className="mb-2 text-lg font-bold text-slate-700">Coming Soon</h2>
        <p className="mx-auto max-w-md text-sm text-slate-400">
          This feature is under development and will be available soon.
        </p>
      </div>
    </div>
  )
}
