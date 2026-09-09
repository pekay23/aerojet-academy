'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, ExternalLink, UploadCloud } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  addTeachingMaterial,
  uploadTeachingMaterial,
  deleteTeachingMaterial,
} from '@/lib/teaching-materials/actions'

interface Material {
  id: string
  title: string
  description: string | null
  fileUrl: string
  fileType: string | null
  visibility: string
  createdAt: string
  course?: { id: string; code: string; name: string } | null
  class?: { id: string; name: string } | null
}

interface CourseOpt {
  id: string
  code: string
  name: string
}

interface ClassOpt {
  id: string
  name: string
  courseId: string
  course: { code: string; name: string }
}

export default function MaterialsManager({
  materials,
  courseOptions,
  classOptions,
}: {
  materials: Material[]
  courseOptions: CourseOpt[]
  classOptions: ClassOpt[]
}) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    title: '',
    description: '',
    fileUrl: '',
    courseId: '',
    classId: '',
    visibility: 'CLASS' as 'CLASS' | 'COURSE' | 'ALL_STUDENTS',
  })

  const run = (fn: () => Promise<{ error?: string; success?: boolean }>, ok: string) =>
    startTransition(async () => {
      const res = await fn()
      if (res.error) toast.error(res.error)
      else toast.success(ok)
    })

  const upload = (input: HTMLInputElement) => {
    const file = input.files?.[0]
    if (!form.title || !file) {
      toast.error('Title and a file are required.')
      return
    }
    const fd = new FormData()
    fd.set('title', form.title.trim())
    fd.set('courseId', form.courseId)
    fd.set('classId', form.classId)
    fd.set('visibility', form.visibility)
    fd.set('file', file)
    run(() => uploadTeachingMaterial(fd), 'Material uploaded')
    input.value = ''
    setForm((f) => ({ ...f, title: '', description: '', fileUrl: '', classId: '' }))
  }

  return (
    <div className="space-y-5">
      {/* Add by URL form */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-3 text-xs font-black tracking-widest text-slate-400 uppercase">
          Add Material by URL
        </h3>
        <div className="grid gap-3 sm:grid-cols-6">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Title *"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <input
            value={form.fileUrl}
            onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
            placeholder="File URL *"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2 dark:border-slate-700 dark:bg-slate-800"
          />
          <select
            value={form.courseId}
            onChange={(e) => {
              setForm((f) => ({ ...f, courseId: e.target.value, classId: '' }))
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">No course</option>
            {courseOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
          <select
            value={form.classId}
            onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
            disabled={!form.courseId}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">No class</option>
            {classOptions
              .filter((c) => c.courseId === form.courseId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <select
            value={form.visibility}
            onChange={(e) =>
              setForm((f) => ({ ...f, visibility: e.target.value as typeof f.visibility }))
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="CLASS">Class</option>
            <option value="COURSE">Course</option>
            <option value="ALL_STUDENTS">All students</option>
          </select>
          <button
            onClick={() =>
              run(
                () =>
                  addTeachingMaterial({
                    title: form.title.trim(),
                    description: form.description.trim() || undefined,
                    fileUrl: form.fileUrl.trim(),
                    courseId: form.courseId || undefined,
                    classId: form.classId || undefined,
                    visibility: form.visibility,
                  }),
                'Material added'
              )
            }
            disabled={isPending}
            className="bg-aerojet-blue hover:bg-aerojet-blue/90 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add URL
          </button>
        </div>
      </div>

      {/* File upload */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/40">
        <UploadCloud className="h-4 w-4 text-slate-400 dark:text-slate-300" />
        <span className="font-bold text-slate-600 dark:text-slate-300">
          Or upload a file (Supabase storage):
        </span>
        <input type="file" id="tm-file" className="text-xs" />
        <button
          disabled={isPending}
          onClick={() => upload(document.getElementById('tm-file') as HTMLInputElement)}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Upload
        </button>
      </div>

      {/* Materials list */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {materials.map((m) => (
          <div
            key={m.id}
            className="flex flex-col rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3
                  className="line-clamp-1 font-black text-slate-900 dark:text-slate-100"
                  title={m.title}
                >
                  {m.title}
                </h3>
                {m.course && (
                  <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                    {m.course.code} — {m.course.name}
                  </p>
                )}
                {m.class && (
                  <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                    Class: {m.class.name}
                  </p>
                )}
              </div>
              <button
                disabled={isPending}
                onClick={() => run(() => deleteTeachingMaterial(m.id), 'Deleted')}
                className="ml-2 text-slate-400 hover:text-red-600 disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="text-[9px] tracking-wider uppercase">
                {m.visibility.replace('_', ' ')}
              </Badge>
              {m.fileType && (
                <Badge variant="secondary" className="text-[9px] tracking-wider uppercase">
                  {m.fileType.split('/')[1] || m.fileType}
                </Badge>
              )}
            </div>
            <div className="mt-auto pt-3">
              <a
                href={m.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open
              </a>
            </div>
          </div>
        ))}
        {materials.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
              <UploadCloud className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-400">No materials yet.</p>
            <p className="mt-1 text-xs text-slate-400">
              Add a URL or upload a file to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
