'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import TestInterface, { type TestQuestion } from '../_components/TestInterface'
import AntiCheatProvider from '../_components/AntiCheatProvider'

interface AptitudeSessionData {
  id: string
  status: string
  expiresAt: string
  questions: TestQuestion[]
}

export default function TakeTestPage() {
  const router = useRouter()
  const [session, setSession] = useState<AptitudeSessionData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/applicant/aptitude/session')
      const json = await res.json()
      if (json.data && json.data.status === 'IN_PROGRESS') {
        setSession(json.data)
      } else {
        router.push('/applicant/application/aptitude-test')
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-aerojet-blue" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-aerojet-blue" />
        <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Redirecting…</p>
      </div>
    )
  }

  return (
    <AntiCheatProvider sessionId={session.id}>
      <TestInterface session={session} />
    </AntiCheatProvider>
  )
}
