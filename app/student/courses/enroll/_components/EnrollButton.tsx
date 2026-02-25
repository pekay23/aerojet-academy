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
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#002a5c] py-3 text-sm font-bold text-white transition-all hover:bg-[#003a7c] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? 'Processing...' : 'Enroll Now'}
      </button>
    </WalletConfirmModal>
  )
}
