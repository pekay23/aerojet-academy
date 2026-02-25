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

      <div className="mx-auto max-w-5xl space-y-16 px-6 py-20">
        <SectionReveal>
          <section>
            <h2 className="mb-8 text-2xl font-black uppercase tracking-tight text-[#002a5c]">
              Full-Time & Modular Courses
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
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
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                >
                  <h3 className="mb-2 font-bold text-slate-800">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </SectionReveal>

        <SectionReveal>
          <section className="rounded-2xl bg-[#002a5c] p-8 text-white shadow-xl sm:rounded-3xl sm:p-12">
            <h2 className="mb-8 text-2xl font-black uppercase tracking-tight">
              Modular & Exam-Only Candidates
            </h2>
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#4c9ded]">
                  Professional Standing
                </h4>
                <p className="text-sm leading-relaxed text-blue-100">
                  Self-study and modular candidates are expected to have a foundational
                  understanding of aviation maintenance or be working under an existing MRO
                  framework.
                </p>
              </div>
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#4c9ded]">
                  Identification
                </h4>
                <p className="text-sm leading-relaxed text-blue-100">
                  A valid Passport or National ID is mandatory for all examination bookings to
                  comply with EASA invigilation standards.
                </p>
              </div>
            </div>
          </section>
        </SectionReveal>

        <SectionReveal>
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm sm:rounded-3xl sm:p-12">
            <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-[#002a5c]">
              Unsure of your eligibility?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-slate-500">
              Our admissions team can provide a preliminary review of your transcripts or
              professional experience.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="rounded-xl bg-[#4c9ded] px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-[#002a5c]"
              >
                Contact Admissions
              </Link>
              <Link
                href="/admissions/fees-and-payment"
                className="rounded-xl bg-slate-100 px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-200"
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
