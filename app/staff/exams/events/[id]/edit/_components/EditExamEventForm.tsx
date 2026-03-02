'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, DollarSign } from 'lucide-react'
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
import { toast } from '@/hooks/use-toast'
import { createExamEventSchema } from '@/lib/validation/schemas'
import { ExamEvent } from '@prisma/client'
import { format } from 'date-fns'

interface EditExamEventFormProps {
  event: Omit<ExamEvent, 'minRevenueTarget' | 'minRevenueCurrency'> & {
    minRevenueTarget: number | any
    minRevenueCurrency?: string
  }
}

type ExamEventFormValues = z.infer<typeof createExamEventSchema>

export default function EditExamEventForm({ event }: EditExamEventFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (date: Date | null) => {
    if (!date) return ''
    return format(new Date(date), "yyyy-MM-dd'T'HH:mm")
  }

  const form = useForm<any>({
    resolver: zodResolver(createExamEventSchema),
    defaultValues: {
      name: event.name,
      startDate: formatDateForInput(event.startDate),
      endDate: formatDateForInput(event.endDate),
      paymentDeadline: formatDateForInput(event.paymentDeadline),
      joinDeadline: formatDateForInput(event.joinDeadline),
      minRevenueTarget: Number(event.minRevenueTarget),
      minRevenueCurrency: event.minRevenueCurrency || 'EUR',
    },
  })

  async function onSubmit(values: ExamEventFormValues) {
    setIsLoading(true)
    try {
      // Convert to ISO strings for the API
      const data = {
        ...values,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        paymentDeadline: new Date(values.paymentDeadline).toISOString(),
        joinDeadline: values.joinDeadline ? new Date(values.joinDeadline).toISOString() : undefined,
      }

      const response = await fetch(`/api/staff/exam-events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update exam event')
      }

      toast.success('Exam event updated successfully')
      router.push(`/staff/exams/events/${event.id}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update exam event')
    } finally {
      setIsLoading(false)
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
              <FormLabel>Event Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Spring 2026 EASA Exams" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date & Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date & Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="paymentDeadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Deadline (Go/No-Go)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormDescription>
                  Deadline for generating invoice and confirming the event.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="joinDeadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Join Deadline</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} value={field.value || ''} />
                </FormControl>
                <FormDescription>Last date for students to join (optional).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="minRevenueTarget"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Minimum Revenue Target</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input type="number" className="pl-10" placeholder="25000.00" {...field} />
                  </div>
                </FormControl>
                <FormDescription>Target revenue for Go/No-Go decision.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="minRevenueCurrency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GHS">GHS (₵)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#002a5c] px-8 hover:bg-[#002a5c]/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
