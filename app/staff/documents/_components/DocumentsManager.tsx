'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { Archive, ExternalLink, FileText, Link2, Plus, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  addStudentDocument,
  archiveStudentDocument,
  uploadStudentDocumentFile,
} from '@/lib/documents/actions'

const DOCUMENT_TYPES = ['ID', 'MEDICAL', 'QUALIFICATION', 'CERTIFICATE', 'CONTRACT', 'OTHER']
const STORAGE_PROVIDERS = ['UPLOADTHING', 'SUPABASE'] as const

interface Doc {
  id: string
  type: string
  title: string
  fileUrl: string
  storageProvider: string
  version: number
  status: string
  expiresAt: string | null
  user: {
    email: string
    profile: { firstName: string; lastName: string } | null
    studentProfile: { studentId: string } | null
  }
}

type StorageProvider = (typeof STORAGE_PROVIDERS)[number]

export default function DocumentsManager({ documents }: { documents: Doc[] }) {
  const [isPending, startTransition] = useTransition()
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [form, setForm] = useState({
    student: '',
    type: 'ID',
    title: '',
    fileUrl: '',
    storageProvider: 'UPLOADTHING' as StorageProvider,
    expiresAt: '',
  })

  const selectedSize = useMemo(
    () => selectedFiles.reduce((total, file) => total + file.size, 0),
    [selectedFiles]
  )

  const run = (
    fn: () => Promise<{ error?: string; success?: boolean; count?: number }>,
    ok: string,
    afterSuccess?: () => void
  ) =>
    startTransition(async () => {
      const res = await fn()
      if (res.error) toast.error(res.error)
      else {
        toast.success(res.count && res.count > 1 ? `${res.count} documents uploaded` : ok)
        afterSuccess?.()
      }
    })

  const resetUploadSelection = () => {
    setSelectedFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (files: FileList | null) => {
    setSelectedFiles(Array.from(files ?? []))
  }

  const handleUploadOpenChange = (open: boolean) => {
    setIsUploadOpen(open)
    if (!open) resetUploadSelection()
  }

  const uploadFiles = () => {
    if (!form.student || !form.title || selectedFiles.length === 0) {
      toast.error('Student, title and at least one file are required to upload.')
      return
    }

    const fd = new FormData()
    fd.set('student', form.student.trim())
    fd.set('type', form.type)
    fd.set('title', form.title.trim())
    fd.set('expiresAt', form.expiresAt)
    selectedFiles.forEach((file) => fd.append('files', file))

    run(
      () => uploadStudentDocumentFile(fd),
      'Uploaded to Supabase storage',
      () => {
        resetUploadSelection()
        setIsUploadOpen(false)
        setForm((f) => ({ ...f, title: '', expiresAt: '' }))
      }
    )
  }

  const add = () => {
    if (!form.student || !form.title || !form.fileUrl) {
      toast.error('Student, title and file URL are required.')
      return
    }
    run(
      () =>
        addStudentDocument({
          student: form.student.trim(),
          type: form.type,
          title: form.title.trim(),
          fileUrl: form.fileUrl.trim(),
          storageProvider: form.storageProvider,
          expiresAt: form.expiresAt || null,
        }),
      'Document added',
      () => setForm((f) => ({ ...f, title: '', fileUrl: '', expiresAt: '' }))
    )
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-balance text-slate-900 dark:text-white">
              Add a document
            </h2>
            <p className="mt-1 text-sm text-pretty text-slate-500 dark:text-slate-400">
              Add a hosted file URL or upload files directly into the organized Supabase vault.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            disabled={isPending}
            className="bg-aerojet-blue hover:bg-aerojet-blue/90 text-white"
          >
            <Upload className="size-4" />
            Upload files
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.1fr_0.8fr_1fr_1.3fr_0.9fr_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="document-student">Student email/ID</Label>
            <Input
              id="document-student"
              value={form.student}
              onChange={(e) => setForm((f) => ({ ...f, student: e.target.value }))}
              placeholder="Student email or ID"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="document-type">Type</Label>
            <Select value={form.type} onValueChange={(type) => setForm((f) => ({ ...f, type }))}>
              <SelectTrigger id="document-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="document-title">Title</Label>
            <Input
              id="document-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Document title"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="document-url">File URL</Label>
            <Input
              id="document-url"
              value={form.fileUrl}
              onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="document-provider">Provider</Label>
            <Select
              value={form.storageProvider}
              onValueChange={(storageProvider) =>
                setForm((f) => ({ ...f, storageProvider: storageProvider as StorageProvider }))
              }
            >
              <SelectTrigger id="document-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UPLOADTHING">UploadThing</SelectItem>
                <SelectItem value="SUPABASE">Supabase</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={add}
              disabled={isPending}
              className="bg-aerojet-blue hover:bg-aerojet-blue/90 w-full text-white xl:w-auto"
            >
              <Plus className="size-4" />
              Add by URL
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={isUploadOpen} onOpenChange={handleUploadOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload documents</DialogTitle>
            <DialogDescription>
              Files are stored under students/id/{form.type.toLowerCase()} and recorded in the
              document vault.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="upload-student">Student email/ID</Label>
              <Input
                id="upload-student"
                value={form.student}
                onChange={(e) => setForm((f) => ({ ...f, student: e.target.value }))}
                placeholder="Student email or ID"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upload-type">Type</Label>
              <Select value={form.type} onValueChange={(type) => setForm((f) => ({ ...f, type }))}>
                <SelectTrigger id="upload-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="upload-title">Title</Label>
              <Input
                id="upload-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Document title"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upload-expiry">Expiry date</Label>
              <Input
                id="upload-expiry"
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Storage</Label>
              <div className="flex h-10 items-center rounded-md border border-slate-200 px-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                Supabase document bucket
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="supabase-doc-files">Files</Label>
            <label
              htmlFor="supabase-doc-files"
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800"
            >
              <Upload className="size-7 text-slate-400" />
              <span className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Choose one or more files
              </span>
              <span className="mt-1 text-xs text-slate-500">PDF and image files are accepted</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              id="supabase-doc-files"
              className="sr-only"
              accept="application/pdf,image/*"
              multiple
              onChange={(e) => handleFileChange(e.target.files)}
            />

            <div className="rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-xs text-slate-500 dark:border-slate-800">
                <span>{selectedFiles.length} selected</span>
                <span className="tabular-nums">{formatFileSize(selectedSize)}</span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {selectedFiles.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-slate-400">
                    No files selected.
                  </div>
                ) : (
                  selectedFiles.map((file) => (
                    <div
                      key={`${file.name}-${file.lastModified}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText className="size-4 shrink-0 text-slate-400" />
                        <span className="truncate text-slate-700 dark:text-slate-200">
                          {file.name}
                        </span>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400 tabular-nums">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetUploadSelection()
                setIsUploadOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={uploadFiles}
              disabled={isPending || selectedFiles.length === 0}
              className="bg-aerojet-blue hover:bg-aerojet-blue/90 text-white"
            >
              <Upload className="size-4" />
              Upload selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left dark:border-slate-800 dark:bg-slate-900/50">
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Student</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Document</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">
                Provider
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {documents.map((document) => {
              const name = document.user.profile
                ? `${document.user.profile.firstName} ${document.user.profile.lastName}`
                : document.user.email
              return (
                <tr key={document.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{name}</div>
                    <div className="text-xs text-slate-400">
                      {document.user.studentProfile?.studentId ?? document.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="size-4 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-800 dark:text-slate-200">
                          {document.title}
                        </div>
                        <div className="text-xs text-slate-400">
                          {document.type} - v{document.version}
                          {document.expiresAt
                            ? ` - exp ${new Date(document.expiresAt).toLocaleDateString('en-GB')}`
                            : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-slate-500">
                    <Badge variant="outline" className="font-bold">
                      {document.storageProvider}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-bold uppercase',
                        document.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      {document.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        title="Open"
                        aria-label={`Open ${document.title}`}
                      >
                        <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-4" />
                        </a>
                      </Button>
                      {document.status === 'ACTIVE' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => run(() => archiveStudentDocument(document.id), 'Archived')}
                        >
                          <Archive className="size-3" />
                          Archive
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {documents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-sm text-slate-500">
                    <Link2 className="size-8 text-slate-300" />
                    <span>No documents.</span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsUploadOpen(true)}
                      className="bg-aerojet-blue hover:bg-aerojet-blue/90 text-white"
                    >
                      <Upload className="size-4" />
                      Upload files
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}
