'use client'

import { useState } from 'react'
import { Plus, Trash2, Save, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { DEFAULT_WELCOME_MESSAGES } from '@/lib/welcome-messages'

interface WelcomeMessagesManagerProps {
  initialMessages: string[]
}

export default function WelcomeMessagesManager({ initialMessages }: WelcomeMessagesManagerProps) {
  const [messages, setMessages] = useState<string[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const addMessage = () => {
    const trimmed = newMessage.trim()
    if (!trimmed) return
    if (messages.includes(trimmed)) {
      toast.error('This message already exists')
      return
    }
    setMessages([...messages, trimmed])
    setNewMessage('')
  }

  const removeMessage = (idx: number) => {
    setMessages(messages.filter((_, i) => i !== idx))
  }

  const resetToDefaults = () => {
    setMessages([...DEFAULT_WELCOME_MESSAGES])
    toast.info('Reset to default messages — click Save to apply.')
  }

  const handleSave = async () => {
    if (messages.length === 0) {
      toast.error('At least one message is required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/staff/welcome-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      toast.success(`Saved ${data.count} welcome messages`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Welcome Messages</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            These messages rotate randomly on every user login across all portals.
          </p>
        </div>
        <span className="rounded-full bg-[#002a5c]/10 px-2.5 py-1 text-xs font-bold text-[#002a5c] dark:bg-blue-500/10 dark:text-blue-400">
          {messages.length} messages
        </span>
      </div>

      {/* Messages list */}
      <div className="divide-y divide-slate-50">
        {messages.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-slate-400">
            No messages yet. Add one below or reset to defaults.
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 px-6 py-3 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#002a5c]/10 text-xs font-bold text-[#002a5c] dark:bg-blue-500/10 dark:text-blue-400">
                {idx + 1}
              </span>
              <p className="flex-1 text-sm text-slate-700 dark:text-slate-300">{msg}</p>
              <button
                type="button"
                title="Remove"
                onClick={() => removeMessage(idx)}
                className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add new */}
      <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMessage())}
            placeholder="Type a new welcome message…"
            maxLength={200}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#002a5c] focus:ring-2 focus:ring-[#002a5c]/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
          />
          <button
            type="button"
            onClick={addMessage}
            disabled={!newMessage.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
        <p className="mt-1.5 text-right text-xs text-slate-400">{newMessage.length}/200</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
        <button
          type="button"
          onClick={resetToDefaults}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset to Defaults
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#002a5c] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#003875] disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Messages
        </button>
      </div>
    </div>
  )
}

