'use client'

import { useState } from 'react'
import { UploadDropzone } from '@/lib/uploads/uploadthing'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CheckCircle2, FileImage, RefreshCw } from 'lucide-react'

interface Props {
  courseId: string
  courseName: string
}

export default function CoursePaymentUploadForm({ courseId, courseName }: Props) {
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  if (submitted) {
    return (
      <div className="space-y-3 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
        <p className="font-bold text-green-800">Enrollment Proof Submitted</p>
        <p className="text-sm text-green-600">
          Your payment proof for <strong>{courseName}</strong> has been received. Our team will
          verify it and once approved, you will be onboarded to the student portal.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mx-auto mt-2 block text-xs text-slate-400 underline hover:text-slate-600 dark:text-slate-400"
        >
          <RefreshCw className="mr-1 inline h-3 w-3" />
          Upload a different file
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="font-bold text-slate-900 dark:text-slate-100">Upload Enrollment Proof</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Upload a screenshot or PDF of your bank transfer receipt for this course.
      </p>

      <UploadDropzone
        endpoint="paymentProof"
        onUploadBegin={() => setUploading(true)}
        onClientUploadComplete={async (res) => {
          setUploading(false)
          if (!res?.[0]?.url) {
            toast.error('Upload failed — no file URL returned.')
            return
          }

          try {
            const response = await fetch(`/api/applicant/courses/${courseId}/enroll`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ proofUrl: res[0].url }),
            })
            const data = await response.json()
            if (!response.ok) {
              toast.error(data.error || 'Failed to submit enrollment request.')
              return
            }
            toast.success('Enrollment submitted for review!')
            setSubmitted(true)
            router.refresh()
          } catch {
            toast.error('Network error while saving enrollment proof.')
          }
        }}
        onUploadError={(error) => {
          setUploading(false)
          toast.error(`Upload error: ${error.message}`)
        }}
        appearance={{
          container:
            'border-2 border-dashed border-slate-200 rounded-xl p-8 cursor-pointer hover:border-aerojet-sky transition-colors',
          label: 'text-slate-700 font-semibold',
          allowedContent: 'text-slate-400 text-xs',
          button:
            'bg-aerojet-blue text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#003875] transition-colors',
        }}
      />

      {uploading && (
        <p className="animate-pulse text-center text-sm text-slate-500 dark:text-slate-400">
          Uploading…
        </p>
      )}
    </div>
  )
}
