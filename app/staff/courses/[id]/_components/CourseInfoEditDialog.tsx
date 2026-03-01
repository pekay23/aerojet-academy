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

export default function CourseInfoEditDialog({
  course,
  categories,
}: {
  course: any
  categories: any[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [description, setDescription] = useState(course.description || '')
  const [duration, setDuration] = useState(course.duration?.toString() || '')
  const [categoryId, setCategoryId] = useState(course.categoryId || '')
  const [prerequisites, setPrerequisites] = useState(course.prerequisites?.join(', ') || '')

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/staff/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          duration: duration ? parseInt(duration) : null,
          categoryId: categoryId || null,
          prerequisites: prerequisites.split(',').map(p => p.trim()).filter(Boolean),
          requiresPrerequisite: prerequisites.trim().length > 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Course Info</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Duration (Hours)</label>
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
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">Prerequisites (comma separated codes)</label>
            <input
              type="text"
              value={prerequisites}
              onChange={(e) => setPrerequisites(e.target.value)}
              placeholder="e.g. M1, M2"
              className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
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
