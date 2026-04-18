'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
  columns = { mobile: 2, tablet: 3, desktop: 4 }
}: ModuleGridProps) {
  const [activeModule, setActiveModule] = useState<string | null>(null)

  const handleToggle = (code: string) => {
    setActiveModule(activeModule === code ? null : code)
  }

  // Column mapping
  const gridCols = `grid grid-cols-${columns.mobile} sm:grid-cols-${columns.tablet} md:grid-cols-${columns.desktop}`

  return (
    <div className={`${gridCols} gap-3`}>
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
              className={`
                flex w-full flex-col items-center justify-center overflow-hidden rounded-xl border transition-all duration-300
                ${
                  isActive
                    ? 'border-aerojet-sky bg-white shadow-lg ring-1 ring-aerojet-sky/20'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                }
              `}
            >
              <motion.div 
                layout 
                className={`py-3 ${isActive ? 'pb-1' : ''}`}
              >
                <span className={`text-base font-black transition-colors ${isActive ? 'text-aerojet-sky' : 'text-slate-400'}`}>
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
                    className="overflow-hidden px-4 pb-4 text-center"
                  >
                    <p className="text-[10px] font-bold leading-tight text-slate-600 uppercase tracking-tight">
                      {m.name}
                    </p>
                    {m.info && (
                      <p className="mt-1 text-[9px] font-medium text-slate-400">
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
  )
}
