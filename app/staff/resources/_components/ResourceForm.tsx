'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Search, Info, Upload, Link2, CheckCircle2, X, FileText, Image, File } from 'lucide-react'
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

const resourceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Name is too short'),
  description: z.string().optional(),
  url: z.string().min(1, 'URL or path is required'),
  type: z.string(),
  category: z.string(),
  showToInstructors: z.boolean(),
  showToStaff: z.boolean(),
  showToStudents: z.boolean(),
  courseIds: z.array(z.string()),
  pathwayIds: z.array(z.string()),
})

type ResourceFormValues = z.infer<typeof resourceSchema>

interface ResourceFormProps {
  initialData?: any
  onSuccess: () => void
}

function getFileIcon(type: string) {
  // eslint-disable-next-line jsx-a11y/alt-text
  if (type === 'IMG') return <Image className="h-4 w-4" />
  if (type === 'PDF') return <FileText className="h-4 w-4" />
  return <File className="h-4 w-4" />
}

export default function ResourceForm({ initialData, onSuccess }: ResourceFormProps) {
  const [options, setOptions] = React.useState<{ courses: any[]; pathways: any[] }>({
    courses: [],
    pathways: [],
  })
  const [courseSearch, setCourseSearch] = React.useState('')
  // 'upload' | 'url' — which source mode is active
  const [sourceMode, setSourceMode] = React.useState<'upload' | 'url'>(
    initialData?.url ? 'url' : 'upload'
  )
  // Track the uploaded file metadata so we can show a preview
  const [uploadedFile, setUploadedFile] = React.useState<{
    url: string
    name: string
  } | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  React.useEffect(() => {
    getResourceLinkingOptions().then(setOptions)
  }, [])

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      id: initialData?.id,
      name: initialData?.name || '',
      description: initialData?.description || '',
      url: initialData?.url || '',
      type: initialData?.type || 'PDF',
      category: initialData?.category || 'INSTITUTIONAL',
      showToInstructors: initialData?.showToInstructors ?? true,
      showToStaff: initialData?.showToStaff ?? true,
      showToStudents: initialData?.showToStudents ?? false,
      courseIds: initialData?.courses?.map((c: any) => c.id) || [],
      pathwayIds: initialData?.pathways?.map((p: any) => p.id) || [],
    },
  })

  const isLoading = form.formState.isSubmitting
  const showToStudents = form.watch('showToStudents')
  const currentUrl = form.watch('url')
  const currentType = form.watch('type')

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[80vh]">
        <ScrollArea className="flex-1 pr-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 pb-6">
            {/* Left Column: Basic Info & General Visibility */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                  Basic Information
                </h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="res-name" className="text-xs font-bold uppercase text-slate-600">Resource Name</FormLabel>
                      <FormControl>
                        <Input
                          id="res-name"
                          placeholder="e.g. Instructor Handbook"
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
                        <FormLabel htmlFor="res-type" className="text-xs font-bold uppercase text-slate-600">File Type</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="res-cat" className="text-xs font-bold uppercase text-slate-600">Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger id="res-cat" className="rounded-xl border-slate-200">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-slate-200">
                            <SelectItem value="ACADEMIC">Academic</SelectItem>
                            <SelectItem value="ADMINISTRATIVE">Administrative</SelectItem>
                            <SelectItem value="EXAMINATION">Examination</SelectItem>
                            <SelectItem value="INSTITUTIONAL">Institutional</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ── File Source: Upload or URL ── */}
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-2">
                        <FormLabel className="text-xs font-bold uppercase text-slate-600">
                          File Source
                        </FormLabel>
                        {/* Tab toggle */}
                        <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
                          <button
                            type="button"
                            onClick={() => setSourceMode('upload')}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all ${
                              sourceMode === 'upload'
                                ? 'bg-white text-aerojet-blue shadow-sm dark:bg-slate-900 dark:text-aerojet-sky'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <Upload className="h-3 w-3" />
                            Upload
                          </button>
                          <button
                            type="button"
                            onClick={() => setSourceMode('url')}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all ${
                              sourceMode === 'url'
                                ? 'bg-white text-aerojet-blue shadow-sm dark:bg-slate-900 dark:text-aerojet-sky'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <Link2 className="h-3 w-3" />
                            URL / Path
                          </button>
                        </div>
                      </div>

                      {sourceMode === 'upload' ? (
                        <div>
                          {uploadedFile || currentUrl ? (
                            /* Uploaded file preview */
                            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/20">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-800/60">
                                {getFileIcon(currentType)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                  {uploadedFile?.name || 'Uploaded file'}
                                </p>
                                <p className="truncate text-[10px] font-mono text-emerald-600/70 dark:text-emerald-400/70">
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
                            /* UploadThing dropzone area */
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
                                    if (isUploading) return (
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
                                    ) : 'Preparing…'
                                  },
                                }}
                                onUploadBegin={() => setIsUploading(true)}
                                onClientUploadComplete={(res) => {
                                  setIsUploading(false)
                                  if (res && res[0]) {
                                    const file = res[0]
                                    const url = (file as any).ufsUrl || (file as any).url
                                    const name = (file as any).name || 'Uploaded file'
                                    setUploadedFile({ url, name })
                                    field.onChange(url)
                                    // Auto-set name if empty
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
                        /* URL / Path input */
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
                              Relative path from <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">public/</code> or a full https:// URL.
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
                      <FormLabel htmlFor="res-desc" className="text-xs font-bold uppercase text-slate-600">Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          id="res-desc"
                          placeholder="What is this resource for?"
                          autoComplete="off"
                          className="min-h-[100px] resize-none rounded-xl border-slate-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 rounded-3xl border border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
                <h4 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Global Visibility
                </h4>

                <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="showToInstructors"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0">
                          <FormLabel htmlFor="res-vis-instructors" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Show to Instructors</FormLabel>
                          <FormControl>
                            <Switch id="res-vis-instructors" checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showToStaff"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0">
                          <FormLabel htmlFor="res-vis-staff" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Show to Staff</FormLabel>
                          <FormControl>
                            <Switch id="res-vis-staff" checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showToStudents"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0">
                          <div className="space-y-0.5">
                            <FormLabel htmlFor="res-vis-students" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Show to Students</FormLabel>
                            <p className="text-[10px] text-slate-400">Enable to configure specific access below</p>
                          </div>
                          <FormControl>
                            <Switch id="res-vis-students" checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                </div>
              </div>
            </div>

            {/* Right Column: Targeted Student Access */}
            <div className={`relative flex flex-col space-y-6 transition-all duration-300 ${!showToStudents ? 'opacity-40 grayscale-[0.5] pointer-events-none select-none' : ''}`}>
              {!showToStudents && (
                <div className="absolute inset-0 z-10 flex items-center justify-center p-8 text-center">
                  <div className="rounded-2xl bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:bg-slate-950/80">
                    <Info className="mx-auto mb-3 h-8 w-8 text-aerojet-sky opacity-50" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                      Enable &quot;Show to Students&quot; <br />to configure target modules <br />and pathways
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                  Targeted Access
                </h3>

                <FormField
                  control={form.control}
                  name="courseIds"
                  render={() => (
                    <FormItem className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <FormLabel htmlFor="res-course-search" className="text-xs font-bold uppercase text-slate-600">Specific Modules</FormLabel>
                        <FormDescription className="text-[10px]">
                          Restrict to students enrolled in these modules. Leave empty for access to ALL enrolled students.
                        </FormDescription>
                      </div>
                      
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="res-course-search"
                          name="courseSearch"
                          placeholder="Search module code or name..."
                          autoComplete="off"
                          className="pl-9 rounded-xl border-slate-200"
                          value={courseSearch}
                          onChange={(e) => setCourseSearch(e.target.value)}
                        />
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-white p-2 dark:border-slate-800 dark:bg-slate-900/40">
                        <ScrollArea className="h-[220px]">
                          <div className="grid grid-cols-1 gap-1 p-2">
                            {options.courses
                              .filter(course => 
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
                                      key={course.id}
                                      className={`flex flex-row items-center space-x-3 space-y-0 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${checked ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, course.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== course.id
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="flex flex-1 items-center gap-2 cursor-pointer text-xs font-medium">
                                        <Badge variant="outline" className="font-mono text-[9px] px-1.5 h-5 border-slate-200 bg-white group-hover:bg-white dark:border-slate-700 dark:bg-slate-800">
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
                      <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <FormLabel className="text-xs font-bold uppercase text-slate-600">Specific Pathways</FormLabel>
                        <FormDescription className="text-[10px]">
                          Only show to students in these study pathways.
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
                                  key={pathway.id}
                                  className={`flex flex-row items-center space-x-3 space-y-0 rounded-xl border border-slate-100 px-4 py-3 transition-all hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 ${checked ? 'border-aerojet-sky bg-aerojet-sky/5 shadow-sm' : ''}`}
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, pathway.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== pathway.id
                                              )
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

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
          <Button 
            type="submit" 
            className="rounded-xl bg-aerojet-blue px-8 py-6 text-base font-black text-white shadow-xl transition-all hover:bg-aerojet-blue/90 hover:shadow-2xl active:scale-95 disabled:opacity-50" 
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
