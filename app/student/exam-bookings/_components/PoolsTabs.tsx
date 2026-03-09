'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FileCheck, Users, User, Package, Calculator, Layers, RefreshCcw } from 'lucide-react'
import { motion } from 'framer-motion'

const PRIMARY_TABS = [
  { key: 'available', label: 'Available Bookings', icon: Users },
  { key: 'my-bookings', label: 'My Bookings', icon: FileCheck },
] as const

const BOOKING_ACTIONS = [
  {
    key: 'group',
    label: 'Group Booking',
    shortLabel: 'Group',
    icon: Layers,
    color: 'blue',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
    activeBg: 'bg-blue-600',
    activeText: 'text-white',
  },
  {
    key: 'individual',
    label: 'Individual Seat',
    shortLabel: 'Individual',
    icon: User,
    color: 'emerald',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    activeBg: 'bg-emerald-600',
    activeText: 'text-white',
  },
  {
    key: 'twin',
    label: 'Twin Pack',
    shortLabel: 'Twin',
    icon: Package,
    color: 'indigo',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    hoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    activeBg: 'bg-indigo-600',
    activeText: 'text-white',
  },
  {
    key: 'four-pack',
    label: '4-Pack',
    shortLabel: '4-Pack',
    icon: Calculator,
    color: 'amber',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
    activeBg: 'bg-amber-600',
    activeText: 'text-white',
  },
  {
    key: 'resit',
    label: 'Exam Resit',
    shortLabel: 'Resit',
    icon: RefreshCcw,
    color: 'red',
    bg: 'bg-red-50 dark:bg-red-900/20',
    iconColor: 'text-red-600 dark:text-red-400',
    hoverBorder: 'hover:border-red-300 dark:hover:border-red-700',
    activeBg: 'bg-red-600',
    activeText: 'text-white',
  },
] as const

export default function PoolsTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'available'

  const setTab = (tab: string) => {
    router.push(`/student/exam-bookings?tab=${tab}`, { scroll: false })
  }

  const isBookingAction = BOOKING_ACTIONS.some((a) => a.key === currentTab)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#002a5c] sm:text-3xl dark:text-white">
          Exam Bookings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Join a booking to secure your seat for upcoming exams.
        </p>
      </div>

      {/* ── Primary Tab Bar ── */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {PRIMARY_TABS.map((t) => {
          const Icon = t.icon
          const isActive = currentTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'text-[#002a5c] dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="pools-tab"
                  className="absolute inset-0 bg-white shadow-sm dark:bg-slate-700"
                  style={{ borderRadius: 8, zIndex: 0 }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Book New Exam - Booking Type Actions ── */}
      <div className="space-y-3">
        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase sm:text-xs">
          Book New Exam
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
          {BOOKING_ACTIONS.map((action) => {
            const Icon = action.icon
            const isActive = currentTab === action.key
            return (
              <button
                key={action.key}
                onClick={() => setTab(action.key)}
                className={`group relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all sm:flex-row sm:gap-3 sm:p-4 sm:text-left ${
                  isActive
                    ? `border-transparent ${action.activeBg} shadow-lg`
                    : `border-slate-100 bg-white ${action.hoverBorder} hover:shadow-md dark:border-slate-800 dark:bg-slate-900`
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors sm:h-11 sm:w-11 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : `${action.bg} ${action.iconColor} group-hover:scale-105`
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-bold sm:text-sm ${
                      isActive
                        ? action.activeText
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <span className="sm:hidden">{action.shortLabel}</span>
                    <span className="hidden sm:inline">{action.label}</span>
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {children}
    </div>
  )
}
