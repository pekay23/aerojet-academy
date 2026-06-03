export const dynamic = 'force-dynamic'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import HeroSlider from './_components/HeroSlider'
import TrustStrip from './_components/TrustStrip'
import SectionReveal from './_components/SectionReveal'
import ProgramCard from './_components/ProgramCard'
import Careers from './_components/Careers'
import UnderstandingLicensing from './_components/UnderstandingLicensing'
import TrainingPathways from './_components/TrainingPathways'
import EnrollmentSteps from './_components/EnrollmentSteps'
import LatestNews from './_components/LatestNews'
import Credibility from './_components/Credibility'
import HomeContact from './_components/HomeContact'
import { CheckCircle2 } from 'lucide-react'
import { getRegistrationFeeInfo } from '@/lib/system-settings'

// Removed local getRegistrationFee in favor of lib/system-settings helper

export default async function Home() {
  const { fee, currency } = await getRegistrationFeeInfo()

  return (
    <div className="bg-white">
      <HeroSlider />
      <TrustStrip />

      {/* ===== START: REPLACEMENT "WHO WE ARE" SECTION ===== */}
      <section className="bg-paper mx-auto max-w-7xl px-6 py-24 text-[#1b2430] sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <SectionReveal skipInitial>
            <div className="text-aerojet-blue/60 text-[11px] font-bold tracking-[0.3em] uppercase">
              — Who We Are
            </div>
            <h2 className="text-aerojet-blue mt-4 max-w-2xl font-serif text-4xl leading-[1.1] font-medium sm:text-5xl">
              Building the Future of African Aviation
            </h2>
            <div className="mt-7 gap-8 text-lg leading-relaxed text-[#1b2430]/85 sm:columns-2">
              <p className="first-letter:text-aerojet-blue first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-6xl first-letter:leading-[0.8] first-letter:font-medium">
                Aerojet Aviation Training Academy is Africa’s foremost institution and leader in the
                field of Aviation Training and Engineering. Training engineers for one of the most
                demanding professions in the world is a truly important responsibility that we take
                very seriously.
              </p>
              <p className="mt-4">
                At Aerojet, we are committed to educating and preparing aircraft engineers to the
                highest standards. During your training, you will gain direct insight into how work
                is carried out in a live aircraft hangar, supported by opportunities to train in our
                EASA Part 145 Facility or at partner facilities worldwide.
              </p>
            </div>
          </SectionReveal>
          <SectionReveal delay={0.2}>
            <Image
              src="/images/home/al4.webp"
              alt="Aerojet student"
              width={800}
              height={1000}
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              className="aspect-3/4 w-full rounded-sm object-cover sepia-[0.15]"
            />
            <ul className="mt-6 divide-y divide-[#1b2430]/15 border-y border-[#1b2430]/15">
              {[
                'Live Hangar Experience',
                'EASA Part-145 Standards',
                'Global Partner Network',
                'Hands-on Mentorship',
              ].map((t) => (
                <li key={t} className="flex items-center justify-between py-3 font-serif text-lg">
                  {t}
                  <span className="text-aerojet-blue/40">✦</span>
                </li>
              ))}
            </ul>
          </SectionReveal>
        </div>
      </section>
      {/* ===== END: REPLACEMENT "WHO WE ARE" SECTION ===== */}

      <TrainingPathways />

      {/* ===== START: REPLACEMENT "PROGRAMS" SECTION ===== */}
      <section className="bg-paper mx-auto max-w-7xl px-6 py-20 text-[#1b2430] sm:py-32">
        <SectionReveal>
          <h2 className="text-aerojet-blue mb-8 font-serif text-3xl font-medium sm:text-4xl">
            Programmes of Study
          </h2>
        </SectionReveal>

        <div className="border-t-2 border-[#1b2430]">
          {[
            {
              title: '4-Year Full-Time',
              badge: 'Flagship',
              desc: 'Our flagship EASA-certified program for aspiring engineers. Comprehensive B1/B2 training.',
              href: '/courses/aircraft-engineering/easa-part-66/four-year-b1-b2',
            },
            {
              title: '2-Year Full-Time',
              badge: null,
              desc: 'An accelerated B1.1 mechanical certification path focused on core engineering excellence.',
              href: '/courses/aircraft-engineering/easa-part-66/two-year-b1',
            },
            {
              title: 'Modular Training',
              badge: null,
              desc: 'Flexible, self-paced study with expert support. Enroll in specific EASA modules as needed.',
              href: '/courses/aircraft-engineering/easa-part-66/modular-training',
            },
            {
              title: 'Military / Industry',
              badge: null,
              desc: 'A 1-year fast-track for experienced personnel entering civil aviation maintenance.',
              href: '/courses/aircraft-engineering/easa-part-66/military-certification',
            },
          ].map((p, i) => (
            <SectionReveal key={p.title} delay={i * 0.05}>
              <Link
                href={p.href}
                className="group grid items-center gap-3 border-b border-[#1b2430]/15 py-6 transition hover:bg-[#efe8dc] sm:grid-cols-[3rem_1.2fr_2fr_2rem] sm:px-3"
              >
                <span className="text-aerojet-blue/40 font-serif text-2xl">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-aerojet-blue font-serif text-2xl font-medium">
                  {p.title}
                  {p.badge && (
                    <span className="text-aerojet-blue/50 ml-2 align-middle text-[10px] font-bold tracking-widest uppercase">
                      · {p.badge}
                    </span>
                  )}
                </span>
                <span className="text-[#1b2430]/70">{p.desc}</span>
                <ArrowRight className="text-aerojet-blue hidden h-5 w-5 transition group-hover:translate-x-1 sm:block" />
              </Link>
            </SectionReveal>
          ))}
        </div>
      </section>
      {/* ===== END: REPLACEMENT "PROGRAMS" SECTION ===== */}

      <Careers />
      <UnderstandingLicensing />
      <EnrollmentSteps fee={fee} currency={currency} />
      <LatestNews />
      <Credibility />
      <HomeContact />
    </div>
  )
}
