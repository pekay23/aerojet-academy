'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Award, Globe, Users } from 'lucide-react'

const stats = [
  { icon: ShieldCheck, label: 'EASA Part 147 Certified', value: 'Certified' },
  { icon: Award, label: 'Licence Categories', value: 'B1 & B2' },
  { icon: Globe, label: 'International Recognition', value: 'Worldwide' },
  { icon: Users, label: 'Max Class Size', value: '28 Students' },
]

export default function TrustStrip() {
  return (
    <section className="relative z-20 -mt-12 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 divide-x divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl sm:rounded-3xl md:grid-cols-4"
        >
          {stats.map((stat, i) => (
            <div key={i} className="group p-5 text-center sm:p-8">
              <stat.icon
                className="text-public-secondary mx-auto mb-3 h-6 w-6 transition-transform duration-300 group-hover:scale-110"
                aria-hidden="true"
              />
              <div className="text-public-primary text-lg font-black tracking-tight sm:text-2xl">
                {stat.value}
              </div>
              <div className="mt-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase sm:text-xs">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
