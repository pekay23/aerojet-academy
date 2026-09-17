'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EmptyState } from '@/components/shared/EmptyState'
import { Inbox } from 'lucide-react'

export interface Module {
  code: string
  name: string
  info?: string
}

interface ModuleGridProps {
  modules: Module[]
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
}

export default function ModuleGrid({
  modules,
  columns = { mobile: 2, tablet: 3, desktop: 4 },
}: ModuleGridProps) {
  const [activeModule, setActiveModule] = useState<string | null>(null)

  const handleToggle = (code: string) => {
    setActiveModule(activeModule === code ? null : code)
  }

  // Column mapping
  const gridCols = `grid grid-cols-${columns.mobile} sm:grid-cols-${columns.tablet} md:grid-cols-${columns.desktop}`

  return (
    <>
      {modules.length === 0 ? (
        <div className="col-span-full">
          <EmptyState
            icon={Inbox}
            title="No modules available"
            description="Check back later for new modules and course offerings."
          />
        </div>
      ) : (
        <div className={`${gridCols} gap-4 sm:gap-5`}>
          {modules.map((m) => {
            const isActive = activeModule === m.code

            return (
              <div
                key={m.code}
                className="relative"
                onMouseEnter={() => setActiveModule(m.code)}
                onMouseLeave={() => setActiveModule(null)}
              >
                <motion.button
                  onClick={() => handleToggle(m.code)}
                  layout
                  className={`flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border transition-all duration-300 ${
                    isActive
                      ? 'border-aerojet-sky ring-aerojet-sky/20 bg-white shadow-lg ring-1'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                  } `}
                >
                  <motion.div layout className={`py-4 sm:py-5 ${isActive ? 'pb-2 sm:pb-2' : ''}`}>
                    <span
                      className={`text-lg font-black transition-colors sm:text-xl ${isActive ? 'text-aerojet-sky' : 'text-slate-400'}`}
                    >
                      {m.code}
                    </span>
                  </motion.div>

                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="overflow-hidden px-5 pb-5 text-center"
                      >
                        <p className="text-xs leading-tight font-bold tracking-tight text-slate-600 uppercase sm:text-sm">
                          {m.name}
                        </p>
                        {m.info && (
                          <p className="mt-1.5 text-[10px] font-medium text-slate-400 sm:text-xs">
                            {m.info}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
