import { Metadata } from 'next'
import Link from 'next/link'
import Hero from '../../../../_components/Hero'
import SectionReveal from '../../../../_components/SectionReveal'
import { CheckCircle2, Clock, AlertCircle, Shield } from 'lucide-react'
import ModuleGrid from '@/app/(public)/_components/ModuleGrid'

export const metadata: Metadata = {
  title: 'Military / Industry Certification (1 Year) | Aerojet Academy',
  description:
    'Fast-track EASA Part-66 certification for military personnel and experienced technicians.',
}

const militaryModules = [
  { code: 'M1', name: 'Mathematics' },
  { code: 'M2', name: 'Physics' },
  { code: 'M3', name: 'Electrical Fundamentals' },
  { code: 'M4', name: 'Electronic Fundamentals' },
  { code: 'M5', name: 'Digital Techniques / Avionics' },
  { code: 'M6', name: 'Materials & Hardware' },
  { code: 'M7A', name: 'Maintenance Practices' },
  { code: 'M8', name: 'Basic Aerodynamics' },
  { code: 'M9A', name: 'Human Factors' },
  { code: 'M10', name: 'Aviation Legislation' },
  { code: 'M11A', name: 'Turbine Aeroplane Aerodynamics, Structures & Systems' },
  { code: 'M15', name: 'Gas Turbine Engine' },
  { code: 'M17A', name: 'Propeller' },
]

export default function MilitaryCertPage() {
  return (
    <div className="bg-white">
      <Hero
        title="Military & Industry Certification"
        subtitle="1-Year fast-track for experienced personnel — theory & exams only."
        backgroundImage="/images/hero/military-certification.webp"
      />
      <div className="mx-auto max-w-7xl space-y-20 px-6 py-20">
        <SectionReveal>
          <section className="grid items-start gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-6 flex flex-wrap gap-3">
                <span className="rounded-full bg-aerojet-sky px-4 py-2 text-xs font-black tracking-widest text-white uppercase">
                  Fast-Track
                </span>
                <span className="rounded-full bg-orange-100 px-4 py-2 text-xs font-black tracking-widest text-orange-700 uppercase">
                  Theory Only
                </span>
              </div>
              <h2 className="mb-6 text-3xl font-black tracking-tight text-aerojet-blue uppercase">
                Certify Your Experience
              </h2>
              <p className="mb-4 text-lg leading-relaxed text-slate-700">
                Designed specifically for military personnel or technicians with{' '}
                <strong>5+ years of verifiable aircraft maintenance experience</strong> who lack
                EASA certification.
              </p>
              <p className="leading-relaxed text-slate-600">
                This fast-track course is a strictly theoretical intensive program aimed at
                preparing students to pass all their EASA exams. It allows experienced technicians
                to certify their skills without repeating practical training they have already
                mastered in the field.
              </p>
            </div>

            <div className="rounded-2xl bg-aerojet-blue p-6 text-white sm:rounded-3xl sm:p-8">
              <Shield className="mb-4 h-10 w-10 text-aerojet-sky" />
              <h3 className="mb-4 text-lg font-bold">Program Details</h3>
              <ul className="space-y-4">
                {[
                  { label: 'Duration', value: '12 Months' },
                  { label: 'Schedule', value: '16:00 – 19:00 Mon–Fri' },
                  { label: 'Type', value: 'Theory & Exams Only' },
                  { label: 'Pricing', value: 'Subsidized for military' },
                ].map((item) => (
                  <li
                    key={item.label}
                    className="grid grid-cols-[120px_1fr] gap-4 border-b border-white/10 pb-3 last:border-0"
                  >
                    <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">{item.label}</span>
                    <span className="text-sm font-medium text-white">{item.value}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 block w-full rounded-xl bg-aerojet-sky py-4 text-center text-xs font-bold tracking-widest text-white uppercase transition-all hover:bg-white hover:text-aerojet-blue"
              >
                Apply for Fast-Track
              </Link>
            </div>
          </section>
        </SectionReveal>

        <SectionReveal>
          <section className="rounded-2xl border border-slate-100 bg-slate-50 p-6 sm:rounded-3xl sm:p-10">
            <h3 className="mb-6 text-xl font-bold text-aerojet-blue">What's Included</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                'All B1.1 theory modules & EASA examinations',
                'Guidance on EASA Part 66 License application process',
                'Eligibility for work experience at Aerojet Part 145 Facility',
                'All technical training notes & study materials',
                'Tuition and examination fees included',
                'Special subsidized pricing for military personnel',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-aerojet-sky" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>
        </SectionReveal>

        <SectionReveal>
          <section>
            <h3 className="mb-6 text-2xl font-black tracking-tight text-aerojet-blue uppercase">
              Required EASA Modules
            </h3>
            <p className="mb-8 text-slate-600">
              This fast-track program focuses on these core EASA B1.1 modules, preparing you for
              the rigorous theoretical examinations.
            </p>
            <ModuleGrid modules={militaryModules} />
          </section>
        </SectionReveal>

        <SectionReveal>
          <div className="flex items-start gap-4 rounded-xl border border-orange-200 bg-orange-50 p-5">
            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-orange-600" />
            <div>
              <strong className="mb-1 block text-orange-900">Important Note</strong>
              <p className="text-sm leading-relaxed text-orange-800">
                This program is <strong>strictly theoretical</strong> — it does not include
                hand-skills training or practical maintenance experience. Candidates must have
                existing verifiable experience to qualify.
              </p>
            </div>
          </div>
        </SectionReveal>

        <SectionReveal>
          <div className="rounded-2xl bg-linear-to-r from-aerojet-blue to-aerojet-sky p-8 text-center text-white sm:rounded-3xl sm:p-12">
            <h2 className="mb-4 text-2xl font-black tracking-tight uppercase">
              Questions About Eligibility?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-blue-100/80">
              Contact our admissions team to verify your experience qualifies for the fast-track
              program.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-block rounded-xl bg-white px-8 py-4 text-xs font-black tracking-widest text-aerojet-blue uppercase transition-all hover:bg-blue-50"
              >
                Register Now
              </Link>
              <Link
                href="/contact"
                className="inline-block rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-xs font-black tracking-widest text-white uppercase transition-all hover:bg-white/20"
              >
                Contact Admissions
              </Link>
            </div>
          </div>
        </SectionReveal>
      </div>
    </div>
  )
}
