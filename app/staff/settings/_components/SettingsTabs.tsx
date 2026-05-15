'use client'

import { useRouter, useSearchParams } from 'next/navigation'
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
} from 'lucide-react'
import MotionTabs from '@/components/ui/MotionTabs'

const TABS = [
  { key: 'general', label: 'General', icon: School },
  { key: 'finance', label: 'Finance', icon: DollarSign },
  { key: 'notifications', label: 'Notifications', icon: Mail },
  { key: 'system', label: 'System', icon: Globe },
  { key: 'custom-fields', label: 'Custom Fields', icon: DatabaseBackup },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'welcome', label: 'Welcome', icon: Sparkles },
  { key: 'emails', label: 'Email Templates', icon: Send },
  { key: 'calendar', label: 'Calendar', icon: Calendar },
  { key: 'backup', label: 'Backup', icon: DatabaseBackup },
]

export default function SettingsTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'general'

  return (
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
        onChange={(tab) => router.push(`/staff/settings?tab=${tab}`, { scroll: false })}
        layoutId="settings-tab"
        ariaLabel="Settings sections"
        className="flex-wrap"
      />

      {children}
    </div>
  )
}
