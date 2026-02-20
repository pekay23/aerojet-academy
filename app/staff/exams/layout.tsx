'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, ClipboardList, Trophy } from 'lucide-react'

const tabs = [
  {
    name: 'Events',
    href: '/staff/exams/events',
    icon: Calendar,
    activePattern: /^\/staff\/exams\/events/,
  },
  {
    name: 'Bookings',
    href: '/staff/exams/bookings',
    icon: ClipboardList,
    activePattern: /^\/staff\/exams\/bookings/,
  },
  {
    name: 'Results',
    href: '/staff/exams/results',
    icon: Trophy,
    activePattern: /^\/staff\/exams\/results/,
  },
]

export default function ExamsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 pt-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = tab.activePattern.test(pathname)
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`flex items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-[#002a5c] text-[#002a5c]'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
      <div className="px-6 pb-12">{children}</div>
    </div>
  )
}
