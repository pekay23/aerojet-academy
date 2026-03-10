'use client'

import { useState } from 'react'
import { Users, User, Package, Calculator } from 'lucide-react'
import GroupBookingModal from './GroupBookingModal'
import StandaloneBooking from './StandaloneBooking'
import BundleBooking from './BundleBooking'

interface ExamEvent {
  id: string
  name: string
  startDate: Date
  endDate: Date
}

interface ExamPricing {
  groupCharterFee: number
  individualExamFee: number
  twoSeatBundle: number
  fourSeatBundle: number
  poolExamFee: number
}

interface WalletInfo {
  availableBalance: number | string
  currency: string
}

interface QuickBookingActionsProps {
  events: ExamEvent[]
  pricing: ExamPricing
  wallet: WalletInfo | null
  examComponents: { id: string; code: string; name: string }[]
  upcomingExams: { id: string; name: string; examDate: Date; examComponent: { course: { code: string; name: string } } }[]
}

export default function QuickBookingActions({
  events,
  pricing,
  wallet,
  examComponents,
  upcomingExams,
}: QuickBookingActionsProps) {
  const balance = Number(wallet?.availableBalance || 0)
  const currency = wallet?.currency || 'EUR'

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-200">
           New Booking Request
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Choose your preferred booking type below
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Group Charter */}
        <div className="group relative rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-900/20">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="mb-1 font-bold text-slate-900 dark:text-slate-100">Group Charter</h3>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            Start a custom group booking for your organization or colleagues.
          </p>
          <GroupBookingModal
            events={events}
            groupCharterFee={pricing.groupCharterFee}
            currency={currency}
            availableBalance={balance}
            trigger={
              <button className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700">
                Start Group Booking
              </button>
            }
          />
        </div>

        {/* 2. Individual Seat */}
        <div className="group relative rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:border-emerald-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-900/20">
            <User className="h-6 w-6" />
          </div>
          <h3 className="mb-1 font-bold text-slate-900 dark:text-slate-100">Individual Seat</h3>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            Book a single seat for any upcoming scheduled exam event.
          </p>
          <StandaloneBooking
            price={pricing.individualExamFee}
            currency={currency}
            availableBalance={balance}
            upcomingExams={upcomingExams}
            examComponents={examComponents}
            events={events}
            trigger={
              <button className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition-all hover:bg-emerald-700">
                Book Individual Seat
              </button>
            }
          />
        </div>

        {/* 3. Twin Pack */}
        <div className="group relative rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:border-indigo-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-900/20">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="mb-1 font-bold text-slate-900 dark:text-slate-100">Twin Pack</h3>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            Bundle 2 seats and save. Valid for 12 months from purchase.
          </p>
          <BundleBooking
            bundleSize={2}
            bundlePrice={pricing.twoSeatBundle}
            individualPrice={pricing.individualExamFee}
            currency={currency}
            availableBalance={balance}
            events={events}
            trigger={
              <button className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white transition-all hover:bg-indigo-700">
                Book Twin Pack
              </button>
            }
          />
        </div>

        {/* 4. 4-Pack */}
        <div className="group relative rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:border-amber-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white dark:bg-amber-900/20">
            <Calculator className="h-6 w-6" />
          </div>
          <h3 className="mb-1 font-bold text-slate-900 dark:text-slate-100">4-Pack</h3>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            Best value for regular students. Secure 4 seats at a discount.
          </p>
          <BundleBooking
            bundleSize={4}
            bundlePrice={pricing.fourSeatBundle}
            individualPrice={pricing.individualExamFee}
            currency={currency}
            availableBalance={balance}
            events={events}
            trigger={
              <button className="w-full rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white transition-all hover:bg-amber-700">
                Book 4 Pack
              </button>
            }
          />
        </div>
      </div>
    </div>
  )
}
