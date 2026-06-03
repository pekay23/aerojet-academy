'use client'

import { motion } from 'framer-motion'
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
    <section className="bg-aerojet-blue border-t border-[#1b2430]/15 text-[#f7f3ec]">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <SectionReveal>
          <h2 className="font-serif text-3xl font-medium sm:text-4xl">
            A Career That Takes You Anywhere
          </h2>
          <p className="mt-4 max-w-2xl text-[#f7f3ec]/70">
            An EASA Part-66 license is a globally recognized qualification. Our graduates work
            across the aviation industry worldwide, including:
          </p>
        </SectionReveal>

        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 font-serif text-2xl">
          {careerPoints.map((c, i) => (
            <SectionReveal key={c} delay={i * 0.05} className="flex items-center gap-3">
              <span>{c}</span>
              {i < careerPoints.length - 1 && <span className="text-aerojet-sky">/</span>}
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
