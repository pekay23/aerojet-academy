'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface EnrollmentStepsProps {
  fee?: string
  currency?: string
}

const SectionReveal = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
  >
    {children}
  </motion.div>
)

export default function EnrollmentSteps({ fee = '350', currency = 'GHS' }: EnrollmentStepsProps) {
  const steps = [
    {
      title: 'Create Account',
      description: 'Register online and submit your basic details to start.',
    },
    {
      title: 'Select Pathway',
      description: 'Choose your desired training programme and schedule.',
    },
    {
      title: 'Aptitude Test',
      description: 'Complete our technical and english proficiency assessment.',
    },
    {
      title: 'Begin Training',
      description: 'Receive your acceptance and prepare for your first class.',
    },
  ]

  return (
    <section className="border-y border-[#1b2430]/15 bg-stone-50 px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionReveal>
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-medium text-[#1b2430] sm:text-4xl">
              Start Your Journey
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#1b2430]/70">
              Four simple steps to begin your career.
            </p>
          </div>
        </SectionReveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <SectionReveal key={step.title} delay={index * 0.1}>
              <div className="group relative h-full border border-[#1b2430]/15 bg-white p-6 transition-all hover:bg-[#1b2430] hover:text-white">
                <div className="font-serif text-4xl font-medium text-[#1b2430]/30 group-hover:text-white/30">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className="mt-6 font-serif text-xl font-medium text-[#1b2430] group-hover:text-white">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#1b2430]/70 group-hover:text-white/70">
                  {step.description}
                </p>
              </div>
            </SectionReveal>
          ))}
        </div>

        <SectionReveal delay={0.4}>
          <div className="mt-16 text-center">
            <Link
              href="/register"
              className="inline-flex h-12 items-center gap-3 bg-[#1b2430] px-8 text-[11px] font-bold tracking-[0.25em] text-white uppercase transition-colors hover:bg-[#1b2430]/90"
            >
              Start Application
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </SectionReveal>
      </div>
    </section>
  )
}
