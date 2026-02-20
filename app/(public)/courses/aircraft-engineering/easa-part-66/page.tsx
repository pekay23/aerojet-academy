import { Metadata } from 'next'
import Link from 'next/link'
import { Check, ShieldCheck, TrendingUp, BookOpen, Clock, Users, GraduationCap } from 'lucide-react'
import Hero from '@/app/(public)/_components/Hero'
import SectionReveal from '@/app/(public)/_components/SectionReveal'
import ProgramCard from '@/app/(public)/_components/ProgramCard'

export const metadata: Metadata = {
  title: 'EASA Part-66 Certification Programmes',
  description:
    'Internationally recognized EASA certification for aircraft maintenance engineers. Explore our structured pathways to becoming a licensed professional.',
}

const benefits = [
  {
    icon: ShieldCheck,
    title: 'Global Recognition',
    description:
      'An EASA Part-66 AML is the gold standard, recognized by aviation authorities and employers worldwide.',
  },
  {
    icon: TrendingUp,
    title: 'High Career Demand',
    description:
      'The aviation industry has a constant and growing need for qualified, licensed aircraft engineers.',
  },
  {
    icon: Check,
    title: 'Certified to Release Aircraft',
    description:
      'Gain the authority and responsibility to certify that an aircraft is safe and ready for service.',
  },
]

export default function EasaPart66Page() {
  return (
    <div className="bg-white">
      <Hero
        title="EASA Part-66 Certification"
        subtitle="The globally recognized standard for aircraft maintenance professionals. Your license to a worldwide career."
        backgroundImage="/images/hero/easa-part-66.png" 
      />
      <div className="container mx-auto px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl space-y-20">
          {/* What is EASA Part-66 Section */}
          <SectionReveal>
            <section className="text-center">
              <span className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-public-secondary">
                The Global Standard
              </span>
              <h2 className="mb-6 text-3xl font-black uppercase tracking-tight text-public-primary sm:text-4xl">
                What is an EASA Part-66 Licence?
              </h2>
              <div className="mx-auto mt-8 max-w-3xl">
                <p className="text-lg leading-relaxed text-slate-600 mb-4">
                  An <strong className="text-[#002a5c]">Aircraft Maintenance Licence (AML)</strong> issued in accordance with EASA Part-66 is
                  the primary qualification required for individuals to certify maintenance work on
                  aircraft. It is the international benchmark for quality and safety, demonstrating
                  that a technician has met the high standards of knowledge and experience required
                  by the European Union Aviation Safety Agency.
                </p>
                <p className="text-lg leading-relaxed text-slate-600">
                  Holding this licence is a legal requirement for many roles within the industry and
                  proves that you have the competence to ensure an aircraft is airworthy.
                </p>
              </div>
            </section>
          </SectionReveal>

          {/* Benefits Section */}
          <SectionReveal>
            <div className="grid gap-8 text-center md:grid-cols-3">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="p-6">
                  <div className="mb-5 inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                    <benefit.icon className="h-10 w-10 text-public-secondary" />
                  </div>
                  {/* FIX: Increased text sizes for benefits */}
                  <h3 className="mb-2 text-xl font-bold text-public-primary">{benefit.title}</h3>
                  <p className="text-base text-slate-500">{benefit.description}</p>
                </div>
              ))}
            </div>
          </SectionReveal>

          {/* Our Pathways Section */}
          <SectionReveal>
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8 sm:p-12">
              <div className="mb-12 text-center">
                <h2 className="text-3xl font-black uppercase tracking-tight text-public-primary sm:text-4xl">
                  Our EASA Programmes
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                  We offer multiple structured pathways to help you achieve your EASA license,
                  catering to different experience levels and learning styles.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* FIX: Updated href paths for all cards */}
                <ProgramCard
                  icon="graduationCap"
                  title="4-Year Full-Time (B1.1 & B2)"
                  description="Our flagship structured program with guaranteed OJT and job placement."
                  href="/courses/aircraft-engineering/easa-part-66/four-year-b1-b2"
                  badge="Flagship"
                />
                <ProgramCard
                  icon="clock"
                  title="2-Year Full-Time (B1.1)"
                  description="An accelerated path for dedicated individuals focusing on mechanical certification."
                  href="/courses/aircraft-engineering/easa-part-66/two-year-b1"
                />
                <ProgramCard
                  icon="users"
                  title="Military / Industry Route"
                  description="A 1-year fast-track program for those with existing verifiable experience."
                  href="/courses/aircraft-engineering/easa-part-66/military-certification"
                />
                <ProgramCard
                  icon="bookOpen"
                  title="Modular Training"
                  description="The ultimate flexible pathway. Study and sit exams for individual modules at your own pace."
                  href="/courses/aircraft-engineering/easa-part-66/modular-training"
                />
                <ProgramCard
                  icon="fileCheck"
                  title="Exam Only"
                  description="For confident self-starters who are ready to challenge the EASA exams directly."
                  href="/courses/aircraft-engineering/easa-part-66/exam-only"
                />
                <ProgramCard
                  icon="refreshCw"
                  title="Revision Support"
                  description="Intensive group tuition blocks designed to prepare you for specific module exams."
                  href="/courses/aircraft-engineering/easa-part-66/revision-support"
                />
              </div>
            </section>
          </SectionReveal>

          {/* Final CTA */}
          <SectionReveal>
            <div className="pt-8 text-center">
              <Link
                href="/register"
                className="inline-block rounded-xl bg-public-secondary px-10 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-public-primary"
              >
                Begin Your Application
              </Link>
            </div>
          </SectionReveal>
        </div>
      </div>
    </div>
  )
}