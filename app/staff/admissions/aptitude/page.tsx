import { Metadata } from 'next'
import { Eye, FileQuestion, Settings, Users } from 'lucide-react'
import Link from 'next/link'
import BankList from './_components/BankList'

export const metadata: Metadata = {
  title: 'Aptitude Tests ',
}

export default function AptitudePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-aerojet-blue text-2xl font-black tracking-tight sm:text-3xl dark:text-white">
            Aptitude Tests
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Manage question banks, test configuration, and view session results.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/staff/admissions/aptitude/config"
          className="group hover:border-aerojet-blue/50 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center gap-3">
            <div className="text-aerojet-blue flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Test Configuration</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Settings & limits</p>
            </div>
          </div>
        </Link>
        <Link
          href="/staff/admissions/aptitude"
          className="group hover:border-aerojet-blue/50 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400">
              <FileQuestion className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Question Banks</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage questions</p>
            </div>
          </div>
        </Link>
        <Link
          href="/staff/admissions/aptitude/results"
          className="group hover:border-aerojet-blue/50 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Session Results</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Applicant scores</p>
            </div>
          </div>
        </Link>
        <Link
          href="/staff/admissions/aptitude/preview"
          className="group hover:border-aerojet-blue/50 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-400">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Preview Test</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">See applicant view</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-8">
        <BankList />
      </div>
    </div>
  )
}
