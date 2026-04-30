'use client'

import { useState } from 'react'
import ModuleGrid, { Module } from '@/app/(public)/_components/ModuleGrid'

interface ModuleTabsProps {
  b1Modules: Module[]
  b2Modules: Module[]
}

export default function ModuleTabs({ b1Modules, b2Modules }: ModuleTabsProps) {
  const [activeTab, setActiveTab] = useState<'b1' | 'b2'>('b1')

  return (
    <div className="space-y-8">
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('b1')}
          className={`pb-4 text-lg font-bold transition-colors ${
            activeTab === 'b1'
              ? 'border-b-2 border-aerojet-blue text-aerojet-blue'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          B1.1 (Mechanical)
        </button>
        <button
          onClick={() => setActiveTab('b2')}
          className={`pb-4 text-lg font-bold transition-colors ${
            activeTab === 'b2'
              ? 'border-b-2 border-aerojet-blue text-aerojet-blue'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          B2 (Avionics)
        </button>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'b1' && <ModuleGrid modules={b1Modules} />}
        {activeTab === 'b2' && <ModuleGrid modules={b2Modules} />}
      </div>
    </div>
  )
}
