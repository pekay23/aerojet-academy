'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

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
  viewCount,
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
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>

        <div className="flex grow flex-col p-6 sm:p-8">
          <div className="mb-3 flex items-center gap-3 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            <span>{date}</span>
            {readTime && (
              <>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>{readTime} Min Read</span>
              </>
            )}
          </div>
          <h3 className="text-public-primary group-hover:text-public-secondary mb-4 line-clamp-2 text-lg leading-tight font-black transition-colors sm:text-xl">
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
                  className="rounded-full bg-slate-50 px-2 py-0.5 text-[9px] font-bold tracking-wider text-slate-500 uppercase dark:bg-slate-900/50"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div className="text-public-secondary mt-auto flex items-center pt-4 text-[10px] font-black tracking-[0.2em] uppercase">
            Read Full Story
            <span
              className="ml-2 transform transition-transform group-hover:translate-x-2"
              aria-hidden="true"
            >
              →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
