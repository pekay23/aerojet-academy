'use client'

import { useState } from 'react'
import { enrollInCourse } from '@/app/student/actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function EnrollButton({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(false)

  const handleEnroll = async () => {
    setLoading(true)
    try {
      const res = await enrollInCourse(courseId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Enrollment request submitted successfully!')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#002a5c] py-3 text-sm font-bold text-white transition-all hover:bg-[#003a7c] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading ? 'Processing...' : 'Enroll Now'}
    </button>
  )
}
