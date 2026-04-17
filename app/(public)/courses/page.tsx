import { Metadata } from 'next'
import Link from 'next/link'
import { Wrench, GraduationCap, ShieldCheck, CheckCircle2 } from 'lucide-react'
import Hero from '../_components/Hero' // Assuming this is your corrected hero
import SectionReveal from '../_components/SectionReveal'
import CourseComparison from '../_components/CourseComparison'
import CourseListings from '../_components/CourseListings' // Import the new component

export const metadata: Metadata = {
  title: 'Training Programs | Aerojet Academy',
  description:
    'EASA Part-66 Certified Aircraft Engineering Training — multiple pathways to your career.',
}

export default function CoursesPage() {
  return (
    <div className="bg-white">
      <Hero
        title="Training Programs"
        subtitle="EASA Part-66 certified pathways to a global career in Aircraft Maintenance Engineering."
        backgroundImage="/images/hero/coursespage.webp" // Ensure this path is correct
      />

      {/* Intro Section (As you liked) */}
      <section className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <span className="text-public-secondary mb-3 block text-xs font-bold tracking-[0.2em] uppercase">
              EASA Certified
            </span>
            <h2 className="text-public-primary mb-6 text-3xl font-black tracking-tight uppercase sm:text-4xl">
              About Our Training
            </h2>
            <p className="mb-6 text-lg leading-relaxed text-slate-600">
              Certified by the European Union Aviation Safety Agency (EASA), our programs prepare
              you for a career in the Civil Aviation Industry, specifically Aircraft Maintenance
              Engineering. Students have the opportunity to work on operational commercial aircraft
              at Aerojet's hangar facility in Ghana or our partner facilities overseas.
            </p>
          </SectionReveal>
          <SectionReveal delay={0.1}>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 sm:p-8">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                <Wrench className="text-public-secondary h-5 w-5" /> What does it involve?
              </h3>
              <p className="mb-4 text-slate-600">
                As an aircraft maintenance engineer, your work involves installing, maintaining,
                replacing, and repairing the airframe, engines, and other components on an aircraft.
                You may specialise in:
              </p>
              <div className="flex flex-wrap gap-3">
                {['Mechanical Engineering', 'Avionics Engineering', 'Structures Engineering'].map(
                  (s) => (
                    <span
                      key={s}
                      className="text-public-primary inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500" /> {s}
                    </span>
                  )
                )}
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* NEW Course Listings Section */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-28">
        {/* --- The Gradient Blobs --- */}
        <div
          className="bg-public-secondary absolute top-0 left-0 h-200 w-200anslate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute right-0 bottom-0 h-200 w-200 translate-x-1/2 translate-y-1/2 rounded-full bg-white opacity-20 blur-3xl"
          aria-hidden="true"
        />

        {/* --- Main Content --- */}
        <div className="relative z-10">
          <CourseListings />
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="bg-slate-50 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="mb-12 text-center">
              <h2 className="text-public-primary mb-4 text-3xl font-black tracking-tight uppercase sm:text-4xl">
                Compare Pathways
              </h2>
              <p className="mx-auto max-w-2xl text-slate-500">
                Not sure which programme is right for you? Compare what's included in each pathway.
              </p>
            </div>
          </SectionReveal>
          <SectionReveal delay={0.1}>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
              <CourseComparison />
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Prerequisites Section */}
      <SectionReveal>
        <section className="bg-public-primary px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="mb-10 text-2xl font-black tracking-tight text-white uppercase sm:text-3xl">
              Prerequisites
            </h2>
            <div className="grid gap-6 text-left sm:grid-cols-3 sm:gap-12">
              {[
                {
                  icon: GraduationCap,
                  title: 'Qualifications',
                  text: "SSCE, A-Levels, HND (Math, English, Science) or Bachelor's Degree.",
                },
                {
                  icon: ShieldCheck,
                  title: 'Clearance',
                  text: 'Medical and security background checks required.',
                },
                {
                  icon: CheckCircle2,
                  title: 'Assessment',
                  text: 'Aptitude test & Interview after registration.',
                },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Icon className="text-public-secondary h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-bold text-white">{title}</h4>
                    <p className="text-sm text-blue-100/80">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* Final CTA Section */}
      <SectionReveal>
        <section className="from-public-primary to-public-secondary bg-linear-to-r px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-2xl font-black tracking-tight text-white uppercase sm:text-3xl">
              Ready to Begin?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-blue-100/80">
              Register today and gain lifetime portal access to book courses, exams, and materials.
            </p>
            <Link
              href="/register"
              className="text-public-primary inline-block rounded-xl bg-white px-10 py-4 text-xs font-black tracking-widest uppercase transition-all hover:bg-slate-100 active:scale-[0.98]"
            >
              Register Now
            </Link>
          </div>
        </section>
      </SectionReveal>
    </div>
  )
}
