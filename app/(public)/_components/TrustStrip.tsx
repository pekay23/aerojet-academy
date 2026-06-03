'use client'

import { motion } from 'framer-motion'

const stats = [
  { label: 'EASA Certified', value: 'Part 147' },
  { label: 'Licence Categories', value: 'B1 & B2' },
  { label: 'Recognition', value: 'Worldwide' },
  { label: 'Max Class Size', value: '28' },
]

export default function TrustStrip() {
  return (
    <section className="bg-paper relative z-20 border-b border-[#1b2430]/15">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`group py-6 text-center ${i !== 0 ? 'border-l border-[#1b2430]/15' : ''}`}
            >
              <div className="text-aerojet-blue font-serif text-3xl font-medium">{stat.value}</div>
              <div className="mt-1 text-[10px] font-bold tracking-[0.2em] text-[#1b2430]/60 uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
