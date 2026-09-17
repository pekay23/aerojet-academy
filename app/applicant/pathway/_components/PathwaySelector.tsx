'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, FileSignature, Layers, AlertCircle, ArrowRight, X } from 'lucide-react'
import { getCurrencySymbol } from '@/lib/currency'

type PathwayType = 'FULL_TIME' | 'EXAM_ONLY' | 'MODULAR'

export default function PathwaySelector({ currency = 'EUR' }: { currency?: string }) {
  const router = useRouter()
  const [selected, setSelected] = useState<PathwayType | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const symbol = getCurrencySymbol(currency)

  const pathways = [
    {
      id: 'FULL_TIME' as PathwayType,
      title: 'Full-Time Programme',
      icon: GraduationCap,
      description: 'Structured 1 to 4-year programmes with milestones.',
      features: [
        'Organized chronological curriculum',
        'Milestone-based payment schedules (Y1: 40/30/30)',
        'Classroom attendance tracking',
      ],
      color:
        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800',
      activeColor: 'border-blue-600 ring-2 ring-blue-600 dark:border-blue-500',
    },
    {
      id: 'EXAM_ONLY' as PathwayType,
      title: 'Exam-Only',
      icon: FileSignature,
      description: 'Book individual EASA module exams with 100% upfront payment.',
      features: [
        'Flexible schedule',
        `Group Pooling discounts (${symbol}300 per seat)`,
        `Individual bookings (${symbol}520 per seat)`,
      ],
      color:
        'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-800',
      activeColor: 'border-purple-600 ring-2 ring-purple-600 dark:border-purple-500',
    },
    {
      id: 'MODULAR' as PathwayType,
      title: 'Modular Packages',
      icon: Layers,
      description: 'Purchase bundles of modules for self-paced learning.',
      features: [
        '100% upfront package payment',
        'Learn exactly what you need',
        'Optional tuition sessions',
      ],
      color:
        'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/10 dark:text-orange-400 dark:border-orange-800',
      activeColor: 'border-orange-600 ring-2 ring-orange-600 dark:border-orange-600',
    },
  ]

  const handleSelect = (id: PathwayType) => {
    setSelected(id)
  }

  const handleConfirm = async () => {
    if (!selected) return
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/me/study-pathway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studyPathway: selected }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to lock pathway')
      }
      router.refresh()
      router.push('/applicant/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to lock pathway')
      setIsSubmitting(false)
      setIsConfirming(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
          Choose Your Study Pathway
        </h1>
        <p className="mt-4 text-base text-slate-500 dark:text-slate-400">
          This is a permanent selection that shapes your entire journey at Aerojet Academy.
          <br /> Select the pathway that aligns with your educational goals.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {pathways.map((path) => {
          const Icon = path.icon
          const isSelected = selected === path.id
          return (
            <div
              key={path.id}
              onClick={() => handleSelect(path.id)}
              className={`relative cursor-pointer rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md dark:bg-slate-900 ${
                isSelected ? path.activeColor : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl border ${path.color} mb-4`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{path.title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{path.description}</p>
              <ul className="mt-4 space-y-2">
                {path.features.map((feature, idx) => (
                  <li key={idx} className="flex text-xs text-slate-600 dark:text-slate-300">
                    <span className="mr-2 text-aerojet-sky">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
              {isSelected && (
                <div className="absolute top-6 right-6 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                  <CheckIcon />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex justify-center pt-6">
        <button
          onClick={() => setIsConfirming(true)}
          disabled={!selected}
          className="inline-flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-aerojet-blue px-8 text-sm font-bold tracking-widest text-white uppercase transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirm Pathway
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {isConfirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <button
                onClick={() => !isSubmitting && setIsConfirming(false)}
                className="text-slate-400 hover:text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Lock your pathway?
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                You have selected the{' '}
                <strong>{pathways.find((p) => p.id === selected)?.title}</strong> pathway. This
                selection is permanent and restricts the bookings available to you. You cannot
                change this later without administrator assistance.
              </p>
            </div>
            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setIsConfirming(false)}
                disabled={isSubmitting}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50 sm:w-auto"
              >
                {isSubmitting ? 'Locking...' : 'Yes, Lock Pathway'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  )
}
