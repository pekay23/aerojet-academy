'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, Loader2, ImagePlus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreateArticlePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isPreview, setIsPreview] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    status: 'DRAFT',
  })

  // Basic slug generator
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    const basicSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    setFormData({ ...formData, title, slug: basicSlug })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/staff/newsroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create article')
      }

      toast.success('Article created successfully')
      router.push('/staff/newsroom')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/staff/newsroom"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Create Article
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Eye className="h-4 w-4" />
            {isPreview ? 'Edit Mode' : 'Preview'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#002a5c] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#002a5c]/90 disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Article
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {!isPreview ? (
            <div className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Article Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter a compelling title..."
                  className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-lg font-medium text-slate-900 outline-none focus:border-[#002a5c] focus:ring-2 focus:ring-[#002a5c]/20 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                  value={formData.title}
                  onChange={handleTitleChange}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Content (Markdown Supported)
                </label>
                <textarea
                  required
                  rows={20}
                  placeholder="Write your article content here..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-transparent px-4 py-3 font-mono text-sm text-slate-900 outline-none focus:border-[#002a5c] focus:ring-2 focus:ring-[#002a5c]/20 dark:border-slate-700 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="prose dark:prose-invert min-h-[600px] max-w-none rounded-2xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              {formData.coverImage && (
                <img
                  src={formData.coverImage}
                  alt="Cover"
                  className="mb-8 h-64 w-full rounded-xl object-cover"
                />
              )}
              <h1>{formData.title || 'Untitled Article'}</h1>
              {formData.excerpt && <p className="lead">{formData.excerpt}</p>}
              <div className="whitespace-pre-wrap">
                {formData.content || 'Start writing to see preview...'}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Publishing</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-[#002a5c] focus:ring-2 focus:ring-[#002a5c]/20 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  URL Slug
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-[#101622]">
                  <span className="shrink-0 text-sm text-slate-400">/news/</span>
                  <input
                    type="text"
                    required
                    className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-white"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Meta Data</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Excerpt
                </label>
                <textarea
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#002a5c] focus:ring-2 focus:ring-[#002a5c]/20 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Short summary for preview cards..."
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Cover Image URL
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <ImagePlus className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="url"
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 pr-4 pl-10 text-sm text-slate-900 outline-none focus:border-[#002a5c] focus:ring-2 focus:ring-[#002a5c]/20 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                    placeholder="https://..."
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  />
                </div>
              </div>

              {formData.coverImage && (
                <div className="relative mt-2 h-32 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <img
                    src={formData.coverImage}
                    alt="Cover Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
