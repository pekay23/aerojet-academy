'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2, Save, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { DEFAULT_ROLE_WELCOME_MESSAGES } from '@/lib/welcome-messages'
import MotionTabs from '@/components/ui/MotionTabs'

interface WelcomeMessagesManagerProps {
  initialMessages: Record<string, string[]> | string[]
}

const ROLES = ['STUDENT', 'STAFF', 'INSTRUCTOR', 'ADMIN']

export default function WelcomeMessagesManager({ initialMessages }: WelcomeMessagesManagerProps) {
  // Normalize initial messages
  const normalizedInitial = useMemo(() => {
    if (Array.isArray(initialMessages)) {
      return {
        STUDENT: initialMessages,
        STAFF: [...DEFAULT_ROLE_WELCOME_MESSAGES.STAFF],
        INSTRUCTOR: [...DEFAULT_ROLE_WELCOME_MESSAGES.INSTRUCTOR],
        ADMIN: [...DEFAULT_ROLE_WELCOME_MESSAGES.ADMIN],
      }
    }

    const base = { ...DEFAULT_ROLE_WELCOME_MESSAGES }
    for (const role of ROLES) {
      if (initialMessages[role]) {
        base[role] = initialMessages[role]
      }
    }
    return base
  }, [initialMessages])

  const [allMessages, setAllMessages] = useState<Record<string, string[]>>(normalizedInitial)
  const [activeRole, setActiveRole] = useState('STUDENT')
  const [newMessage, setNewMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const currentMessages = allMessages[activeRole] || []

  const addMessage = () => {
    const trimmed = newMessage.trim()
    if (!trimmed) return
    if (currentMessages.includes(trimmed)) {
      toast.error('This message already exists for this role')
      return
    }
    setAllMessages({
      ...allMessages,
      [activeRole]: [...currentMessages, trimmed],
    })
    setNewMessage('')
  }

  const removeMessage = (idx: number) => {
    setAllMessages({
      ...allMessages,
      [activeRole]: currentMessages.filter((_, i) => i !== idx),
    })
  }

  const resetToDefaults = () => {
    setAllMessages({
      ...allMessages,
      [activeRole]: [...DEFAULT_ROLE_WELCOME_MESSAGES[activeRole]],
    })
    toast.info(`Reset ${activeRole} messages to defaults — click Save to apply.`)
  }

  const handleSave = async () => {
    // Validate: at least one role must have messages (though we usually have many)
    const hasAny = Object.values(allMessages).some((arr) => arr.length > 0)
    if (!hasAny) {
      toast.error('At least one welcome message is required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/staff/welcome-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      toast.success(`Saved welcome messages for all roles`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      {/* Header */}
      <div className="flex flex-col border-b border-slate-100 lg:flex-row lg:items-center lg:justify-between dark:border-slate-800">
        <div className="px-6 py-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Welcome Messages</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Customize the greetings shown on portal dashboards by role.
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex border-t border-slate-100 p-2 lg:border-t-0 dark:border-slate-800">
          <MotionTabs
            tabs={ROLES}
            activeTab={activeRole}
            onChange={setActiveRole}
            layoutId="role-tabs"
            containerClassName="bg-transparent dark:bg-transparent"
            tabClassName="py-2.5"
          />
        </div>
      </div>

      {/* Messages list */}
      <div className="max-h-[350px] divide-y divide-slate-50 overflow-y-auto dark:divide-slate-800/50">
        {currentMessages.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-400">
            No messages for {activeRole} yet. Add one below.
          </div>
        ) : (
          currentMessages.map((msg, idx) => (
            <div
              key={idx}
              className="group flex items-start gap-3 px-6 py-3 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#002a5c]/10 text-[10px] font-bold text-[#002a5c] dark:bg-blue-500/10 dark:text-blue-400">
                {idx + 1}
              </span>
              <p className="flex-1 text-sm text-slate-700 dark:text-slate-300">{msg}</p>
              <button
                type="button"
                title="Remove"
                onClick={() => removeMessage(idx)}
                className="shrink-0 rounded-lg p-1 text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:text-slate-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add new */}
      <div className="border-t border-slate-100 px-6 py-4 dark:border-slate-800">
        <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase">
          New {activeRole} Message
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMessage())}
            placeholder={`Type a message for ${activeRole}s…`}
            maxLength={200}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#002a5c] focus:ring-2 focus:ring-[#002a5c]/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
          />
          <button
            type="button"
            onClick={addMessage}
            disabled={!newMessage.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
        <button
          type="button"
          onClick={resetToDefaults}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset {activeRole} to Defaults
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#002a5c] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#003875] active:scale-95 disabled:opacity-60 dark:bg-blue-600 dark:shadow-blue-900/20 dark:hover:bg-blue-700"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All Changes
        </button>
      </div>
    </div>
  )
}
