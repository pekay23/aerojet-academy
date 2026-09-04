'use client'

import { useState, useTransition } from 'react'

import { Bell, Mail, Moon, Sun, Monitor, Loader2, Save, Eye } from 'lucide-react'
import { updateUserSettings } from '@/app/student/actions'
import { toast } from 'sonner'
import { useTheme } from '@/components/shared/theme-provider'
import PrivacyToggle from '@/components/shared/PrivacyToggle'
import { useProfileDirty } from './ProfileTabs'

interface SettingsFormProps {
  initialSettings: any
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const { theme, setTheme } = useTheme()
  const { markDirty, markClean } = useProfileDirty()
  const [emailNotifications, setEmailNotifications] = useState(
    initialSettings?.notifications?.email ?? true
  )

  const handleSave = async () => {
    startTransition(async () => {
      const result = await updateUserSettings({
        notifications: {
          email: emailNotifications,
        },
        theme: theme,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Settings updated successfully')
        markClean()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Notifications Section */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-6 flex items-center gap-2 border-b border-slate-50 pb-4 text-lg font-black text-blue-800 dark:border-slate-800 dark:text-white">
          <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Notification Preferences
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-slate-50 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Email Notifications</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stay updated on course changes, results, and fees.
                </p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => {
                  const val = e.target.checked
                  setEmailNotifications(val)
                  markDirty()
                  startTransition(async () => {
                    const result = await updateUserSettings({
                      notifications: {
                        email: val,
                      },
                      theme: theme,
                    })
                    if (result.error) {
                      toast.error(result.error)
                      setEmailNotifications(!val)
                    } else {
                      toast.success('Notification settings updated')
                    }
                  })
                }}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-blue-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-slate-600 dark:bg-slate-700"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Privacy Section */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-6 flex items-center gap-2 border-b border-slate-50 pb-4 text-lg font-black text-blue-800 dark:border-slate-800 dark:text-white">
          <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Privacy
        </h3>
        <PrivacyToggle />
      </div>

      {/* Appearance Section */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-6 flex items-center gap-2 border-b border-slate-50 pb-4 text-lg font-black text-aerojet-blue dark:border-slate-800 dark:text-white">
          <Sun className="h-5 w-5 text-amber-500 dark:text-amber-400" />
          Appearance Settings
        </h3>

        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'system', label: 'System', icon: Monitor },
          ].map((item) => {
            const Icon = item.icon
            const isActive = theme === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTheme(item.id)
                  markDirty()
                }}
                className={`flex flex-col items-center gap-3 rounded-2xl border p-4 transition-all ${
                  isActive
                    ? 'border-blue-500 bg-blue-50/50 text-blue-600 dark:border-blue-400 dark:bg-blue-400/10 dark:text-blue-400'
                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-slate-700'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-bold tracking-widest uppercase">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-blue-800 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-[#003d85] hover:shadow-lg disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </button>
      </div>
    </div>
  )
}
