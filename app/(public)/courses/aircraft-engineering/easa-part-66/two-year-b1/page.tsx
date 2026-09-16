import { Metadata } from 'next'
import Link from 'next/link'
import Hero from '../../../../_components/Hero'
import SectionReveal from '../../../../_components/SectionReveal'
import { BookOpen, Zap } from 'lucide-react'
import ModuleGrid from '@/app/(public)/_components/ModuleGrid'

export const metadata: Metadata = {
  title: '2-Year Full-Time Program (B1.1) ',
  description: 'Accelerated 2-year EASA Part-66 B1.1 Mechanical training program.',
}

const twoYearModules = [
  { code: 'M1', name: 'Mathematics' },
  { code: 'M2', name: 'Physics' },
  { code: 'M3', name: 'Basic Electricals' },
  { code: 'M4', name: 'Basic Electronics' },
  { code: 'M5', name: 'Digital Techniques' },
  { code: 'M6', name: 'Materials & Hardware' },
  { code: 'M7', name: 'Maintenance Practices' },
  { code: 'M8', name: 'Basic Aerodynamics' },
  { code: 'M9', name: 'Human Factors' },
  { code: 'M10', name: 'Aviation Legislation' },
  { code: 'M11', name: 'Turbine Aeroplane Aerodynamics & Systems' },
  { code: 'M15', name: 'Turbine Engines' },
  { code: 'M17', name: 'Propellers' },
]

export default function TwoYearPage() {
  return (
    <div className="bg-white">
      <Hero
        title="2-Year Full-Time Program"
        subtitle="B1.1 Mechanical License — An accelerated pathway for focused candidates."
        backgroundImage="/images/hero/fulltime-2year-b1.webp"
      />

      <div className="mx-auto max-w-7xl space-y-24 px-6 py-20">
        <SectionReveal skipInitial>
          <section>
            <div className="mb-8 flex flex-wrap gap-4">
              <span className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-black tracking-widest text-white uppercase">
                Accelerated
              </span>
              <span className="text-aerojet-blue rounded-full bg-blue-100 px-5 py-2.5 text-sm font-black tracking-widest uppercase">
                B1.1 License
              </span>
            </div>
            <h2 className="text-aerojet-blue mb-8 text-3xl font-black tracking-tight md:text-4xl">
              Focused. Intensive. Career-Ready.
            </h2>
            <p className="mb-6 text-xl leading-relaxed text-slate-700">
              The 2-Year Full-Time Program is designed for students who want to focus specifically
              on the EASA B1.1 (Aeroplanes Turbine — Mechanical) certification. This condensed
              program covers all required theoretical modules and includes structured practical
              training.
            </p>
            <p className="text-lg leading-relaxed text-slate-600">
              Ideal for candidates who already have some technical background or who want a faster
              route into the industry without the dual B1.1/B2 scope of the 4-year program.
            </p>
          </section>
        </SectionReveal>

        <SectionReveal>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-8 sm:p-10">
              <Zap className="text-aerojet-sky mb-5 h-10 w-10" />
              <h3 className="mb-3 text-xl font-bold text-slate-900">Why 2 Years?</h3>
              <p className="text-base leading-relaxed text-slate-600">
                By focusing exclusively on B1.1 modules and streamlining the curriculum, this
                program delivers EASA certification in half the time of the combined B1.1/B2
                program.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-8 sm:p-10">
              <BookOpen className="text-aerojet-sky mb-5 h-10 w-10" />
              <h3 className="mb-3 text-xl font-bold text-slate-900">What's Covered</h3>
              <p className="text-base leading-relaxed text-slate-600">
                Core modules M1–M10 plus specialist modules M11, M15, and M17 — everything required
                for the B1.1 (Aeroplanes Turbine – Mechanical) category.
              </p>
            </div>
          </div>
        </SectionReveal>

        <SectionReveal>
          <section className="bg-aerojet-blue rounded-3xl p-8 text-white sm:p-12">
            <h3 className="text-aerojet-sky mb-8 text-2xl font-black tracking-tight uppercase">
              Program Details
            </h3>
            <div className="grid gap-8 sm:grid-cols-2">
              {[
                { label: 'Duration', value: '2 years' },
                { label: 'Schedule', value: '08:00 – 15:00, Mon–Fri' },
                { label: 'Category', value: 'B1.1 — Aeroplane Turbine Mechanical' },
                { label: 'Pass Mark', value: '75% per module' },
                { label: 'Attendance', value: '90%+ required' },
                { label: 'Certification', value: 'EASA Part-66 B1.1' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-[130px_1fr] gap-5 border-b border-white/10 pb-4 last:border-0"
                >
                  <span className="text-sm font-bold tracking-wider text-blue-200 uppercase">
                    {item.label}
                  </span>
                  <span className="text-base font-medium text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </section>
        </SectionReveal>

        <SectionReveal>
          <section>
            <h3 className="text-aerojet-blue mb-8 flex flex-wrap items-baseline gap-3 text-3xl font-bold tracking-tight">
              Required Modules
              <span className="text-lg font-medium text-slate-400">(B1.1 license category)</span>
            </h3>
            <ModuleGrid modules={twoYearModules} />
            <p className="mt-6 text-base text-slate-500">
              <Link
                href="/courses/module-requirements"
                className="text-aerojet-sky font-bold hover:underline"
              >
                View full module details →
              </Link>
            </p>
          </section>
        </SectionReveal>

        {/* CTA */}
        <SectionReveal>
          <div className="from-aerojet-blue to-aerojet-sky rounded-3xl bg-linear-to-r p-10 text-center text-white sm:p-16">
            <h2 className="mb-5 text-3xl font-black tracking-tight uppercase md:text-4xl">
              Interested in the 2-Year Program?
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-blue-100/80">
              Register on our portal to begin the application process.
            </p>
            <div className="flex flex-col justify-center gap-5 sm:flex-row">
              <Link
                href="/register"
                className="text-aerojet-blue inline-block rounded-xl bg-white px-10 py-5 text-sm font-black tracking-widest uppercase transition-all hover:bg-blue-50"
              >
                Register Now
              </Link>
              <Link
                href="/courses/aircraft-engineering/easa-part-66/four-year-b1-b2"
                className="inline-block rounded-xl border border-white/20 bg-white/10 px-10 py-5 text-sm font-black tracking-widest text-white uppercase transition-all hover:bg-white/20"
              >
                Compare with 4-Year
              </Link>
            </div>
          </div>
        </SectionReveal>
      </div>
    </div>
  )
}
