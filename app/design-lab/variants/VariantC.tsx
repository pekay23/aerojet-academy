'use client'

import { motion } from 'framer-motion'
import { HERO, STATS, WHO, JOURNEY, PROGRAMMES, CAREERS, IMG, Img, ArrowR } from '../shared'

const ease = [0.22, 1, 0.36, 1] as const
const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease },
}

/* ════════════════════════════════════════════════════════════
   C — "ACADEMY JOURNAL" · EDITORIAL INSTITUTIONAL
   Inspired by Embry-Riddle / heritage universities & journals:
   warm paper, serif display, ruled lines, drop-cap, column grid,
   footnote tone. Sells trust, rigour, an established institution.
   ════════════════════════════════════════════════════════════ */
export default function VariantC() {
  return (
    <div className="bg-[#f7f3ec] font-sans text-[#1b2430]">
      {/* MASTHEAD */}
      <header className="border-b-2 border-[#1b2430]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 text-[11px] font-semibold tracking-[0.25em] text-[#1b2430]/70 uppercase">
          <span>Aerojet Aviation Training Academy</span>
          <span className="hidden sm:block">Accra, Ghana · Est. for Excellence</span>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-[#1b2430]/15">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <motion.div {...reveal} className="text-center">
            <div className="text-aerojet-blue mb-6 flex items-center justify-center gap-4 text-[11px] font-bold tracking-[0.35em] uppercase">
              <span className="bg-aerojet-blue/40 h-px w-12" />
              {HERO.eyebrow}
              <span className="bg-aerojet-blue/40 h-px w-12" />
            </div>
            <h1 className="text-aerojet-blue mx-auto max-w-4xl font-serif text-4xl leading-[1.06] font-medium tracking-tight sm:text-6xl">
              Your Journey to Becoming a Certified Aircraft Technician Starts Here.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl font-serif text-xl leading-relaxed text-[#1b2430]/75 italic">
              {HERO.subhead}
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <a
                href="/register"
                className="bg-aerojet-blue inline-flex h-12 items-center gap-3 rounded-sm px-8 text-[11px] font-bold tracking-[0.25em] text-white uppercase transition hover:bg-[#1b2430]"
              >
                Start Registration <ArrowR className="h-4 w-4" />
              </a>
              <a
                href="/courses"
                className="border-aerojet-blue/40 text-aerojet-blue hover:bg-aerojet-blue inline-flex h-12 items-center rounded-sm border px-8 text-[11px] font-bold tracking-[0.25em] uppercase transition hover:text-white"
              >
                Explore Courses
              </a>
            </div>
          </motion.div>
          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.15 }}
            className="mt-14 overflow-hidden rounded-sm"
          >
            <Img src={IMG.lecture} className="aspect-21/9 w-full object-cover sepia-[0.15]" />
          </motion.div>
          {/* stats ledger */}
          <div className="mt-12 grid grid-cols-2 border-y border-[#1b2430]/20 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={`py-6 text-center ${i !== 0 ? 'border-l border-[#1b2430]/15' : ''}`}
              >
                <div className="text-aerojet-blue font-serif text-3xl font-medium">{s.value}</div>
                <div className="mt-1 text-[10px] font-bold tracking-[0.2em] text-[#1b2430]/60 uppercase">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO WE ARE — columns w/ drop cap */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <motion.div {...reveal} className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div>
            <div className="text-aerojet-blue/60 text-[11px] font-bold tracking-[0.3em] uppercase">
              — {WHO.eyebrow}
            </div>
            <h2 className="text-aerojet-blue mt-4 max-w-2xl font-serif text-4xl leading-[1.1] font-medium sm:text-5xl">
              {WHO.title}
            </h2>
            <div className="mt-7 gap-8 text-lg leading-relaxed text-[#1b2430]/85 sm:columns-2">
              <p className="first-letter:text-aerojet-blue first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-6xl first-letter:leading-[0.8] first-letter:font-medium">
                {WHO.body}
              </p>
              <p className="mt-4">{WHO.body2}</p>
            </div>
          </div>
          <div>
            <Img
              src={IMG.student}
              className="aspect-3/4 w-full rounded-sm object-cover sepia-[0.15]"
            />
            <ul className="mt-6 divide-y divide-[#1b2430]/15 border-y border-[#1b2430]/15">
              {WHO.includes.map((t) => (
                <li key={t} className="flex items-center justify-between py-3 font-serif text-lg">
                  {t}
                  <span className="text-aerojet-blue/40">✦</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </section>

      {/* JOURNEY — numbered editorial */}
      <section className="border-y border-[#1b2430]/15 bg-[#efe8dc]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <motion.h2
            {...reveal}
            className="text-aerojet-blue mb-10 font-serif text-3xl font-medium sm:text-4xl"
          >
            Our Training Pathways
          </motion.h2>
          <div className="grid gap-10 lg:grid-cols-3">
            {JOURNEY.map((j, i) => (
              <motion.div
                key={j.k}
                {...reveal}
                transition={{ ...reveal.transition, delay: i * 0.08 }}
                className="border-aerojet-blue border-t-2 pt-5"
              >
                <div className="text-aerojet-blue/30 font-serif text-5xl font-medium">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="text-aerojet-blue mt-3 font-serif text-2xl font-medium">{j.k}</h3>
                <p className="mt-2 leading-relaxed text-[#1b2430]/70">{j.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMMES — index */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <motion.h2
          {...reveal}
          className="text-aerojet-blue mb-8 font-serif text-3xl font-medium sm:text-4xl"
        >
          Programmes of Study
        </motion.h2>
        <div className="border-t-2 border-[#1b2430]">
          {PROGRAMMES.map((p, i) => (
            <motion.a
              key={p.title}
              href={p.href}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.05 }}
              className="group grid items-center gap-3 border-b border-[#1b2430]/15 py-6 transition hover:bg-[#efe8dc] sm:grid-cols-[3rem_1.2fr_2fr_2rem] sm:px-3"
            >
              <span className="text-aerojet-blue/40 font-serif text-2xl">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-aerojet-blue font-serif text-2xl font-medium">
                {p.title}
                {p.badge && (
                  <span className="text-aerojet-blue/50 ml-2 align-middle text-[10px] font-bold tracking-widest uppercase">
                    · {p.badge}
                  </span>
                )}
              </span>
              <span className="text-[#1b2430]/70">{p.desc}</span>
              <ArrowR className="text-aerojet-blue hidden h-5 w-5 transition group-hover:translate-x-1 sm:block" />
            </motion.a>
          ))}
        </div>
      </section>

      {/* CAREERS — running list */}
      <section className="bg-aerojet-blue border-t border-[#1b2430]/15 text-[#f7f3ec]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <motion.h2 {...reveal} className="font-serif text-3xl font-medium sm:text-4xl">
            A Career That Takes You Anywhere
          </motion.h2>
          <motion.p {...reveal} className="mt-4 max-w-2xl text-[#f7f3ec]/70">
            An EASA Part-66 license is a globally recognized qualification. Our graduates work
            across the aviation industry worldwide, including:
          </motion.p>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 font-serif text-2xl">
            {CAREERS.map((c, i) => (
              <motion.span
                key={c}
                {...reveal}
                transition={{ ...reveal.transition, delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                {c}
                {i < CAREERS.length - 1 && <span className="text-aerojet-sky">/</span>}
              </motion.span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
