import { Metadata } from 'next'
import Link from 'next/link'
import Hero from '../_components/Hero'
import SectionReveal from '../_components/SectionReveal'

export const metadata: Metadata = { title: 'About Us ' }

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
                <div className="bg-aerojet-sky mb-5 h-1.5 w-14 rounded-full" />
                <h2 className="text-aerojet-blue mb-6 text-3xl font-black tracking-tight uppercase">
                  Our Academy
                </h2>
                <div className="space-y-4 text-lg leading-relaxed text-slate-600">
                  <p>
                    Aerojet Aviation Training Academy is Africa's foremost institution and leader in
                    the field of Aviation Training and Engineering.
                  </p>
                  <p>
                    Training Engineers for one of the most demanding professions in the world is a
                    truly important responsibility that we take very seriously. At Aerojet we are
                    extremely committed to educating, mentoring and preparing aircraft engineers to
                    the highest standards, ensuring you have a successful career as an Aircraft
                    Engineer.
                  </p>
                  <p>
                    As direct recipients of trained personnel via Aerojet's Engineering Division, we
                    know what it takes and understand the importance of the knowledge and
                    preparation we give to students that come through our institution.
                  </p>
                  <p>
                    During your training you will gain direct insight into how work is carried out
                    in a live aircraft hangar and become conversant with the required processes
                    employed by Aircraft Maintenance companies to ensure the safe operation of
                    commercial aircraft today.
                  </p>
                  <p>
                    Depending on your chosen program you will be supported by being given the
                    opportunity to train in Aerojet's EASA Part 145 Facility or at one of our
                    partner facilities worldwide to help you gain the best hands-on experience
                    needed to pursue a career in Aircraft Engineering.
                  </p>
                </div>
              </section>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <section>
                <div className="bg-aerojet-sky mb-5 h-1.5 w-14 rounded-full" />
                <h2 className="text-aerojet-blue mb-6 text-3xl font-black tracking-tight uppercase">
                  The Accra MRO Project
                </h2>
                <p className="mb-4 leading-relaxed text-slate-600">
                  Aerojet Aviation Training Academy was developed as a foundational component of
                  Aerojet's flagship Accra MRO Project.
                </p>
                <Link
                  href="/about/accra-mro-project"
                  className="text-aerojet-sky inline-flex items-center font-bold hover:underline"
                >
                  Read more about the MRO Project →
                </Link>
              </section>
            </SectionReveal>
          </div>
          <SectionReveal delay={0.15}>
            <aside>
              <div className="sticky top-28 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:rounded-3xl sm:p-8">
                <h3 className="text-aerojet-blue mb-6 border-b border-slate-200 pb-4 text-base font-black tracking-widest uppercase">
                  Academy Highlights
                </h3>
                <ul className="space-y-6">
                  {[
                    'Training aligned to strict EASA Part-66 standards.',
                    'Inaugural cohort of students already in training.',
                    'Strategically located at the Accra Technical Training Centre (ATTC).',
                  ].map((text) => (
                    <li key={text} className="flex items-start gap-3">
                      <span className="bg-aerojet-sky mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                        ✓
                      </span>
                      <p className="text-base text-slate-700">{text}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 border-t border-slate-200 pt-6">
                  <Link
                    href="/courses"
                    className="bg-aerojet-blue hover:bg-aerojet-sky block rounded-xl py-4 text-center text-sm font-black tracking-widest text-white uppercase shadow-lg transition-all"
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
