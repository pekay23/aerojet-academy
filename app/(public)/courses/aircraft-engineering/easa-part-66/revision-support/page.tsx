import { Metadata } from 'next'
import Link from 'next/link'
import Hero from '../../../../_components/Hero'
import SectionReveal from '../../../../_components/SectionReveal'

export const metadata: Metadata = {
  title: 'Revision Support ',
  description:
    'Intensive 8-week revision series with mock exams — designed for groups and organisations.',
}

export default function RevisionSupportPage() {
  return (
    <div className="bg-white">
      <Hero
        title="Revision Support"
        subtitle="Intensive 8-week tuition blocks with mock examinations."
        backgroundImage="/images/hero/lecture.webp"
      />

      <div className="mx-auto max-w-7xl space-y-24 px-6 py-20">
        <SectionReveal>
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="text-aerojet-sky mb-4 block text-sm font-bold tracking-[0.2em] uppercase">
                Group Learning
              </span>
              <h2 className="text-aerojet-blue mb-8 text-3xl font-black tracking-tight uppercase md:text-4xl">
                8-Week Revision Series
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-slate-700">
                Our Revision Support clinics provide focused preparation before EASA examinations.
                Each series is an 8-session intensive covering core syllabus topics with mock exams
                at Weeks 4 and 8.
              </p>
              <div className="space-y-4 text-base text-slate-700 sm:text-lg">
                {[
                  { label: 'Schedule', value: '2:00 PM – 5:00 PM, Monday–Friday' },
                  { label: 'Price', value: 'Available in the portal' },
                  { label: 'Modules', value: 'M2, M3, M4, M5, M8 (others on demand)' },
                  { label: 'Mock Exams', value: 'Week 4 (mid-point) and Week 8 (final)' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="grid grid-cols-[110px_1fr] items-baseline gap-x-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0 sm:grid-cols-[130px_1fr]"
                  >
                    <span className="text-aerojet-blue font-bold">{item.label}</span>
                    <span className="text-slate-600">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10 rounded-r-xl border-l-4 border-orange-400 bg-orange-50 p-6">
                <p className="mb-2 text-sm font-bold tracking-widest text-orange-800 uppercase">
                  Individual Student?
                </p>
                <p className="text-base leading-relaxed text-orange-700">
                  Please view our{' '}
                  <Link
                    href="/courses/aircraft-engineering/easa-part-66/modular-training"
                    className="font-bold underline"
                  >
                    Modular Training Programme
                  </Link>{' '}
                  which allows individuals to book tuition per module.
                </p>
              </div>
            </div>

            <div className="border-aerojet-sky rounded-3xl border-t-4 bg-slate-900 p-8 text-white shadow-xl sm:p-10">
              <h3 className="text-aerojet-sky mb-8 text-xl font-black tracking-tight uppercase">
                The 8-Week Structure
              </h3>
              <div className="space-y-6">
                {[
                  {
                    num: '01',
                    title: 'Tuition Clinics',
                    desc: 'Weekly sessions on core syllabus topics.',
                  },
                  {
                    num: '02',
                    title: 'Mid-Point Mock',
                    desc: 'Full mock exam at Week 4 to assess progress.',
                  },
                  { num: '03', title: 'Final Mock', desc: 'Exam-condition simulation at Week 8.' },
                ].map((step) => (
                  <div key={step.num} className="flex items-start gap-5">
                    <span className="mt-1 text-4xl font-black text-white/10">{step.num}</span>
                    <div>
                      <h4 className="mb-1 text-base font-bold text-white">{step.title}</h4>
                      <p className="text-sm leading-relaxed text-slate-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionReveal>

        <SectionReveal>
          <div className="text-center">
            <h2 className="text-aerojet-blue mb-6 text-3xl font-black tracking-tight uppercase md:text-4xl">
              Corporate & Group Enquiry
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-slate-600">
              Representing an organisation? Contact us to discuss scheduling a dedicated revision
              block for your team.
            </p>
            <Link
              href="/contact"
              className="bg-aerojet-blue hover:bg-aerojet-sky inline-block rounded-xl px-12 py-5 text-sm font-black tracking-widest text-white uppercase transition-colors"
            >
              Contact Admissions
            </Link>
          </div>
        </SectionReveal>
      </div>
    </div>
  )
}
