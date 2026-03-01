import { Metadata } from 'next'
import Link from 'next/link'
import Hero from '../../_components/Hero'
import SectionReveal from '../../_components/SectionReveal'
import prisma from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Fees & Payment | Aerojet Academy' }

function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case 'EUR':
      return '€'
    case 'GHS':
      return 'GH₵'
    case 'USD':
      return '$'
    default:
      return 'GH₵'
  }
}

async function getRegistrationFee() {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ['registration_fee', 'registration_currency'] } },
  })
  const fee = settings.find((s) => s.key === 'registration_fee')?.value || '350'
  const currency = settings.find((s) => s.key === 'registration_currency')?.value || 'GHS'
  return { fee, currency, symbol: getCurrencySymbol(currency) }
}

const milestones = [
  {
    id: 'A',
    name: 'Four-Year Full-Time (B1.1 & B2)',
    deposit: '40% of Year 1',
    balance: '2 instalments per year',
  },
  {
    id: 'B',
    name: 'Two-Year Full-Time (B1.1)',
    deposit: '40% of Year 1',
    balance: '2 instalments per year',
  },
  {
    id: 'C',
    name: '12-Month Crash Course',
    deposit: '40% Total Fee',
    balance: '2 instalments total',
  },
  { id: 'D', name: 'Modular Training', deposit: '100% per Module', balance: 'Pay-as-you-go' },
  {
    id: 'E',
    name: 'Examination-Only Seat',
    deposit: '50% per Exam',
    balance: 'Settled by T-14 days',
  },
  { id: 'F', name: 'Revision Support', deposit: '100% per Block', balance: 'Paid upfront' },
]

export default async function FeesPage() {
  const { fee, currency, symbol } = await getRegistrationFee()

  return (
    <div className="bg-slate-50">
      <Hero
        title="Fees & Payment Rules"
        subtitle="Structured payment milestones for Aerojet Academy training programmes."
        backgroundImage="/images/hero/feespayment.webp"
      />{' '}
      <div className="mx-auto max-w-5xl space-y-16 px-6 py-20">
        {/* Registration Fee */}
        <SectionReveal>
          <section className="flex flex-col items-center gap-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-xl sm:rounded-3xl sm:p-10 md:flex-row">
            <div className="flex-1">
              <div className="mb-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black tracking-widest text-[#4c9ded] uppercase">
                Step 01
              </div>
              <h2 className="mb-4 text-2xl font-black tracking-tight text-[#002a5c] uppercase sm:text-3xl">
                Mandatory Registration
              </h2>
              <p className="leading-relaxed text-slate-500">
                To initiate your journey, a one-time registration fee is required. This activates
                your record and unlocks the official application link. This fee covers
                administrative processing and background verification.
              </p>
            </div>
            <div className="w-full shrink-0 rounded-2xl bg-slate-900 p-6 text-center text-white shadow-2xl sm:p-8 md:w-auto">
              <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-[#4c9ded] uppercase">
                Pre-Application
              </span>
              <span className="mb-1 block text-4xl font-black">
                {symbol}
                {fee}
              </span>
              <span className="text-[10px] font-medium text-slate-400 uppercase">
                Non-Refundable
              </span>
            </div>
          </section>
        </SectionReveal>

        {/* Payment Milestones */}
        <SectionReveal>
          <section>
            <h3 className="mb-6 text-2xl font-black tracking-tight text-slate-900 uppercase">
              Payment Milestones
            </h3>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    <tr>
                      <th className="p-5">Option</th>
                      <th className="p-5">Programme</th>
                      <th className="p-5">Initial Confirmation</th>
                      <th className="p-5">Balance Schedule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {milestones.map((row) => (
                      <tr key={row.id} className="transition-colors hover:bg-slate-50/50">
                        <td className="p-5 font-black text-[#4c9ded]">{row.id}</td>
                        <td className="p-5 font-bold text-slate-800">{row.name}</td>
                        <td className="p-5 font-bold text-[#002a5c]">{row.deposit}</td>
                        <td className="p-5 text-xs font-medium text-slate-500">{row.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-5 rounded-xl border border-blue-100/50 bg-blue-50/50 p-4 text-center">
              <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Detailed tuition and exam pricing is visible in the Student Portal after
                registration.
              </p>
            </div>
          </section>
        </SectionReveal>

        {/* Refund Rules */}
        <SectionReveal>
          <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:rounded-3xl sm:p-10">
            <h3 className="mb-6 flex items-center gap-3 text-xl font-black tracking-tight text-[#002a5c] uppercase">
              <span className="h-8 w-2 rounded-full bg-red-500" /> Refund & Cancellation Rules
            </h3>
            <ul className="space-y-5">
              {[
                {
                  title: 'Registration Fees',
                  desc: `The ${symbol}${fee} fee is strictly non-refundable once the invoice is generated.`,
                },
                {
                  title: 'Seat Confirmation Deposits',
                  desc: 'The 40% deposit confirms your place. Non-refundable once the cohort has been officially confirmed.',
                },
                {
                  title: 'Examination Sittings',
                  desc: 'Confirmed bookings may roll forward to the next window if requested before T-21. No-shows result in total forfeiture.',
                },
              ].map((rule) => (
                <li key={rule.title} className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-50 text-[10px] font-black text-red-600">
                    !
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-bold tracking-tight text-slate-700 uppercase">
                      {rule.title}
                    </p>
                    <p className="text-xs leading-relaxed text-slate-500">{rule.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </SectionReveal>

        {/* CTA */}
        <SectionReveal>
          <div className="rounded-2xl bg-[#4c9ded] px-8 py-14 text-center shadow-xl sm:rounded-3xl">
            <h2 className="mb-4 text-2xl font-black tracking-tight text-white uppercase">
              Begin the Process
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-blue-100">
              Request your registration invoice to unlock official pricing and gain portal access.
            </p>
            <Link
              href="/register"
              className="inline-block rounded-xl bg-white px-10 py-4 text-xs font-black tracking-widest text-[#002a5c] uppercase transition-all hover:bg-slate-900 hover:text-white active:scale-[0.98]"
            >
              Start Registration
            </Link>
          </div>
        </SectionReveal>
      </div>
    </div>
  )
}
