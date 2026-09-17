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

interface StudentResourceCardProps {
  resource: Resource
}

export default function StudentResourceCard({ resource }: StudentResourceCardProps) {
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
      case 'STUDENT_GUIDE':
        return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
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

  const humanCategory = (category: string) =>
    category
      .toLowerCase()
      .split('_')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ')

  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-100 bg-white/70 backdrop-blur-md p-6 transition-all duration-300 hover:border-blue-200/50 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-blue-800/40"
    >
      <div className="absolute inset-0 bg-linear-to-br from-blue-50/0 to-indigo-50/0 opacity-0 transition-opacity duration-300 group-hover:from-blue-50/30 group-hover:to-indigo-50/30 dark:group-hover:from-blue-900/5 dark:group-hover:to-indigo-900/5 group-hover:opacity-100" />

      <div className="relative flex flex-1 flex-col">
        {/* Top Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-sm transition-transform duration-300 group-hover:scale-105 dark:bg-slate-800 dark:border-slate-700">
            {getFileIcon(resource.type)}
          </div>
          <span
            className={cn(
              'rounded-xl border px-3 py-1 text-[10px] font-black tracking-widest uppercase transition-colors duration-300',
              getCategoryColor(resource.category)
            )}
          >
            {humanCategory(resource.category)}
          </span>
        </div>

        {/* Title */}
        <div className="mb-5 flex-1">
          {resource.courseCode && (
            <div className="mb-2 inline-flex rounded-md bg-slate-50 border border-slate-100 px-2 py-0.5 font-mono text-[9px] font-black tracking-tight text-slate-400 uppercase dark:bg-slate-800/50 dark:border-slate-800">
              {resource.courseCode}
            </div>
          )}
          <h3 className="line-clamp-2 text-sm font-black text-slate-900 leading-snug tracking-tight transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
            {resource.name}
          </h3>
        </div>

        {/* Action Bottom Section */}
        <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
            <Clock className="h-3 w-3 text-slate-300" />
            {new Date(resource.updatedAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>

          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500 transition-all duration-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-blue-600 dark:hover:border-blue-600"
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
    </motion.div>
  )
}
