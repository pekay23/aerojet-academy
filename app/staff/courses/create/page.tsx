'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch, type Resolver } from 'react-hook-form'
import * as z from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MultiSelect, type Option } from '@/components/ui/multi-select'

const courseFormSchema = z.object({
  code: z.string().min(2, {
    message: 'Code must be at least 2 characters.',
  }),
  name: z.string().min(3, {
    message: 'Name must be at least 3 characters.',
  }),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  applicableCategories: z.array(z.string()).default([]),
  moduleType: z.enum(['CORE', 'SPECIALIST', 'AVIONICS']).optional().nullable(),
  duration: z.coerce.number().int().positive().optional(),
  price: z.coerce.number().positive(),
  isActive: z.boolean().default(true),
  requiresPrerequisite: z.boolean().default(false),
  prerequisites: z.string().optional(), // Comma-separated course codes
  syllabusUrl: z.string().url().optional().or(z.literal('')).nullable(),
  materialsUrl: z.string().url().optional().or(z.literal('')).nullable(),
})

type CourseFormValues = z.infer<typeof courseFormSchema>

const defaultValues: Partial<CourseFormValues> = {
  price: 1000,
  applicableCategories: [],
}

export default function CreateCoursePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [licenseCategories, setLicenseCategories] = useState<Option[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [catsRes, licensesRes] = await Promise.all([
          fetch('/api/staff/course-categories'),
          fetch('/api/staff/license-categories')
        ])
        
        const catsData = await catsRes.json()
        const licensesData = await licensesRes.json()

        if (catsData.success) {
          setCategories(catsData.data)
        }
        if (licensesData.success) {
          setLicenseCategories(licensesData.data.map((l: { code: string; name: string }) => ({
            label: `${l.code} - ${l.name}`,
            value: l.code
          })))
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load course data')
        toast.error('Failed to load course data')
      }
    }
    fetchData()
  }, [])
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema) as unknown as Resolver<CourseFormValues>,
    defaultValues: defaultValues as CourseFormValues,
    mode: 'onChange',
  })
  const requiresPrerequisite = useWatch({ control: form.control, name: 'requiresPrerequisite' })

  async function onSubmit(values: CourseFormValues) {
    setIsLoading(true)
    try {
      // Process prerequisites into array
      const data = {
        ...values,
        prerequisites: values.prerequisites
          ? values.prerequisites
              .split(',')
              .map((p) => p.trim())
              .filter(Boolean)
          : [],
      }

      const response = await fetch('/api/staff/courses/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create course')
      }

      toast.success('Course created successfully')
      router.push('/staff/courses')
    } catch (_error) {
      toast.error('Failed to create course')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1800px]">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
            Create Course
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Add a new course to the catalog.</p>
        </div>
        <Link href="/staff/courses" className="text-sm font-bold text-aerojet-blue hover:underline">
          Cancel
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="course-code">Course Code</FormLabel>
                      <FormControl>
                        <Input id="course-code" placeholder="e.g., M1" autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="course-name">Course Name</FormLabel>
                      <FormControl>
                        <Input id="course-name" placeholder="e.g., Mathematics" autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="course-description">Description</FormLabel>
                    <FormControl>
                      <Textarea id="course-description" placeholder="A brief description of the course" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 p-4 shadow-sm dark:border-slate-700">
                      <div className="space-y-0.5">
                        <FormLabel>Is Active</FormLabel>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Enable or disable this course in the catalog.
                        </div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requiresPrerequisite"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 p-4 shadow-sm dark:border-slate-700">
                      <div className="space-y-0.5">
                        <FormLabel>Requires Prerequisite</FormLabel>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Students must complete other courses before this one.
                        </div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {requiresPrerequisite && (
                <FormField
                  control={form.control}
                  name="prerequisites"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="course-prerequisites">Prerequisites (Course Codes)</FormLabel>
                      <FormControl>
                        <Input id="course-prerequisites" placeholder="e.g., M1, M2 (comma separated)" autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="course-category">Course Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger id="course-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="applicableCategories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="course-app-categories">Applicable License Categories</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={licenseCategories}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Select license categories..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="course-duration">Duration (hours)</FormLabel>
                      <FormControl>
                        <Input id="course-duration" type="number" placeholder="e.g., 100" autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="course-price">Price</FormLabel>
                      <div className="mb-2 text-xs text-slate-500 italic dark:text-slate-400">
                        Currency is set in system settings.
                      </div>
                      <FormControl>
                        <Input id="course-price" type="number" step="0.01" autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="syllabusUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="course-syllabus">Syllabus URL</FormLabel>
                      <FormControl>
                        <Input
                          id="course-syllabus"
                          placeholder="https://example.com/syllabus.pdf"
                          autoComplete="off"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="materialsUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="course-materials">Materials URL</FormLabel>
                      <FormControl>
                        <Input
                          id="course-materials"
                          placeholder="https://example.com/materials.zip"
                          autoComplete="off"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-aerojet-blue hover:bg-aerojet-blue/90"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Course'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
