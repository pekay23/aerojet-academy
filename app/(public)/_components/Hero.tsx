'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

interface PageHeroProps {
  title: string
  subtitle: string
  backgroundImage: string
}

export default function PageHero({ title, subtitle, backgroundImage }: PageHeroProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Parallax scroll effect from your new hero
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const textOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section
      ref={ref}
      // Uses the taller height from the old hero but as a Tailwind class
      className="relative h-[70vh] min-h-[420px] w-full overflow-hidden"
    >
      {/* Background with Parallax */}
      <motion.div style={{ y: backgroundY }} className="absolute inset-0">
        <Image
          src={backgroundImage}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/60" />
      </motion.div>

      {/* Content with fade-on-scroll */}
      <motion.div
        style={{ opacity: textOpacity }}
        className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl text-4xl leading-[0.95] font-black tracking-tight text-white uppercase sm:text-5xl md:text-6xl"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-2xl text-base leading-relaxed font-medium text-blue-100/80 sm:text-lg"
        >
          {subtitle}
        </motion.p>
      </motion.div>

      {/* Bottom fade to white for a smooth transition to page content */}
      <div className="absolute right-0 bottom-0 left-0 z-10 h-24 bg-linear-to-t from-white to-transparent" />
    </section>
  )
}
