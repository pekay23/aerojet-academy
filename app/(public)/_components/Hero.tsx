"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface PageHeroProps {
  title: string;
  subtitle: string;
  backgroundImage: string;
}

export default function PageHero({ title, subtitle, backgroundImage }: PageHeroProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Parallax scroll effect from your new hero
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      // Uses the taller height from the old hero but as a Tailwind class
      className="relative w-full h-[70vh] min-h-[420px] overflow-hidden"
    >
      {/* Background with Parallax */}
      <motion.div style={{ y: backgroundY }} className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/60" />
      </motion.div>

      {/* Content with fade-on-scroll */}
      <motion.div
        style={{ opacity: textOpacity }}
        className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6"
      >
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-tight leading-[0.95] max-w-4xl"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 text-base sm:text-lg text-blue-100/80 font-medium max-w-2xl leading-relaxed"
        >
          {subtitle}
        </motion.p>
      </motion.div>

      {/* Bottom fade to white for a smooth transition to page content */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-10" />
    </section>
  );
}
