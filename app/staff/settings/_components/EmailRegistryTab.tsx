'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Mail, Plus, Trash2, Lock, Edit2, Save, X, Sparkles } from 'lucide-react'
import { useFormDirty } from '@/hooks/useFormDirty'

interface RegistryEntry {
  id: string
  title: string
  description: string | null
  address: string
  category: 'AUTO' | 'CUSTOM'
  isSystem: boolean
  createdAt: string
  updatedAt: string
  /** Canonical (code-defined) address — present on AUTO entries so the UI
   *  can detect when an admin has customized the address. */
  canonicalAddress: string | null
}

const PILL_COLOURS: Record<RegistryEntry['category'], string> = {
  AUTO: 'bg-indigo-50 text-indigo-700',
  CUSTOM: 'bg-emerald-50 text-emerald-700',
}

export default function EmailRegistryTab() {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [entries, setEntries] = useState<RegistryEntry[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState({ title: '', description: '', address: '' })
  const [editDraft, setEditDraft] = useState({ title: '', description: '', address: '' })

  const { markDirty, markClean } = useFormDirty()

  const reload = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/staff/settings/email-registry', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to load registry')
      setEntries(json.data ?? json)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
  }, [])

  const onAdd = async () => {
    if (!draft.title.trim() || !draft.address.trim()) {
      toast.error('Title and address are required')
      return
    }
    const res = await fetch('/api/staff/settings/email-registry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
    const json = await res.json()
    if (!res.ok || json?.success === false) {
      toast.error(json?.error || 'Failed to add')
      return
    }
    toast.success('Entry added')
    markClean()
    setDraft({ title: '', description: '', address: '' })
    await reload()
    startTransition(() => router.refresh())
  }

  const onSaveEdit = async (entry: RegistryEntry) => {
    const payload: Record<string, string | null> = {}
    if (editDraft.title !== entry.title) payload.title = editDraft.title
    if (editDraft.description !== (entry.description ?? ''))
      payload.description = editDraft.description
    const trimmedAddress = editDraft.address.trim()
    if (trimmedAddress !== '' && trimmedAddress !== entry.address) payload.address = trimmedAddress

    if (Object.keys(payload).length === 0) {
      toast.info('No changes to save')
      setEditing(null)
      return
    }

    const res = await fetch(`/api/staff/settings/email-registry/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok || json?.success === false) {
      toast.error(json?.error || 'Failed to save')
      return
    }
    toast.success('Saved')
    markClean()
    setEditing(null)
    await reload()
  }

  const onDelete = async (entry: RegistryEntry) => {
    if (!confirm(`Remove "${entry.title}" from the registry?`)) return
    const res = await fetch(`/api/staff/settings/email-registry/${entry.id}`, {
      method: 'DELETE',
    })
    const json = await res.json()
    if (!res.ok || json?.success === false) {
      toast.error(json?.error || 'Failed to delete')
      return
    }
    toast.success('Removed')
    await reload()
  }

  const onCleanupDuplicates = async () => {
    if (!confirm('Remove all duplicate system auto-senders? This cannot be undone.')) return
    const res = await fetch('/api/staff/settings/email-registry?cleanup=duplicates', {
      method: 'GET',
    })
    const json = await res.json()
    if (!res.ok || json?.success === false) {
      toast.error(json?.error || 'Failed to clean up duplicates')
      return
    }
    if (json.removed > 0) {
      toast.success(`Removed ${json.removed} duplicate${json.removed === 1 ? '' : 's'}`)
    } else {
      toast.info('No duplicates found')
    }
    await reload()
  }

  const autoEntries = entries?.filter((e) => e.category === 'AUTO') ?? []
  const customEntries = entries?.filter((e) => e.category === 'CUSTOM') ?? []

  return (
    <div className="space-y-8">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-slate-100">
          <Mail className="text-aerojet-blue h-5 w-5" />
          Communication emails
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Every email address used by the application — both code-synced senders and admin-added
          entries. Edit any entry's title, description, or address. System entries (tagged "AUTO")
          are editable: your customizations are preserved across seed syncs and take effect for
          outgoing emails immediately.
        </p>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading…</p>}

      {!loading && (
        <>
          {/* System auto-senders (admin-editable) */}
          <section className="space-y-3">
            <header className="flex items-baseline justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <h3 className="text-sm font-bold tracking-widest text-slate-500 uppercase">
                System auto-senders
              </h3>
              <span className="text-xs text-slate-400">
                {autoEntries.length} entries · system senders · fully editable
              </span>
              <button
                onClick={onCleanupDuplicates}
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                title="Remove duplicate system entries"
              >
                Clean up duplicates
              </button>
            </header>
            <ul className="space-y-2">
              {autoEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  {editing === entry.id ? (
                    <div className="space-y-2">
                      <input
                        value={editDraft.title}
                        onChange={(e) => {
                          setEditDraft({ ...editDraft, title: e.target.value })
                          markDirty()
                        }}
                        placeholder="Title"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      />
                      <input
                        value={editDraft.address}
                        onChange={(e) => {
                          setEditDraft({ ...editDraft, address: e.target.value })
                          markDirty()
                        }}
                        placeholder="Email address"
                        type="email"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      />
                      <input
                        value={editDraft.description}
                        onChange={(e) => {
                          setEditDraft({ ...editDraft, description: e.target.value })
                          markDirty()
                        }}
                        placeholder="Description / note"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => onSaveEdit(entry)}
                          className="bg-aerojet-blue hover:bg-aerojet-blue/90 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                        >
                          <Save className="h-3.5 w-3.5" /> Save
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {entry.title}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${PILL_COLOURS.AUTO}`}
                          >
                            auto
                          </span>
                          {entry.canonicalAddress && entry.address !== entry.canonicalAddress && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black tracking-widest text-amber-700 uppercase dark:bg-amber-900/30 dark:text-amber-300"
                              title="Customized — differs from the code-defined address"
                            >
                              <Sparkles className="h-3 w-3" /> Customized
                            </span>
                          )}
                        </div>
                        <p className="text-aerojet-blue font-mono text-xs">{entry.address}</p>
                        {entry.description && (
                          <p className="text-xs text-slate-500">{entry.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditing(entry.id)
                            setEditDraft({
                              title: entry.title,
                              description: entry.description ?? '',
                              address: entry.address,
                            })
                          }}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          aria-label="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(entry)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          aria-label="Delete"
                          title={
                            entry.isSystem
                              ? 'Delete duplicate (keeps the customized copy)'
                              : 'Delete'
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* ── CUSTOM entries (admin editable) ───────────────────────────── */}
          <section className="space-y-3">
            <header className="flex items-baseline justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <h3 className="text-sm font-bold tracking-widest text-slate-500 uppercase">
                Custom entries
              </h3>
              <span className="text-xs text-slate-400">{customEntries.length} entries</span>
            </header>
            <ul className="space-y-2">
              {customEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  {editing === entry.id ? (
                    <div className="space-y-2">
                      <input
                        value={editDraft.title}
                        onChange={(e) => {
                          setEditDraft({ ...editDraft, title: e.target.value })
                          markDirty()
                        }}
                        placeholder="Title"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      />
                      <input
                        value={editDraft.address}
                        onChange={(e) => {
                          setEditDraft({ ...editDraft, address: e.target.value })
                          markDirty()
                        }}
                        placeholder="Email address"
                        type="email"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      />
                      <input
                        value={editDraft.description}
                        onChange={(e) => {
                          setEditDraft({ ...editDraft, description: e.target.value })
                          markDirty()
                        }}
                        placeholder="Description / note"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => onSaveEdit(entry)}
                          className="bg-aerojet-blue hover:bg-aerojet-blue/90 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                        >
                          <Save className="h-3.5 w-3.5" /> Save
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {entry.title}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${PILL_COLOURS.CUSTOM}`}
                          >
                            custom
                          </span>
                        </div>
                        <p className="text-aerojet-blue font-mono text-xs">{entry.address}</p>
                        {entry.description && (
                          <p className="text-xs text-slate-500">{entry.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditing(entry.id)
                            setEditDraft({
                              title: entry.title,
                              description: entry.description ?? '',
                              address: entry.address,
                            })
                          }}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          aria-label="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(entry)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
              {customEntries.length === 0 && (
                <li className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 dark:border-slate-700">
                  No custom entries yet. Add internal-comms or vendor addresses below.
                </li>
              )}
            </ul>
          </section>

          {/* ── Add custom entry ──────────────────────────────────────────── */}
          <section className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
            <h3 className="mb-3 text-sm font-bold tracking-widest text-slate-500 uppercase">
              Add a custom entry
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={draft.title}
                onChange={(e) => {
                  setDraft({ ...draft, title: e.target.value })
                  markDirty()
                }}
                placeholder="Title (e.g. Internal comms)"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                value={draft.address}
                onChange={(e) => {
                  setDraft({ ...draft, address: e.target.value })
                  markDirty()
                }}
                placeholder="Email address"
                type="email"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                value={draft.description}
                onChange={(e) => {
                  setDraft({ ...draft, description: e.target.value })
                  markDirty()
                }}
                placeholder="What is this used for? (optional)"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:col-span-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <button
              onClick={onAdd}
              className="bg-aerojet-blue hover:bg-aerojet-blue/90 mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-white"
            >
              <Plus className="h-4 w-4" /> Add to registry
            </button>
          </section>
        </>
      )}
    </div>
  )
}
