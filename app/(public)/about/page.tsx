import { Metadata } from 'next'
import Link from 'next/link'
import Hero from '../_components/Hero'
import SectionReveal from '../_components/SectionReveal'

export const metadata: Metadata = { title: 'About Us | Aerojet Academy' }

export default function AboutPage() {
  return (
    <div className="bg-white">
      <Hero
        title="About Aerojet Academy"
        subtitle="Building the future of African aviation, one certified technician at a time."
        backgroundImage="/images/hero/students.webp"
      />
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-14 lg:grid-cols-3">
          <div className="space-y-12 lg:col-span-2">
            <SectionReveal>
              <section>
                <div className="mb-5 h-1.5 w-14 rounded-full bg-aerojet-sky" />
                <h2 className="mb-6 text-3xl font-black uppercase tracking-tight text-aerojet-blue">
                  Our Mission
                </h2>
                <p className="mb-4 text-lg leading-relaxed text-slate-600">
                  Our mission is to provide world-class, EASA-standard technical training and create
                  career opportunities for aspiring aviation professionals.
                </p>
                <p className="leading-relaxed text-slate-500">
                  We are committed to developing a highly skilled workforce ready to meet the
                  demands of the growing aviation industry in Ghana and across Africa.
                </p>
              </section>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <section>
                <div className="mb-5 h-1.5 w-14 rounded-full bg-aerojet-sky" />
                <h2 className="mb-6 text-3xl font-black uppercase tracking-tight text-aerojet-blue">
                  The Accra MRO Project
                </h2>
                <p className="mb-4 leading-relaxed text-slate-600">
                  Aerojet Aviation Training Academy was developed as a foundational component of
                  Aerojet's flagship Accra MRO Project.
                </p>
                <Link
                  href="/about/accra-mro-project"
                  className="inline-flex items-center font-bold text-aerojet-sky hover:underline"
                >
                  Read more about the MRO Project →
                </Link>
              </section>
            </SectionReveal>
          </div>
          <SectionReveal delay={0.15}>
            <aside>
              <div className="sticky top-28 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:rounded-3xl sm:p-8">
                <h3 className="mb-6 border-b border-slate-200 pb-4 text-base font-black uppercase tracking-widest text-aerojet-blue">
                  Academy Highlights
                </h3>
                <ul className="space-y-6">
                  {[
                    'Training aligned to strict EASA Part-66 standards.',
                    'Inaugural cohort of students already in training.',
                    'Strategically located at the Accra Technical Training Centre (ATTC).',
                  ].map((text) => (
                    <li key={text} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-aerojet-sky text-xs font-bold text-white">
                        ✓
                      </span>
                      <p className="text-base text-slate-700">{text}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 border-t border-slate-200 pt-6">
                  <Link
                    href="/courses"
                    className="block rounded-xl bg-aerojet-blue py-4 text-center text-sm font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-aerojet-sky"
                  >
                    Explore Programmes
                  </Link>
                </div>
              </div>
            </aside>
          </SectionReveal>
        </div>
      </div>
    </div>
  )
}
