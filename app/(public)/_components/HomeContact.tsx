'use client'

import Link from 'next/link'
import { Phone, Mail } from 'lucide-react'
import SectionReveal from './SectionReveal'

export default function HomeContact() {
  return (
    <SectionReveal>
      <section className="bg-public-dark px-6 py-24">
        <div className="bg-public-secondary relative mx-auto flex w-full flex-col items-center justify-between gap-10 overflow-hidden rounded-4xl p-8 text-white shadow-2xl sm:rounded-[3rem] md:p-16 lg:flex-row">
          {/* Decorative Background Icon */}
          <div className="absolute -right-10 -bottom-10 opacity-10" aria-hidden="true">
            <svg className="h-64 w-64" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 16.5C21 16.88 20.79 17.21 20.47 17.38L12.57 21.82C12.41 21.94 12.21 22 12 22C11.79 22 11.59 21.94 11.43 21.82L3.53 17.38C3.21 17.21 3 16.88 3 16.5V7.5C3 7.12 3.21 6.79 3.53 6.62L11.43 2.18C11.59 2.06 11.79 2 12 2C12.21 2 12.41 2.06 12.57 2.18L20.47 6.62C20.79 6.79 21 7.12 21 7.5V16.5Z" />
            </svg>
          </div>

          <div className="relative z-10 text-center lg:text-left">
            <h2 className="mb-4 text-3xl font-black tracking-tight uppercase md:text-5xl">
              Ready to Begin?
            </h2>
            <p className="max-w-lg text-lg leading-relaxed font-medium text-blue-100">
              Contact our admissions team today to request your registration invoice or to ask any
              questions about our 2026/2027 schedule.
            </p>
            <div className="mt-8 flex flex-col items-center gap-6 text-sm font-bold tracking-widest uppercase md:flex-row lg:items-start">
              <a
                href="tel:+233209848423"
                className="hover:text-public-primary flex items-center gap-2 transition"
              >
                <Phone className="h-4 w-4" /> <span>+233-20-984-8423</span>
              </a>
              <a
                href="mailto:trainingprograms@aerojet-academy.com"
                className="hover:text-public-primary flex items-center gap-2 transition"
              >
                <Mail className="h-4 w-4" /> <span>Email Admissions</span>
              </a>
            </div>
          </div>

          <div className="relative z-10 flex w-full shrink-0 flex-col gap-4 md:w-auto">
            <Link
              href="/register"
              className="text-public-primary hover:bg-public-primary rounded-2xl bg-white px-10 py-5 text-center text-xs font-black tracking-[0.2em] uppercase shadow-xl transition-all hover:text-white"
            >
              Start Registration
            </Link>
            <Link
              href="/contact"
              className="rounded-2xl border border-white/20 bg-white/10 px-10 py-5 text-center text-xs font-black tracking-[0.2em] text-white uppercase backdrop-blur-md transition-all hover:bg-white/20"
            >
              General Enquiry
            </Link>
          </div>
        </div>
      </section>
    </SectionReveal>
  )
}
