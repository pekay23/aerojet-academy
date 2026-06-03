'use client'

import { School, ClipboardCheck, Plane } from 'lucide-react'
import SectionReveal from './SectionReveal'

const pathways = [
  {
    title: 'Classroom & Workshop Training',
    description: 'Foundational theory and hands-on practice in our modern facilities.',
  },
  {
    title: 'EASA Examinations',
    description: 'Successfully pass all required modules to prove your knowledge.',
  },
  {
    title: 'Work Experience & Job Placement',
    description: 'Gain required OJT and launch your career with our partner network.',
  },
]

export default function TrainingPathways() {
  return (
    <section className="bg-paper-dark border-y border-[#1b2430]/15">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <SectionReveal>
          <h2 className="text-aerojet-blue mb-10 font-serif text-3xl font-medium sm:text-4xl">
            Our Training Pathways
          </h2>
        </SectionReveal>

        <div className="grid gap-10 lg:grid-cols-3">
          {pathways.map((pathway, index) => (
            <SectionReveal key={pathway.title} delay={index * 0.08}>
              <div className="border-aerojet-blue border-t-2 pt-5">
                <div className="text-aerojet-blue/30 font-serif text-5xl font-medium">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className="text-aerojet-blue mt-3 font-serif text-2xl font-medium">
                  {pathway.title}
                </h3>
                <p className="mt-2 leading-relaxed text-[#1b2430]/70">{pathway.description}</p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
