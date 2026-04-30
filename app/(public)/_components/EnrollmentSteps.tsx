'use client'

import { motion } from 'framer-motion'
import { getCurrencySymbol } from '@/lib/currency'

interface EnrollmentStepsProps {
  fee?: string
  currency?: string
}

export default function EnrollmentSteps({ fee = '350', currency = 'GHS' }: EnrollmentStepsProps) {
  const symbol = getCurrencySymbol(currency || 'GHS')

  const steps = [
    {
      num: '01',
      title: 'Register Online',
      desc: `Pay the ${symbol}${fee} registration fee and create your portal account.`,
    },
    {
      num: '02',
      title: 'Complete Application',
      desc: 'Submit your documents and complete the online application form.',
    },
    {
      num: '03',
      title: 'Get Approved',
      desc: 'Our team reviews your application and issues a confirmation invoice.',
    },
    {
      num: '04',
      title: 'Begin Training',
      desc: 'Pay your confirmation fee, get onboarded, and start your journey.',
    },
  ]

  return (
    <section className="px-6 py-20 sm:py-28">
      <div className="mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <span className="text-public-secondary mb-4 block text-sm font-bold tracking-[0.25em] uppercase">
            How to Enroll
          </span>
          <h2 className="text-public-primary text-4xl font-black tracking-tight uppercase md:text-5xl">
            Four Simple Steps
          </h2>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative"
            >
              <div className="hover:border-public-secondary h-full rounded-3xl border border-slate-200 bg-white p-8 transition-all duration-500 hover:shadow-xl sm:p-10">
                <span className="text-public-secondary group-hover:text-public-primary block text-6xl leading-none font-black transition-colors duration-300 sm:text-7xl">
                  {step.num}
                </span>
                <h3 className="mt-5 mb-3 text-xl font-bold text-slate-900">{step.title}</h3>
                <p className="text-base leading-relaxed text-slate-600">{step.desc}</p>
              </div>
              {/* Connector line on desktop */}
              {i < steps.length - 1 && (
                <div className="absolute top-1/2 -right-3 hidden h-px w-6 bg-slate-200 lg:block" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
