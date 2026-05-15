'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BrainCircuit, Play, FileCheck, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import TestWarningModal from './_components/TestWarningModal'

export default function AptitudeTestLanding() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [starting, setStarting] = useState(false)

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/applicant/aptitude/session')
      const json = await res.json()
      setSessionInfo(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const handleStart = async () => {
    setStarting(true)
    try {
      const res = await fetch('/api/applicant/aptitude/start', { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        // Force refresh to start interface
        window.location.reload()
      } else {
        alert(json.error || 'Failed to start test')
        setStarting(false)
      }
    } catch (e) {
      alert('An error occurred')
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-aerojet-blue" />
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
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white sm:text-3xl">
            Aptitude Test Completed
          </h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            You have successfully completed the aptitude test. You will be notified of the next steps via email and your dashboard.
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-aerojet-blue dark:bg-blue-900/30 dark:text-blue-400">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Aptitude Test</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Engineering & Logic Evaluation</p>
          </div>
        </div>

        <div className="py-6 prose prose-slate dark:prose-invert max-w-none text-sm">
          <p>
            The Aerojet Aviation aptitude test evaluates your foundational knowledge in Mathematics, English, Engineering principles, and Logical Reasoning. This is a mandatory step in the admission pipeline.
          </p>
          <ul className="space-y-2 font-medium">
            <li className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500 shrink-0" />
              <span><strong>Time Limit:</strong> You will have 60 minutes to complete the test. The timer cannot be paused once started.</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500 shrink-0" />
              <span><strong>Anti-Cheat Active:</strong> This test requires full screen. Navigating away or switching tabs will flag your session and may result in an automatic failure.</span>
            </li>
            <li className="flex items-start gap-2">
              <FileCheck className="mt-0.5 h-4 w-4 text-aerojet-blue shrink-0" />
              <span><strong>Preparation:</strong> Ensure you have a stable internet connection and a quiet environment before starting.</span>
            </li>
          </ul>
        </div>

        <div className="border-t border-slate-100 pt-6 dark:border-slate-800 text-center">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-aerojet-blue px-8 py-4 font-black text-white shadow-lg shadow-aerojet-blue/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-aerojet-blue/30"
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
