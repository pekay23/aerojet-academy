'use client'

import React, { useState, useMemo } from 'react'
import { Search, Filter, BookOpen, GraduationCap, ClipboardList, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ResourceCard from './ResourceCard'

interface Resource {
  id: string
  name: string
  type: string
  category: string
  url: string
  updatedAt: Date | string
  courseCode?: string
}

interface ResourcesViewProps {
  initialResources: Resource[]
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Resources', icon: BookOpen },
  { id: 'ACADEMIC', label: 'Academic', icon: GraduationCap },
  { id: 'ADMINISTRATIVE', label: 'Administrative', icon: ClipboardList },
  { id: 'EXAMINATION', label: 'Examination', icon: Shield },
  { id: 'INSTITUTIONAL', label: 'Institutional', icon: BookOpen },
]

export default function ResourcesView({ initialResources }: ResourcesViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('ALL')

  const filteredResources = useMemo(() => {
    return initialResources.filter((resource) => {
      const matchesSearch =
        resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.courseCode?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategory === 'ALL' || resource.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [initialResources, searchQuery, activeCategory])

  return (
    <div className="flex flex-col space-y-8">
      {/* Search and Filters */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-lg flex-1">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by module code or file name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-100 bg-white py-3 pr-4 pl-11 text-sm font-medium text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-900/40 dark:focus:ring-blue-900/20"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={withBadge(
                  'flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all',
                  isActive
                    ? 'border-[#4c9ded] bg-[#4c9ded] text-white'
                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {filteredResources.length > 0 ? (
            filteredResources.map((resource) => (
              <motion.div
                key={resource.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <ResourceCard resource={resource} />
              </motion.div>
            ))
          ) : (
            <motion.div
              className="col-span-full py-20 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
                <Filter className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                No resources found
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                Adjust your filters or search terms to find what you're looking for.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function withBadge(base: string, active: string) {
  return `${base} ${active}`
}
