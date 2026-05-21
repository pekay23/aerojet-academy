import { Users, User, Layers, Wallet, Info } from 'lucide-react'

import AvailablePoolsTab from './AvailablePoolsTab'
import BookingActionTab from './BookingActionTab'

/**
 * Consolidated "Book Exam" tab — combines pools, individual booking,
 * and group charter into a single scrollable page with clearly
 * separated sections.
 */
export default function BookExamTab() {
  return (
    <div className="space-y-10">
      {/* ── Section 1: Join an Exam Pool ── */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Join an Exam Pool
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Join an open exam pool to be allocated a seat when the event is confirmed.
            </p>
          </div>
        </div>
        <AvailablePoolsTab />
      </section>

      {/* ── Divider ── */}
      <div className="border-t border-slate-200/80 dark:border-slate-700/50" />

      {/* ── Section 2: Individual Booking ── */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Individual Booking
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Book a guaranteed exam seat directly — single, twin pack, or 4-pack options.
            </p>
          </div>
        </div>
        <BookingActionTab type="individual" />
      </section>

      {/* ── Divider ── */}
      <div className="border-t border-slate-200/80 dark:border-slate-700/50" />

      {/* ── Section 3: Group Charter ── */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Group Charter
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              For organizations sending multiple candidates. One representative creates the booking,
              and the academy links all participants.
            </p>
          </div>
        </div>
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-950/20">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <p className="text-xs text-blue-800 dark:text-blue-300">
            Group bookings are ideal for companies or training centres. The group representative
            handles booking and payment, and the academy will create or link participant accounts to
            their exam records.
          </p>
        </div>
        <BookingActionTab type="group" />
      </section>
    </div>
  )
}
