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

type ExamEventFormValues = z.infer<typeof createExamEventSchema>

export default function CreateExamEventPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm<any>({
    resolver: zodResolver(createExamEventSchema),
    defaultValues: {
      name: '',
      minRevenueTarget: 25000,
      minRevenueCurrency: 'EUR',
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

      const response = await fetch('/api/staff/exam-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create exam event')
      }

      toast.success('Exam event created successfully')
      router.push('/staff/exams/events')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create exam event')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
            Create Exam Event
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Schedule a new examination session.</p>
        </div>
        <Link
          href="/staff/exams/events"
          className="text-sm font-bold text-slate-500 hover:text-aerojet-blue dark:text-slate-400"
        >
          Cancel
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-6">
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
                          <Input
                            type="number"
                            className="pl-10"
                            placeholder="25000.00"
                            {...field}
                          />
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
                  className="bg-aerojet-blue px-8 hover:bg-aerojet-blue/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Event'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
