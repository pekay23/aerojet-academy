import { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import PageHero from '@/app/(public)/_components/Hero'
import SectionReveal from '@/app/(public)/_components/SectionReveal'
import TMinusTooltip from '@/components/shared/TMinusTooltip'
import { getExamsConfig } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Exam Schedule 2026-2027',
  description:
    'Official examination windows for EASA Part-66 modular candidates at Aerojet Academy.',
}

const schedule2026 = [
  { window: 'Jun 2026', dates: '23–24 Jun 2026', deadline: '15 Mar 2026' },
  { window: 'Sep 2026', dates: '14–15 Sep 2026', deadline: '06 Jun 2026' },
  { window: 'Dec 2026', dates: '21–22 Dec 2026', deadline: '12 Sep 2026' },
]

const schedule2027 = [
  { window: 'Mar 2027', dates: '18–20 Mar 2027', deadline: '08 Dec 2026' },
  { window: 'Jun 2027', dates: '28–30 Jun 2027', deadline: '20 Mar 2027' },
  { window: 'Sep/Oct 2027', dates: '29 Sep–01 Oct 2027', deadline: '21 Jun 2027' },
  { window: 'Dec 2027', dates: '15–17 Dec 2027', deadline: '06 Sep 2027' },
]

export default async function ExamSchedulePage() {
  const { isOpen } = await getExamsConfig()

  return (
    <div className="bg-white">
      <PageHero
        title="Exam Schedule 2026–2027"
        subtitle="Official examination windows for EASA Part-66 modular candidates."
        backgroundImage="/images/hero/examsschedule.webp"
      />
      <div className="container mx-auto px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl space-y-12 px-6">
          <SectionReveal>
            <div className="bg-public-primary border-public-secondary mx-auto max-w-4xl rounded-3xl border-l-8 p-8 text-white shadow-lg">
              <div className="mb-4 flex items-center gap-4">
                <AlertTriangle className="text-public-secondary h-8 w-8" />
                <h2 className="text-xl font-black tracking-tight text-white uppercase">
                  Important Booking Policy
                </h2>
              </div>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
                <li className="flex flex-wrap items-center gap-1.5 text-base text-slate-300">
                  Exam seats must be <strong>paid in full</strong> by the Payment Deadline{' '}
                  <TMinusTooltip days={21} />.
                </li>
                <li>
                  Pools are confirmed automatically once 25 paid candidates are reached. Up to 3
                  additional seats may be added to a confirmed pool.
                </li>
                <li>Unconfirmed windows roll forward to the next date.</li>
              </ul>
            </div>
          </SectionReveal>

          {isOpen ? (
            <>
              {/* 2026 Table */}
              <SectionReveal>
                <section>
                  <h3 className="text-public-primary mb-6 text-2xl font-black tracking-tight uppercase">
                    2026 Schedule
                  </h3>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="p-4">Window</th>
                          <th className="p-4">Exam Dates</th>
                          <th className="p-4 text-red-600">Payment Deadline</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {schedule2026.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-4 font-bold text-slate-800">{row.window}</td>
                            <td className="p-4">{row.dates}</td>
                            <td className="p-4 font-bold text-red-600">{row.deadline}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </SectionReveal>

              {/* 2027 Table */}
              <SectionReveal>
                <section>
                  <h3 className="text-public-primary mb-6 text-2xl font-black tracking-tight uppercase">
                    2027 Schedule
                  </h3>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="p-4">Window</th>
                          <th className="p-4">Exam Dates</th>
                          <th className="p-4 text-red-600">Payment Deadline</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {schedule2027.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-4 font-bold text-slate-800">{row.window}</td>
                            <td className="p-4">{row.dates}</td>
                            <td className="p-4 font-bold text-red-600">{row.deadline}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </SectionReveal>

              <div className="mx-auto mt-16 flex max-w-7xl justify-center">
                <Link
                  href="/login"
                  className="bg-public-secondary hover:bg-public-primary inline-block rounded-xl px-10 py-4 text-sm font-black tracking-widest text-white uppercase shadow-lg transition-all"
                >
                  Book Exam Seats in Portal
                </Link>
              </div>
            </>
          ) : (
            <SectionReveal>
              <div className="mx-auto max-w-2xl rounded-3xl bg-slate-800 p-12 text-center text-white shadow-lg">
                <div className="mb-6 flex justify-center">
                  <AlertTriangle className="h-16 w-16 text-amber-400" />
                </div>
                <h2 className="mb-4 text-3xl font-black tracking-tight uppercase">
                  Exams Suspended
                </h2>
                <p className="mx-auto max-w-lg text-lg leading-relaxed text-slate-300">
                  No examination windows are currently scheduled. We will announce when exam
                  sessions resume.
                </p>
              </div>
            </SectionReveal>
          )}
        </div>
      </div>
    </div>
  )
}
