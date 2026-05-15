'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import TestInterface from '../_components/TestInterface'
import AntiCheatProvider from '../_components/AntiCheatProvider'

export default function TakeTestPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
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

  if (!session) return null

  return (
    <AntiCheatProvider sessionId={session.id}>
      <TestInterface session={session} />
    </AntiCheatProvider>
  )
}
