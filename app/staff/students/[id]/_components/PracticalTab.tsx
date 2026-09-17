'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import PracticalAssessmentsClient from '@/app/staff/practical-assessments/_components/PracticalAssessmentsClient'
import type { SerializedPracticalRecord, SerializedCourse, SerializedInstructor, SerializedAtaChapter } from '@/lib/staff/types'

interface PracticalStudent {
  id: string
  studentId: string
  user: { profile: { firstName: string; lastName: string } | null }
}

interface Props {
  student: { id: string }
  onRefresh: () => void
}

interface PracticalData {
  records: SerializedPracticalRecord[]
  courses: SerializedCourse[]
  students: PracticalStudent[]
  instructors: SerializedInstructor[]
  ataChapters: SerializedAtaChapter[]
}

export default function PracticalTab({ student }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PracticalData | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(
          `/api/staff/practical-training?userId=${encodeURIComponent(student.id)}&limit=200`,
          { cache: 'no-store' }
        )
        if (!res.ok) throw new Error('Failed to load practical records')
        const json = await res.json()
        if (cancelled) return
        const d = json.data || {}
        setData({
          records: d.records || [],
          courses: d.courses || [],
          students: d.student ? [d.student] : [],
          instructors: d.instructors || [],
          ataChapters: d.ataChapters || [],
        })
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load practical assessments')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [student.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading practical assessments...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center text-sm text-rose-500">{error || 'Unable to load data.'}</div>
    )
  }

  return (
    <PracticalAssessmentsClient
      initialRecords={data.records}
      courses={data.courses}
      students={data.students}
      instructors={data.instructors}
      ataChapters={data.ataChapters}
    />
  )
}
