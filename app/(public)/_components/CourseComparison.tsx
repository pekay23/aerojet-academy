'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle2, X } from 'lucide-react'

const pathways = [
  {
    name: '4-Year Full-Time',
    duration: '4 Years',
    href: '/courses/aircraft-engineering/easa-part-66/four-year-b1-b2',
    highlight: true,
    features: {
      'Classroom Tuition': true,
      'Study Materials': true,
      'Exam Fees Included': true,
      'Practical Training': true,
      'Work Experience': true,
      'Job Guarantee': true,
    },
  },
  {
    name: '2-Year Full-Time',
    duration: '2 Years',
    href: '/courses/aircraft-engineering/easa-part-66/two-year-b1',
    highlight: false,
    features: {
      'Classroom Tuition': true,
      'Study Materials': true,
      'Exam Fees Included': true,
      'Practical Training': false,
      'Work Experience': false,
      'Job Guarantee': false,
    },
  },
  {
    name: 'Modular',
    duration: 'Self-Paced',
    href: '/courses/aircraft-engineering/easa-part-66/modular-training',
    highlight: false,
    features: {
      'Classroom Tuition': true,
      'Study Materials': true,
      'Exam Fees Included': true,
      'Practical Training': false,
      'Work Experience': false,
      'Job Guarantee': false,
    },
  },
  {
    name: 'Exam Only',
    duration: 'Flexible',
    href: '/courses/aircraft-engineering/easa-part-66/exam-only',
    highlight: false,
    features: {
      'Classroom Tuition': false,
      'Study Materials': true,
      'Exam Fees Included': true,
      'Practical Training': false,
      'Work Experience': false,
      'Job Guarantee': false,
    },
  },
]

const featureNames = Object.keys(pathways[0].features)

export default function CourseComparison() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="overflow-x-auto"
    >
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead>
          <tr>
            <th className="p-4 text-xs font-bold tracking-widest text-slate-400 uppercase">
              Feature
            </th>
            {pathways.map((p) => (
              <th key={p.name} className="p-4 text-center">
                <div
                  className={`inline-block rounded-xl px-4 py-2 text-sm font-black tracking-wide uppercase ${p.highlight ? 'bg-aerojet-blue text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  {p.name}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-400">{p.duration}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {featureNames.map((feat) => (
            <tr key={feat} className="transition-colors hover:bg-slate-50/50">
              <td className="p-4 font-medium text-slate-700">{feat}</td>
              {pathways.map((p) => (
                <td key={p.name} className="p-4 text-center">
                  {p.features[feat as keyof typeof p.features] ? (
                    <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                  ) : (
                    <X className="mx-auto h-5 w-5 text-slate-300" />
                  )}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td className="p-4" />
            {pathways.map((p) => (
              <td key={p.name} className="p-4 text-center">
                <Link
                  href={p.href}
                  className={`inline-block rounded-xl px-5 py-2.5 text-xs font-black tracking-widest uppercase transition-all ${
                    p.highlight
                      ? 'bg-aerojet-sky hover:bg-aerojet-blue text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  View Details
                </Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </motion.div>
  )
}
