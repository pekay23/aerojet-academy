'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { HERO, STATS, WHO, PROGRAMMES, LICENSING, IMG, Img, ArrowR } from '../shared'

const ease = [0.22, 1, 0.36, 1] as const
const reveal = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease },
}

/* ════════════════════════════════════════════════════════════
   E — "MERIDIAN" · SWISS PRECISION MINIMAL
   Inspired by premium minimal design (Apple / Swiss grid):
   near-monochrome, hairlines, vast whitespace, tiny labels, a
   single hero image, hover-reveal. Sells calm, premium confidence.
   ════════════════════════════════════════════════════════════ */
export default function VariantE() {
  const [active, setActive] = useState(0)

  return (
    <div className="bg-white font-sans text-[#0a1628]">
      {/* HERO */}
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-12">
        <div className="grid grid-cols-12 gap-4 border-b border-[#0a1628]/15 pb-3 text-[11px] tracking-widest text-[#0a1628]/40 uppercase">
          <span className="col-span-6">Aerojet Academy</span>
          <span className="col-span-3 hidden sm:block">{HERO.eyebrow}</span>
          <span className="col-span-3 text-right">№ 001</span>
        </div>
        <motion.h1
          {...reveal}
          className="font-outfit mt-10 max-w-5xl text-4xl leading-[1.05] font-medium tracking-tight sm:text-6xl lg:text-[5rem]"
        >
          Your Journey to Becoming a Certified Aircraft Technician Starts Here.
        </motion.h1>
        <motion.div
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.1 }}
          className="mt-10 grid items-end gap-8 lg:grid-cols-[1fr_auto]"
        >
          <p className="max-w-md text-lg leading-relaxed text-[#0a1628]/60">{HERO.subhead}</p>
          <div className="flex gap-4">
            <a
              href="/register"
              className="group hover:border-aerojet-sky hover:text-aerojet-sky inline-flex items-center gap-3 border-b-2 border-[#0a1628] pb-1 text-sm font-medium tracking-wide transition"
            >
              Start Registration <ArrowR className="h-4 w-4 transition group-hover:translate-x-1" />
            </a>
            <a
              href="/courses"
              className="inline-flex items-center gap-3 border-b-2 border-transparent pb-1 text-sm font-medium tracking-wide text-[#0a1628]/50 transition hover:text-[#0a1628]"
            >
              Explore Courses
            </a>
          </div>
        </motion.div>
        <motion.div
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.15 }}
          className="mt-12 overflow-hidden"
        >
          <Img
            src={IMG.aircraftFull}
            className="aspect-21/9 w-full object-cover grayscale transition duration-700 hover:grayscale-0"
          />
        </motion.div>
      </section>

      {/* STATS — hairline table */}
      <section className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 border-t border-[#0a1628]/15 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.06 }}
              className={`py-10 ${i !== 0 ? 'lg:border-l lg:border-[#0a1628]/15 lg:pl-8' : ''}`}
            >
              <div className="text-[11px] tracking-widest text-[#0a1628]/40 uppercase">
                {String(i + 1).padStart(2, '0')} / {s.label}
              </div>
              <div className="font-outfit mt-3 text-4xl font-medium tracking-tight">{s.value}</div>
              <div className="mt-1 text-sm text-[#0a1628]/50">{s.sub}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* WHO WE ARE — minimal split */}
      <section className="mx-auto max-w-7xl px-6 py-28">
        <motion.div {...reveal} className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <div>
            <div className="text-[11px] tracking-widest text-[#0a1628]/40 uppercase">
              — {WHO.eyebrow}
            </div>
            <ul className="mt-8 space-y-px">
              {WHO.includes.map((t) => (
                <li
                  key={t}
                  className="border-t border-[#0a1628]/15 py-3 text-sm tracking-wide text-[#0a1628]/70"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-outfit text-4xl leading-[1.1] font-medium tracking-tight sm:text-5xl">
              {WHO.title}
            </h2>
            <p className="mt-7 text-lg leading-relaxed text-[#0a1628]/60">{WHO.body}</p>
            <p className="mt-4 leading-relaxed text-[#0a1628]/50">{WHO.body2}</p>
          </div>
        </motion.div>
      </section>

      {/* PROGRAMMES — interactive hover-reveal list */}
      <section className="border-y border-[#0a1628]/15">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 text-[11px] tracking-widest text-[#0a1628]/40 uppercase">
            Programmes
          </div>
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              {PROGRAMMES.map((p, i) => (
                <a
                  key={p.title}
                  href={p.href}
                  onMouseEnter={() => setActive(i)}
                  className={`group flex items-baseline gap-6 border-t border-[#0a1628]/15 py-6 transition last:border-b ${active === i ? 'pl-3' : ''}`}
                >
                  <span className="text-sm text-[#0a1628]/40">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`font-outfit text-2xl font-medium tracking-tight transition sm:text-4xl ${active === i ? 'text-aerojet-sky' : ''}`}
                  >
                    {p.title}
                  </span>
                  <ArrowR className="group-hover:text-aerojet-sky ml-auto h-5 w-5 self-center text-[#0a1628]/30 transition group-hover:translate-x-1" />
                </a>
              ))}
            </div>
            <div className="relative hidden overflow-hidden rounded-sm lg:block">
              {PROGRAMMES.map((p, i) => (
                <motion.div
                  key={p.title}
                  animate={{ opacity: active === i ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  <Img
                    src={[IMG.heroA, IMG.engine, IMG.lecture, IMG.takeoff][i]}
                    className="h-full w-full object-cover grayscale"
                  />
                  <div className="absolute inset-0 flex items-end bg-linear-to-t from-[#0a1628]/80 to-transparent p-8">
                    <p className="max-w-sm text-white">{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LICENSING — minimal two columns */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <motion.p
          {...reveal}
          className="mx-auto mb-14 max-w-2xl text-center text-lg leading-relaxed text-[#0a1628]/60"
        >
          {LICENSING.intro}
        </motion.p>
        <div className="grid gap-px bg-[#0a1628]/15 lg:grid-cols-2">
          <motion.div {...reveal} className="bg-white p-8">
            <div className="text-[11px] tracking-widest text-[#0a1628]/40 uppercase">
              Category — B1
            </div>
            <h3 className="font-outfit mt-3 text-2xl font-medium tracking-tight">
              {LICENSING.b1.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#0a1628]/60">{LICENSING.b1.body}</p>
            <div className="mt-6 divide-y divide-[#0a1628]/10 border-t border-[#0a1628]/10 text-sm">
              {LICENSING.b1.rows.map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5">
                  <span className="font-medium">{k}</span>
                  <span className="text-[#0a1628]/50">{v}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.1 }}
            className="bg-white p-8"
          >
            <div className="text-[11px] tracking-widest text-[#0a1628]/40 uppercase">
              Category — B2
            </div>
            <h3 className="font-outfit mt-3 text-2xl font-medium tracking-tight">
              {LICENSING.b2.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#0a1628]/60">{LICENSING.b2.body}</p>
            <ul className="mt-6 space-y-px text-sm">
              {LICENSING.b2.focus.map((f) => (
                <li key={f} className="border-t border-[#0a1628]/10 py-2.5 text-[#0a1628]/70">
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
