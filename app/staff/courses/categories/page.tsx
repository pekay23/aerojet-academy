'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Loader2, Trash2, ArrowLeft, Pencil, BookOpen, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { DbCourseCategory } from '@/types/database'

export default function CourseCategoriesPage() {
  const [categories, setCategories] = useState<DbCourseCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Create state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  // Edit state
  const [editTarget, setEditTarget] = useState<DbCourseCategory | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<DbCourseCategory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/staff/course-categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch {
      toast.error('Failed to fetch categories')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories()
  }, [])

  // ─ CREATE ─
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/staff/course-categories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDescription }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Category created')
        setNewName('')
        setNewDescription('')
        setIsCreateOpen(false)
        fetchCategories()
      } else {
        toast.error(data.error || 'Failed to create category')
      }
    } catch {
      toast.error('Failed to create category')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─ EDIT ─
  const openEdit = (cat: DbCourseCategory) => {
    setEditTarget(cat)
    setEditName(cat.name.replace(/_/g, ' '))
    setEditDescription(cat.description ?? '')
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/staff/course-categories/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, description: editDescription }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Category updated')
        setEditTarget(null)
        fetchCategories()
      } else {
        toast.error(data.error || 'Failed to update category')
      }
    } catch {
      toast.error('Failed to update category')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─ DELETE
  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/staff/course-categories/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Category deleted')
        setDeleteTarget(null)
        fetchCategories()
      } else {
        toast.error(data.error || 'Failed to delete category')
      }
    } catch {
      toast.error('Failed to delete category')
    } finally {
      setIsDeleting(false)
    }
  }

  // ─ RENDER
  return (
    <div className="mx-auto max-w-450">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/staff/courses"
            className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
              Course Categories
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {categories.length} {categories.length === 1 ? 'category' : 'categories'} •{' '}
              {categories.reduce((sum, c) => sum + (c._count?.courses ?? 0), 0)} courses total
            </p>
          </div>
        </div>

        {/* Create dialog trigger */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-aerojet-blue hover:bg-aerojet-blue/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Course Category</DialogTitle>
                <DialogDescription>Define a new category for grouping courses.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    placeholder="e.g. EASA MODULE"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                  <p className="text-[10px] text-slate-500 italic">
                    Will be saved as UPPERCASE_WITH_UNDERSCORES
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Brief description of this category..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-aerojet-blue">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-500 dark:border-slate-800">
            No categories yet. Create your first one.
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Accent stripe */}
              <div className="from-aerojet-blue to-aerojet-sky h-1 w-full bg-gradient-to-r" />

              <div className="flex flex-1 flex-col p-6">
                {/* Top row: name + actions */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-aerojet-blue truncate font-black dark:text-white">
                      {cat.name.replace(/_/g, ' ')}
                    </h3>
                    <code className="font-mono text-[10px] text-slate-400">{cat.id}</code>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-lg p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <MoreHorizontal className="h-4 w-4 text-slate-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => openEdit(cat)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => setDeleteTarget(cat)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Description */}
                <p className="mb-4 line-clamp-2 flex-1 text-sm text-slate-500 dark:text-slate-400">
                  {cat.description || 'No description provided.'}
                </p>

                {/* Footer: course count + link */}
                <div className="flex items-center justify-between border-t border-slate-50 pt-4 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <BookOpen className="text-aerojet-sky h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                      {cat._count?.courses ?? 0}
                    </span>
                    <span className="text-xs text-slate-400">
                      {cat._count?.courses === 1 ? 'course' : 'courses'}
                    </span>
                  </div>
                  <Link
                    href={`/staff/courses?category=${cat.id}`}
                    className="text-aerojet-sky hover:bg-aerojet-sky/10 inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-bold transition-all duration-150 ease-out hover:shadow-sm"
                  >
                    View courses →
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Edit Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the name or description of this category.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
                <p className="text-[10px] text-slate-500 italic">
                  Will be saved as UPPERCASE_WITH_UNDERSCORES
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Brief description..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-aerojet-blue">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong>{deleteTarget?.name.replace(/_/g, ' ')}</strong>? This cannot be undone.
              {(deleteTarget?._count?.courses ?? 0) > 0 && (
                <span className="mt-2 block rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  ⚠ This category has {deleteTarget?._count?.courses} course(s). You must reassign
                  them before deleting.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || (deleteTarget?._count?.courses ?? 0) > 0}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
