'use client'

import React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Loader2,
  Search,
  Info,
  Upload,
  Link2,
  CheckCircle2,
  X,
  FileText,
  Image as ImageIcon,
  File,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { upsertResource, getResourceLinkingOptions } from '@/lib/actions/resources'
import { toast } from '@/hooks/use-toast'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { UploadButton } from '@/lib/uploads/uploadthing'
import { cn } from '@/lib/utils'

// ─── Category definitions ────────────────────────────────────────────────────
// Maps each category to its metadata (label, description, badge colour, icon).
// STUDENT_GUIDE and INSTITUTIONAL are always staff+instructor only (never students).
// ACADEMIC and EXAMINATION are fully configurable per-audience.
export type ResourceCategory =
  'STUDENT_GUIDE' | 'ACADEMIC' | 'ADMINISTRATIVE' | 'EXAMINATION' | 'INSTITUTIONAL'

export const RESOURCE_CATEGORIES: Record<
  ResourceCategory,
  {
    label: string
    description: string
    badgeClass: string
    badgeTextClass: string
    icon: React.ReactNode
  }
> = {
  STUDENT_GUIDE: {
    label: 'Student Guide',
    description: 'Academy-wide student handbook and reference material. Always visible to all.',
    badgeClass:
      'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400',
    badgeTextClass: 'text-amber-600 dark:text-amber-400',
    icon: <GraduationCap className="h-3 w-3" />,
  },
  ACADEMIC: {
    label: 'Academic',
    description: 'Course materials, textbooks, and learning resources for specific modules.',
    badgeClass:
      'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400',
    badgeTextClass: 'text-blue-600 dark:text-blue-400',
    icon: <BookOpen className="h-3 w-3" />,
  },
  ADMINISTRATIVE: {
    label: 'Administrative',
    description: 'Academy procedures, calendars, and general notices. Not shown to students.',
    badgeClass:
      'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400',
    badgeTextClass: 'text-purple-600 dark:text-purple-400',
    icon: <ClipboardList className="h-3 w-3" />,
  },
  EXAMINATION: {
    label: 'Examination',
    description: 'Exam timetables, regulations, and past papers for specific modules.',
    badgeClass:
      'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400',
    badgeTextClass: 'text-rose-600 dark:text-rose-400',
    icon: <ShieldCheck className="h-3 w-3" />,
  },
  INSTITUTIONAL: {
    label: 'Institutional',
    description: 'Internal staff and instructor reference documents. Not shown to students.',
    badgeClass:
      'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400',
    badgeTextClass: 'text-slate-500 dark:text-slate-400',
    icon: <Building2 className="h-3 w-3" />,
  },
}

const RESOURCE_CATEGORY_KEYS = Object.keys(RESOURCE_CATEGORIES) as ResourceCategory[]

const resourceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Name is too short'),
  description: z.string().optional(),
  url: z.string().min(1, 'URL or path is required'),
  type: z.string(),
  category: z.enum(RESOURCE_CATEGORY_KEYS),
  showToInstructors: z.boolean(),
  showToStaff: z.boolean(),
  showToStudents: z.boolean(),
  courseIds: z.array(z.string()),
  pathwayIds: z.array(z.string()),
})

type ResourceFormValues = z.infer<typeof resourceSchema>

type ResourceCourseOption = { id: string; code: string; name: string }
type ResourcePathwayOption = { id: string; name: string }

type ResourceInitialData = {
  id?: string
  name?: string
  description?: string | null
  url?: string
  type?: string
  category?: string
  showToInstructors?: boolean
  showToStaff?: boolean
  showToStudents?: boolean
  courses?: { id: string }[] | null
  pathways?: { id: string }[] | null
}

/** Category-aware default visibility values used when creating a new resource. */
function getDefaultVisibility(category: ResourceCategory | string) {
  if (category === 'STUDENT_GUIDE')
    return { showToInstructors: true, showToStaff: true, showToStudents: true }
  if (category === 'ADMINISTRATIVE' || category === 'INSTITUTIONAL')
    return { showToInstructors: false, showToStaff: true, showToStudents: false }
  // ACADEMIC and EXAMINATION
  return { showToInstructors: true, showToStaff: true, showToStudents: false }
}

interface ResourceFormProps {
  initialData?: ResourceInitialData
  onSuccess: () => void
}

