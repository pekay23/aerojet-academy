'use client'

import { useState } from 'react'
import { Wrench, Cpu } from 'lucide-react'
import MotionTabs from '@/components/ui/MotionTabs'
import ModuleGrid, { Module } from '@/app/(public)/_components/ModuleGrid'

const TABS = [
  { key: 'b1', label: 'B1.1 (Mechanical)', shortLabel: 'B1.1', icon: Wrench },
  { key: 'b2', label: 'B2 (Avionics)', shortLabel: 'B2', icon: Cpu },
]

interface ModuleTabsProps {
  b1Modules: Module[]
  b2Modules: Module[]
}

export default function ModuleTabs({ b1Modules, b2Modules }: ModuleTabsProps) {
  const [activeTab, setActiveTab] = useState<'b1' | 'b2'>('b1')

  return (
    <div className="space-y-8">
      <MotionTabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as 'b1' | 'b2')}
        layoutId="module-tab"
        ariaLabel="Module categories"
      />

      <div className="min-h-100">
        {activeTab === 'b1' && <ModuleGrid modules={b1Modules} />}
        {activeTab === 'b2' && <ModuleGrid modules={b2Modules} />}
      </div>
    </div>
  )
}
