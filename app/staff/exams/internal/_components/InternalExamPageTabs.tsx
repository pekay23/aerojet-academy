'use client'

import Link from 'next/link'
import { Database, Activity } from 'lucide-react'

interface Props {
  activeTab: string
}

export default function InternalExamPageTabs({ activeTab }: Props) {
  const tabs = [
    { key: 'banks', label: 'Question Banks', icon: <Database className="h-4 w-4" /> },
    { key: 'operations', label: 'Operations', icon: <Activity className="h-4 w-4" /> },
  ]

  return (
    <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={`/staff/exams/internal?tab=${tab.key}`}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all ${
            activeTab === tab.key
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
          }`}
        >
          {tab.icon}
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
