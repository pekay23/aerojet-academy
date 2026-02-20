"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  GraduationCap,
  Clock,
  Users,
  BookOpen,
  FileCheck,
  RefreshCw,
  type LucideProps
} from "lucide-react";
import { ElementType } from "react";

// Create a map to look up the icon component from a string
const iconMap: { [key: string]: ElementType<LucideProps> } = {
  graduationCap: GraduationCap,
  clock: Clock,
  users: Users,
  bookOpen: BookOpen,
  fileCheck: FileCheck,
  refreshCw: RefreshCw,
};

interface ProgramCardProps {
  title: string;
  description: string;
  href: string;
  icon: string; // <-- FIX: Prop is now a string identifier
  badge?: string;
  badgeColor?: string;
  index?: number;
}

export default function ProgramCard({
  title,
  description,
  href,
  icon, // <-- This is now a string, like "graduationCap"
  badge,
  badgeColor = "bg-[#4c9ded]",
  index = 0,
}: ProgramCardProps) {

  // FIX: Look up the correct component from the map
  const Icon = iconMap[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link
        href={href}
        className="group relative block bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:shadow-2xl hover:border-[#4c9ded] transition-all duration-500 h-full"
      >
        {badge && (
          <span className={`absolute top-4 right-4 ${badgeColor} text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full`}>
            {badge}
          </span>
        )}
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-[#002a5c] transition-colors duration-300">
          {/* Render the looked-up icon component */}
          {Icon && <Icon className="w-6 h-6 text-[#002a5c] group-hover:text-white transition-colors duration-300" />}
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 group-hover:text-[#002a5c] transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-6 line-clamp-3">{description}</p>
        <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#4c9ded] group-hover:gap-3 transition-all duration-300">
          Learn More <ArrowRight className="w-4 h-4" />
        </span>
      </Link>
    </motion.div>
  );
}