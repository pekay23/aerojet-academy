'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import Link from 'next/link'
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
    <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-bold text-aerojet-blue uppercase tracking-wider">
            <span className="h-1 w-6 bg-aerojet-blue rounded-full" />
            Exam Management
          </div>
          <h1 className="text-4xl font-black tracking-tight text-aerojet-blue dark:text-white">
            Create Exam Event
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            Configure dates, revenue targets, and deadlines for a new examination session.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <Button
            variant="ghost"
            asChild
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <Link href="/staff/exams/events">Cancel</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/60 bg-white p-1 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/60">
        <div className="overflow-hidden rounded-[calc(1.5rem-4px)] bg-slate-50/20 p-8 dark:bg-slate-950/20">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                {/* Column 1: Core Details */}
                <div className="space-y-8">
                  <div>
                    <h3 className="mb-6 text-sm font-black uppercase tracking-[0.2em] text-aerojet-blue/70">
                      Core Information
                    </h3>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel id="label-event-name" htmlFor="input-event-name" className="text-xs font-black uppercase tracking-widest text-slate-500">
                            Event Name <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              id="input-event-name"
                              placeholder="e.g., Spring 2026 EASA Exams"
                              autoComplete="off"
                              className="h-12 border-slate-200 bg-white px-4 text-base focus:ring-4 focus:ring-aerojet-blue/10 dark:border-slate-800 dark:bg-slate-900"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-aerojet-blue/70">
                      Revenue Targets
                    </h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="minRevenueTarget"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel id="label-revenue" htmlFor="input-revenue" className="text-xs font-black uppercase tracking-widest text-slate-500">
                              Min Revenue Target
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                                  €
                                </span>
                                <Input
                                  id="input-revenue"
                                  type="number"
                                  autoComplete="off"
                                  className="h-12 border-slate-200 bg-white pl-10 text-base focus:ring-4 focus:ring-aerojet-blue/10 dark:border-slate-800 dark:bg-slate-900"
                                  placeholder="25000.00"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormDescription className="text-[10px] font-medium leading-relaxed text-slate-400">
                              Estimated target for financial feasibility (Go/No-Go).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="minRevenueCurrency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel id="label-currency" htmlFor="select-currency" className="text-xs font-black uppercase tracking-widest text-slate-500">
                              Currency
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger
                                  id="select-currency"
                                  className="h-12 border-slate-200 bg-white focus:ring-4 focus:ring-aerojet-blue/10 dark:border-slate-800 dark:bg-slate-900"
                                >
                                  <SelectValue placeholder="EUR" />
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
                  </div>
                </div>

                {/* Column 2: Scheduling & Deadlines */}
                <div className="space-y-8 rounded-2xl bg-white p-8 border border-slate-100 dark:bg-slate-900/40 dark:border-slate-800/50">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-aerojet-blue/70">
                    Session Schedule & Deadlines
                  </h3>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel id="label-start" htmlFor="input-start" className="text-xs font-black uppercase tracking-widest text-slate-500">
                            Start Date & Time
                          </FormLabel>
                          <FormControl>
                            <Input
                              id="input-start"
                              type="datetime-local"
                              autoComplete="off"
                              className="h-12 border-slate-200 bg-slate-50/50 px-4 text-sm focus:bg-white focus:ring-4 focus:ring-aerojet-blue/10 dark:border-slate-800 dark:bg-slate-950"
                              {...field}
                            />
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
                          <FormLabel id="label-end" htmlFor="input-end" className="text-xs font-black uppercase tracking-widest text-slate-500">
                            End Date & Time
                          </FormLabel>
                          <FormControl>
                            <Input
                              id="input-end"
                              type="datetime-local"
                              autoComplete="off"
                              className="h-12 border-slate-200 bg-slate-50/50 px-4 text-sm focus:bg-white focus:ring-4 focus:ring-aerojet-blue/10 dark:border-slate-800 dark:bg-slate-950"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <FormField
                      control={form.control}
                      name="paymentDeadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel id="label-payment" htmlFor="input-payment" className="text-xs font-black uppercase tracking-widest text-slate-500">
                            Payment Deadline (Go/No-Go)
                          </FormLabel>
                          <FormControl>
                            <Input
                              id="input-payment"
                              type="datetime-local"
                              autoComplete="off"
                              className="h-12 border-slate-200 bg-slate-50/50 px-4 text-sm focus:bg-white focus:ring-4 focus:ring-aerojet-blue/10 dark:border-slate-800 dark:bg-slate-950"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-[10px] font-medium leading-relaxed text-slate-400 italic">
                            Students must settle all pending fees before this date to participate.
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
                          <FormLabel id="label-join" htmlFor="input-join" className="text-xs font-black uppercase tracking-widest text-slate-500">
                            Join Deadline
                          </FormLabel>
                          <FormControl>
                            <Input
                              id="input-join"
                              type="datetime-local"
                              autoComplete="off"
                              placeholder="Optional"
                              className="h-12 border-slate-200 bg-slate-50/50 px-4 text-sm focus:bg-white focus:ring-4 focus:ring-aerojet-blue/10 dark:border-slate-800 dark:bg-slate-950"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription className="text-[10px] font-medium leading-relaxed text-slate-400 italic">
                            Last date for new registrations (optional).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/60 pt-10 dark:border-slate-800">
                <p className="hidden text-xs font-medium text-slate-400 sm:block italic">
                  * All fields marked with asterisk are strictly required for event publication.
                </p>
                <div className="flex w-full gap-4 sm:w-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                    disabled={isLoading}
                    className="flex-1 font-bold sm:flex-none sm:px-10"
                  >
                    Discard Changes
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-aerojet-blue px-12 py-6 text-base font-black uppercase tracking-wider shadow-lg shadow-aerojet-blue/20 transition-all hover:bg-aerojet-blue/90 hover:shadow-xl active:scale-[0.98] sm:flex-none"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Publish Event'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
