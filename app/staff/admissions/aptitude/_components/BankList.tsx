'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Database, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Bank {
  id: string
  name: string
  description: string | null
  applicableProgrammes: string[]
  isActive: boolean
  _count: { questions: number; sessions: number }
  createdAt: string
}

export default function BankList() {
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', isActive: true })
  const [saving, setSaving] = useState(false)

  const fetchBanks = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/admissions/aptitude/banks')
      const json = await res.json()
      if (json.data) setBanks(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBanks()
  }, [fetchBanks])

  const handleCreate = async () => {
    if (!form.name) return
    setSaving(true)
    try {
      const res = await fetch('/api/staff/admissions/aptitude/banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setForm({ name: '', description: '', isActive: true })
        setShowForm(false)
        fetchBanks()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this test bank?')) return
    await fetch(`/api/staff/admissions/aptitude/banks/${id}`, { method: 'DELETE' })
    fetchBanks()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-aerojet-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-800 dark:text-white">Question Banks</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New Bank
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 font-bold text-slate-800 dark:text-white">Create Test Bank</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-aerojet-blue focus:outline-none focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="e.g. 2026 General Aptitude"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-aerojet-blue focus:outline-none focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={saving || !form.name}
                className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {banks.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Database className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="font-bold text-slate-500 dark:text-slate-400">No test banks found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banks.map(bank => (
            <div key={bank.id} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-aerojet-blue/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div>
                <div className="flex items-center justify-between">
                  <div className={`h-2.5 w-2.5 rounded-full ${bank.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  {bank._count.sessions === 0 && (
                    <button onClick={() => handleDelete(bank.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <h3 className="mt-3 text-lg font-black text-slate-800 dark:text-white">{bank.name}</h3>
                {bank.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{bank.description}</p>
                )}
                <div className="mt-4 flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">
                    <Database className="h-3.5 w-3.5 text-aerojet-blue" />
                    {bank._count.questions} Questions
                  </span>
                </div>
              </div>
              <Link
                href={`/staff/admissions/aptitude/banks/${bank.id}`}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-bold text-aerojet-blue transition-colors hover:bg-blue-50 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700"
              >
                Manage Questions <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
