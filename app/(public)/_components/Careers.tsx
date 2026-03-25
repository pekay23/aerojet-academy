'use client'

import NextImage from 'next/image'
import { motion } from 'framer-motion'
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
    <section className="bg-slate-50 px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <SectionReveal className="order-2 lg:order-1">
            <div className="relative">
              <div className="absolute -top-6 -left-6 z-0 h-24 w-24 rounded-full border-4 border-white bg-aerojet-sky/10 blur-xl" />
              <div className="relative z-10 overflow-hidden rounded-3xl shadow-2xl">
                <NextImage
                  src="/images/careers/aircraftcareers.webp"
                  alt="Aircraft Engineer working on an engine"
                  width={800}
                  height={1000}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          </SectionReveal>
          <SectionReveal delay={0.2} className="order-1 lg:order-2">
            <div>
              <span className="mb-4 block text-sm font-black tracking-[0.3em] text-aerojet-sky uppercase">
                Career Opportunities
              </span>
              <h2 className="mb-8 text-4xl leading-tight font-black tracking-tight text-aerojet-blue uppercase sm:text-5xl">
                A Career That Takes <br />
                <span className="text-aerojet-sky">You Anywhere</span>
              </h2>
              <p className="mb-10 text-lg leading-relaxed text-slate-600">
                An EASA Part-66 license is a globally recognized qualification that opens doors to a
                rewarding and high-demand career. Our graduates work in a variety of roles across
                the aviation industry worldwide, including:
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {careerPoints.map((point, i) => (
                  <motion.div
                    key={point}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-aerojet-sky hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-slate-800">{point}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  )
}
