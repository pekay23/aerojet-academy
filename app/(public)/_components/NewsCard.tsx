"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface NewsCardProps {
  title: string;
  slug: string;
  image: string;
  category: string;
  date: string;
  index?: number;
}

export default function NewsCard({ title, slug, image, category, date, index = 0 }: NewsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link
        href={`/newsroom/${slug}`}
        className="group bg-white rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-100 flex flex-col h-full"
      >
        <div className="relative h-52 sm:h-60 w-full bg-slate-100 overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
            <p className="text-[10px] font-black text-[#4c9ded] uppercase tracking-widest">{category}</p>
          </div>
        </div>

        <div className="p-6 sm:p-8 grow flex flex-col">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{date}</p>
          <h3 className="text-lg sm:text-xl font-black text-[#002a5c] leading-tight mb-4 group-hover:text-[#4c9ded] transition-colors line-clamp-2">
            {title}
          </h3>
          <div className="mt-auto pt-4 flex items-center text-[#4c9ded] font-black uppercase text-[10px] tracking-[0.2em]">
            Read Full Story
            <span className="ml-2 transform group-hover:translate-x-2 transition-transform">→</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}