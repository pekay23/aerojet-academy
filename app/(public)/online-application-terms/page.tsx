import { Metadata } from 'next'
import Link from 'next/link'
import prisma from '@/lib/prisma/client'
import { getCurrencySymbol } from '@/lib/currency'

export const metadata: Metadata = { title: 'Application Terms | Aerojet Academy' }

async function getRegistrationFee() {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ['registration_fee', 'registration_currency'] } },
  })
  const fee = settings.find((s) => s.key === 'registration_fee')?.value || '350'
  const currency = settings.find((s) => s.key === 'registration_currency')?.value || 'GHS'
  return { fee, currency, symbol: getCurrencySymbol(currency) }
}

export default async function TermsPage() {
  const { fee, symbol } = await getRegistrationFee()

  return (
    <div className="bg-slate-50 pt-20">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl sm:rounded-3xl sm:p-14">
          <div className="mb-10 border-b border-slate-100 pb-6">
            <span className="mb-4 inline-block rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black tracking-widest text-aerojet-sky uppercase">
              Legal Policy
            </span>
            <h1 className="text-3xl leading-tight font-black tracking-tight text-aerojet-blue uppercase sm:text-4xl dark:text-white">
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
                  'Exam windows are confirmed 21 days prior (Go/No-Go at T-21).',
                  'If cancelled, all bookings roll to next available window at no extra cost.',
                  'Late bookings (within T-14) incur a surcharge.',
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
                <h3 className="mb-3 text-lg font-black tracking-tight text-aerojet-blue uppercase">
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
                <p className="text-sm font-black text-aerojet-blue uppercase">Have Questions?</p>
                <p className="text-xs text-slate-500">Send us an enquiry.</p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/contact"
                  className="text-xs font-bold tracking-widest text-aerojet-sky uppercase hover:underline"
                >
                  Contact Us
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-aerojet-sky px-6 py-3 text-[10px] font-black tracking-widest text-white uppercase transition-all hover:bg-aerojet-blue"
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
