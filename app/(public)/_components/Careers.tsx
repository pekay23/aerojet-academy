'use client'

import Image from 'next/image'
import SectionReveal from './SectionReveal'

const careerPoints = [
  'Commercial Airlines',
  'Maintenance, Repair & Overhaul (MRO) Facilities',
  'Aircraft Manufacturing Companies',
  'Military and Defence Contractors',
  'Specialist Engineering Firms',
]

export default function Careers() {
  return (
    <section className="relative w-full min-h-105 overflow-hidden border-t border-[#1b2430]/15 text-[#f7f3ec] sm:min-h-0">
      {/* Background Image — mobile */}
      <div className="absolute inset-0 z-0 sm:hidden">
        <Image
          src="/images/home/careerwidemobile.webp"
          alt="Careers at Aerojet Academy"
          fill
          sizes="(max-width: 640px) 100vw, 0px"
          className="object-cover object-center"
          quality={90}
          priority
        />
      </div>
      {/* Background Image — desktop */}
      <div className="absolute inset-0 z-0 hidden sm:block">
        <Image
          src="/images/home/careerwide.webp"
          alt="Careers at Aerojet Academy"
          fill
          sizes="(min-width: 640px) 100vw, 0px"
          className="object-cover object-center sm:object-top-right"
          quality={90}
          priority
        />
      </div>
      {/* Dark blue gradient overlay fading to the right so text stays readable but the image pops on the right */}
      <div className="absolute inset-0 bg-linear-to-b from-[#0d1624]/70 via-[#0d1624]/60 to-[#0d1624]/80 sm:from-[#0d1624]/95 sm:via-[#0d1624]/80 sm:to-[#0d1624]/20" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div className="max-w-3xl">
          <SectionReveal>
            <h2 className="font-serif text-3xl font-medium sm:text-4xl lg:text-5xl">
              A Career That Takes You Anywhere
            </h2>
            <p className="mt-6 text-lg text-[#f7f3ec]/80">
              An EASA Part-66 license is a globally recognized qualification. Our graduates work
              across the aviation industry worldwide, including:
            </p>
          </SectionReveal>

          <div className="mt-10 flex flex-col gap-y-3 font-serif text-2xl sm:text-3xl">
            {careerPoints.map((c, i) => (
              <SectionReveal key={c} delay={i * 0.08}>
                <div className="border-l-2 border-[#7eb8d4]/50 py-1 pl-5 text-[#f7f3ec]/90">
                  {c}
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
