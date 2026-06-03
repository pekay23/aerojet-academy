'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SectionReveal from './SectionReveal'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const partners = [
  { name: 'EASA', src: '/images/partners/easa-logo.webp', width: 200, height: 65 },
  { name: 'USTDA', src: '/images/partners/ustda.webp', width: 200, height: 65 },
  { name: 'Ghana Air Force', src: '/images/partners/Airforce-logo.webp', width: 200, height: 65 },
  { name: 'Joramco', src: '/images/partners/Joramco-Logo-AI.webp', width: 200, height: 60 },
  { name: 'Gaptek', src: '/images/partners/Logotip-GAPTEK.webp', width: 200, height: 65 },
  {
    name: 'Aerojet Foundation',
    src: '/images/partners/foundation-logo.webp',
    width: 210,
    height: 65,
  },
]

export default function Credibility() {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    gsap.from('.partner-logo', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 85%',
      },
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'back.out(1.7)'
    })
  }, { scope: containerRef })

  return (
    <section ref={containerRef} className="bg-paper-dark border-y border-[#1b2430]/15 py-20 sm:py-24">
      <SectionReveal>
        <div className="container mx-auto px-6 text-center">
          <h3 className="mb-12 font-serif text-lg font-medium tracking-wide text-[#1b2430]/60">
            Partners & Certification Standards
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 md:gap-x-20">
            {partners.map((partner) => (
              <div
                key={partner.name}
                className="partner-logo transition-all duration-500 hover:scale-105"
              >
                <Image
                  src={partner.src}
                  alt={partner.name}
                  width={partner.width}
                  height={partner.height}
                  priority
                  sizes="(max-width: 768px) 160px, 200px"
                  className="h-12 w-auto object-contain mix-blend-multiply sm:h-14"
                />
              </div>
            ))}
          </div>
        </div>
      </SectionReveal>
    </section>
  )
}
