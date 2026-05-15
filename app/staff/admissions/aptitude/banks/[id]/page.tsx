'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { ArrowLeft, Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import QuestionEditor from './_components/QuestionEditor'

interface Bank {
  id: string
  name: string
  description: string | null
  isActive: boolean
}

export default function BankDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [bank, setBank] = useState<Bank | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchBank = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff/admissions/aptitude/banks/${id}`)
      const json = await res.json()
      if (json.data) setBank(json.data)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBank()
  }, [fetchBank])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-aerojet-blue" />
      </div>
    )
  }

  if (!bank) return <div className="p-12 text-center text-slate-500">Bank not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/staff/admissions/aptitude" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-aerojet-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-aerojet-blue dark:text-white sm:text-3xl">
            {bank.name}
          </h1>
          {bank.description && (
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              {bank.description}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">Questions</h2>
          <button
            onClick={() => setShowEditor(true)}
            className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-aerojet-blue/20 transition-all hover:shadow-xl hover:shadow-aerojet-blue/30"
          >
            <Plus className="h-4 w-4" /> Add Question
          </button>
        </div>

        <QuestionEditor 
          bankId={id} 
          isCreating={showEditor} 
          onCancelCreate={() => setShowEditor(false)} 
          key={refreshKey}
        />
      </div>
    </div>
  )
}
