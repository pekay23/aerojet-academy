'use client'

import Image from 'next/image'
import SectionReveal from './SectionReveal' // We'll wrap this in a reveal for a nice effect

const partners = [
  { name: 'EASA', src: '/images/partners/easa-logo.webp', width: 120, height: 40 },
  { name: 'USTDA', src: '/images/partners/ustda.webp', width: 120, height: 40 },
  { name: 'Ghana Air Force', src: '/images/partners/Airforce-logo.webp', width: 120, height: 40 },
  { name: 'Joramco', src: '/images/partners/Joramco-Logo-AI.webp', width: 120, height: 35 },
  { name: 'Gaptek', src: '/images/partners/Logotip-GAPTEK.webp', width: 120, height: 40 },
  {
    name: 'Aerojet Foundation',
    src: '/images/partners/foundation-logo.webp',
    width: 130,
    height: 40,
  },
]

export default function Credibility() {
  return (
    <section className="bg-slate-50 py-20 sm:py-24">
      <SectionReveal>
        <div className="container mx-auto px-6 text-center">
          <h3 className="mb-12 text-xs font-black tracking-[0.3em] text-slate-500 uppercase">
            Partners & Certification Standards
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 md:gap-x-20">
            {partners.map((partner) => (
              <div
                key={partner.name}
                className="transform opacity-60 grayscale transition-all duration-500 hover:scale-105 hover:opacity-100 hover:grayscale-0"
              >
                <Image
                  src={partner.src}
                  alt={partner.name}
                  width={partner.width}
                  height={partner.height}
                  sizes="(max-width: 768px) 120px, 150px"
                  className="h-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </SectionReveal>
    </section>
  )
}
