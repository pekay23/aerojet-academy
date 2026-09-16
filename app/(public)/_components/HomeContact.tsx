'use client'

import Link from 'next/link'
import SectionReveal from './SectionReveal'

export default function HomeContact({ isOpen = true }: { isOpen?: boolean }) {
  return (
    <SectionReveal>
      <section className="border-y border-[#1b2430]/15 px-6 py-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-10 border border-[#1b2430] bg-[#1b2430] p-8 text-[#f7f3ec] sm:p-16 lg:flex-row">
          <div className="text-center lg:text-left">
            <h2 className="mb-4 font-serif text-3xl font-medium sm:text-5xl">Ready to Begin?</h2>
            <p className="max-w-lg text-lg leading-relaxed text-[#f7f3ec]/70">
              Contact our admissions team today to request your registration invoice or to ask any
              questions about our 2026/2027 schedule.
            </p>
            <div className="mt-8 flex flex-col items-center gap-6 text-sm font-bold tracking-widest uppercase md:flex-row lg:items-start">
              <a
                href="tel:+233209848423"
                className="hover:text-aerojet-sky flex items-center gap-2 transition"
              >
                <span>+233-20-984-8423</span>
              </a>
              <span className="text-aerojet-sky hidden md:inline">/</span>
              <a
                href="mailto:trainingprograms@aerojet-academy.com"
                className="hover:text-aerojet-sky flex items-center gap-2 transition"
              >
                <span>Email Admissions</span>
              </a>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-4 md:w-auto">
            {isOpen && (
              <Link
                href="/register"
                className="bg-aerojet-sky inline-flex h-12 items-center justify-center rounded-sm px-10 text-[11px] font-bold tracking-[0.2em] text-[#1b2430] uppercase transition hover:bg-white"
              >
                Start Registration
              </Link>
            )}
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-sm border border-[#f7f3ec]/40 px-10 text-[11px] font-bold tracking-[0.2em] text-[#f7f3ec] uppercase transition hover:bg-[#f7f3ec] hover:text-[#1b2430]"
            >
              General Enquiry
            </Link>
          </div>
        </div>
      </section>
    </SectionReveal>
  )
}
