'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
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
import { upsertResource } from '@/lib/actions/resources'
import { toast } from '@/hooks/use-toast'

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
})

type ResourceFormValues = z.infer<typeof resourceSchema>

interface ResourceFormProps {
  initialData?: any
  onSuccess: () => void
}

export default function ResourceForm({ initialData, onSuccess }: ResourceFormProps) {
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      url: '',
      type: 'PDF',
      category: 'INSTITUTIONAL',
      showToInstructors: true,
      showToStaff: true,
      showToStudents: false,
    },
  })

  const isLoading = form.formState.isSubmitting

  async function onSubmit(values: ResourceFormValues) {
    try {
      await upsertResource(values)
      toast.success(values.id ? 'Resource updated' : 'Resource created')
      onSuccess()
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resource Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Instructor Handbook" {...field} />
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
                <FormLabel>File Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL or Path</FormLabel>
              <FormControl>
                <Input placeholder="/documents/file.pdf or https://..." {...field} />
              </FormControl>
              <FormDescription>Relative path from public/ or a full URL.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="What is this resource for?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
          <h4 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-slate-100">
            Visibility
          </h4>

          <FormField
            control={form.control}
            name="showToInstructors"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between space-y-0">
                <FormLabel className="text-xs font-medium">Show to Instructors</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showToStaff"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between space-y-0">
                <FormLabel className="text-xs font-medium">Show to Staff</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showToStudents"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between space-y-0">
                <FormLabel className="text-xs font-medium">Show to Students</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" className="bg-aerojet-blue hover:bg-aerojet-blue/90" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
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
