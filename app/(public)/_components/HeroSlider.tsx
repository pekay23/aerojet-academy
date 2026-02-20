"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"; // Using ShadCN button for consistency

const slides = [
  {
    src: "/images/hero/hero-slide1.jpg",
    headline: "Your Journey to Becoming a Certified Aircraft Technician Starts Here.",
    subhead: "World-class aviation technical training in Accra — structured pathways to EASA Part-66 B1/B2 standards."
  },
  {
    src: "/images/hero/hero-slide2.jpg",
    headline: "Discipline, Structure, and Excellence in Aviation.",
    subhead: "Join a cohort of dedicated professionals training for a global career."
  },
  {
    src: "/images/hero/hero-slide3.jpg",
    headline: "State-of-the-Art Training for a High-Tech Industry.",
    subhead: "Learn with modern tools and a curriculum designed for real-world MRO environments."
  },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 7000); 
    return () => clearInterval(timer);
  }, []);

  return (
    // ===== FIX: Changed h-screen to h-[70vh] =====
    <section className="relative h-[70vh] w-full flex items-center justify-center bg-black overflow-hidden">
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
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 z-10" />

      {/* Content Area - Centered */}
      <div className="container mx-auto px-6 relative z-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
            {slides[currentSlide].headline}
          </h1>
          <p className="text-lg text-gray-200 mb-10 max-w-2xl mx-auto">
            {slides[currentSlide].subhead}
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
    <Button asChild size="lg" className="bg-public-secondary text-white hover:bg-opacity-90">
        <Link href="/register">Start Registration</Link>
    </Button>
    <Button asChild size="lg" variant="outline" className="border-2 border-white/80 text-white bg-transparent hover:bg-white hover:text-public-primary transition-colors duration-300">
        <Link href="/courses">Explore Courses</Link>
    </Button>
</div>
        </div>
      </div>
    </section>
  );
}
