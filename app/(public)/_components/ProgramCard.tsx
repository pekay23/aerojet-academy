'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  GraduationCap,
  Clock,
  Users,
  BookOpen,
  FileCheck,
  RefreshCw,
  type LucideProps,
} from 'lucide-react'
import { ElementType } from 'react'

// Create a map to look up the icon component from a string
const iconMap: { [key: string]: ElementType<LucideProps> } = {
  graduationCap: GraduationCap,
  clock: Clock,
  users: Users,
  bookOpen: BookOpen,
  fileCheck: FileCheck,
  refreshCw: RefreshCw,
}

interface ProgramCardProps {
  title: string
  description: string
  href: string
  icon: string // <-- FIX: Prop is now a string identifier
  badge?: string
  badgeColor?: string
  index?: number
}

export default function ProgramCard({
  title,
  description,
  href,
  icon, // <-- This is now a string, like "graduationCap"
  badge,
  badgeColor = 'bg-public-secondary',
  index = 0,
}: ProgramCardProps) {
  // FIX: Look up the correct component from the map
  const Icon = iconMap[icon]

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link
        href={href}
        className="group hover:border-public-secondary relative block h-full rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-500 hover:shadow-2xl sm:rounded-3xl sm:p-8"
      >
        {badge && (
          <span
            className={`absolute top-4 right-4 ${badgeColor} rounded-full px-2.5 py-1 text-xs font-black tracking-widest text-white uppercase`}
          >
            {badge}
          </span>
        )}
        <div className="group-hover:bg-public-primary mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 transition-colors duration-300">
          {/* Render the looked-up icon component */}
          {Icon && (
            <Icon
              className="text-public-primary h-6 w-6 transition-colors duration-300 group-hover:text-white"
              aria-hidden="true"
            />
          )}
        </div>
        <h3 className="group-hover:text-public-primary mb-2 text-lg font-bold text-slate-900 transition-colors sm:text-xl">
          {title}
        </h3>
        <p className="mb-6 line-clamp-3 text-base leading-relaxed text-slate-600">{description}</p>
        <span className="text-public-secondary inline-flex items-center gap-2 text-sm font-black tracking-widest uppercase transition-all duration-300 group-hover:gap-3">
          Learn More <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </Link>
    </motion.div>
  )
}
