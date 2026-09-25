'use client'

import { motion } from 'framer-motion'
import { HERO, STATS, LICENSING, PROGRAMMES, JOURNEY, IMG, Img, ArrowR } from '../shared'

const ease = [0.22, 1, 0.36, 1] as const
const reveal = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease },
}
const grid =
  'bg-[linear-gradient(rgba(120,170,220,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(120,170,220,0.08)_1px,transparent_1px)] bg-[size:32px_32px]'

function Bracket({ className = '' }: { className?: string }) {
  return (
    <span
      className={`border-aerojet-sky/60 pointer-events-none absolute h-4 w-4 ${className}`}
      aria-hidden
    />
  )
}

/* ════════════════════════════════════════════════════════════
   B — "HANGAR SYSTEMS" · TECHNICAL BLUEPRINT
   Inspired by Lufthansa Technik / SR Technics MRO sites:
   charcoal, blueprint grid, monospace data, corner brackets,
   schematic precision. Sells engineering credibility.
   ════════════════════════════════════════════════════════════ */
export default function VariantB() {
  return (
    <div className={`bg-[#0b0e13] font-sans text-slate-100 ${grid}`}>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-24">
          <div>
            <div className="text-aerojet-sky flex items-center gap-3 font-mono text-[11px] tracking-widest">
              <span className="bg-aerojet-sky h-2 w-2 animate-pulse rounded-full" />
              <span>SYS // {HERO.eyebrow.toUpperCase()}</span>
            </div>
            <h1 className="font-outfit mt-6 text-4xl leading-[1.05] font-black tracking-tight sm:text-5xl lg:text-6xl">
              Your Journey to a Certified{' '}
              <span className="text-aerojet-sky">Aircraft Technician</span> Starts Here.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-400">{HERO.subhead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/register"
                className="bg-aerojet-sky inline-flex h-12 items-center gap-3 rounded-md px-7 font-mono text-xs font-bold tracking-widest text-[#0b0e13] uppercase transition hover:bg-white"
              >
                ▸ Start Registration
              </a>
              <a
                href="/courses"
                className="hover:border-aerojet-sky hover:text-aerojet-sky inline-flex h-12 items-center rounded-md border border-white/20 px-7 font-mono text-xs font-bold tracking-widest uppercase transition"
              >
                Explore Courses
              </a>
            </div>
          </div>
          <div className="relative">
            <Bracket className="-top-2 -left-2 border-t-2 border-l-2" />
            <Bracket className="-top-2 -right-2 border-t-2 border-r-2" />
            <Bracket className="-bottom-2 -left-2 border-b-2 border-l-2" />
            <Bracket className="-right-2 -bottom-2 border-r-2 border-b-2" />
            <div className="overflow-hidden rounded-md grayscale">
              <Img src={IMG.engine} className="aspect-4/3 w-full object-cover" />
            </div>
            <div className="text-aerojet-sky absolute bottom-3 left-3 rounded bg-black/70 px-3 py-1.5 font-mono text-[10px] tracking-widest backdrop-blur">
              FIG.01 — POWERPLANT / CROSS-SECTION
            </div>
          </div>
        </div>
      </section>

      {/* STATS telemetry */}
      <section className="border-b border-white/10 bg-black/20">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-white/10 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.06 }}
              className="bg-[#0b0e13] px-6 py-8"
            >
              <div className="text-aerojet-sky font-mono text-[10px] tracking-widest">
                [0{i + 1}]
              </div>
              <div className="font-outfit mt-2 text-2xl font-black">{s.value}</div>
              <div className="mt-1 text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* JOURNEY — process line */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <motion.div
          {...reveal}
          className="text-aerojet-sky mb-10 font-mono text-[11px] tracking-[0.3em] uppercase"
        >
          {'// Training Sequence'}
        </motion.div>
        <div className="grid gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 lg:grid-cols-3">
          {JOURNEY.map((j, i) => (
            <motion.div
              key={j.k}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.08 }}
              className="bg-[#0b0e13] p-7"
            >
              <div className="text-aerojet-sky font-mono text-sm">STEP_{i + 1}</div>
              <h3 className="font-outfit mt-3 text-lg font-bold">{j.k}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{j.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* LICENSING — spec sheets */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <motion.div
          {...reveal}
          className="text-aerojet-sky mb-3 font-mono text-[11px] tracking-[0.3em] uppercase"
        >
          {'// Licence Specification'}
        </motion.div>
        <motion.p {...reveal} className="mb-10 max-w-3xl text-slate-400">
          {LICENSING.intro}
        </motion.p>
        <div className="grid gap-5 lg:grid-cols-2">
          <motion.div {...reveal} className="rounded-md border border-white/10 bg-white/3 p-7">
            <div className="flex items-center justify-between">
              <h3 className="font-outfit text-xl font-black">{LICENSING.b1.title}</h3>
              <span className="border-aerojet-sky/50 text-aerojet-sky rounded border px-2 py-0.5 font-mono text-[11px]">
                B1
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{LICENSING.b1.body}</p>
            <div className="mt-5 divide-y divide-white/10 border-y border-white/10 font-mono text-sm">
              {LICENSING.b1.rows.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-2.5">
                  <span className="text-aerojet-sky">{k}</span>
                  <span className="text-slate-300">{v}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.1 }}
            className="rounded-md border border-white/10 bg-white/3 p-7"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-outfit text-xl font-black">{LICENSING.b2.title}</h3>
              <span className="rounded border border-amber-400/50 px-2 py-0.5 font-mono text-[11px] text-amber-400">
                B2
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{LICENSING.b2.body}</p>
            <ul className="mt-5 grid gap-2 font-mono text-sm text-slate-300">
              {LICENSING.b2.focus.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <span className="text-amber-400">›</span>
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* PROGRAMMES — terminal list */}
      <section className="border-t border-white/10 bg-black/20">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <motion.div
            {...reveal}
            className="text-aerojet-sky mb-8 font-mono text-[11px] tracking-[0.3em] uppercase"
          >
            {'// Programmes'}
          </motion.div>
          <div className="overflow-hidden rounded-md border border-white/10 font-mono">
            {PROGRAMMES.map((p, i) => (
              <motion.a
                key={p.title}
                href={p.href}
                {...reveal}
                transition={{ ...reveal.transition, delay: i * 0.05 }}
                className="group hover:bg-aerojet-sky/10 flex items-center gap-4 border-b border-white/10 px-5 py-5 transition last:border-b-0"
              >
                <span className="text-aerojet-sky">P-0{i + 1}</span>
                <span className="font-outfit text-lg font-bold tracking-tight transition group-hover:translate-x-1">
                  {p.title}
                </span>
                {p.badge && (
                  <span className="border-aerojet-sky/50 text-aerojet-sky rounded border px-2 py-0.5 text-[10px] tracking-widest uppercase">
                    {p.badge}
                  </span>
                )}
                <span className="ml-auto hidden max-w-md truncate text-xs text-slate-500 lg:block">
                  {p.desc}
                </span>
                <ArrowR className="text-aerojet-sky h-4 w-4 shrink-0 transition group-hover:translate-x-1" />
              </motion.a>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
