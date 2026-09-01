'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, ExternalLink, UploadCloud } from 'lucide-react'
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
  visibility: string
  createdAt: string
}
interface CourseOpt {
  id: string
  label: string
}

export default function MaterialsManager({
  materials,
  courseOptions,
}: {
  materials: Material[]
  courseOptions: CourseOpt[]
}) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    title: '',
    description: '',
    fileUrl: '',
    courseId: '',
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
    fd.set('visibility', form.visibility)
    fd.set('file', file)
    run(() => uploadTeachingMaterial(fd), 'Material uploaded')
    input.value = ''
    setForm((f) => ({ ...f, title: '', description: '', fileUrl: '' }))
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-2 rounded-2xl border border-slate-100 bg-white p-4 sm:grid-cols-6 dark:border-slate-800 dark:bg-slate-900">
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Title"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <input
          value={form.fileUrl}
          onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
          placeholder="File URL (optional)"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2 dark:border-slate-700 dark:bg-slate-800"
        />
        <select
          value={form.courseId}
          onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">No course</option>
          {courseOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
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
                  visibility: form.visibility,
                }),
              'Material added'
            )
          }
          disabled={isPending}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-aerojet-blue px-3 py-2 text-sm font-bold text-white hover:bg-aerojet-blue/90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add URL
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/40">
        <UploadCloud className="h-4 w-4 text-slate-400 dark:text-slate-300 dark:text-slate-300" />
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {materials.map((m) => (
          <div
            key={m.id}
            className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <h3 className="line-clamp-1 font-black text-slate-900 dark:text-slate-100" title={m.title}>
                {m.title}
              </h3>
              <button
                disabled={isPending}
                onClick={() => run(() => deleteTeachingMaterial(m.id), 'Deleted')}
                className="text-slate-400 hover:text-red-600 disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              {m.visibility.replace('_', ' ')}
            </p>
            <a
              href={m.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open
            </a>
          </div>
        ))}
        {materials.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-slate-400">
            No materials yet.
          </p>
        )}
      </div>
    </div>
  )
}
