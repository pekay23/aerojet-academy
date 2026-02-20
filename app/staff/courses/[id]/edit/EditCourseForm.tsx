'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type Resolver } from 'react-hook-form'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
  category: z.string().optional().nullable(),
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

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema) as unknown as Resolver<CourseFormValues>,
    defaultValues: {
      code: initialData.code || '',
      name: initialData.name || '',
      description: initialData.description || '',
      category: initialData.category || '',
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
      // Process prerequisites into array
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
        throw new Error('Failed to update course')
      }

      toast.success('Course updated successfully')
      router.push(`/staff/courses/${initialData.id}`)
      router.refresh()
    } catch (error) {
      toast.error('Failed to update course')
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
                <FormLabel>Course Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., M1" {...field} />
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
                <FormLabel>Course Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Mathematics" {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A brief description of the course"
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
                <FormLabel>Prerequisites (Course Codes)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., M1, M2 (comma separated)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., CORE" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (hours)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 100"
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
                <FormLabel>Price ({initialData.currency || 'EUR'})</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
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
                <FormLabel>Syllabus URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com/syllabus.pdf"
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
                <FormLabel>Materials URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com/materials.zip"
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
          <Button type="submit" className="bg-[#002a5c] hover:bg-[#002a5c]/90" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
