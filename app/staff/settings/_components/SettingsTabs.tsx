'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { createContext, useContext, useCallback } from 'react'
import {
  School,
  DollarSign,
  Mail,
  Globe,
  Sparkles,
  Send,
  Calendar,
  DatabaseBackup,
  Shield,
  ClipboardList,
  AtSign,
} from 'lucide-react'
import MotionTabs from '@/components/ui/MotionTabs'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { UnsavedChangesDialog } from '@/components/shared/UnsavedChangesDialog'

const TABS = [
  { key: 'general', label: 'General', icon: School },
  { key: 'admissions', label: 'Admissions', icon: ClipboardList },
  { key: 'finance', label: 'Finance', icon: DollarSign },
  { key: 'notifications', label: 'Notifications', icon: Mail },
  { key: 'system', label: 'System', icon: Globe },
  { key: 'custom-fields', label: 'Custom Fields', icon: DatabaseBackup },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'welcome', label: 'Welcome', icon: Sparkles },
  { key: 'emails', label: 'Email Templates', icon: Send },
  { key: 'email-registry', label: 'Email Addresses', icon: AtSign },
  { key: 'email-delivery', label: 'Email Delivery', icon: Send },
  { key: 'calendar', label: 'Calendar', icon: Calendar },
  { key: 'backup', label: 'Backup', icon: DatabaseBackup },
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

  return (
    <SettingsDirtyContext.Provider value={{ markDirty, markClean }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Configure your academy platform settings and preferences
          </p>
        </div>

        <MotionTabs
          tabs={TABS}
          activeTab={currentTab}
          onChange={handleChange}
          onBeforeChange={confirmLeave}
          layoutId="settings-tab"
          ariaLabel="Settings sections"
          className="flex-wrap"
        />

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
