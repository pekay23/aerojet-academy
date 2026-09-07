'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

interface Policy {
  id: string
  entity: string
  retentionDays: number
  anchor: 'CREATED_AT' | 'UPDATED_AT' | 'GRADUATION'
  isActive: boolean
  description: string | null
  updatedAt: string
}

export default function RetentionEditor({ policies }: { policies: Policy[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [draft, setDraft] = useState<Policy[]>(policies)
  const dirty = JSON.stringify(draft) !== JSON.stringify(policies)

  // Warn before closing the tab / navigating away with unsaved edits.
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const update = (id: string, patch: Partial<Policy>) => {
    setDraft((d) => d.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const onSave = async () => {
    const changed = draft.filter((d) => {
      const orig = policies.find((p) => p.id === d.id)
      return !orig || JSON.stringify(orig) !== JSON.stringify(d)
    })
    if (changed.length === 0) return

    const res = await fetch('/api/staff/settings/retention', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates: changed }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json?.success === false) {
      toast.error(json?.error || 'Save failed')
      return
    }
    toast.success(`${changed.length} policies updated`)
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={isPending || !dirty}
          className="flex items-center gap-1.5 rounded-lg bg-aerojet-blue px-3 py-2 text-sm font-bold text-white hover:bg-aerojet-blue/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> Save changes
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800">
            <tr>
              <th className="px-3 py-2">Entity</th>
              <th className="px-3 py-2">Retention (days)</th>
              <th className="px-3 py-2">Anchor</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {draft.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-2 font-mono text-xs font-black">{p.entity}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    value={p.retentionDays}
                    onChange={(e) => update(p.id, { retentionDays: parseInt(e.target.value, 10) || 0 })}
                    className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                  <span className="ml-1 text-xs text-slate-400">≈ {Math.round(p.retentionDays / 365 * 10) / 10}y</span>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={p.anchor}
                    onChange={(e) => update(p.id, { anchor: e.target.value as Policy['anchor'] })}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="CREATED_AT">created_at</option>
                    <option value="UPDATED_AT">updated_at</option>
                    <option value="GRADUATION">graduation</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={p.isActive}
                    onChange={(e) => update(p.id, { isActive: e.target.checked })}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={p.description ?? ''}
                    onChange={(e) => update(p.id, { description: e.target.value })}
                    placeholder="Why this value?"
                    className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
