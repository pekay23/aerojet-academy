'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { User, Settings, Lock, Shield } from 'lucide-react'
import MotionTabs from '@/components/ui/MotionTabs'

const TABS = [
  { key: 'info', label: 'Personal Info', icon: User },
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'password', label: 'Password', icon: Lock },
]

export default function ProfileTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'info'

  return (
    <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your personal and academic information.
        </p>
      </div>

      <MotionTabs
        tabs={TABS}
        activeTab={currentTab}
        onChange={(tab) => router.push(`/student/profile?tab=${tab}`, { scroll: false })}
        layoutId="profile-tab"
        ariaLabel="Profile sections"
      />

      <div role="tabpanel" id="profile-tabpanel" aria-labelledby={`tab-${currentTab}`}>
        {children}
      </div>
    </div>
  )
}
