'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
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
import { toast } from 'sonner'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  capacity: z.number().int().positive('Capacity must be positive'),
  type: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function CreateClassroomForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      capacity: 30,
      type: '',
    },
  })

  async function onSubmit(values: FormValues) {
    setIsLoading(true)
    try {
      const response = await fetch('/api/staff/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add room')
      }

      toast.success('Success', { description: 'Room added successfully' })
      router.push('/staff/classrooms')
      router.refresh()
    } catch (error: any) {
      toast.error('Error', { description: error.message || 'Failed to add room' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Name/Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Room 101, Sim Lab A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Seating Capacity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Lecture Hall, Laboratory" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" className="bg-aerojet-blue hover:bg-aerojet-blue/90" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Room
          </Button>
        </div>
      </form>
    </Form>
  )
}
