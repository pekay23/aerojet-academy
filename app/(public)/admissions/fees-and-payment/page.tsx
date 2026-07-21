import { Metadata } from 'next'
import Link from 'next/link'
import Hero from '../../_components/Hero'
import SectionReveal from '../../_components/SectionReveal'
import { getRegistrationFeeInfo } from '@/lib/system-settings'
import { getCurrencySymbol } from '@/lib/currency'
import TMinusTooltip from '@/components/shared/TMinusTooltip'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Fees & Payment ' }

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
    balance: (
      <span className="inline-flex items-center gap-1">
        Settled by <TMinusTooltip days={14} /> days
      </span>
    ),
  },
  { id: 'F', name: 'Revision Support', deposit: '100% per Block', balance: 'Paid upfront' },
]

export default async function FeesPage() {
  const { fee, currency } = await getRegistrationFeeInfo()
  const symbol = getCurrencySymbol(currency)

  return (
    <div className="relative bg-slate-50">
      <Hero
        title="Fees & Payment Rules"
        subtitle="Structured payment milestones for Aerojet Academy training programmes."
        backgroundImage="/images/hero/feespayment.webp"
      />{' '}
      <div className="mx-auto max-w-7xl space-y-24 px-6 py-20">
        {/* Registration Fee */}
        <SectionReveal>
          <section className="flex flex-col items-center gap-8 rounded-3xl border border-slate-100 bg-white p-8 shadow-xl sm:p-12 md:flex-row">
            <div className="flex-1">
              <div className="text-aerojet-sky mb-4 inline-block rounded-full bg-blue-50 px-4 py-2 text-sm font-black tracking-widest uppercase">
                Step 01
              </div>
              <h2 className="text-aerojet-blue mb-6 text-3xl font-black tracking-tight uppercase sm:text-4xl">
                Mandatory Registration
              </h2>
              <p className="text-lg leading-relaxed text-slate-500">
                To initiate your journey, a one-time registration fee is required. This activates
                your record and unlocks the official application link. This fee covers
                administrative processing and background verification.
              </p>
            </div>
            <div className="w-full shrink-0 rounded-3xl bg-slate-900 p-8 text-center text-white shadow-2xl sm:p-10 md:w-auto">
              <span className="text-aerojet-sky mb-3 block text-sm font-bold tracking-[0.2em] uppercase">
                Pre-Application
              </span>
              <span className="mb-2 block text-5xl font-black">
                {symbol}
                {fee}
              </span>
              <span className="text-sm font-medium text-slate-400 uppercase">Non-Refundable</span>
            </div>
          </section>
        </SectionReveal>

        {/* Payment Milestones */}
        <SectionReveal>
          <section>
            <h3 className="mb-8 text-3xl font-black tracking-tight text-slate-900 uppercase">
              Payment Milestones
            </h3>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-150 text-left">
                  <thead className="border-b border-slate-100 bg-slate-50 text-sm font-black tracking-widest text-slate-400 uppercase">
                    <tr>
                      <th className="p-6">Option</th>
                      <th className="p-6">Programme</th>
                      <th className="p-6">Initial Confirmation</th>
                      <th className="p-6">Balance Schedule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {milestones.map((row) => (
                      <tr key={row.id} className="transition-colors hover:bg-slate-50/50">
                        <td className="text-aerojet-sky p-6 text-base font-black">{row.id}</td>
                        <td className="p-6 text-base font-bold text-slate-800">{row.name}</td>
                        <td className="text-aerojet-blue p-6 text-base font-bold">{row.deposit}</td>
                        <td className="p-6 text-sm font-medium text-slate-500">{row.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-blue-100/50 bg-blue-50/50 p-6 text-center">
              <p className="text-sm font-black tracking-widest text-slate-500 uppercase">
                Detailed tuition and exam pricing is visible in the Student Portal after
                registration.
              </p>
            </div>
          </section>
        </SectionReveal>

        {/* Refund Rules */}
        <SectionReveal>
          <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm sm:p-12">
            <h3 className="text-aerojet-blue mb-8 flex items-center gap-4 text-2xl font-black tracking-tight uppercase">
              <span className="h-8 w-2 rounded-full bg-red-500" /> Refund & Cancellation Rules
            </h3>
            <ul className="space-y-6">
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
                  desc: (
                    <>
                      Confirmed bookings may roll forward to the next window if requested before{' '}
                      <TMinusTooltip days={21} />. No-shows result in total forfeiture.
                    </>
                  ),
                },
              ].map((rule) => (
                <li key={rule.title} className="flex items-start gap-5">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-base font-black text-red-600">
                    !
                  </div>
                  <div>
                    <p className="mb-2 text-base font-bold tracking-tight text-slate-700 uppercase">
                      {rule.title}
                    </p>
                    <p className="text-base leading-relaxed text-slate-500">{rule.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </SectionReveal>

        {/* Realistic Journey */}
        <SectionReveal>
          <section className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm sm:p-16">
            <h2 className="text-aerojet-blue mb-8 text-3xl font-black tracking-tight uppercase">
              A Realistic Outlook on Your Certification Journey
            </h2>
            <p className="mb-10 text-lg leading-relaxed text-slate-600">
              Becoming a fully licensed EASA-certified Aircraft Maintenance Engineer is a rewarding
              but demanding path that requires strong dedication and sustained motivation. We
              believe in transparency to help you plan your career effectively.
            </p>
            <div className="flex flex-col gap-10">
              <div>
                <h3 className="text-aerojet-blue mb-4 text-base font-black tracking-widest uppercase">
                  The Practical Timeline
                </h3>
                <p className="text-base leading-relaxed text-slate-500 sm:text-lg">
                  In practice, many candidates complete this journey in{' '}
                  <span className="font-bold text-slate-700">4 to 6 years</span>. While we provide
                  the structured EASA training baseline, maintenance organizations often require
                  workplace experience beyond the two years of practical training. Depending on your
                  background, pathway, and exam pace, securing logbook sign-offs can extend the
                  process—up to <span className="font-bold text-slate-700">10 years</span> in some
                  cases—influenced by your available time, placement availability, and finances.
                </p>
              </div>
              <div>
                <h3 className="text-aerojet-blue mb-4 text-base font-black tracking-widest uppercase">
                  Total Investment Planning
                </h3>
                <p className="text-base leading-relaxed text-slate-500 sm:text-lg">
                  Candidates should plan realistically for the entire process. When accounting for
                  training, examinations, and the mandatory work experience/logbook requirements,
                  the{' '}
                  <span className="font-bold text-slate-700">
                    total investment typically falls within USD 20,000 to USD 80,000
                  </span>
                  , depending on your chosen route and rate of progress.
                </p>
              </div>
            </div>
          </section>
        </SectionReveal>

        {/* CTA */}
        <SectionReveal>
          <div className="bg-aerojet-sky rounded-3xl px-10 py-20 text-center shadow-xl">
            <h2 className="mb-5 text-3xl font-black tracking-tight text-white uppercase">
              Begin the Process
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-lg text-blue-100">
              Request your registration invoice to unlock official pricing and gain portal access.
            </p>
            <Link
              href="/register"
              className="text-aerojet-blue inline-block rounded-xl bg-white px-12 py-5 text-sm font-black tracking-widest uppercase transition-all hover:bg-slate-900 hover:text-white active:scale-[0.98]"
            >
              Start Registration
            </Link>
          </div>
        </SectionReveal>
      </div>
    </div>
  )
}
