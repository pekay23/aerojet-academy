'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffIndexPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/staff/dashboard')
  }, [router])
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <span className="text-sm font-medium text-slate-500">Redirecting to dashboard...</span>
    </div>
  )
}
