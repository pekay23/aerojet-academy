import { Metadata } from 'next'
import Link from 'next/link'
import Hero from '../../_components/Hero'
import SectionReveal from '../../_components/SectionReveal'

export const metadata: Metadata = { title: 'Entry Requirements | Aerojet Academy' }

export default function EntryRequirementsPage() {
  return (
    <div className="bg-slate-50">
      <Hero
        title="Entry Requirements"
        subtitle="Academic and professional criteria for our EASA programmes."
        backgroundImage="/images/hero/entry1.webp"
      />

      <div className="mx-auto max-w-7xl space-y-24 px-6 py-20">
        <SectionReveal>
          <section>
            <h2 className="mb-10 text-3xl font-black uppercase tracking-tight text-aerojet-blue">
              Full-Time & Modular Courses
            </h2>
            <div className="grid gap-8 sm:grid-cols-2">
              {[
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
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10"
                >
                  <h3 className="mb-3 text-xl font-bold text-slate-800">{item.title}</h3>
                  <p className="text-lg leading-relaxed text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </SectionReveal>

        <SectionReveal>
          <section className="rounded-3xl bg-aerojet-blue p-10 text-white shadow-xl sm:p-16">
            <h2 className="mb-10 text-3xl font-black uppercase tracking-tight">
              Modular & Exam-Only Candidates
            </h2>
            <div className="grid gap-10 sm:grid-cols-2">
              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-aerojet-sky">
                  Professional Standing
                </h4>
                <p className="text-base sm:text-lg leading-relaxed text-blue-100">
                  Self-study and modular candidates are expected to have a foundational
                  understanding of aviation maintenance or be working under an existing MRO
                  framework.
                </p>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-aerojet-sky">
                  Identification
                </h4>
                <p className="text-base sm:text-lg leading-relaxed text-blue-100">
                  A valid Passport or National ID is mandatory for all examination bookings to
                  comply with EASA invigilation standards.
                </p>
              </div>
            </div>
          </section>
        </SectionReveal>

        <SectionReveal>
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm sm:p-16">
            <h2 className="mb-5 text-3xl font-black uppercase tracking-tight text-aerojet-blue">
              Unsure of your eligibility?
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-lg text-slate-500">
              Our admissions team can provide a preliminary review of your transcripts or
              professional experience.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row sm:gap-6">
              <Link
                href="/contact"
                className="rounded-xl bg-aerojet-sky px-10 py-5 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-aerojet-blue"
              >
                Contact Admissions
              </Link>
              <Link
                href="/admissions/fees-and-payment"
                className="rounded-xl bg-slate-100 px-10 py-5 text-sm font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-200"
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
