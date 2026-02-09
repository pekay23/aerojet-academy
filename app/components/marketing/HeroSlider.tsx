"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

const slides = [
  {
    src: "/hero-slide1.jpg",
    headline: "Your Journey to Becoming a Certified Aircraft Technician Starts Here.",
    subhead: "World-class aviation technical training in Accra — structured pathways to EASA Part-66 B1/B2 standards."
  },
  {
    src: "/hero-slide2.jpg",
    headline: "Discipline, Structure, and Excellence in Aviation.",
    subhead: "Join a cohort of dedicated professionals training for a global career."
  },
  {
    src: "/hero-slide3.jpg",
    headline: "State-of-the-Art Training for a High-Tech Industry.",
    subhead: "Learn with modern tools and a curriculum designed for real-world MRO environments."
  },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const isPortalLive = process.env.NEXT_PUBLIC_PORTAL_LIVE === 'true';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 7000); 
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-screen w-full flex items-center justify-center bg-black overflow-hidden">
      {/* Background Images */}
      {slides.map((slide, index) => (
        <Image
          key={index}
          src={slide.src}
          alt="Aerojet Academy background"
          layout="fill"
          objectFit="cover"
          className={`transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          priority={index === 0}
        />
      ))}
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 z-10" />

      {/* Content Area - Centered */}
      <div className="container mx-auto px-6 relative z-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            {slides[currentSlide].headline}
          </h1>
          <p className="text-lg text-gray-200 mb-10 max-w-2xl mx-auto">
            {slides[currentSlide].subhead}
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            {isPortalLive ? (
                <Link href="/register" className="bg-aerojet-sky text-white px-8 py-4 rounded-md font-bold hover:bg-aerojet-soft-blue transition shadow-lg">
                  Start Registration
                </Link>
            ) : (
                <Link href="/contact" className="bg-aerojet-sky text-white px-8 py-4 rounded-md font-bold hover:bg-aerojet-soft-blue transition shadow-lg">
                  Contact Admissions
                </Link>
            )}
            <Link href="/courses" className="border-2 border-white/80 text-white px-8 py-4 rounded-md font-bold hover:bg-white hover:text-aerojet-blue transition">
              Explore Courses
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
