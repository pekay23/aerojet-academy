'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Save, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CustomFieldDefinition, CustomFieldType, CustomFieldTarget } from '@prisma/client'

export default function CustomFieldsManager({
  initialFields,
}: {
  initialFields: CustomFieldDefinition[]
}) {
  const router = useRouter()
  const [_fields, _setFields] = useState(initialFields)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<CustomFieldDefinition>>({})

  // Warn before navigating away with unsaved form edits.
  const hasUnsavedEdits = isAdding || editingId !== null
  useEffect(() => {
    if (!hasUnsavedEdits) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedEdits])

  const handleSave = async () => {
    if (!formData.name || !formData.slug || !formData.fieldType || !formData.appliesTo) {
      toast.error('Please fill in all required fields (Name, Slug, Type, Applies To)')
      return
    }

    try {
      const url = editingId
        ? `/api/staff/settings/custom-fields/${editingId}`
        : '/api/staff/settings/custom-fields'

      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setIsAdding(false)
        setEditingId(null)
        setFormData({})
        router.refresh()
        // Optimistic local update could be added here, but refresh is fine
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to save custom field')
      }
    } catch (_e) {
      toast.error('An unexpected error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this custom field? All data associated with it will be lost.'
      )
    )
      return

    try {
      const res = await fetch(`/api/staff/settings/custom-fields/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      } else {
        toast.error('Failed to delete custom field')
      }
    } catch (_e) {
      toast.error('An unexpected error occurred')
    }
  }

  const startEdit = (field: CustomFieldDefinition) => {
    setEditingId(field.id)
    setFormData(field)
    setIsAdding(false)
  }

  const startAdd = () => {
    setIsAdding(true)
    setEditingId(null)
    setFormData({
      fieldType: 'TEXT',
      appliesTo: 'APPLICATION',
      isRequired: false,
      isActive: true,
      sortOrder: 0,
      applicableProgrammes: [],
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Fields</h2>
        <button
          onClick={startAdd}
          disabled={isAdding || !!editingId}
          className="bg-aerojet-blue hover:bg-aerojet-blue/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Field
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="border-aerojet-blue/30 bg-aerojet-blue/5 dark:border-aerojet-sky/30 dark:bg-aerojet-sky/5 rounded-xl border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-aerojet-blue dark:text-aerojet-sky font-bold">
              {isAdding ? 'Create New Field' : 'Edit Field'}
            </h3>
            <button
              onClick={() => {
                setIsAdding(false)
                setEditingId(null)
                setFormData({})
              }}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                Display Name
              </label>
              <input
                type="text"
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Blood Type"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                Unique Slug
              </label>
              <input
                type="text"
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={formData.slug || ''}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. blood_type"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                Field Type
              </label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={formData.fieldType || 'TEXT'}
                onChange={(e) =>
                  setFormData({ ...formData, fieldType: e.target.value as CustomFieldType })
                }
              >
                {Object.values(CustomFieldType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                Applies To Entity
              </label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={formData.appliesTo || 'APPLICATION'}
                onChange={(e) =>
                  setFormData({ ...formData, appliesTo: e.target.value as CustomFieldTarget })
                }
              >
                {(Object.values(CustomFieldTarget) as string[]).map((entity) => (
                  <option key={entity} value={entity}>
                    {entity.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                Sort Order
              </label>
              <input
                type="number"
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={formData.sortOrder ?? 0}
                onChange={(e) =>
                  setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>

            <div className="flex items-center gap-6 sm:col-span-2 lg:col-span-1">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="text-aerojet-blue rounded border-slate-300"
                  checked={formData.isRequired || false}
                  onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                />
                Required Field
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="text-aerojet-blue rounded border-slate-300"
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                Active
              </label>
            </div>

            {(formData.fieldType === 'SELECT' || formData.fieldType === 'MULTI_SELECT') && (
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Options (JSON Array)
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
                  value={
                    formData.options ? JSON.stringify(formData.options) : '["Option 1", "Option 2"]'
                  }
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value)
                      setFormData({ ...formData, options: parsed })
                    } catch (_err) {
                      // Allow invalid state while typing, but don't save to state
                    }
                  }}
                  placeholder='["Option 1", "Option 2"]'
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Must be a valid JSON array of strings.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleSave}
              className="bg-aerojet-blue hover:bg-aerojet-blue/90 flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold text-white"
            >
              <Save className="h-4 w-4" /> Save Field
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="p-4 font-semibold">Field Name</th>
              <th className="p-4 font-semibold">Entity</th>
              <th className="p-4 font-semibold">Type</th>
              <th className="p-4 text-center font-semibold">Required</th>
              <th className="p-4 text-center font-semibold">Active</th>
              <th className="p-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {initialFields.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No custom fields defined yet.
                </td>
              </tr>
            ) : (
              initialFields.map((field) => (
                <tr
                  key={field.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="p-4">
                    <div className="font-bold text-slate-900 dark:text-white">{field.name}</div>
                    <div className="font-mono text-xs text-slate-500">{field.slug}</div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                      {field.appliesTo}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="bg-aerojet-blue/10 text-aerojet-blue dark:bg-aerojet-sky/10 dark:text-aerojet-sky inline-flex rounded-md px-2.5 py-0.5 text-xs font-medium">
                      {field.fieldType}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {field.isRequired ? (
                      <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">-</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {field.isActive ? (
                      <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="mx-auto h-5 w-5 text-slate-300 dark:text-slate-600" />
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(field)}
                        className="hover:text-aerojet-blue dark:hover:text-aerojet-sky rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Field"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(field.id)}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        title="Delete Field"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
