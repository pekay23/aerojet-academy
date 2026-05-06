'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sanitizeHtml } from '@/lib/utils/sanitize'
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  ImagePlus,
  Trash2,
  X,
  Calendar,
  Clock,
  User as UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { UploadButton } from '@/lib/uploads/uploadthing'
import dynamic from 'next/dynamic'
const NewsMarkdownEditor = dynamic(() => import('../../_components/NewsMarkdownEditor'), { ssr: false })

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    customAuthorName: '',
    publishedAt: '',
    customPublishedAt: '',
    tags: [] as string[],
  })

  const isPublishing = formData.status === 'PUBLISHED'

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await fetch(`/api/staff/newsroom/${id}`)
        const response = await res.json()
        if (!res.ok) throw new Error(response.error || 'Failed to load article')

        const data = response.data
        setFormData({
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
      } catch (error: any) {
        toast.error(error.message)
      } finally {
        setInitialLoading(false)
      }
    }
    fetchArticle()
  }, [id])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    // Only auto-generate slug if it hasn't been manually set much
    if (formData.status === 'DRAFT') {
      const basicSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData({ ...formData, title, slug: basicSlug })
    } else {
      setFormData({ ...formData, title })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

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
        isPublishing ? 'Article published/updated successfully' : 'Article saved as draft'
      )
      router.push('/staff/newsroom')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article?')) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/staff/newsroom/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Article deleted')
      router.push('/staff/newsroom')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
      setIsDeleting(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1800px] space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/staff/newsroom"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-150 ease-out hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Edit Article
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            disabled={isDeleting || loading}
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 dark:border-red-900/30 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-150 ease-out hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
          >
            <Eye className="h-4 w-4" />
            {isPreview ? 'Edit Mode' : 'Preview'}
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || isDeleting}
            className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-aerojet-blue/90 disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isPublishing ? 'Publish Changes' : 'Save Changes'}
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
                  className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-lg font-medium text-slate-900 outline-none focus:border-aerojet-blue focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                  value={formData.title}
                  onChange={handleTitleChange}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Content (Markdown & Media Supported)
                </label>
                <NewsMarkdownEditor
                  value={formData.content}
                  onChange={(val) => setFormData({ ...formData, content: val })}
                  placeholder="Write your article content here..."
                />
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              {/* Immersive Hero Preview */}
              <div className="relative h-64 w-full overflow-hidden sm:h-80">
                {formData.coverImage ? (
                  <>
                    <img
                      src={formData.coverImage}
                      alt={formData.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-aerojet-blue" />
                )}

                <div className="absolute inset-0 flex items-end pb-8">
                  <div className="px-8">
                    <div className="mb-4 inline-block rounded-full bg-aerojet-sky px-3 py-1 text-[8px] font-black tracking-widest text-white uppercase">
                      Academy News
                    </div>
                    <h1 className="mb-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
                      {formData.title || 'Untitled Article'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-[9px] font-bold tracking-widest text-slate-200 uppercase">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-3 w-3 text-aerojet-sky" />
                        <span>{formData.customAuthorName || 'Aerojet Academy'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-aerojet-sky" />
                        <span>
                          {formData.customPublishedAt
                            ? new Date(formData.customPublishedAt).toLocaleDateString()
                            : formData.publishedAt
                              ? new Date(formData.publishedAt).toLocaleDateString()
                              : new Date().toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Article Content Area */}
              <div className="p-8">
                {formData.excerpt && (
                  <p className="mb-8 text-lg font-medium text-slate-600 italic dark:text-slate-400">
                    {formData.excerpt}
                  </p>
                )}
                <div
                  className="prose dark:prose-invert prose-slate max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(formData.content || 'Start writing to see preview...'),
                  }}
                />
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-aerojet-blue focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
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
                  className="w-full resize-none rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm text-slate-900 outline-none focus:border-aerojet-blue focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Short summary for preview cards..."
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-aerojet-blue focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                  placeholder="e.g. Aviation, News, Training"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => {
                    const tags = e.target.value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter((tag) => tag !== '')
                    setFormData({ ...formData, tags })
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    Custom Author
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-aerojet-blue focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                    placeholder="Enter author name..."
                    value={formData.customAuthorName}
                    onChange={(e) => setFormData({ ...formData, customAuthorName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    System Publish Date
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-aerojet-blue focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                    value={formData.publishedAt}
                    onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Custom Display Date
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-aerojet-blue focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                  value={formData.customPublishedAt}
                  onChange={(e) => setFormData({ ...formData, customPublishedAt: e.target.value })}
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Overrides the default publication date shown on cards and the article.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Cover Image URL
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <ImagePlus className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="url"
                      className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 pr-4 pl-10 text-sm text-slate-900 outline-none focus:border-aerojet-blue focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                      placeholder="https://..."
                      value={formData.coverImage}
                      onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                      OR
                    </span>
                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                  </div>

                  <UploadButton
                    endpoint="newsCoverImage"
                    onClientUploadComplete={(res) => {
                      if (res && res[0]) {
                        setFormData({ ...formData, coverImage: res[0].ufsUrl })
                        toast.success('Image uploaded successfully')
                      }
                    }}
                    onUploadError={(error: Error) => {
                      toast.error(`Error! ${error.message}`)
                    }}
                    appearance={{
                      button:
                        'ut-ready:bg-aerojet-blue ut-uploading:cursor-not-allowed rounded-xl bg-aerojet-blue bg-none after:bg-blue-400',
                      container: 'w-full',
                      allowedContent: 'text-slate-400 text-[10px] uppercase font-bold',
                    }}
                  />
                </div>
              </div>

              {formData.coverImage && (
                <div className="group relative mt-2 h-32 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <img
                    src={formData.coverImage}
                    alt="Cover Preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, coverImage: '' })}
                    className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
