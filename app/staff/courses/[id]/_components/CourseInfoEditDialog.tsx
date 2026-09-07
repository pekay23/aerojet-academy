'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Pencil, Loader2 } from 'lucide-react'

const LICENCE_CATEGORIES = ['A', 'B1', 'B2', 'B3'] as const

interface CourseInfo {
  id: string
  description: string | null
  subtitle?: string | null
  duration?: number | null
  categoryId?: string | null
  prerequisites?: string[]
  topics?: string[]
  estimatedStudyHoursMin?: number | null
  estimatedStudyHoursMax?: number | null
  applicableCategories?: string[]
}

interface CourseCategory {
  id: string
  name: string
}

export default function CourseInfoEditDialog({
  course,
  categories,
}: {
  course: CourseInfo
  categories: CourseCategory[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [description, setDescription] = useState(course.description || '')
  const [subtitle, setSubtitle] = useState(course.subtitle || '')
  const [duration, setDuration] = useState(course.duration?.toString() || '')
  const [categoryId, setCategoryId] = useState(course.categoryId || '')
  const [prerequisites, setPrerequisites] = useState(course.prerequisites?.join(', ') || '')
  const [topics, setTopics] = useState(course.topics?.join(', ') || '')
  const [studyHoursMin, setStudyHoursMin] = useState(
    course.estimatedStudyHoursMin?.toString() || ''
  )
  const [studyHoursMax, setStudyHoursMax] = useState(
    course.estimatedStudyHoursMax?.toString() || ''
  )
  const [applicableCategories, setApplicableCategories] = useState<string[]>(
    course.applicableCategories || []
  )

  const toggleCategory = (cat: string) => {
    setApplicableCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/staff/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          subtitle: subtitle || undefined,
          duration: duration ? parseInt(duration) : null,
          categoryId: categoryId || null,
          prerequisites: prerequisites
            .split(',')
            .map((p: string) => p.trim())
            .filter(Boolean),
          requiresPrerequisite: prerequisites.trim().length > 0,
          topics: topics
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean),
          estimatedStudyHoursMin: studyHoursMin ? parseInt(studyHoursMin) : null,
          estimatedStudyHoursMax: studyHoursMax ? parseInt(studyHoursMax) : null,
          applicableCategories,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[10px]">
          <Pencil className="h-3 w-3" /> Edit Info
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Edit Course Info</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Arithmetic · Algebra · Geometry"
              className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">
              Topics (comma separated)
            </label>
            <input
              type="text"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="e.g. Arithmetic, Algebra, Geometry"
              className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">
                Duration (Hours)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">
                Study Hours (Min)
              </label>
              <input
                type="number"
                value={studyHoursMin}
                onChange={(e) => setStudyHoursMin(e.target.value)}
                placeholder="e.g. 40"
                className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">
                Study Hours (Max)
              </label>
              <input
                type="number"
                value={studyHoursMax}
                onChange={(e) => setStudyHoursMax(e.target.value)}
                placeholder="e.g. 60"
                className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">
              Prerequisites (comma separated codes)
            </label>
            <input
              type="text"
              value={prerequisites}
              onChange={(e) => setPrerequisites(e.target.value)}
              placeholder="e.g. M1, M2"
              className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-600">
              Applicable Licence Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {LICENCE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                    applicableCategories.includes(cat)
                      ? 'border-aerojet-blue bg-aerojet-blue text-white'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  Cat {cat}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
