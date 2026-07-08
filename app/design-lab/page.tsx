'use client'

import { useState } from 'react'
import VariantA from './variants/VariantA'
import VariantB from './variants/VariantB'
import VariantC from './variants/VariantC'
import VariantD from './variants/VariantD'
import VariantE from './variants/VariantE'
import { FeedbackOverlay } from './FeedbackOverlay'

const VARIANTS = [
  {
    id: 'A',
    name: 'Flightline · Cinematic Aerospace',
    ref: 'cf. Airbus / Rolls-Royce / Boeing',
    blurb:
      'Immersive full-bleed photography, deep navy, refined large type, cinematic parallax. Sells prestige and scale.',
    Comp: VariantA,
  },
  {
    id: 'B',
    name: 'Hangar Systems · Technical Blueprint',
    ref: 'cf. Lufthansa Technik / SR Technics MRO',
    blurb:
      'Charcoal, blueprint grid, monospace data, corner brackets, licence spec-sheets. Sells engineering credibility.',
    Comp: VariantB,
  },
  {
    id: 'C',
    name: 'Academy Journal · Editorial Institutional',
    ref: 'cf. Embry-Riddle / heritage universities',
    blurb:
      'Warm paper, serif display, ruled lines, drop-cap, column grid. Sells trust, rigour and an established institution.',
    Comp: VariantC,
  },
  {
    id: 'D',
    name: 'Vector · Modern Kinetic Bold',
    ref: 'cf. design-forward aviation / startup brands',
    blurb:
      'Bright, high-contrast, oversized type, electric accent, marquee, colour blocks, springy motion. Sells energy and ambition.',
    Comp: VariantD,
  },
  {
    id: 'E',
    name: 'Meridian · Swiss Precision Minimal',
    ref: 'cf. Apple / premium Swiss-grid design',
    blurb:
      'Near-monochrome, hairlines, vast whitespace, tiny labels, hover-reveal. Sells calm, premium confidence.',
    Comp: VariantE,
  },
]

export default function DesignLabPage() {
  const [view, setView] = useState<string>('ALL')
  const shown = view === 'ALL' ? VARIANTS : VARIANTS.filter((v) => v.id === view)

  return (
    <div className="min-h-screen bg-slate-200">
      {/* Sticky switcher */}
      <div className="sticky top-0 z-50 border-b border-slate-300 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3">
          <span className="font-outfit text-aerojet-blue mr-2 text-sm font-black">
            Aerojet · Homepage Design Lab
          </span>
          <button onClick={() => setView('ALL')} className={tab(view === 'ALL')}>
            All
          </button>
          {VARIANTS.map((v) => (
            <button key={v.id} onClick={() => setView(v.id)} className={tab(view === v.id)}>
              {v.id} · {v.name.split(' · ')[0]}
            </button>
          ))}
          <span className="ml-auto hidden text-xs text-slate-500 sm:block">
            Resize the window to test responsiveness
          </span>
        </div>
      </div>

      <p className="mx-auto max-w-7xl px-4 py-4 text-sm text-slate-600">
        Five distinct directions for the homepage, each modelled on how a different class of top
        aviation/aerospace brand presents itself. All copy is the <strong>real site content</strong>
        ; imagery is the project&rsquo;s own aviation library (treated differently per style) and
        stands in for a final academy photo shoot. Use <strong>＋ Add feedback</strong>{' '}
        (bottom-right) to click any element and leave notes — or just tell me in chat.
      </p>

      <main className="space-y-10 pb-32">
        {shown.map((v) => (
          <section key={v.id} data-variant={v.id}>
            <div className="mx-auto max-w-7xl px-4">
              <div className="bg-aerojet-blue flex flex-col gap-1 rounded-t-2xl border border-b-0 border-slate-300 px-5 py-4 text-white">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-outfit text-lg font-black">
                    Variant {v.id} — {v.name}
                  </span>
                  <span className="text-aerojet-sky font-mono text-[11px] tracking-wide">
                    {v.ref}
                  </span>
                </div>
                <p className="text-sm text-white/70">{v.blurb}</p>
              </div>
            </div>
            <div className="mx-auto max-w-7xl px-4">
              <div className="overflow-hidden rounded-b-2xl border border-slate-300 shadow-xl">
                <v.Comp />
              </div>
            </div>
          </section>
        ))}
      </main>

      <FeedbackOverlay targetName="PublicHomepage" />
    </div>
  )
}

function tab(active: boolean) {
  return `rounded-full px-3 py-1.5 text-xs font-bold transition ${
    active ? 'bg-aerojet-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
  }`
}
