'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button' // Using ShadCN button for consistency

const slides = [
  {
    src: '/images/hero/hero-slide1.jpg',
    headline: 'Your Journey to Becoming a Certified Aircraft Technician Starts Here.',
    subhead:
      'World-class aviation technical training in Accra — structured pathways to EASA Part-66 B1/B2 standards.',
  },
  {
    src: '/images/hero/hero-slide2.jpg',
    headline: 'Discipline, Structure, and Excellence in Aviation.',
    subhead: 'Join a cohort of dedicated professionals training for a global career.',
  },
  {
    src: '/images/hero/hero-slide3.jpg',
    headline: 'State-of-the-Art Training for a High-Tech Industry.',
    subhead: 'Learn with modern tools and a curriculum designed for real-world MRO environments.',
  },
]

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  return (
    // ===== FIX: Changed h-screen to h-[70vh] =====
    <section className="relative flex h-[70vh] w-full items-center justify-center overflow-hidden bg-black">
      {/* Background Images */}
      {slides.map((slide, index) => (
        <Image
          key={index}
          src={slide.src}
          alt="Aerojet Academy background"
          fill // Use `fill` to cover the container
          // quality={80}
          className={`object-cover transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          priority={index === 0}
        />
      ))}

      {/* Dark Overlay using modern Tailwind syntax */}
      <div className="absolute inset-0 z-10 bg-linear-to-b from-black/20 via-black/60 to-black/80" />

      {/* Content Area - Centered */}
      <div className="relative z-20 container mx-auto px-6 text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-4xl leading-tight font-black text-white md:text-5xl lg:text-6xl">
            {slides[currentSlide].headline}
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-200">
            {slides[currentSlide].subhead}
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-public-secondary hover:bg-opacity-90 text-white"
            >
              <Link href="/register">Start Registration</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="hover:text-public-primary border-2 border-white/80 bg-transparent text-white transition-colors duration-300 hover:bg-white"
            >
              <Link href="/courses">Explore Courses</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
