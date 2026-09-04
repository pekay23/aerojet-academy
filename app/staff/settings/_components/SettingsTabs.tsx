'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { createContext, useContext, useCallback } from 'react'
import {
  School,
  DollarSign,
  Mail,
  Globe,
  Calendar,
  Shield,
  ClipboardList,
  FileText,
} from 'lucide-react'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { UnsavedChangesDialog } from '@/components/shared/UnsavedChangesDialog'

const TABS = [
  { key: 'general', label: 'General', icon: School },
  { key: 'admissions', label: 'Admissions', icon: ClipboardList },
  { key: 'finance', label: 'Finance', icon: DollarSign },
  { key: 'comms', label: 'Emails & Comms', icon: Mail },
  { key: 'academic', label: 'Academic', icon: Calendar },
  { key: 'templates', label: 'Templates', icon: FileText },
  { key: 'system', label: 'System & Data', icon: Globe },
  { key: 'security', label: 'My Security', icon: Shield },
]

// ── Context so child forms can mark dirty / clean without prop drilling ──────
interface DirtyContextValue {
  markDirty: () => void
  markClean: () => void
}

export const SettingsDirtyContext = createContext<DirtyContextValue>({
  markDirty: () => {},
  markClean: () => {},
})

export function useSettingsDirty() {
  return useContext(SettingsDirtyContext)
}

export default function SettingsTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'general'

  const { isDirty: _isDirty, markDirty, markClean, confirmLeave: _confirmLeave, pendingTab, proceedLeave, cancelLeave } =
    useUnsavedChanges()

  const _handleChange = useCallback(
    (tab: string) => {
      router.push(`/staff/settings?tab=${tab}`, { scroll: false })
      // Reset dirty state when we actually navigate
      markClean()
    },
    [router, markClean]
  )

  const currentTabObj = TABS.find((t) => t.key === currentTab) || TABS[0]

  return (
    <SettingsDirtyContext.Provider value={{ markDirty, markClean }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-aerojet-blue text-2xl font-black tracking-tight sm:text-3xl dark:text-white">
            {currentTabObj.label} Settings
          </h1>
        </div>

        {children}

        <UnsavedChangesDialog
          open={pendingTab !== null}
          onProceed={proceedLeave}
          onCancel={cancelLeave}
        />
      </div>
    </SettingsDirtyContext.Provider>
  )
}
