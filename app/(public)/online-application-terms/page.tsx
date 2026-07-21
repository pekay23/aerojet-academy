import { Metadata } from 'next'
import Link from 'next/link'
import { getRegistrationFeeInfo } from '@/lib/system-settings'
import { getCurrencySymbol } from '@/lib/currency'
import TMinusTooltip from '@/components/shared/TMinusTooltip'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Application Terms ' }

export default async function TermsPage() {
  const { fee, currency } = await getRegistrationFeeInfo()
  const symbol = getCurrencySymbol(currency)

  return (
    <div className="bg-slate-50 pt-20">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl sm:rounded-3xl sm:p-14">
          <div className="mb-10 border-b border-slate-100 pb-6">
            <span className="text-aerojet-sky mb-4 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-black tracking-widest uppercase">
              Legal Policy
            </span>
            <h1 className="text-aerojet-blue text-3xl leading-tight font-black tracking-tight uppercase sm:text-4xl dark:text-white">
              Online Application Terms & Conditions
            </h1>
            <p className="mt-3 text-sm text-slate-400 italic">Last Updated: February 2026</p>
          </div>

          <div className="space-y-8 text-slate-700">
            <p className="text-lg leading-relaxed font-medium text-slate-900">
              By initiating the registration process or submitting an application to Aerojet
              Aviation Training Academy, you acknowledge that you have read, understood, and agree
              to the following terms.
            </p>

            {[
              {
                title: '1. Registration Gating & Fees',
                items: [
                  `A one-time Registration Fee of ${symbol}${fee}.00 is mandatory for all programmes.`,
                  'The Registration Fee is strictly non-refundable.',
                  'Payment is required before the Online Application Form link is released.',
                ],
              },
              {
                title: '2. Enrollment & Seat Confirmation',
                items: [
                  'Approved applicants must pay a 40% Seat Confirmation Deposit.',
                  'Modular/Exam enrollment requires 100% upfront payment.',
                  'Failure to settle invoices by deadline may result in seat forfeiture.',
                ],
              },
              {
                title: '3. Examination Policies',
                items: [
                  <>
                    Exam windows are confirmed 21 days prior (Go/No-Go at{' '}
                    <TMinusTooltip days={21} />
                    ).
                  </>,
                  'If cancelled, all bookings roll to next available window at no extra cost.',
                  <>
                    Late bookings (within <TMinusTooltip days={14} />) incur a surcharge.
                  </>,
                  'No-shows forfeit their fees.',
                ],
              },
              {
                title: '4. The 24-Month Rule (Modular)',
                items: [
                  'All required exams must be completed within a 24-month window from the date of the first passed module.',
                ],
              },
              {
                title: '5. Cohort Minimums',
                items: [
                  'Start dates are indicative and subject to minimum cohort sizes.',
                  'Aerojet reserves the right to adjust schedules or defer intakes.',
                ],
              },
              {
                title: '6. Documentation & Conduct',
                items: [
                  'All uploaded documents must be authentic.',
                  'Forged documents result in immediate disqualification, fee forfeiture, and permanent ban.',
                ],
              },
            ].map((section) => (
              <section key={section.title}>
                <h3 className="text-aerojet-blue mb-3 text-lg font-black tracking-tight uppercase">
                  {section.title}
                </h3>
                <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
                  {section.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}

            <div className="mt-12 flex flex-col items-center justify-between gap-5 border-t border-slate-100 pt-8 sm:flex-row">
              <div>
                <p className="text-aerojet-blue text-sm font-black uppercase">Have Questions?</p>
                <p className="text-xs text-slate-500">Send us an enquiry.</p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/contact"
                  className="text-aerojet-sky text-xs font-bold tracking-widest uppercase hover:underline"
                >
                  Contact Us
                </Link>
                <Link
                  href="/register"
                  className="bg-aerojet-sky hover:bg-aerojet-blue rounded-xl px-6 py-3 text-xs font-black tracking-widest text-white uppercase transition-all"
                >
                  Start Registration
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
