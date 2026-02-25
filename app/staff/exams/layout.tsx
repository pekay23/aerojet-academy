'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
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
      <div className="border-b border-slate-200 bg-white px-6 pt-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = tab.activePattern.test(pathname)
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`relative flex items-center gap-2 px-1 pb-4 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[#002a5c] dark:text-blue-400'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="exams-nav-underline"
                      className="absolute bottom-0 left-0 h-0.5 w-full bg-[#002a5c] dark:bg-blue-400"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
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
