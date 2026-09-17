import { Metadata } from 'next'
import Link from 'next/link'
import Hero from '../../_components/Hero'
import SectionReveal from '../../_components/SectionReveal'
import { GraduationCap, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Entry Requirements',
  description:
    'Academic and professional criteria for Aerojet Academy EASA programmes — age, academic background, language, aptitude, and identification requirements.',
}

const fullTimeRequirements = [
  {
    title: 'Age Requirement',
    desc: 'Applicants must be a minimum of 18 years old at the time of course commencement.',
  },
  {
    title: 'Academic Background',
    desc: 'A High School Diploma, WASSCE, or equivalent is required. Strong credits in Mathematics, Physics, and English are highly recommended.',
  },
  {
    title: 'Language Proficiency',
    desc: 'All training is conducted in English. Applicants must demonstrate proficiency in reading, writing, and speaking English.',
  },
  {
    title: 'Aptitude Assessment',
    desc: 'Shortlisted applicants for full-time cohorts must pass an internal aptitude test to assess technical comprehension.',
  },
]

const modularRequirements = [
  {
    title: 'Professional Standing',
    desc: 'Self-study and modular candidates are expected to have a foundational understanding of aviation maintenance or be working under an existing MRO framework.',
  },
  {
    title: 'Identification',
    desc: 'A valid Passport or National ID is mandatory for all examination bookings to comply with EASA invigilation standards.',
  },
]

export default function EntryRequirementsPage() {
  return (
    <div className="bg-slate-50">
      <Hero
        title="Entry Requirements"
        subtitle="Academic and professional criteria for our EASA programmes."
        backgroundImage="/images/hero/entry1.webp"
      />

      <div className="mx-auto max-w-7xl space-y-24 px-6 py-20">
        {/* Full-Time & Modular Courses */}
        <SectionReveal>
          <section>
            <div className="mb-10 flex items-center gap-4">
              <div className="bg-aerojet-blue/10 flex h-12 w-12 items-center justify-center rounded-xl">
                <GraduationCap className="text-aerojet-blue h-6 w-6" />
              </div>
              <div>
                <h2 className="text-aerojet-blue text-3xl font-black tracking-tight uppercase">
                  Full-Time &amp; Modular Courses
                </h2>
                <p className="mt-1 text-base text-slate-500">
                  Core criteria for candidates entering structured training programmes.
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {fullTimeRequirements.map((item, i) => (
                <div
                  key={item.title}
                  className="group flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl sm:p-10"
                >
                  <span className="text-aerojet-sky font-mono text-xs font-bold">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xl font-bold text-slate-800">{item.title}</h3>
                    <p className="text-base leading-relaxed text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </SectionReveal>

        {/* Modular & Exam-Only Candidates */}
        <SectionReveal>
          <section className="bg-aerojet-blue rounded-3xl p-10 text-white shadow-xl sm:p-16">
            <div className="mb-10 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <Users className="text-aerojet-sky h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight uppercase">
                  Modular &amp; Exam-Only Candidates
                </h2>
                <p className="mt-1 text-base text-blue-100/80">
                  Additional expectations for self-study and examination-only routes.
                </p>
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              {modularRequirements.map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-8"
                >
                  <h4 className="text-aerojet-sky text-sm font-bold tracking-widest uppercase">
                    {item.title}
                  </h4>
                  <p className="text-base leading-relaxed text-blue-100">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </SectionReveal>

        {/* Unsure of your eligibility? */}
        <SectionReveal>
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm sm:p-16">
            <h2 className="text-aerojet-blue mb-5 text-3xl font-black tracking-tight uppercase">
              Unsure of your eligibility?
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-lg text-slate-500">
              Our admissions team can provide a preliminary review of your transcripts or
              professional experience.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row sm:gap-6">
              <Link
                href="/contact"
                className="bg-aerojet-sky hover:bg-aerojet-blue rounded-xl px-10 py-5 text-sm font-black tracking-widest text-white uppercase transition-all"
              >
                Contact Admissions
              </Link>
              <Link
                href="/admissions/fees-and-payment"
                className="rounded-xl bg-slate-100 px-10 py-5 text-sm font-black tracking-widest text-slate-600 uppercase transition-all hover:bg-slate-200"
              >
                View Fees
              </Link>
            </div>
          </div>
        </SectionReveal>
      </div>
    </div>
  )
}
