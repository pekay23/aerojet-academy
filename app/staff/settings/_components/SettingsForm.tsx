'use client'

import { useState, useRef } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface SettingField {
  key: string
  label: string
  description: string
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'SELECT'
  default: string
  options?: string[]
}

interface SettingsFormProps {
  fields: SettingField[]
  values: Record<string, string>
  groupLabel?: string
}

export default function SettingsForm({ fields, values, groupLabel }: SettingsFormProps) {
  const [saving, setSaving] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formRef.current) return

    setSaving(true)
    try {
      const formData = new FormData(formRef.current)
      // Ensure unchecked checkboxes are included as 'false'
      for (const field of fields) {
        if (field.type === 'BOOLEAN' && !formData.has(field.key)) {
          formData.set(field.key, 'false')
        }
      }

      const res = await fetch('/api/staff/settings', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      })

      if (res.ok) {
        toast.success(`${groupLabel || 'Settings'} saved successfully`)
      } else {
        toast.error('Failed to save settings')
      }
    } catch {
      toast.error('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-1">
      <div className="divide-y divide-slate-100/60 overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 shadow-sm dark:divide-white/5 dark:border-white/5 dark:bg-[#111827]/60">
        {fields.map((field) => {
          const currentValue = values[field.key] ?? field.default
          return (
            <div
              key={field.key}
              className="group flex flex-col justify-between gap-4 px-6 py-5 transition-colors hover:bg-slate-50/50 md:flex-row md:items-center dark:hover:bg-white/1"
            >
              <div className="max-w-xl flex-1">
                <label
                  htmlFor={field.key}
                  className="block text-sm font-bold text-slate-900 dark:text-slate-100"
                >
                  {field.label}
                </label>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {field.description}
                </p>
              </div>
              <div className="w-full shrink-0 md:w-72">
                {field.type === 'BOOLEAN' ? (
                  <div className="flex items-center justify-end gap-3">
                    <input type="hidden" name={`${field.key}__type`} value="BOOLEAN" />
                    <div className="relative inline-flex items-center">
                      <input
                        id={field.key}
                        name={field.key}
                        type="checkbox"
                        defaultChecked={currentValue === 'true'}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={field.key}
                        className="peer h-7 w-12 cursor-pointer rounded-full bg-slate-200 shadow-inner transition-colors peer-checked:bg-[#002a5c] peer-focus:ring-4 peer-focus:ring-[#002a5c]/20 peer-focus:outline-none after:absolute after:top-[4px] after:left-[4px] after:h-[1.35rem] after:w-[1.35rem] after:rounded-full after:bg-white after:shadow-md after:transition-all peer-checked:after:translate-x-5 peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-blue-600"
                      />
                    </div>
                  </div>
                ) : field.type === 'SELECT' && field.options ? (
                  <div>
                    <input type="hidden" name={`${field.key}__type`} value="STRING" />
                    <select
                      id={field.key}
                      name={field.key}
                      defaultValue={currentValue}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-sm transition-all focus:border-[#002a5c] focus:ring-4 focus:ring-[#002a5c]/5 focus:outline-none dark:border-white/10 dark:bg-black/20 dark:text-white"
                    >
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <input type="hidden" name={`${field.key}__type`} value={field.type} />
                    <input
                      id={field.key}
                      name={field.key}
                      type={field.type === 'NUMBER' ? 'number' : 'text'}
                      defaultValue={currentValue}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-[#002a5c] focus:ring-4 focus:ring-[#002a5c]/5 focus:outline-none dark:border-white/10 dark:bg-black/20 dark:text-white"
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#002a5c] px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#003875] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  )
}
