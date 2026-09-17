'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface SectionRevealProps {
  children: ReactNode
  delay?: number
  className?: string
  skipInitial?: boolean
}

export default function SectionReveal({
  children,
  delay = 0,
  className = '',
  skipInitial = false,
}: SectionRevealProps) {
  return (
    <motion.div
      initial={skipInitial ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-120px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`relative ${className}`}
    >
      {children}
    </motion.div>
  )
}
