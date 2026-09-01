'use client'

import React from 'react'
import { FileText, FileCode, Archive, ExternalLink, Download, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Resource {
  id: string
  name: string
  type: string
  category: string
  url: string
  updatedAt: Date | string
  courseCode?: string
}

interface ResourceCardProps {
  resource: Resource
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  const getFileIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF':
        return <FileText className="h-6 w-6 text-rose-500" />
      case 'DOCX':
        return <FileText className="h-6 w-6 text-blue-500" />
      case 'ZIP':
        return <Archive className="h-6 w-6 text-amber-500" />
      case 'LINK':
        return <ExternalLink className="h-6 w-6 text-emerald-500" />
      default:
        return <FileCode className="h-6 w-6 text-slate-500" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toUpperCase()) {
      case 'ACADEMIC':
        return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
      case 'ADMINISTRATIVE':
        return 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
      case 'EXAMINATION':
        return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
    }
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white transition-all hover:border-blue-100 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900/30"
    >
      <div className="flex flex-1 flex-col p-6">
        {/* Icon & Category */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800">
            {getFileIcon(resource.type)}
          </div>
          <span
            className={cn(
              'rounded-lg border px-2 py-0.5 text-[9px] font-black tracking-widest uppercase',
              getCategoryColor(resource.category)
            )}
          >
            {resource.category}
          </span>
        </div>

        {/* Title */}
        <div className="mb-4 flex-1">
          {resource.courseCode && (
            <span className="mb-1 text-[10px] font-black text-aerojet-sky uppercase">
              {resource.courseCode}
            </span>
          )}
          <h3 className="line-clamp-2 text-sm font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
            {resource.name}
          </h3>
        </div>

        {/* Footer Meta */}
        <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
            <Clock className="h-3 w-3" />
            {new Date(resource.updatedAt).toLocaleDateString([], {
              month: 'short',
              year: 'numeric',
            })}
          </div>

          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition-all hover:bg-blue-500 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600"
            title={resource.type === 'LINK' ? 'Open link' : 'Download file'}
          >
            {resource.type === 'LINK' ? (
              <ExternalLink className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </a>
        </div>
      </div>
    </MotionDiv>
  )
}
