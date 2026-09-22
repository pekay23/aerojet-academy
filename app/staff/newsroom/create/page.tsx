'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import NewsroomForm, { NewsroomFormData } from '@/app/staff/newsroom/_components/NewsroomForm'

export default function CreateArticlePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting] = useState(false)

  const handleSubmit = async (formData: NewsroomFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/staff/newsroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create article')
      }

      toast.success(formData.status === 'PUBLISHED' ? 'Article published successfully' : 'Article created as draft')
      router.push('/staff/newsroom')
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong'
      toast.error(message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    // No delete for new articles
  }

  return (
    <NewsroomForm
      isEditing={false}
      isSubmitting={isSubmitting}
      isDeleting={isDeleting}
      submitLabel="Publish Article"
      onSubmit={handleSubmit}
      onDelete={handleDelete}
    />
  )
}