function getFileIcon(type: string) {
  if (type === 'IMG') return <ImageIcon className="h-4 w-4" />
  if (type === 'PDF') return <FileText className="h-4 w-4" />
  return <File className="h-4 w-4" />
}

export default function ResourceForm({ initialData, onSuccess }: ResourceFormProps) {
  const [options, setOptions] = React.useState<{
    courses: ResourceCourseOption[]
    pathways: ResourcePathwayOption[]
  }>({
    courses: [],
    pathways: [],
  })
  const [courseSearch, setCourseSearch] = React.useState('')
  const [sourceMode, setSourceMode] = React.useState<'upload' | 'url'>(
    initialData?.url ? 'url' : 'upload'
  )
  const [uploadedFile, setUploadedFile] = React.useState<{
    url: string
    name: string
  } | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  React.useEffect(() => {
    getResourceLinkingOptions().then(setOptions)
  }, [])

  // Resolved category — use initialData on first render, then live watched value.
  const initialCategory = (initialData?.category as ResourceCategory) || 'INSTITUTIONAL'
  const defaults = getDefaultVisibility(initialCategory)

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      id: initialData?.id,
      name: initialData?.name || '',
      description: initialData?.description || '',
      url: initialData?.url || '',
      type: initialData?.type || 'PDF',
      category: initialCategory,
      showToInstructors: initialData?.showToInstructors ?? defaults.showToInstructors,
      showToStaff: initialData?.showToStaff ?? defaults.showToStaff,
      showToStudents: initialData?.showToStudents ?? defaults.showToStudents,
      courseIds: initialData?.courses?.map((c) => c.id) || [],
      pathwayIds: initialData?.pathways?.map((p) => p.id) || [],
    },
  })

  const isLoading = form.formState.isSubmitting

  // ── Live watchers ─────────────────────────────────────────────────────────
  const watchedCategory = useWatch({ control: form.control, name: 'category' })
  const watchedShowToStudents = useWatch({ control: form.control, name: 'showToStudents' })
  const currentUrl = useWatch({ control: form.control, name: 'url' })
  const currentType = useWatch({ control: form.control, name: 'type' })

  // ── Derived UI state per category ───────────────────────────────────────
  const isStudentGuide = watchedCategory === 'STUDENT_GUIDE'
  const isStaffOnlyCategory =
    watchedCategory === 'ADMINISTRATIVE' || watchedCategory === 'INSTITUTIONAL'

  // When switching to a staff-only category, force showToStudents OFF.
  React.useEffect(() => {
    if (isStaffOnlyCategory) {
      form.setValue('showToStudents', false, { shouldValidate: true })
    }
  }, [isStaffOnlyCategory, form])

  // When switching to STUDENT_GUIDE, force all three ON.
  React.useEffect(() => {
    if (isStudentGuide) {
      form.setValue('showToInstructors', true, { shouldValidate: true })
      form.setValue('showToStaff', true, { shouldValidate: true })
      form.setValue('showToStudents', true, { shouldValidate: true })
    }
  }, [isStudentGuide, form])

  async function onSubmit(values: ResourceFormValues) {
    try {
      await upsertResource(values)
      toast.success(values.id ? 'Resource updated' : 'Resource created')
      onSuccess()
    } catch (_error) {
      toast.error('Something went wrong')
    }
  }

  function clearUpload() {
    setUploadedFile(null)
    form.setValue('url', '')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full max-h-[80vh] flex-col">
        <ScrollArea className="flex-1 pr-6">
          <div className="grid grid-cols-1 gap-8 pb-6 lg:grid-cols-2 lg:gap-12">
            {/* ── Left Column: Basic Info & Visibility ───────────────────── */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-black tracking-widest text-slate-400 uppercase">
                  Basic Information
                </h3>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        htmlFor="res-name"
                        className="text-xs font-bold text-slate-600 uppercase"
                      >
                        Resource Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="res-name"
                          placeholder="e.g. AATA Student Handbook 2025"
                          autoComplete="off"
                          className="rounded-xl border-slate-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          htmlFor="res-type"
                          className="text-xs font-bold text-slate-600 uppercase"
                        >
                          File Type
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger id="res-type" className="rounded-xl border-slate-200">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-slate-200">
                            <SelectItem value="PDF">PDF Document</SelectItem>
                            <SelectItem value="DOCX">Word Document</SelectItem>
                            <SelectItem value="ZIP">Archive (ZIP)</SelectItem>
                            <SelectItem value="LINK">External Link</SelectItem>
                            <SelectItem value="IMG">Image</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ── Category Select ─────────────────────────────────── */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          htmlFor="res-cat"
                          className="text-xs font-bold text-slate-600 uppercase"
                        >
                          Category
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger id="res-cat" className="rounded-xl border-slate-200">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-slate-200">
                            {RESOURCE_CATEGORY_KEYS.map((key) => {
                              const cat = RESOURCE_CATEGORIES[key]
                              return (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-2.5 py-0.5">
                                    <span
                                      className={cn(
                                        'flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-black',
                                        cat.badgeClass
                                      )}
                                    >
                                      {cat.icon}
                                      {cat.label}
                                    </span>
                                    {key === 'ADMINISTRATIVE' || key === 'INSTITUTIONAL' ? (
                                      <span className="ml-1 text-[10px] text-slate-400">
                                        (not for students)
                                      </span>
                                    ) : null}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>

                        {/* Category description below the select */}
                        {watchedCategory &&
                          RESOURCE_CATEGORIES[watchedCategory as ResourceCategory] && (
                            <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                              {RESOURCE_CATEGORIES[watchedCategory as ResourceCategory].description}
                            </p>
                          )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ── File Source: Upload or URL ──────────────────────── */}
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <div className="mb-2 flex items-center justify-between">
                        <FormLabel className="text-xs font-bold text-slate-600 uppercase">
                          File Source
                        </FormLabel>
                        <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
                          <button
                            type="button"
                            onClick={() => setSourceMode('upload')}
                            className={cn(
                              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all',
                              sourceMode === 'upload'
                                ? 'text-aerojet-blue dark:text-aerojet-sky bg-white shadow-sm dark:bg-slate-900'
                                : 'text-slate-400 hover:text-slate-600'
                            )}
                          >
                            <Upload className="h-3 w-3" />
                            Upload
                          </button>
                          <button
                            type="button"
                            onClick={() => setSourceMode('url')}
                            className={cn(
                              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all',
                              sourceMode === 'url'
                                ? 'text-aerojet-blue dark:text-aerojet-sky bg-white shadow-sm dark:bg-slate-900'
                                : 'text-slate-400 hover:text-slate-600'
                            )}
                          >
                            <Link2 className="h-3 w-3" />
                            URL / Path
                          </button>
                        </div>
                      </div>

                      {sourceMode === 'upload' ? (
                        <div>
                          {uploadedFile || currentUrl ? (
                            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/20">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-800/60">
                                {getFileIcon(currentType)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                  {uploadedFile?.name || 'Uploaded file'}
                                </p>
                                <p className="truncate font-mono text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                                  {uploadedFile?.url || currentUrl}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                <button
                                  type="button"
                                  onClick={clearUpload}
                                  className="rounded-lg p-1 text-emerald-400 transition-colors hover:bg-emerald-100 hover:text-red-500 dark:hover:bg-emerald-800"
                                  title="Remove file"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/30">
                              <div className="mb-3 text-center">
                                <Upload className="mx-auto mb-1.5 h-7 w-7 text-slate-300" />
                                <p className="text-[11px] font-bold text-slate-500">
                                  PDF, DOCX, ZIP, images — up to 32 MB
                                </p>
                              </div>
                              <UploadButton
                                endpoint="resourceFile"
                                appearance={{
                                  button:
                                    'w-full rounded-xl bg-aerojet-blue px-4 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-aerojet-blue/90 ut-uploading:opacity-60 ut-uploading:cursor-not-allowed',
                                  allowedContent: 'hidden',
                                }}
                                content={{
                                  button({ ready, isUploading }) {
                                    if (isUploading)
                                      return (
                                        <span className="flex items-center gap-2">
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          Uploading…
                                        </span>
                                      )
                                    return ready ? (
                                      <span className="flex items-center gap-2">
                                        <Upload className="h-3.5 w-3.5" />
                                        Choose File to Upload
                                      </span>
                                    ) : (
                                      'Preparing…'
                                    )
                                  },
                                }}
                                onUploadBegin={() => setIsUploading(true)}
                                onClientUploadComplete={(res) => {
                                  setIsUploading(false)
                                  if (res && res[0]) {
                                    const file = res[0]
                                    const url = file.ufsUrl ?? file.url
                                    const name = file.name || 'Uploaded file'
                                    setUploadedFile({ url, name })
                                    field.onChange(url)
                                    if (!form.getValues('name')) {
                                      form.setValue('name', name.replace(/\.[^.]+$/, ''))
                                    }
                                    toast.success('File uploaded successfully')
                                  }
                                }}
                                onUploadError={(err) => {
                                  setIsUploading(false)
                                  toast.error(`Upload failed: ${err.message}`)
                                }}
                              />
                            </div>
                          )}
                          <FormMessage />
                        </div>
                      ) : (
                        <FormControl>
                          <div>
                            <Input
                              id="res-url"
                              placeholder="/documents/file.pdf or https://..."
                              autoComplete="off"
                              className="rounded-xl border-slate-200 font-mono text-xs"
                              {...field}
                            />
                            <p className="mt-1.5 text-[10px] text-slate-400">
                              Relative path from{' '}
                              <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">
                                public/
                              </code>{' '}
                              or a full https:// URL.
                            </p>
                          </div>
                        </FormControl>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        htmlFor="res-desc"
                        className="text-xs font-bold text-slate-600 uppercase"
                      >
                        Description (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          id="res-desc"
                          placeholder="What is this resource for? Who should use it?"
                          autoComplete="off"
                          className="min-h-25 resize-none rounded-xl border-slate-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ── Global Visibility ──────────────────────────────────────── */}
              {/* Hidden entirely for STUDENT_GUIDE — always global. */}
              {!isStudentGuide && (
                <div className="space-y-4 rounded-3xl border border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
                  <h4 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    Global Visibility
                  </h4>

                  <div className="space-y-4">
                    {/* Show to Staff — always editable */}
                    <FormField
                      control={form.control}
                      name="showToStaff"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0">
                          <FormLabel
                            htmlFor="res-vis-staff"
                            className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                          >
                            Show to Staff
                          </FormLabel>
                          <FormControl>
                            <Switch
                              id="res-vis-staff"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Show to Instructors — always editable */}
                    <FormField
                      control={form.control}
                      name="showToInstructors"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0">
                          <FormLabel
                            htmlFor="res-vis-instructors"
                            className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                          >
                            Show to Instructors
                          </FormLabel>
                          <FormControl>
                            <Switch
                              id="res-vis-instructors"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Show to Students — force-locked for staff-only categories */}
                    <FormField
                      control={form.control}
                      name="showToStudents"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0">
                          <div className="space-y-0.5">
                            <FormLabel
                              htmlFor="res-vis-students"
                              className={cn(
                                'text-sm font-semibold',
                                isStaffOnlyCategory
                                  ? 'text-slate-400 dark:text-slate-600'
                                  : 'text-slate-700 dark:text-slate-300'
                              )}
                            >
                              Show to Students
                            </FormLabel>
                            {isStaffOnlyCategory ? (
                              <p className="text-[10px] text-rose-400">
                                Locked —{' '}
                                {watchedCategory === 'ADMINISTRATIVE'
                                  ? 'Administrative'
                                  : 'Institutional'}{' '}
                                resources are never shown to students.
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-400">
                                Enable to configure specific module and pathway access below.
                              </p>
                            )}
                          </div>
                          <FormControl>
                            <Switch
                              id="res-vis-students"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isStaffOnlyCategory}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* STUDENT_GUIDE always-visible notice */}
              {isStudentGuide && (
                <div className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-800 dark:bg-amber-900/20">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                      Student Guides are always globally available
                    </p>
                    <p className="mt-1 text-[10px] leading-relaxed text-amber-600 dark:text-amber-500">
                      This resource will be visible to all students, instructors, and staff — no
                      course or pathway targeting needed.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Right Column: Targeted Access ─────────────────────────── */}
            <div
              className={cn(
                'relative flex flex-col space-y-6 transition-all duration-300',
                (!watchedShowToStudents || isStudentGuide) &&
                  'pointer-events-none opacity-40 grayscale-[0.5] select-none'
              )}
            >
              {!watchedShowToStudents && !isStudentGuide && (
                <div className="absolute inset-0 z-10 flex items-center justify-center p-8 text-center">
                  <div className="rounded-2xl bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:bg-slate-950/80">
                    <Info className="text-aerojet-sky mx-auto mb-3 h-8 w-8 opacity-50" />
                    <p className="text-xs leading-relaxed font-bold tracking-widest text-slate-500 uppercase">
                      Enable &quot;Show to Students&quot;
                      <br />
                      to configure target modules
                      <br />
                      and pathways
                    </p>
                  </div>
                </div>
              )}
              {isStudentGuide && (
                <div className="absolute inset-0 z-10 flex items-center justify-center p-8 text-center">
                  <div className="rounded-2xl bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:bg-slate-950/80">
                    <GraduationCap className="mx-auto mb-3 h-8 w-8 text-amber-400 opacity-50" />
                    <p className="text-xs leading-relaxed font-bold tracking-widest text-slate-500 uppercase">
                      Student Guides are always global —<br />
                      no targeting required
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-sm font-black tracking-widest text-slate-400 uppercase">
                  Targeted Access
                </h3>

                <FormField
                  control={form.control}
                  name="courseIds"
                  render={() => (
                    <FormItem className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <FormLabel
                          htmlFor="res-course-search"
                          className="text-xs font-bold text-slate-600 uppercase"
                        >
                          Specific Modules
                        </FormLabel>
                        <FormDescription className="text-[10px]">
                          Only show to students enrolled in these modules. Leave empty for all
                          enrolled students.
                        </FormDescription>
                      </div>

                      <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="res-course-search"
                          name="courseSearch"
                          placeholder="Search module code or name..."
                          autoComplete="off"
                          className="rounded-xl border-slate-200 pl-9"
                          value={courseSearch}
                          onChange={(e) => setCourseSearch(e.target.value)}
                        />
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-white p-2 dark:border-slate-800 dark:bg-slate-900/40">
                        <ScrollArea className="h-55">
                          <div className="grid grid-cols-1 gap-1 p-2">
                            {options.courses
                              .filter(
                                (course) =>
                                  course.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
                                  course.name.toLowerCase().includes(courseSearch.toLowerCase())
                              )
                              .map((course) => (
                                <FormField
                                  key={course.id}
                                  control={form.control}
                                  name="courseIds"
                                  render={({ field }) => {
                                    const checked = field.value?.includes(course.id)
                                    return (
                                      <FormItem
                                        className={cn(
                                          'flex flex-row items-center space-y-0 space-x-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
                                          checked && 'bg-blue-50/50 dark:bg-blue-900/10'
                                        )}
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={checked}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...field.value, course.id])
                                                : field.onChange(
                                                    field.value?.filter((v) => v !== course.id)
                                                  )
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="flex flex-1 cursor-pointer items-center gap-2 text-xs font-medium">
                                          <Badge
                                            variant="outline"
                                            className="h-5 border-slate-200 bg-white px-1.5 font-mono text-[9px] dark:border-slate-700 dark:bg-slate-800"
                                          >
                                            {course.code}
                                          </Badge>
                                          <span className="truncate">{course.name}</span>
                                        </FormLabel>
                                      </FormItem>
                                    )
                                  }}
                                />
                              ))}
                          </div>
                        </ScrollArea>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pathwayIds"
                  render={() => (
                    <FormItem className="space-y-4">
                      <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <FormLabel className="text-xs font-bold text-slate-600 uppercase">
                          Specific Pathways
                        </FormLabel>
                        <FormDescription className="text-[10px]">
                          Only show to students in these study pathways. Leave empty for all
                          pathways.
                        </FormDescription>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {options.pathways.map((pathway) => (
                          <FormField
                            key={pathway.id}
                            control={form.control}
                            name="pathwayIds"
                            render={({ field }) => {
                              const checked = field.value?.includes(pathway.id)
                              return (
                                <FormItem
                                  className={cn(
                                    'flex flex-row items-center space-y-0 space-x-3 rounded-xl border px-4 py-3 transition-all',
                                    checked
                                      ? 'border-aerojet-sky bg-aerojet-sky/5 shadow-sm'
                                      : 'border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700'
                                  )}
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, pathway.id])
                                          : field.onChange(
                                              field.value?.filter((v) => v !== pathway.id)
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {pathway.name}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* ── Action Buttons ─────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
          <Button
            type="submit"
            className="bg-aerojet-blue hover:bg-aerojet-blue/90 rounded-xl px-8 py-6 text-base font-black text-white shadow-xl transition-all hover:shadow-2xl active:scale-95 disabled:opacity-50"
            disabled={isLoading || isUploading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : initialData ? (
              'Update Resource'
            ) : (
              'Create Resource'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
