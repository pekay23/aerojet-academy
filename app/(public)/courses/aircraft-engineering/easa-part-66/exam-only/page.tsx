import { Metadata } from 'next'
import Link from 'next/link'
import Hero from '../../../../_components/Hero'
import SectionReveal from '../../../../_components/SectionReveal'
import {
  CheckCircle2,
  Users,
  Calendar,
  AlertTriangle,
  Clock,
  Award,
  BookOpen,
  MonitorPlay,
  Info,
  CreditCard,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Exam Delivery & Pricing | Aerojet Academy',
  description:
    'EASA Part-66 examination booking — pool seats, individual bookings, bundles, and special pricing.',
}

export default function ExamOnlyPage() {
  return (
    <div className="bg-white">
      <Hero
        title="Examination Only"
        subtitle="Self-study option with flexible exam booking — pool seats, individual slots, and bundle packages."
        backgroundImage="/images/hero/examonly.webp"
      />

      <div className="mx-auto max-w-6xl space-y-20 px-6 py-20">
        {/* Notice */}
        <SectionReveal>
          <div className="rounded-r-xl border-l-4 border-orange-500 bg-orange-50 p-5">
            <div className="flex gap-4">
              <AlertTriangle className="h-6 w-6 shrink-0 text-orange-600" />
              <div>
                <h3 className="mb-1 font-bold text-orange-900">Important Notice</h3>
                <p className="text-sm text-orange-800">
                  No minimum wait times between subject attempts — book when ready.
                </p>
              </div>
            </div>
          </div>
        </SectionReveal>

        {/* What's Included + How Pools Work */}
        <div className="grid gap-10 lg:grid-cols-2">
          <SectionReveal>
            <section>
              <h2 className="mb-6 text-2xl font-black tracking-tight text-[#002a5c] uppercase">
                What's Included
              </h2>
              <p className="mb-6 leading-relaxed text-slate-700">
                The Exam Only option is ideal for candidates who are confident studying on their own
                and require no tuition support. Aerojet's facility is a{' '}
                <strong>Certified EASA Part 147 Facility</strong>.
              </p>
              <div className="space-y-3">
                {[
                  {
                    icon: BookOpen,
                    title: 'Exam Fee & Learning Materials',
                    desc: 'Full access to study guides and the examination sitting.',
                  },
                  {
                    icon: MonitorPlay,
                    title: '1 Online Prep Session',
                    desc: 'Complimentary online prep session included in the package.',
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#4c9ded]" />
                    <div>
                      <h5 className="text-sm font-bold text-slate-900">{title}</h5>
                      <p className="text-xs text-slate-600">{desc}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100/50">
                    <CreditCard className="h-4 w-4 shrink-0 text-[#4c9ded]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900 uppercase">
                      Transparent Pricing
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      View all exam and bundle fees before booking.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6 sm:p-8">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-[#002a5c]">
                <Users className="h-5 w-5" /> What is an Exam Booking?
              </h3>
              <p className="mb-4 text-sm text-slate-700">
                An exam booking is a single sitting that brings together 25–28 candidates. Each
                booking:
              </p>
              <ul className="space-y-2 text-sm text-slate-700">
                {[
                  'Accommodates 25–28 candidates',
                  'Each candidate takes ONE module per booking',
                  'Supports up to 4 different module codes per sitting',
                  'Confirms automatically when 25 candidates book & pay',
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#4c9ded]" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-lg border border-blue-200 bg-white p-3">
                <p className="text-xs text-slate-600">
                  <strong>Example:</strong> Pool A might have 7 candidates taking M1, 8 taking M7, 6
                  taking M8, and 5 taking M15 — all in the same session.
                </p>
              </div>
            </section>
          </SectionReveal>
        </div>

        {/* Pricing notice + Table */}
        <SectionReveal>
          <section>
            <h2 className="mb-6 text-2xl font-black tracking-tight text-[#002a5c] uppercase">
              Exam Booking Options
            </h2>

            {/* Pricing notice */}
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#4c9ded]" />
              <p className="text-sm text-slate-700">
                <strong className="text-[#002a5c]">All pricing is available in the portal.</strong>{' '}
                Register or log in to view current rates for all booking types and bundle packages.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-2xl">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="bg-[#002a5c] text-white">
                    <th className="px-5 py-4 text-left text-xs font-bold tracking-wider uppercase">
                      Booking Type
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold tracking-wider uppercase">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    {
                      type: 'Pool Seat',
                      tag: 'Most Popular',
                      tagColor: 'bg-green-600',
                      notes:
                        'One module. Pool confirms at 25+ candidates. Includes pre-exam clinic.',
                    },
                    {
                      type: 'Individual Seat',
                      notes: 'Guaranteed slot. One module + pre-exam group clinic.',
                    },
                    {
                      type: '2-Seat Bundle',
                      notes: 'Any modules. Valid 12 months. 1 free module change.',
                    },
                    {
                      type: '4-Seat Bundle',
                      notes: 'Any modules. Valid 12 months. 2 free module changes.',
                    },
                    {
                      type: 'Resit',
                      notes: 'Subject to availability in upcoming exam windows.',
                    },
                    {
                      type: 'Group Charter',
                      notes: 'Up to 28 candidates per sitting. Mix up to 4 modules.',
                    },
                  ].map((row) => (
                    <tr key={row.type} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-slate-900">{row.type}</span>
                        {row.tag && (
                          <span
                            className={`ml-2 ${row.tagColor} rounded-full px-2 py-0.5 text-[9px] font-black text-white uppercase`}
                          >
                            {row.tag}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </SectionReveal>

        {/* Special Pricing */}
        <SectionReveal>
          <section>
            <h2 className="mb-8 text-2xl font-black tracking-tight text-[#002a5c] uppercase">
              Special Pricing Programs
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl bg-linear-to-br from-purple-600 to-purple-700 p-6 text-white shadow-xl sm:rounded-3xl sm:p-8">
                <Award className="mb-3 h-8 w-8 text-purple-200" />
                <h3 className="mb-1 text-lg font-bold">Multi-Pool Discount</h3>
                <p className="mb-4 text-sm text-purple-100">
                  Book 3+ pool seats in the same exam event and receive an automatic discount at
                  checkout.
                </p>
                <div className="space-y-1 rounded-xl border border-white/20 bg-white/10 p-3 text-xs text-purple-100">
                  <p>✓ Automatically applied at checkout</p>
                  <p>✓ Savings vs standard pool pricing</p>
                </div>
              </div>
              <div className="rounded-2xl bg-linear-to-br from-orange-600 to-orange-700 p-6 text-white shadow-xl sm:rounded-3xl sm:p-8">
                <Users className="mb-3 h-8 w-8 text-orange-200" />
                <h3 className="mb-1 text-lg font-bold">Ambassador Program</h3>
                <p className="mb-4 text-sm text-orange-100">
                  Refer 10+ candidates who complete pool bookings and unlock a discounted per-seat
                  rate for life.
                </p>
                <div className="space-y-1 rounded-xl border border-white/20 bg-white/10 p-3 text-xs text-orange-100">
                  <p>✓ Discounted per-seat pricing for life</p>
                  <p>✓ Wallet credit rewarded at 10 referrals</p>
                </div>
              </div>
            </div>
          </section>
        </SectionReveal>

        {/* Booking Conditions */}
        <SectionReveal>
          <section className="rounded-2xl bg-slate-50 p-6 sm:rounded-3xl sm:p-10">
            <h2 className="mb-6 text-xl font-bold text-[#002a5c]">Booking Conditions</h2>
            <div className="mb-8 grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h5 className="mb-3 text-sm font-bold text-slate-900">Pool-Specific Rules</h5>
                <ul className="space-y-2 text-xs text-slate-600">
                  {[
                    'Confirms at 25 paid candidates',
                    'Capacity: 25–28 per booking',
                    'Max 4 module codes per booking',
                    'Real-time status via Portal',
                  ].map((r) => (
                    <li key={r} className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#4c9ded]" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h5 className="mb-3 text-sm font-bold text-slate-900">Payment Terms</h5>
                <ul className="space-y-2 text-xs text-slate-600">
                  {[
                    'Pool Seats: Full payment required to reserve',
                    'Individual: 50% deposit, balance by T-21',
                    'Bundles: Paid in full to activate',
                    'Late booking surcharge applies within 14 days',
                  ].map((r) => (
                    <li key={r} className="flex gap-2">
                      <CreditCard className="h-4 w-4 shrink-0 text-[#4c9ded]" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <h5 className="mb-2 text-sm font-bold text-red-900">
                Changes, Postponements & Credits
              </h5>
              <p className="mb-2 text-xs text-red-800">
                <strong>No cash refunds policy.</strong> All changes result in wallet credits.
              </p>
              <ul className="space-y-1 text-xs text-red-800">
                <li>• Aerojet-initiated postponements: Automatic wallet credit rollover</li>
                <li>• Module changes: Admin fee applies (waived for bundle holders)</li>
                <li>• Cancellations 21+ days before: Wallet credit at Aerojet's discretion</li>
                <li>• No-shows: Forfeit seat (refund only with verified medical reason)</li>
              </ul>
            </div>
          </section>
        </SectionReveal>

        {/* CTA */}
        <SectionReveal>
          <section className="rounded-2xl bg-linear-to-r from-[#002a5c] to-[#4c9ded] p-8 text-center text-white sm:rounded-3xl sm:p-10">
            <h2 className="mb-4 text-2xl font-bold">Ready to Book Your Exam?</h2>
            <p className="mx-auto mb-6 max-w-xl text-blue-100/80">
              Register on our portal to view available exam bookings, pricing, and book your seats.
            </p>
            <Link
              href="/register"
              className="mb-6 inline-block rounded-xl bg-white px-8 py-4 text-xs font-bold tracking-widest text-[#002a5c] uppercase transition-all hover:bg-blue-50"
            >
              Register Now
            </Link>
            <div className="space-y-1 border-t border-white/20 pt-6 text-sm text-blue-100">
              <p>Email: trainingprograms@aerojet-academy.com</p>
              <p>Phone/WhatsApp: +233 209 848 423</p>
            </div>
          </section>
        </SectionReveal>
      </div>
    </div>
  )
}
