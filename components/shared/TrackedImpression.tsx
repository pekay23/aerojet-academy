'use client'

import { useEffect, useRef } from 'react'
import { recordCourseEngagement } from '@/app/(portal)/_actions/analytics'

export default function TrackedImpression({ courseId }: { courseId: string }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (!tracked.current) {
      recordCourseEngagement(courseId, 'VIEW')
      tracked.current = true
    }
  }, [courseId])

  return null
}
