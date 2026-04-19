'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, DollarSign, Users, Layers, AlertTriangle } from 'lucide-react'
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
import { ExamPool, ExamEvent } from '@prisma/client'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { EASA_MODULE_CODES } from '@/lib/constants/easa-modules'

// Omit eventId as we are editing an existing pool
const editExamPoolSchema = createExamPoolSchema.omit({ eventId: true })

type ExamPoolFormValues = z.infer<typeof editExamPoolSchema>

interface EditExamPoolFormProps {
  pool: any
}

const EASA_MODULES = EASA_MODULE_CODES

export default function EditExamPoolForm({ pool }: EditExamPoolFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (date: Date | string) => {
    if (!date) return ''
    const d = new Date(date)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }

  const form = useForm<any>({
    resolver: zodResolver(editExamPoolSchema),
    defaultValues: {
      name: pool.name,
      minCandidates: pool.minCandidates,
      maxCandidates: pool.maxCandidates,
      moduleDiversityCap: pool.moduleDiversityCap,
      seatPrice: Number(pool.seatPrice),
      allowedModules: pool.allowedModules,
      examDate: formatDateForInput(pool.examDate),
      examStartTime: formatDateForInput(pool.examStartTime),
      examEndTime: formatDateForInput(pool.examEndTime),
      notes: pool.notes || '',
    },
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

      const response = await fetch(`/api/staff/exam-pools/${pool.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update exam booking')
      }

      toast.success('Exam booking updated successfully')
      router.push(`/staff/exams/pools/${pool.id}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update exam booking')
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
                  <Input
                    id="pool-exam-date"
                    type="datetime-local"
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
            name="examStartTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="pool-start">Start Time</FormLabel>
                <FormControl>
                  <Input
                    id="pool-start"
                    type="datetime-local"
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
            name="examEndTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="pool-end">End Time</FormLabel>
                <FormControl>
                  <Input
                    id="pool-end"
                    type="datetime-local"
                    autoComplete="off"
                    {...field}
                  />
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
                {EASA_MODULES.map((moduleCode) => (
                  <FormField
                    key={moduleCode}
                    control={form.control}
                    name="allowedModules"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={moduleCode}
                          className="flex flex-row items-start space-y-0 space-x-3"
                        >
                          <FormControl>
                            <Checkbox
                              id={`module-${moduleCode}`}
                              checked={field.value?.includes(moduleCode)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, moduleCode])
                                  : field.onChange(
                                      field.value?.filter((value: string) => value !== moduleCode)
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel htmlFor={`module-${moduleCode}`} className="font-normal">{moduleCode}</FormLabel>
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

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="pool-notes">Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  id="pool-notes"
                  placeholder="Any additional notes for this pool..."
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
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
            className="bg-aerojet-blue px-8 hover:bg-aerojet-blue/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Pool...
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
