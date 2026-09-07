'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

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
  event: Omit<ExamEvent, 'minRevenueTarget' | 'resitFee' | 'lateBookingSurcharge' | 'startDate' | 'endDate' | 'paymentDeadline' | 'joinDeadline' | 'createdAt' | 'updatedAt' | 'deletedAt'> & {
    minRevenueTarget: number
    minRevenueCurrency?: string
    resitFee: number
    lateBookingSurcharge: number
    startDate: string | Date
    endDate: string | Date
    paymentDeadline: string | Date
    joinDeadline?: string | Date | null
    createdAt: string | Date
    updatedAt: string | Date
    deletedAt?: string | Date | null
  }
}

type ExamEventFormValues = z.input<typeof createExamEventSchema>

export default function EditExamEventForm({ event }: EditExamEventFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (date: Date | string | null | undefined) => {
    if (!date) return ''
    try {
      return format(new Date(date), "yyyy-MM-dd'T'HH:mm")
    } catch (_e) {
      console.error('Invalid date for input:', date)
      return ''
    }
  }

  const form = useForm<ExamEventFormValues>({
    resolver: zodResolver(createExamEventSchema) as any,
    defaultValues: {
      name: event.name,
      startDate: formatDateForInput(event.startDate),
      endDate: formatDateForInput(event.endDate),
      paymentDeadline: formatDateForInput(event.paymentDeadline),
      joinDeadline: formatDateForInput(event.joinDeadline),
      minRevenueTarget: Number(event.minRevenueTarget),
      minRevenueCurrency: (event.minRevenueCurrency || 'EUR') as 'EUR' | 'GHS' | 'USD',
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update exam event'
      toast.error(message || 'Failed to update exam event')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control as any}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="form-name">Event Name</FormLabel>
              <FormControl>
                <Input id="form-name" placeholder="e.g., Spring 2026 EASA Exams" autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control as any}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="form-start">Start Date & Time</FormLabel>
                <FormControl>
                  <Input id="form-start" type="datetime-local" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="form-end">End Date & Time</FormLabel>
                <FormControl>
                  <Input id="form-end" type="datetime-local" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control as any}
            name="paymentDeadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="form-payment">Payment Deadline (Go/No-Go)</FormLabel>
                <FormControl>
                  <Input id="form-payment" type="datetime-local" autoComplete="off" {...field} />
                </FormControl>
                <FormDescription>
                  Deadline for generating invoice and confirming the event.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name="joinDeadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="form-join">Join Deadline</FormLabel>
                <FormControl>
                  <Input id="form-join" type="datetime-local" autoComplete="off" {...field} value={field.value || ''} />
                </FormControl>
                <FormDescription>Last date for students to join (optional).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FormField
            control={form.control as any}
            name="minRevenueTarget"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel htmlFor="form-revenue">Minimum Revenue Target</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="form-revenue" type="number" autoComplete="off" className="pl-10" placeholder="25000.00" {...field} />
                  </div>
                </FormControl>
                <FormDescription>Target revenue for Go/No-Go decision.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name="minRevenueCurrency"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="form-currency">Currency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger id="form-currency">
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
            className="bg-aerojet-blue px-8 hover:bg-aerojet-blue/90"
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
