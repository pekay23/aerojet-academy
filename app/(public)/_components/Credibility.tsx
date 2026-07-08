'use client'

import Image from 'next/image'
import SectionReveal from './SectionReveal' // We'll wrap this in a reveal for a nice effect

const partners = [
  { name: 'EASA', src: '/images/partners/easa-logo.webp', width: 200, height: 65 },
  { name: 'USTDA', src: '/images/partners/ustda.webp', width: 200, height: 65 },
  { name: 'Ghana Air Force', src: '/images/partners/Airforce-logo.webp', width: 200, height: 65 },
  {
    name: 'Joramco',
    src: '/images/partners/Joramco-Logo-AI.webp',
    width: 200,
    height: 60,
    priority: true,
  },
  { name: 'Gaptek', src: '/images/partners/Logotip-GAPTEK.webp', width: 200, height: 65 },
  {
    name: 'Aerojet Foundation',
    src: '/images/partners/foundation-logo.webp',
    width: 210,
    height: 65,
  },
]

export default function Credibility() {
  return (
    <section className="border-y border-[#1b2430]/15 py-20 sm:py-24">
      <SectionReveal>
        <div className="container mx-auto px-6 text-center">
          <h3 className="mb-12 font-serif text-lg font-medium tracking-wide text-[#1b2430]/60">
            Partners & Certification Standards
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 md:gap-x-20">
            {partners.map((partner) => (
              <div
                key={partner.name}
                className="transition-all duration-500 md:opacity-80 md:grayscale md:hover:scale-105 md:hover:opacity-100 md:hover:grayscale-0"
              >
                <Image
                  src={partner.src}
                  alt={partner.name}
                  width={partner.width}
                  height={partner.height}
                  priority={partner.priority}
                  sizes="(max-width: 768px) 160px, 200px"
                  className="h-12 w-auto object-contain sm:h-14"
                />
              </div>
            ))}
          </div>
        </div>
      </SectionReveal>
    </section>
  )
}
