'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  FileText,
  Edit2,
  Copy,
  Archive,
  RotateCcw,
  Star,
  Loader2,
  MoreHorizontal,
} from 'lucide-react'
import {
  listTemplatesForAdmin,
  cloneTemplateAction,
  archiveTemplateAction,
  activateTemplateAction,
  setDefaultTemplateAction,
  renameTemplateAction,
} from '@/app/staff/settings/_actions/pdf-template-actions'

export type Template = {
  id: string
  name: string
  slug: string
  type: 'CERTIFICATE' | 'TRANSCRIPT'
  layout: string
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  isDefault: boolean
  content: Record<string, unknown>
  branding: Record<string, unknown> | null
  numberFormat: string | null
  lastSequence: number
  lastSequenceYear: number | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
  updatedBy: string | null
  clonedFromId: string | null
  signatures: {
    id: string
    templateId: string
    signatureId: string
    position: number
    signature: {
      id: string
      label: string
      signerName: string
      imageUrl: string
    }
  }[]
  _count: {
    verifications: number
  }
}

const TYPE_STYLES: Record<string, string> = {
  CERTIFICATE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  TRANSCRIPT: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  ACTIVE: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ARCHIVED: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export default function TemplateList() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cloningId, setCloningId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await listTemplatesForAdmin()
      setTemplates(data as unknown as Template[])
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load templates'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTemplates()
  }, [fetchTemplates])

  useEffect(() => {
    const handleClick = () => setOpenMenuId(null)
    if (openMenuId) {
      window.addEventListener('click', handleClick)
      return () => window.removeEventListener('click', handleClick)
    }
  }, [openMenuId])

  const handleRename = (id: string, currentName: string) => {
    setEditingId(id)
    setEditName(currentName)
    setOpenMenuId(null)
  }

  const handleRenameSave = async () => {
    if (!editingId || !editName.trim()) return
    try {
      await renameTemplateAction(editingId, editName.trim())
      toast.success('Template renamed')
      setEditingId(null)
      fetchTemplates()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to rename')
    }
  }

  const handleClone = async (id: string) => {
    const template = templates.find((t) => t.id === id)
    if (!template) return
    setOpenMenuId(null)
    const newName = prompt(`Clone "${template.name}" as:`, `${template.name} (Copy)`)
    if (!newName || !newName.trim()) return
    setCloningId(id)
    try {
      await cloneTemplateAction(id, newName.trim())
      toast.success('Template cloned')
      fetchTemplates()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to clone template')
    } finally {
      setCloningId(null)
    }
  }

  const handleArchive = async (id: string) => {
    setOpenMenuId(null)
    try {
      await archiveTemplateAction(id)
      toast.success('Template archived')
      fetchTemplates()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to archive template')
    }
  }

  const handleActivate = async (id: string) => {
    setOpenMenuId(null)
    try {
      await activateTemplateAction(id)
      toast.success('Template activated')
      fetchTemplates()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to activate template')
    }
  }

  const handleSetDefault = async (id: string) => {
    const template = templates.find((t) => t.id === id)
    if (!template) return
    setOpenMenuId(null)
    if (template.isDefault) {
      toast.info('This is already the default template')
      return
    }
    try {
      await setDefaultTemplateAction(id)
      toast.success('Set as default')
      fetchTemplates()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to set default')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/50">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-500">Loading templates...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
        <button
          type="button"
          onClick={fetchTemplates}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">PDF Templates</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Manage certificate and transcript templates. Default template is used for new document
            generation.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <FileText className="h-4 w-4" />
          {templates.length} template{templates.length !== 1 && 's'}
        </div>
      </div>

      {/* Table */}
      {templates.length === 0 ? (
        <div className="p-8 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-bold text-slate-500">No templates yet</p>
          <p className="text-xs text-slate-400">Templates will appear here once created.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Default
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {templates.map((template) => (
                <tr
                  key={template.id}
                  className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                >
                  <td className="px-6 py-4">
                    {editingId === template.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSave()
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-48 rounded-lg border border-slate-200 px-2 py-1 text-sm focus:ring-1 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleRenameSave}
                          className="bg-aerojet-blue rounded-lg px-2 py-1 text-xs font-bold text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {template.name}
                        </div>
                        <div className="text-xs text-slate-400">{template.slug}</div>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${TYPE_STYLES[template.type] || ''}`}
                    >
                      {template.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[template.status] || ''}`}
                    >
                      {template.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {template.isDefault ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        Default
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId(openMenuId === template.id ? null : template.id)
                        }
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {openMenuId === template.id && (
                        <div className="absolute top-full right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                          <button
                            type="button"
                            onClick={() => handleRename(template.id, template.name)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={() => handleClone(template.id)}
                            disabled={cloningId === template.id}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            {cloningId === template.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            Clone
                          </button>
                          {template.status === 'ACTIVE' ? (
                            <button
                              type="button"
                              onClick={() => handleArchive(template.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                            >
                              <Archive className="h-3.5 w-3.5" />
                              Archive
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleActivate(template.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Activate
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSetDefault(template.id)}
                            disabled={template.isDefault}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            <Star className="h-3.5 w-3.5" />
                            Set as Default
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
