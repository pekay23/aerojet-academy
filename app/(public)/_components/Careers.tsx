'use client'

import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'
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
    <section className="bg-white py-20 sm:py-28">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionReveal>
            <Image
              src="/images/careers/aircraftcareers.webp"
              alt="Aircraft Engineer working on an engine"
              width={600}
              height={700}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="rounded-2xl object-cover"
            />
          </SectionReveal>
          <SectionReveal delay={0.1}>
            <div>
              <span className="text-public-secondary mb-3 block text-xs font-bold tracking-[0.2em] uppercase">
                Career Opportunities
              </span>
              <h2 className="text-public-primary mb-6 text-3xl font-black tracking-tight uppercase sm:text-4xl">
                A Career That Takes You Anywhere
              </h2>
              <p className="mb-8 leading-relaxed text-slate-600">
                An EASA Part-66 license is a globally recognized qualification that opens doors to a
                rewarding and high-demand career. Our graduates work in a variety of roles across
                the aviation industry worldwide, including:
              </p>
              <ul className="space-y-4">
                {careerPoints.map((point) => (
                  <li key={point} className="flex items-center gap-3">
                    <CheckCircle2 className="text-public-secondary h-5 w-5 shrink-0" />
                    <span className="font-medium text-slate-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  )
}
