import { Metadata } from 'next'
import Link from 'next/link'
import Hero from '../_components/Hero'
import SectionReveal from '../_components/SectionReveal'
import EnrollmentSteps from '../_components/EnrollmentSteps'
import { ArrowRight, CheckCircle2, BookOpen, GraduationCap, HelpCircle } from 'lucide-react'
import { getRegistrationFeeInfo } from '@/lib/system-settings'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Admissions | Aerojet Academy' }

export default async function AdmissionsPage() {
  const { fee, currency } = await getRegistrationFeeInfo()

  return (
    <div className="relative bg-white">
      <Hero
        title="Admissions"
        subtitle="Your journey to a global aviation career starts with a simple first step."
        backgroundImage="/images/hero/admissions.webp"
      />

      {/* --- START: GRADIENT WRAPPER --- */}
      <div className="relative overflow-hidden">
        {/* Gradient Blobs */}
        <div
          className="absolute top-0 left-0 h-200 w-200 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="bg-public-secondary absolute right-0 bottom-0 h-200 w-200 translate-x-1/2 translate-y-1/2 rounded-full opacity-10 blur-3xl"
          aria-hidden="true"
        />

        {/* Why Choose Us Section */}
        <section className="relative z-10 px-6 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <SectionReveal skipInitial>
              <h2 className="text-public-primary mb-8 text-3xl font-black tracking-tight uppercase md:text-4xl">
                Why Choose Aerojet?
              </h2>
              <p className="text-xl leading-relaxed text-slate-600">
                We don't just teach theory; we build careers. Our admissions process is designed to
                identify and cultivate the most dedicated future engineers. Whether you are a fresh
                graduate or a professional upskilling, we have a pathway for you.
              </p>
              <Link
                href="/courses/aircraft-engineering/easa-part-66"
                className="mt-6 inline-flex items-center gap-1 font-bold text-public-secondary hover:underline"
              >
                Learn more about the EASA Certification standard →
              </Link>
            </SectionReveal>
          </div>
        </section>

        {/* Nav Cards Section */}
        <section className="relative z-10 px-6 pb-20">
          <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3">
            {[
              {
                icon: CheckCircle2,
                title: 'Entry Requirements',
                desc: 'Check your eligibility. WASSCE, High School Diplomas, and mature professional entry.',
                href: '/admissions/entry-requirements',
                color: 'blue',
              },
              {
                icon: BookOpen,
                title: 'Fees & Payment',
                desc: 'Transparent pricing. Registration fees, tuition deposits, and flexible payment plans.',
                href: '/admissions/fees-and-payment',
                color: 'green',
              },
              {
                icon: HelpCircle,
                title: 'FAQs',
                desc: 'Common questions about programs, admissions, training, fees, and careers.',
                href: '/admissions/faq',
                color: 'purple',
              },
            ].map(({ icon: Icon, title, desc, href, color }, i) => (
              <SectionReveal key={title} delay={i * 0.08}>
                <Link
                  href={href}
                  className="group hover:border-public-primary flex h-full flex-col rounded-3xl border border-white/20 bg-white/60 p-8 shadow-sm backdrop-blur-md transition-all hover:shadow-xl sm:p-10"
                >
                  <div
                    className={`h-16 w-16 bg-${color === 'blue' ? 'blue' : color === 'green' ? 'green' : 'purple'}-100 group-hover:bg-public-primary mb-6 flex items-center justify-center rounded-2xl transition-colors`}
                  >
                    <Icon className="text-public-primary h-8 w-8 transition-colors group-hover:text-white" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-slate-900">{title}</h3>
                  <p className="mb-8 grow text-base text-slate-500">{desc}</p>
                  <span className="text-public-secondary flex items-center gap-2 text-sm font-black tracking-widest uppercase">
                    View <ArrowRight className="h-5 w-5" />
                  </span>
                </Link>
              </SectionReveal>
            ))}
          </div>
        </section>
      </div>
      {/* --- END: GRADIENT WRAPPER --- */}

      <EnrollmentSteps fee={fee} currency={currency} />

      {/* CTA */}
      <SectionReveal>
        {/* FIX: Changed background from public-primary to public-dark */}
        <section className="bg-public-dark px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-5 text-3xl font-black tracking-tight text-white uppercase md:text-4xl">
              Ready to Commit?
            </h2>
            <p className="mb-10 text-lg text-blue-100/80">
              Applications are currently open for the 2026/2027 Academic Year. Slots are limited.
            </p>
            <Link
              href="/register"
              className="text-public-primary inline-block rounded-xl bg-white px-12 py-5 text-sm font-black tracking-widest uppercase transition-all hover:bg-slate-200"
            >
              Start Registration Now
            </Link>
          </div>
        </section>
      </SectionReveal>
    </div>
  )
}
