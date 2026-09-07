'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

interface NewsCardProps {
  title: string
  slug: string
  image: string
  date: string
  readTime?: number
  viewCount?: number
  index?: number
  tags?: string[]
  excerpt?: string | null
}

export default function NewsCard({
  title,
  slug,
  image,
  date,
  readTime,
  viewCount: _viewCount,
  index = 0,
  tags = [],
  excerpt,
}: NewsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link
        href={`/newsroom/${slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-500 hover:shadow-2xl sm:rounded-3xl"
      >
        <div className="relative h-52 w-full overflow-hidden bg-slate-100 sm:h-60">
          <NextImage
            src={image}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>

        <div className="flex grow flex-col p-6 sm:p-9">
          <div className="mb-4 flex items-center gap-3 text-xs font-black tracking-[0.25em] text-aerojet-sky uppercase">
            <span>{date}</span>
            {readTime && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                <span>{readTime} Min Read</span>
              </>
            )}
          </div>
          <h3 className="mb-4 line-clamp-2 text-xl leading-tight font-black text-aerojet-blue transition-colors group-hover:text-aerojet-sky sm:text-2xl">
            {title}
          </h3>

          {excerpt && (
            <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {excerpt}
            </p>
          )}

          {tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:bg-slate-900/50"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div className="text-public-secondary mt-auto flex items-center pt-4 text-xs font-black tracking-[0.2em] uppercase">
            Read Full Story
            <ArrowRight className="ml-2 h-3.5 w-3.5 transform transition-transform group-hover:translate-x-2" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
