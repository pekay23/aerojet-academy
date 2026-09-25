'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { HERO, STATS, WHO, PROGRAMMES, ENROLL, IMG, Img, ArrowR } from '../shared'

const ease = [0.22, 1, 0.36, 1] as const
const reveal = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-90px' },
  transition: { duration: 0.8, ease },
}

/* ════════════════════════════════════════════════════════════
   A — "FLIGHTLINE" · CINEMATIC AEROSPACE
   Inspired by Airbus / Rolls-Royce / Boeing: immersive full-bleed
   photography, deep navy, refined large type, cinematic parallax,
   premium restraint. Sells prestige + scale.
   ════════════════════════════════════════════════════════════ */
export default function VariantA() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const txtY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%'])

  return (
    <div className="bg-[#0a1628] font-sans text-white">
      {/* HERO */}
      <section ref={heroRef} className="relative h-[92vh] min-h-150 overflow-hidden">
        <motion.div style={{ y: imgY }} className="absolute inset-0 scale-110">
          <Img src={IMG.heroA} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-[#0a1628] via-[#0a1628]/55 to-[#0a1628]/30" />
          <div className="absolute inset-0 bg-linear-to-r from-[#0a1628]/80 to-transparent" />
        </motion.div>

        <motion.div
          style={{ y: txtY }}
          className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-24"
        >
          <motion.span
            {...reveal}
            className="text-aerojet-sky text-xs font-semibold tracking-[0.4em] uppercase"
          >
            {HERO.eyebrow}
          </motion.span>
          <motion.h1
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.1 }}
            className="font-outfit mt-6 max-w-4xl text-4xl leading-[1.04] font-semibold tracking-tight sm:text-6xl lg:text-7xl"
          >
            Your Journey to Becoming a Certified Aircraft Technician Starts Here.
          </motion.h1>
          <motion.p
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.2 }}
            className="mt-7 max-w-xl text-lg leading-relaxed text-slate-300"
          >
            {HERO.subhead}
          </motion.p>
          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <a
              href="/register"
              className="group hover:bg-aerojet-sky inline-flex h-14 items-center gap-3 rounded-full bg-white px-9 text-xs font-bold tracking-[0.2em] text-[#0a1628] uppercase transition hover:text-white"
            >
              Start Registration <ArrowR className="h-4 w-4 transition group-hover:translate-x-1" />
            </a>
            <a
              href="/courses"
              className="inline-flex h-14 items-center rounded-full border border-white/30 px-9 text-xs font-bold tracking-[0.2em] uppercase transition hover:border-white hover:bg-white/10"
            >
              Explore Courses
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* STATS band */}
      <section className="border-y border-white/10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-white/10 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.08 }}
              className="bg-[#0a1628] px-6 py-10"
            >
              <div className="font-outfit text-3xl font-semibold text-white sm:text-4xl">
                {s.value}
              </div>
              <div className="text-aerojet-sky mt-2 text-[11px] font-bold tracking-[0.2em] uppercase">
                {s.label}
              </div>
              <div className="mt-1 text-sm text-slate-400">{s.sub}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* WHO WE ARE — cinematic split */}
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-28 lg:grid-cols-2">
        <motion.div {...reveal}>
          <span className="text-aerojet-sky text-[11px] font-semibold tracking-[0.4em] uppercase">
            {WHO.eyebrow}
          </span>
          <h2 className="font-outfit mt-5 text-4xl leading-[1.08] font-semibold sm:text-5xl">
            {WHO.title}
          </h2>
          <p className="mt-7 text-lg leading-relaxed text-slate-300">{WHO.body}</p>
          <p className="mt-4 leading-relaxed text-slate-400">{WHO.body2}</p>
          <ul className="mt-9 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {WHO.includes.map((t) => (
              <li
                key={t}
                className="flex items-center gap-3 border-t border-white/10 pt-4 font-medium"
              >
                <span className="text-aerojet-sky">✦</span> {t}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.15 }}
          className="relative"
        >
          <div className="overflow-hidden rounded-2xl">
            <Img
              src={IMG.hangar}
              className="aspect-4/5 w-full object-cover transition duration-700 hover:scale-105"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 rounded-2xl border border-white/10 bg-[#0a1628] px-7 py-5 shadow-2xl">
            <div className="font-outfit text-aerojet-sky text-3xl font-semibold">100%</div>
            <div className="text-[11px] font-bold tracking-widest text-slate-300 uppercase">
              EASA Standards
            </div>
          </div>
        </motion.div>
      </section>

      {/* PROGRAMMES — cinematic image cards */}
      <section className="mx-auto max-w-7xl px-6 pb-28">
        <motion.div {...reveal} className="mb-12 flex items-end justify-between gap-6">
          <div>
            <span className="text-aerojet-sky text-[11px] font-semibold tracking-[0.4em] uppercase">
              Programmes
            </span>
            <h2 className="font-outfit mt-4 text-4xl font-semibold sm:text-5xl">
              Choose Your Pathway
            </h2>
          </div>
          <a
            href="/courses"
            className="hidden items-center gap-2 text-xs font-bold tracking-[0.2em] text-slate-300 uppercase hover:text-white sm:inline-flex"
          >
            View all <ArrowR className="h-4 w-4" />
          </a>
        </motion.div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROGRAMMES.map((p, i) => (
            <motion.a
              key={p.title}
              href={p.href}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.08 }}
              className="group relative flex h-80 flex-col justify-end overflow-hidden rounded-2xl border border-white/10 p-6"
            >
              <Img
                src={[IMG.heroB, IMG.engine, IMG.lecture, IMG.takeoff][i]}
                className="absolute inset-0 h-full w-full object-cover opacity-50 transition duration-700 group-hover:scale-110 group-hover:opacity-70"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#0a1628] via-[#0a1628]/40 to-transparent" />
              <div className="relative">
                {p.badge && (
                  <span className="bg-aerojet-sky mb-3 inline-block rounded-full px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase">
                    {p.badge}
                  </span>
                )}
                <h3 className="font-outfit text-xl font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300 opacity-0 transition group-hover:opacity-100">
                  {p.desc}
                </p>
                <span className="text-aerojet-sky mt-4 inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
                  Learn more <ArrowR className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* ENROLLMENT */}
      <section className="border-t border-white/10 bg-[#081120]">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <motion.h2
            {...reveal}
            className="font-outfit mb-14 text-center text-4xl font-semibold sm:text-5xl"
          >
            How to Enroll
          </motion.h2>
          <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {ENROLL.map((s, i) => (
              <motion.div
                key={s.n}
                {...reveal}
                transition={{ ...reveal.transition, delay: i * 0.08 }}
                className="bg-[#081120] p-8"
              >
                <div className="font-outfit text-5xl font-semibold text-white/15">{s.n}</div>
                <h3 className="mt-5 text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
