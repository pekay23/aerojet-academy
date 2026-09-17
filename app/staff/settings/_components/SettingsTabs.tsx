'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { createContext, useContext, useCallback, useMemo } from 'react'
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
import MotionTabs from '@/components/ui/MotionTabs'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { UnsavedChangesDialog } from '@/components/shared/UnsavedChangesDialog'
import { toast } from 'sonner'

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
  isDirty: boolean
}

export const SettingsDirtyContext = createContext<DirtyContextValue>({
  markDirty: () => {},
  markClean: () => {},
  isDirty: false,
})

export function useSettingsDirty() {
  return useContext(SettingsDirtyContext)
}

export default function SettingsTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'general'

  const { isDirty, markDirty, markClean, confirmLeave, pendingTab, proceedLeave, cancelLeave } =
    useUnsavedChanges()

  const handleChange = useCallback(
    (tab: string) => {
      router.push(`/staff/settings?tab=${tab}`, { scroll: false })
      // Reset dirty state when we actually navigate
      markClean()
    },
    [router, markClean]
  )

  // Stable context value so consumers don't re-render unnecessarily
  const contextValue = useMemo<DirtyContextValue>(
    () => ({ markDirty, markClean, isDirty }),
    [markDirty, markClean, isDirty]
  )

  const currentTabObj = TABS.find((t) => t.key === currentTab) || TABS[0]
  const pendingTabObj = pendingTab ? TABS.find((t) => t.key === pendingTab) : null

  // Toast confirmation after discarding
  const handleProceed = useCallback(() => {
    toast.info('Unsaved changes discarded')
    proceedLeave()
  }, [proceedLeave])

  return (
    <SettingsDirtyContext.Provider value={contextValue}>
      <div className="space-y-6">
        <div>
          <h1 className="text-aerojet-blue text-2xl font-black tracking-tight sm:text-3xl dark:text-white">
            {currentTabObj.label} Settings
          </h1>
        </div>

        <MotionTabs
          tabs={TABS}
          activeTab={currentTab}
          onChange={handleChange}
          onBeforeChange={confirmLeave}
          layoutId="settings-tab"
          ariaLabel="Settings sections"
        />

        {children}

        <UnsavedChangesDialog
          open={pendingTab !== null}
          fromLabel={currentTabObj.label}
          toLabel={pendingTabObj?.label ?? ''}
          onProceed={handleProceed}
          onCancel={cancelLeave}
        />
      </div>
    </SettingsDirtyContext.Provider>
  )
}