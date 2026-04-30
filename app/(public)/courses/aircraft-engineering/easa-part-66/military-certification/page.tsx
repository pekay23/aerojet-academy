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
              <div className="mb-8 flex flex-wrap gap-4">
                <span className="rounded-full bg-aerojet-sky px-5 py-2.5 text-sm font-black tracking-widest text-white uppercase">
                  Fast-Track
                </span>
                <span className="rounded-full bg-orange-100 px-5 py-2.5 text-sm font-black tracking-widest text-orange-700 uppercase">
                  Theory Only
                </span>
              </div>
              <h2 className="mb-8 text-3xl font-black tracking-tight text-aerojet-blue uppercase md:text-4xl">
                Certify Your Experience
              </h2>
              <p className="mb-6 text-xl leading-relaxed text-slate-700">
                Designed specifically for military personnel or technicians with{' '}
                <strong>5+ years of verifiable aircraft maintenance experience</strong> who lack
                EASA certification.
              </p>
              <p className="leading-relaxed text-lg text-slate-600">
                This fast-track course is a strictly theoretical intensive program aimed at
                preparing students to pass all their EASA exams. It allows experienced technicians
                to certify their skills without repeating practical training they have already
                mastered in the field.
              </p>
            </div>

            <div className="rounded-3xl bg-aerojet-blue p-8 text-white sm:p-10">
              <Shield className="mb-5 h-10 w-10 text-aerojet-sky" />
              <h3 className="mb-6 text-xl font-bold">Program Details</h3>
              <ul className="space-y-5">
                {[
                  { label: 'Duration', value: '12 Months' },
                  { label: 'Schedule', value: '16:00 – 19:00 Mon–Fri' },
                  { label: 'Type', value: 'Theory & Exams Only' },
                  { label: 'Pricing', value: 'Subsidized for military' },
                ].map((item) => (
                  <li
                    key={item.label}
                    className="grid grid-cols-[130px_1fr] gap-5 border-b border-white/10 pb-4 last:border-0"
                  >
                    <span className="text-sm font-bold text-blue-200 uppercase tracking-wider">{item.label}</span>
                    <span className="text-base font-medium text-white">{item.value}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-10 block w-full rounded-xl bg-aerojet-sky py-5 text-center text-sm font-bold tracking-widest text-white uppercase transition-all hover:bg-white hover:text-aerojet-blue"
              >
                Apply for Fast-Track
              </Link>
            </div>
          </section>
        </SectionReveal>

        <SectionReveal>
          <section className="rounded-3xl border border-slate-100 bg-slate-50 p-8 sm:p-12">
            <h3 className="mb-8 text-2xl font-bold text-aerojet-blue">What's Included</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                'All B1.1 theory modules & EASA examinations',
                'Guidance on EASA Part 66 License application process',
                'Eligibility for work experience at Aerojet Part 145 Facility',
                'All technical training notes & study materials',
                'Tuition and examination fees included',
                'Special subsidized pricing for military personnel',
              ].map((item) => (
                <div key={item} className="flex items-start gap-4 text-base text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-aerojet-sky" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>
        </SectionReveal>

        <SectionReveal>
          <section className="space-y-12">
            <div>
              <h3 className="mb-6 text-3xl font-black tracking-tight text-aerojet-blue uppercase">
                Required EASA Modules
              </h3>
              <p className="text-lg text-slate-600">
                This fast-track program focuses on these core EASA B1.1 modules, preparing you for
                the rigorous theoretical examinations.
              </p>
            </div>
            <ModuleGrid modules={militaryModules} />
          </section>
        </SectionReveal>

        <SectionReveal>
          <div className="flex items-start gap-5 rounded-2xl border border-orange-200 bg-orange-50 p-6 sm:p-8">
            <AlertCircle className="mt-0.5 h-8 w-8 shrink-0 text-orange-600" />
            <div>
              <strong className="mb-2 block text-lg text-orange-900">Important Note</strong>
              <p className="text-base leading-relaxed text-orange-800">
                This program is <strong>strictly theoretical</strong> — it does not include
                hand-skills training or practical maintenance experience. Candidates must have
                existing verifiable experience to qualify.
              </p>
            </div>
          </div>
        </SectionReveal>

        <SectionReveal>
          <div className="rounded-3xl bg-linear-to-r from-aerojet-blue to-aerojet-sky p-10 text-center text-white sm:p-16">
            <h2 className="mb-5 text-3xl font-black tracking-tight uppercase md:text-4xl">
              Questions About Eligibility?
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-blue-100/80 leading-relaxed">
              Contact our admissions team to verify your experience qualifies for the fast-track
              program.
            </p>
            <div className="flex flex-col justify-center gap-5 sm:flex-row">
              <Link
                href="/register"
                className="inline-block rounded-xl bg-white px-10 py-5 text-sm font-black tracking-widest text-aerojet-blue uppercase transition-all hover:bg-blue-50"
              >
                Register Now
              </Link>
              <Link
                href="/contact"
                className="inline-block rounded-xl border border-white/20 bg-white/10 px-10 py-5 text-sm font-black tracking-widest text-white uppercase transition-all hover:bg-white/20"
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
