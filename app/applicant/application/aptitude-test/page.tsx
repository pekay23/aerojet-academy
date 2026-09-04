'use client'

export const metadata = { title: 'Aptitude Test | Applicant Portal' }

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { BrainCircuit, Play, FileCheck, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import TestWarningModal from './_components/TestWarningModal'
import { useFetch } from '@/lib/hooks/useFetch'

interface AptitudeSession {
  status: string
  [key: string]: unknown
}

export default function AptitudeTestLanding() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [starting, setStarting] = useState(false)
  const { data: sessionInfo, loading, _error, _refetch } = useFetch<AptitudeSession>('/api/applicant/aptitude/session')

  const handleStart = async () => {
    setStarting(true)
    try {
      const res = await fetch('/api/applicant/aptitude/start', { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        router.refresh()
      } else {
        toast.error(json.error || 'Failed to start test')
        setStarting(false)
      }
    } catch (_e) {
      toast.error('An error occurred')
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="text-aerojet-blue h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (sessionInfo?.status === 'IN_PROGRESS') {
    // Return the active test interface directly (or redirect)
    // We'll redirect to the actual test page if we had one, but we can also just render it.
    // For simplicity, let's redirect to the test running page.
    router.push('/applicant/application/aptitude-test/take')
    return null
  }

  if (sessionInfo && sessionInfo.status !== 'IN_PROGRESS') {
    return (
      <div className="mx-auto max-w-2xl space-y-6 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
          <h2 className="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl dark:text-white">
            Aptitude Test Completed
          </h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            You have successfully completed the aptitude test. You will be notified of the next
            steps via email and your dashboard.
          </p>
          <button
            onClick={() => router.push('/applicant/application/status')}
            className="mt-8 rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6 dark:border-slate-800">
          <div className="text-aerojet-blue flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Aptitude Test</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Engineering & Logic Evaluation
            </p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none py-6 text-sm">
          <p>
            The Aerojet Aviation Training Academy aptitude test evaluates your foundational
            knowledge in Mathematics, English, Engineering principles, and Logical Reasoning. This
            is a mandatory step in the admission pipeline.
          </p>
          <ul className="space-y-2 font-medium">
            <li className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>
                <strong>Time Limit:</strong> You will have 60 minutes to complete the test. The
                timer cannot be paused once started.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>
                <strong>Anti-Cheat Active:</strong> This test requires full screen. Navigating away
                or switching tabs will flag your session and may result in an automatic failure.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <FileCheck className="text-aerojet-blue mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>Preparation:</strong> Ensure you have a stable internet connection and a
                quiet environment before starting.
              </span>
            </li>
          </ul>
        </div>

        <div className="border-t border-slate-100 pt-6 text-center dark:border-slate-800">
          <button
            onClick={() => setShowModal(true)}
            className="bg-aerojet-blue shadow-aerojet-blue/20 hover:shadow-aerojet-blue/30 inline-flex items-center gap-2 rounded-xl px-8 py-4 font-black text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            <Play className="h-5 w-5 fill-current" />
            Begin Assessment
          </button>
        </div>
      </div>

      {showModal && (
        <TestWarningModal
          onCancel={() => setShowModal(false)}
          onConfirm={handleStart}
          starting={starting}
        />
      )}
    </div>
  )
}
