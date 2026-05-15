'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, Loader2, Save } from 'lucide-react'

interface SystemSettings {
  [key: string]: any
}

export default function AptitudeConfigPage() {
  const [settings, setSettings] = useState<SystemSettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/admissions/aptitude/config')
      const json = await res.json()
      if (json.data) {
        setSettings(json.data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)
    try {
      const res = await fetch('/api/staff/admissions/aptitude/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return <div className="flex py-24 justify-center"><Loader2 className="h-8 w-8 animate-spin text-aerojet-blue" /></div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue dark:text-white sm:text-3xl">
          Test Configuration
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Global rules and composition settings for the admissions aptitude test.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-black text-slate-800 dark:text-white">Test Limits</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Time Limit (Minutes)</label>
            <input
              type="number"
              value={settings.aptitude_time_limit_minutes}
              onChange={e => handleChange('aptitude_time_limit_minutes', parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-200 p-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Pass Threshold (%)</label>
            <input
              type="number"
              min={1} max={100}
              value={settings.aptitude_pass_threshold_pct}
              onChange={e => handleChange('aptitude_pass_threshold_pct', parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-200 p-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Anti-Cheat: Max Tab Switches</label>
            <input
              type="number"
              value={settings.aptitude_max_tab_switches}
              onChange={e => handleChange('aptitude_max_tab_switches', parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-200 p-2 text-sm"
            />
            <p className="mt-1 text-[10px] text-slate-400">Test is flagged if applicant switches tabs more than this.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-black text-slate-800 dark:text-white">Question Composition (per session)</h3>
        <p className="mb-4 text-xs text-slate-500">How many questions to pull randomly from each category for a single test attempt.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">Math</label>
            <input type="number" value={settings.aptitude_math_count} onChange={e => handleChange('aptitude_math_count', parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-slate-200 p-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">English</label>
            <input type="number" value={settings.aptitude_english_count} onChange={e => handleChange('aptitude_english_count', parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-slate-200 p-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">Engineering</label>
            <input type="number" value={settings.aptitude_engineering_count} onChange={e => handleChange('aptitude_engineering_count', parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-slate-200 p-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">Logical Reasoning</label>
            <input type="number" value={settings.aptitude_reasoning_count} onChange={e => handleChange('aptitude_reasoning_count', parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-slate-200 p-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">Physics</label>
            <input type="number" value={settings.aptitude_physics_count} onChange={e => handleChange('aptitude_physics_count', parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-slate-200 p-2 text-sm" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-black text-slate-800 dark:text-white">Behaviors</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={settings.aptitude_require_for_modular} onChange={e => handleChange('aptitude_require_for_modular', e.target.checked)} className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Require test for Modular applicants</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={settings.aptitude_shuffle_questions} onChange={e => handleChange('aptitude_shuffle_questions', e.target.checked)} className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Shuffle questions order for each applicant</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={settings.aptitude_shuffle_options} onChange={e => handleChange('aptitude_shuffle_options', e.target.checked)} className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Shuffle MCQ options for each applicant</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Configuration
        </button>
        {success && <span className="flex items-center gap-1 text-sm font-bold text-emerald-500"><Check className="h-4 w-4" /> Saved!</span>}
      </div>
    </div>
  )
}
