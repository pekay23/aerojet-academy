'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type Resolver } from 'react-hook-form'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
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

const courseFormSchema = z.object({
  code: z.string().min(2, {
    message: 'Code must be at least 2 characters.',
  }),
  name: z.string().min(3, {
    message: 'Name must be at least 3 characters.',
  }),
  description: z.string().optional().nullable(),
  categoryId: z.string().min(1, 'Category is required'),
  applicableCategories: z.array(z.string()).default([]),
  moduleType: z.enum(['CORE', 'SPECIALIST', 'AVIONICS']).optional().nullable(),
  duration: z.coerce.number().int().positive().optional().nullable(),
  price: z.coerce.number().positive(),
  isActive: z.boolean().default(true),
  requiresPrerequisite: z.boolean().default(false),
  prerequisites: z.string().optional(), // Comma-separated course codes
  syllabusUrl: z.string().url().optional().or(z.literal('')).nullable(),
  materialsUrl: z.string().url().optional().or(z.literal('')).nullable(),
})

type CourseFormValues = z.infer<typeof courseFormSchema>

interface EditCourseFormProps {
  initialData: any
}

export default function EditCourseForm({ initialData }: EditCourseFormProps) {
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
          setLicenseCategories(licensesData.data.map((l: any) => ({
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
    defaultValues: {
      code: initialData.code || '',
      name: initialData.name || '',
      description: initialData.description || '',
      categoryId: initialData.categoryId || '',
      applicableCategories: initialData.applicableCategories || [],
      moduleType: initialData.moduleType || 'CORE',
      duration: initialData.duration || undefined,
      price: Number(initialData.price) || 0,
      isActive: initialData.isActive ?? true,
      requiresPrerequisite: initialData.requiresPrerequisite ?? false,
      prerequisites: initialData.prerequisites ? initialData.prerequisites.join(', ') : '',
      syllabusUrl: initialData.syllabusUrl || '',
      materialsUrl: initialData.materialsUrl || '',
    },
    mode: 'onChange',
  })

  async function onSubmit(values: CourseFormValues) {
    setIsLoading(true)
    try {
      const data = {
        ...values,
        prerequisites: values.prerequisites
          ? values.prerequisites
              .split(',')
              .map((p: string) => p.trim())
              .filter(Boolean)
          : [],
      }

      const response = await fetch(`/api/staff/courses/${initialData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update course')
      }

      toast.success('Course updated successfully')
      router.push(`/staff/courses`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update course')
    } finally {
      setIsLoading(false)
    }
  }

  return (
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
                  <Input
                    id="course-code"
                    placeholder="e.g., M1"
                    autoComplete="off"
                    {...field}
                  />
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
                  <Input
                    id="course-name"
                    placeholder="e.g., Mathematics"
                    autoComplete="off"
                    {...field}
                  />
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
                <Textarea
                  id="course-description"
                  placeholder="A brief description of the course"
                  autoComplete="off"
                  {...field}
                  value={field.value || ''}
                />
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
              <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm">
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
              <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm">
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

        {form.watch('requiresPrerequisite') && (
          <FormField
            control={form.control}
            name="prerequisites"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="course-prerequisites">Prerequisites (Course Codes)</FormLabel>
                <FormControl>
                  <Input
                    id="course-prerequisites"
                    placeholder="e.g., M1, M2 (comma separated)"
                    autoComplete="off"
                    {...field}
                  />
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
                  <Input
                    id="course-duration"
                    type="number"
                    placeholder="e.g., 100"
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
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="course-price">Price ({initialData.currency || 'EUR'})</FormLabel>
                <FormControl>
                  <Input
                    id="course-price"
                    type="number"
                    step="0.01"
                    autoComplete="off"
                    {...field}
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

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" className="bg-aerojet-blue hover:bg-aerojet-blue/90" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
