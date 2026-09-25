'use client'
import { formatDate } from '@/lib/utils/formatters'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  Clock as _Clock,
  User as UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { UploadButton } from '@/lib/uploads/uploadthing'
import dynamic from 'next/dynamic'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const NewsMarkdownEditor = dynamic(() => import('./NewsMarkdownEditor'), { ssr: false })

export interface NewsroomFormData {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  customAuthorName: string
  publishedAt: string
  customPublishedAt: string
  tags: string[]
}

export interface NewsroomFormProps {
  initialData?: Partial<NewsroomFormData>
  isEditing: boolean
  articleId?: string
  onSubmit: (data: NewsroomFormData) => Promise<void>
  onDelete?: () => Promise<void>
  isSubmitting: boolean
  isDeleting: boolean
  submitLabel: string
}

export default function NewsroomForm({
  initialData,
  isEditing,
  onSubmit,
  onDelete,
  isSubmitting,
  isDeleting,
  submitLabel,
}: NewsroomFormProps) {
  const [isPreview, setIsPreview] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const [formData, setFormData] = useState<NewsroomFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    status: 'DRAFT',
    customAuthorName: '',
    publishedAt: '',
    customPublishedAt: '',
    tags: [],
    ...initialData,
  })

  // Auto-generate slug from title (only for drafts and if not manually edited)
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const title = e.target.value
      setFormData((prev) => {
        if (prev.status === 'DRAFT' && !slugManuallyEdited) {
          const basicSlug = title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '')
          return { ...prev, title, slug: basicSlug }
        }
        return { ...prev, title }
      })
    },
    [slugManuallyEdited]
  )

  const handleSlugChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, slug: e.target.value }))
    setSlugManuallyEdited(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handleDelete = async () => {
    if (!onDelete) return
    await onDelete()
  }

  // Format date for display
  const getDisplayDate = () => {
    if (formData.customPublishedAt) {
      return formatDate(formData.customPublishedAt)
    }
    if (formData.publishedAt) {
      return formatDate(formData.publishedAt)
    }
    return new Date().toLocaleDateString()
  }

  const getDisplayAuthor = () => {
    return formData.customAuthorName || 'Aerojet Academy'
  }

  if (isEditing && !initialData?.title && !isSubmitting) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-450 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/staff/newsroom"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-150 ease-out hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600"
              aria-label="Back to Newsroom"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isEditing ? 'Edit Article' : 'Create Article'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEditing && onDelete && (
              <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting || isSubmitting}
                    aria-label="Delete article"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Article</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this article? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreview(!isPreview)}
                  aria-pressed={isPreview}
                >
                  <Eye className="h-4 w-4" />
                  {isPreview ? 'Edit Mode' : 'Preview'}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Toggle between editing and preview mode</TooltipContent>
            </Tooltip>

            <Button
              type="submit"
              form="newsroom-form"
              disabled={isSubmitting || isDeleting}
              className="bg-aerojet-blue hover:bg-aerojet-blue/90 disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {submitLabel}
            </Button>
          </div>
        </div>

        <form id="newsroom-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {!isPreview ? (
                <div className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                  <div>
                    <Label
                      htmlFor="title"
                      className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Article Title
                    </Label>
                    <Input
                      id="title"
                      required
                      placeholder="Enter a compelling title..."
                      className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-lg font-medium text-slate-900 outline-none focus:ring-2 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                      value={formData.title}
                      onChange={handleTitleChange}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="content"
                      className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Content (Markdown & Media Supported)
                    </Label>
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
                        <Image
                          src={formData.coverImage}
                          alt={formData.title}
                          fill
                          sizes="(min-width: 640px) 800px, 100vw"
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent" />
                      </>
                    ) : (
                      <div className="bg-aerojet-blue absolute inset-0" />
                    )}

                    <div className="absolute inset-0 flex items-end pb-8">
                      <div className="px-8">
                        <div className="bg-aerojet-sky mb-4 inline-block rounded-full px-3 py-1 text-[11px] font-black tracking-widest text-white uppercase">
                          Academy News
                        </div>
                        <h1 className="mb-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
                          {formData.title || 'Untitled Article'}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold tracking-widest text-slate-200 uppercase">
                          <div className="flex items-center gap-2">
                            <UserIcon className="text-aerojet-sky h-3 w-3" />
                            <span>{getDisplayAuthor()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="text-aerojet-sky h-3 w-3" />
                            <span>{getDisplayDate()}</span>
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
                <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
                  Publishing
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="status"
                      className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
                    >
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          status: value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
                        })
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label
                      htmlFor="slug"
                      className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
                    >
                      URL Slug
                    </Label>
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-[#101622]">
                      <span className="shrink-0 text-sm text-slate-400">/news/</span>
                      <Input
                        id="slug"
                        required
                        className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-white"
                        value={formData.slug}
                        onChange={handleSlugChange}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Auto-generated from title. Edit to customize.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Meta Data</h3>

                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="excerpt"
                      className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
                    >
                      Excerpt
                    </Label>
                    <Textarea
                      id="excerpt"
                      rows={3}
                      className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full resize-none rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Short summary for preview cards..."
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="tags"
                      className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
                    >
                      Tags (Comma separated)
                    </Label>
                    <Input
                      id="tags"
                      className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                      placeholder="e.g. Aviation, News, Training"
                      value={formData.tags.join(', ')}
                      onChange={(e) => {
                        const tags = e.target.value
                          .split(',')
                          .map((tag) => tag.trim())
                          .filter((tag) => tag !== '')
                        setFormData({ ...formData, tags })
                      }}
                    />
                    <p className="mt-1 text-[11px] text-slate-400">Separate tags with commas</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="customAuthorName"
                        className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
                      >
                        Custom Author
                      </Label>
                      <Input
                        id="customAuthorName"
                        className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                        placeholder="Enter author name..."
                        value={formData.customAuthorName}
                        onChange={(e) =>
                          setFormData({ ...formData, customAuthorName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="publishedAt"
                        className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
                      >
                        System Publish Date
                      </Label>
                      <Input
                        id="publishedAt"
                        type="datetime-local"
                        className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                        value={formData.publishedAt}
                        onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="customPublishedAt"
                      className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
                    >
                      Custom Display Date
                    </Label>
                    <Input
                      id="customPublishedAt"
                      type="datetime-local"
                      className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                      value={formData.customPublishedAt}
                      onChange={(e) =>
                        setFormData({ ...formData, customPublishedAt: e.target.value })
                      }
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Overrides the default publication date shown on cards and the article.
                    </p>
                  </div>

                  <div>
                    <Label
                      htmlFor="coverImage"
                      className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
                    >
                      Cover Image URL
                    </Label>
                    <div className="space-y-3">
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <ImagePlus className="h-4 w-4 text-slate-400" />
                        </div>
                        <Input
                          id="coverImage"
                          type="url"
                          className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-xl border border-slate-200 bg-transparent py-2.5 pr-4 pl-10 text-sm text-slate-900 outline-none focus:ring-2 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
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
                      <Image
                        src={formData.coverImage}
                        alt="Cover Preview"
                        fill
                        sizes="(min-width: 640px) 320px, 100vw"
                        className="object-cover"
                        unoptimized
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 rounded-lg bg-red-500 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                        onClick={() => setFormData({ ...formData, coverImage: '' })}
                        aria-label="Remove cover image"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </TooltipProvider>
  )
}
