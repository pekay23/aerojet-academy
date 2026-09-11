'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type Resolver } from 'react-hook-form'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Loader2, DollarSign, Users, Layers } from 'lucide-react'
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
import { toast } from '@/hooks/use-toast'
import { createExamPoolSchema } from '@/lib/validation/schemas'
import { ExamEvent } from '@prisma/client'
import { Checkbox } from '@/components/ui/checkbox'
import { EASA_MODULE_CODES } from '@/lib/constants/easa-modules'
import { useFormDirty } from '@/hooks/useFormDirty'

interface CreateExamPoolFormProps {
  event: Omit<ExamEvent, 'minRevenueTarget'> & { minRevenueTarget: number | null }
}

type ExamPoolFormValues = z.infer<typeof createExamPoolSchema>

const EASA_MODULES = EASA_MODULE_CODES

export default function CreateExamPoolForm({ event }: CreateExamPoolFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ExamPoolFormValues>({
    resolver: zodResolver(createExamPoolSchema) as unknown as Resolver<ExamPoolFormValues>,
    defaultValues: {
      eventId: event.id,
      name: '',
      examDate: '',
      examStartTime: '',
      examEndTime: '',
      minCandidates: 25,
      maxCandidates: 28,
      moduleDiversityCap: 4,
      seatPrice: 300,
      allowedModules: [],
    },
  })

  const { markDirty, markClean } = useFormDirty()

  // Track form changes for unsaved changes warning
  useEffect(() => {
    const subscription = form.watch(() => markDirty())
    return () => subscription.unsubscribe()
  })

  async function onSubmit(values: ExamPoolFormValues) {
    setIsLoading(true)
    try {
      // Convert to ISO strings for the API
      const data = {
        ...values,
        examDate: new Date(values.examDate).toISOString(),
        examStartTime: new Date(values.examStartTime).toISOString(),
        examEndTime: new Date(values.examEndTime).toISOString(),
      }

      const response = await fetch('/api/staff/exam-pools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create exam booking')
      }

      toast.success('Exam booking created successfully')
      markClean()
      router.push(`/staff/exams/events/${event.id}`)
      router.refresh()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create exam booking')
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
              <FormLabel htmlFor="pool-name">Booking Name</FormLabel>
              <FormControl>
                <Input
                  id="pool-name"
                  placeholder="e.g., Morning Session A"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="examDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="pool-exam-date">Exam Date (Reference)</FormLabel>
                <FormControl>
                  <Input id="pool-exam-date" type="datetime-local" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="examStartTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="pool-start-time">Start Time</FormLabel>
                <FormControl>
                  <Input id="pool-start-time" type="datetime-local" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="examEndTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="pool-end-time">End Time</FormLabel>
                <FormControl>
                  <Input id="pool-end-time" type="datetime-local" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="minCandidates"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="pool-min-candidates">Min Candidates</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Users className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="pool-min-candidates"
                      type="number"
                      autoComplete="off"
                      className="pl-10"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxCandidates"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="pool-max-candidates">Max Candidates</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Users className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="pool-max-candidates"
                      type="number"
                      autoComplete="off"
                      className="pl-10"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="moduleDiversityCap"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="pool-diversity-cap">Module Diversity Cap</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Layers className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="pool-diversity-cap"
                      type="number"
                      autoComplete="off"
                      className="pl-10"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormDescription>Max different modules allowed.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="seatPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="pool-seat-price">Seat Price</FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="pool-seat-price"
                    type="number"
                    autoComplete="off"
                    className="pl-10"
                    placeholder="300.00"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allowedModules"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Allowed Modules (Select at least 1)</FormLabel>
                <FormDescription>
                  Select the modules for which candidates can book this pool.
                </FormDescription>
              </div>
              <div className="grid grid-cols-4 gap-4 md:grid-cols-6 lg:grid-cols-8">
                {EASA_MODULES.map((moduleCode, idx) => (
                  <FormField
                    key={moduleCode}
                    control={form.control}
                    name="allowedModules"
                    render={({ field }) => {
                      const checkboxId = `module-${moduleCode}-${idx}`
                      return (
                        <FormItem
                          key={moduleCode}
                          className="flex flex-row items-start space-y-0 space-x-3"
                        >
                          <FormControl>
                            <Checkbox
                              id={checkboxId}
                              checked={field.value?.includes(moduleCode)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, moduleCode])
                                  : field.onChange(
                                      field.value?.filter((value) => value !== moduleCode)
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel htmlFor={checkboxId} className="cursor-pointer font-normal">
                            {moduleCode}
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
            className="bg-aerojet-blue hover:bg-aerojet-blue/90 px-8"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Booking...
              </>
            ) : (
              'Create Booking'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
