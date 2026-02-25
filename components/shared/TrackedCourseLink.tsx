'use client'

import Link from 'next/link'
import { recordCourseEngagement } from '@/app/(portal)/_actions/analytics'

interface TrackedCourseLinkProps {
  courseId: string
  href: string
  className?: string
  children: React.ReactNode
  action?: 'ENROLL_CLICK' | 'VIEW_CLICK'
}

export default function TrackedCourseLink({
  courseId,
  href,
  className,
  children,
  action = 'ENROLL_CLICK',
}: TrackedCourseLinkProps) {
  const handleClick = async () => {
    await recordCourseEngagement(courseId, action)
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  )
}
