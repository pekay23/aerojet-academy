'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

const slides = [
  {
    src: '/images/hero/hero-slide1.webp',
    headline: 'Your Journey to Becoming a Certified Aircraft Technician Starts Here.',
    subhead:
      'World-class aviation technical training in Accra — structured pathways to EASA Part-66 B1/B2 standards.',
  },
  {
    src: '/images/hero/hero-slide2.webp',
    headline: 'Discipline, Structure, and Excellence in Aviation.',
    subhead: 'Join a cohort of dedicated professionals training for a global career.',
  },
  {
    src: '/images/hero/hero-slide3.webp',
    headline: 'State-of-the-Art Training for a High-Tech Industry.',
    subhead: 'Learn with modern tools and a curriculum designed for real-world MRO environments.',
  },
]

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sectionRef = useRef<HTMLElement>(null)

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
    }, 7000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!paused) startTimer()
    else stopTimer()
    return stopTimer
  }, [paused, startTimer, stopTimer])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const handleMouseEnter = () => setPaused(true)
    const handleMouseLeave = () => setPaused(false)
    const handleFocus = () => setPaused(true)
    const handleBlur = () => setPaused(false)

    el.addEventListener('mouseenter', handleMouseEnter)
    el.addEventListener('mouseleave', handleMouseLeave)
    el.addEventListener('focusin', handleFocus)
    el.addEventListener('focusout', handleBlur)

    return () => {
      el.removeEventListener('mouseenter', handleMouseEnter)
      el.removeEventListener('mouseleave', handleMouseLeave)
      el.removeEventListener('focusin', handleFocus)
      el.removeEventListener('focusout', handleBlur)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-black md:min-h-[80vh]"
      aria-roledescription="carousel"
      aria-label="Hero image slideshow"
    >
      {/* Background Images */}
      {slides.map((slide, index) => (
        <NextImage
          key={index}
          src={slide.src}
          alt="Aerojet Academy background"
          fill // Use `fill` to cover the container
          quality={80} // Reduced for better LCP
          sizes="100vw"
          className={`object-cover transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          priority={index === 0}
        />
      ))}

      {/* Warm Dark Overlay */}
      <div className="absolute inset-0 z-10 bg-linear-to-b from-[#1b2430]/30 via-[#1b2430]/60 to-[#1b2430]/90" />

      {/* Content Area - Centered */}
      <div className="relative z-20 w-full px-6 py-20 text-center md:container md:mx-auto">
        <div className="mx-auto max-w-5xl pt-16">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-6 flex items-center justify-center gap-4 text-[11px] font-bold tracking-[0.35em] text-white/90 uppercase">
                <span className="h-px w-12 bg-white/40" />
                EASA Part-66 · Accra, Ghana
                <span className="h-px w-12 bg-white/40" />
              </div>
              <h1 className="mb-6 font-serif text-4xl leading-[1.06] font-medium tracking-tight text-white md:text-6xl lg:text-7xl">
                {slides[currentSlide].headline.split(' ').map((word, i) => (
                  <span key={i} className="mr-[0.25em] inline-block last:mr-0">
                    {word}
                  </span>
                ))}
              </h1>
              <p className="mx-auto mb-10 max-w-2xl font-serif text-lg font-medium text-gray-200/90 italic md:text-xl">
                {slides[currentSlide].subhead}
              </p>

              <div className="flex flex-wrap justify-center gap-5">
                <Button
                  asChild
                  size="lg"
                  className="bg-aerojet-sky inline-flex h-12 items-center gap-3 rounded-sm px-8 text-[11px] font-bold tracking-[0.25em] text-white uppercase transition hover:bg-[#1b2430]"
                >
                  <Link href="/register">Start Registration</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="inline-flex h-12 items-center rounded-sm border border-white/40 bg-transparent px-8 text-[11px] font-bold tracking-[0.25em] text-white uppercase transition hover:bg-white hover:text-[#1b2430]"
                >
                  <Link href="/courses">Explore Courses</Link>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Pause/Play button (WCAG 2.2.2) - HIDDEN per user request */}
      {/* 
      <button
        onClick={() => setPaused((p) => !p)}
        className="absolute bottom-6 right-6 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
      >
        {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </button>
      */}
    </section>
  )
}
