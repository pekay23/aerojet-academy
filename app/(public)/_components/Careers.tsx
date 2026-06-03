'use client'

import { motion } from 'framer-motion'
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
    <section className="relative border-t border-[#1b2430]/15 text-[#f7f3ec] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/home/careerwide.webp"
          alt="Careers at Aerojet Academy"
          fill
          className="object-cover object-right-top"
          quality={90}
        />
        {/* Dark blue gradient overlay fading to the right so text stays readable but the image pops on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1624]/95 via-[#0d1624]/80 to-[#0d1624]/20" />
      </div>

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

          <div className="mt-10 flex flex-col gap-y-4 font-serif text-2xl sm:text-3xl">
            {careerPoints.map((c, i) => (
              <SectionReveal key={c} delay={i * 0.08} className="flex items-center gap-4">
                <span className="text-aerojet-sky text-opacity-50">✦</span>
                <span>{c}</span>
              </SectionReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
