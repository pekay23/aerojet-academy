'use client'

import { motion } from 'framer-motion'
import { HERO, STATS, PROGRAMMES, CAREERS, ENROLL, IMG, Img, ArrowR } from '../shared'

const spring = { type: 'spring' as const, stiffness: 120, damping: 18 }
const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-70px' },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
}

/* ════════════════════════════════════════════════════════════
   D — "VECTOR" · MODERN KINETIC BOLD
   Inspired by design-forward aviation/startup brands: bright,
   high-contrast, oversized type, electric accent, marquee, color
   blocks, springy motion. Sells energy + ambition to young talent.
   ════════════════════════════════════════════════════════════ */
export default function VariantD() {
  return (
    <div className="bg-white font-sans text-[#0a1628]">
      {/* HERO */}
      <section className="mx-auto max-w-7xl px-5 pt-12 pb-8 sm:px-6">
        <motion.div {...reveal} className="bg-aerojet-blue rounded-4xl p-7 text-white sm:p-12">
          <span className="bg-aerojet-sky inline-block rounded-full px-4 py-1.5 text-[11px] font-black tracking-widest uppercase">
            {HERO.eyebrow}
          </span>
          <h1 className="font-outfit mt-7 text-5xl leading-[0.95] font-black tracking-tighter sm:text-7xl lg:text-8xl">
            CERTIFIED
            <br />
            <span className="text-aerojet-sky">AIRCRAFT</span>
            <br />
            TECHNICIAN.
          </h1>
          <div className="mt-8 grid items-end gap-8 lg:grid-cols-[1.2fr_1fr]">
            <p className="max-w-xl text-lg text-white/80">{HERO.subhead}</p>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <a
                href="/register"
                className="text-aerojet-blue inline-flex h-14 items-center gap-3 rounded-full bg-white px-8 text-xs font-black tracking-widest uppercase transition hover:scale-105"
              >
                Start Registration <ArrowR className="h-4 w-4" />
              </a>
              <a
                href="/courses"
                className="inline-flex h-14 items-center rounded-full border-2 border-white/40 px-8 text-xs font-black tracking-widest uppercase transition hover:bg-white/10"
              >
                Explore Courses
              </a>
            </div>
          </div>
          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.15 }}
            className="mt-8 overflow-hidden rounded-2xl"
          >
            <Img src={IMG.heroB} className="aspect-21/9 w-full object-cover" />
          </motion.div>
        </motion.div>
      </section>

      {/* MARQUEE stats */}
      <section className="bg-aerojet-sky overflow-hidden border-y-2 border-[#0a1628] py-4">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="flex w-max gap-12 whitespace-nowrap"
        >
          {[...STATS, ...STATS, ...STATS, ...STATS].map((s, i) => (
            <span
              key={i}
              className="font-outfit flex items-center gap-3 text-xl font-black text-white"
            >
              {s.value}
              <span className="text-sm font-bold text-white/80">{s.label}</span>
              <span>✦</span>
            </span>
          ))}
        </motion.div>
      </section>

      {/* PROGRAMMES — bold color cards */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6">
        <motion.h2
          {...reveal}
          className="font-outfit mb-8 text-4xl font-black tracking-tighter sm:text-6xl"
        >
          CHOOSE YOUR <span className="text-aerojet-sky">PATHWAY</span>
        </motion.h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROGRAMMES.map((p, i) => {
            const bg = [
              'bg-aerojet-blue text-white',
              'bg-aerojet-sky text-white',
              'bg-[#0a1628] text-white',
              'bg-slate-100 text-aerojet-blue',
            ][i]
            return (
              <motion.a
                key={p.title}
                href={p.href}
                {...reveal}
                transition={{ ...reveal.transition, delay: i * 0.07 }}
                whileHover={{ y: -8 }}
                className={`group flex min-h-64 flex-col justify-between rounded-3xl p-7 ${bg}`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-outfit text-5xl font-black opacity-30">0{i + 1}</span>
                  {p.badge && (
                    <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                      {p.badge}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-outfit text-2xl leading-tight font-black">{p.title}</h3>
                  <p className="mt-2 text-sm opacity-80">{p.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-black tracking-widest uppercase">
                    Learn more <ArrowR className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </motion.a>
            )
          })}
        </div>
      </section>

      {/* CAREERS — big tag cloud */}
      <section className="bg-[#0a1628] text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6">
          <motion.h2
            {...reveal}
            className="font-outfit text-4xl font-black tracking-tighter sm:text-6xl"
          >
            A CAREER THAT TAKES YOU <span className="text-aerojet-sky">ANYWHERE</span>
          </motion.h2>
          <p className="mt-4 max-w-2xl text-white/70">
            An EASA Part-66 license opens doors worldwide. Our graduates work across:
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {CAREERS.map((c, i) => (
              <motion.span
                key={c}
                {...reveal}
                transition={{ ...reveal.transition, delay: i * 0.06 }}
                whileHover={{ scale: 1.05 }}
                className="font-outfit hover:border-aerojet-sky hover:bg-aerojet-sky/10 rounded-full border border-white/20 px-6 py-3 text-lg font-bold transition"
              >
                {c}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ENROLLMENT */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6">
        <motion.h2
          {...reveal}
          className="font-outfit mb-8 text-4xl font-black tracking-tighter sm:text-6xl"
        >
          FOUR SIMPLE STEPS
        </motion.h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ENROLL.map((s, i) => (
            <motion.div
              key={s.n}
              {...reveal}
              transition={{ ...spring, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="rounded-3xl border-2 border-[#0a1628] p-7"
            >
              <div className="font-outfit text-aerojet-sky text-6xl font-black">{s.n}</div>
              <h3 className="font-outfit mt-4 text-xl font-black">{s.t}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
