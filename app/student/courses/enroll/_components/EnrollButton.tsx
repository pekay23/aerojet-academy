'use client'

import { useState } from 'react'
import { enrollInCourse } from '@/app/student/actions'
import { recordCourseEngagement } from '@/app/(portal)/_actions/analytics'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { WalletConfirmModal } from '@/components/shared/WalletConfirmModal'

export default function EnrollButton({
  courseId,
  price,
  currency,
}: {
  courseId: string
  price: number
  currency: string
}) {
  const [loading, setLoading] = useState(false)

  const handleEnroll = async () => {
    setLoading(true)
    try {
      await recordCourseEngagement(courseId, 'ENROLL_CLICK')
      const res = await enrollInCourse(courseId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Enrollment successful!')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <WalletConfirmModal
      title="Enroll in Course"
      description="You are about to enroll in this course. For Modular pathways, this will instantly deduct the full course fee from your wallet. For Full-Time, your milestones will be generated."
      amount={price}
      currency={currency}
      onConfirm={handleEnroll}
      processing={loading}
    >
      <button
        disabled={loading}
        className="group/enroll relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-aerojet-blue px-8 text-xs font-black tracking-widest text-white uppercase transition-all hover:shadow-[0_0_20px_rgba(0,42,92,0.3)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-linear-to-r from-blue-600 via-indigo-600 to-blue-600 opacity-0 transition-opacity duration-500 group-hover/enroll:opacity-100" />
        
        {/* Shimmer Effect */}
        <div className="absolute inset-x-0 top-0 h-px w-full bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover/enroll:translate-y-14" />

        <span className="relative z-10 flex items-center gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing
            </>
          ) : (
            <>
              Enroll Now <span className="transition-transform group-hover/enroll:translate-x-1">→</span>
            </>
          )}
        </span>
      </button>
    </WalletConfirmModal>
  )
}
