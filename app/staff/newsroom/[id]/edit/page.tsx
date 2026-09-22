'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import NewsroomForm, { NewsroomFormData } from '../../_components/NewsroomForm'

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [initialData, setInitialData] = useState<Partial<NewsroomFormData> | undefined>(undefined)

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await fetch(`/api/staff/newsroom/${id}`)
        const response = await res.json()
        if (!res.ok) throw new Error(response.error || 'Failed to load article')

        const data = response.data
        setInitialData({
          title: data.title || '',
          slug: data.slug || '',
          excerpt: data.excerpt || '',
          content: data.content || '',
          coverImage: data.coverImage || '',
          status: data.status || 'DRAFT',
          customAuthorName: data.customAuthorName || '',
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt).toISOString().slice(0, 16)
            : '',
          customPublishedAt: data.customPublishedAt
            ? new Date(data.customPublishedAt).toISOString().slice(0, 16)
            : '',
          tags: data.tags || [],
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to load article'
        toast.error(message)
      } finally {
        setInitialLoading(false)
      }
    }
    fetchArticle()
  }, [id])

  const handleSubmit = async (formData: NewsroomFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/staff/newsroom/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update article')
      }

      toast.success(
        formData.status === 'PUBLISHED'
          ? 'Article published/updated successfully'
          : 'Article saved as draft'
      )
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
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/staff/newsroom/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Article deleted')
      router.push('/staff/newsroom')
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete'
      toast.error(message)
      setIsDeleting(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="text-sm text-slate-500">Loading article...</span>
      </div>
    )
  }

  return (
    <NewsroomForm
      initialData={initialData}
      isEditing={true}
      articleId={id}
      isSubmitting={isSubmitting}
      isDeleting={isDeleting}
      submitLabel="Publish Changes"
      onSubmit={handleSubmit}
      onDelete={handleDelete}
    />
  )
}
