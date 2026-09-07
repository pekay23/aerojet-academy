'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch, type Resolver } from 'react-hook-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClassSchema } from '@/lib/validation/schemas'

// We need to adapt the schema for the form because datetime strings are needed for the API
// but the form might use date inputs which produce strings that need converting to ISO.
const formSchema = createClassSchema.extend({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  recurrenceType: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']).default('NONE'),
  recurrenceDays: z.string().optional(),
  recurrenceUntil: z.string().optional().nullable(),
  classroomId: z.string().optional(),
  weeklySchedule: z.array(z.object({
    day: z.number(), // 0-6 (Sun-Sat)
    active: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
  })).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface InstructorItem {
  id: string
  user: {
    id: string
    email: string
    profile: {
      firstName: string
      lastName: string
    } | null
  }
}

interface CreateClassFormProps {
  courses: { id: string; name: string; code: string }[]
  instructors: InstructorItem[]
  classrooms: { id: string; name: string; capacity: number; type: string | null }[]
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CreateClassForm({ courses, instructors, classrooms }: CreateClassFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      name: '',
      courseId: '',
      instructorId: undefined,
      startDate: '',
      endDate: '',
      maxStudents: 28,
      recurrenceType: 'NONE',
      recurrenceDays: '',
      recurrenceUntil: '',
      classroomId: undefined,
      weeklySchedule: Array.from({ length: 7 }).map((_, i) => ({
        day: i,
        active: false,
        startTime: '09:00',
        endTime: '17:00',
      })),
    },
  })

  const recurrenceType = useWatch({ control: form.control, name: 'recurrenceType' })
  const weeklySchedule = useWatch({ control: form.control, name: 'weeklySchedule' })

  async function onSubmit(values: FormValues) {
    setIsLoading(true)
    try {
      // Convert dates to ISO format and handle optional instructorId
      const data = {
        ...values,
        instructorId: values.instructorId === 'none' ? undefined : values.instructorId,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        recurrenceUntil: values.recurrenceUntil ? new Date(values.recurrenceUntil).toISOString() : undefined,
        classroomId: values.classroomId === 'none' ? undefined : values.classroomId,
        schedule: values.weeklySchedule?.filter(s => s.active),
      }

      const response = await fetch('/api/staff/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create class')
      }

      toast.success('Class scheduled successfully')
      router.push('/staff/classes')
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create class'
      toast.error(message || 'Failed to create class')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="class-name">Class Name</FormLabel>
                <FormControl>
                  <Input
                    id="class-name"
                    placeholder="e.g., Evening Batch A"
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
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="class-course">Course</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger id="class-course">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.name}
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
            name="instructorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="class-instructor">Instructor (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger id="class-instructor">
                      <SelectValue placeholder="Select an instructor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {instructors.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.user.profile
                          ? `${inst.user.profile.firstName} ${inst.user.profile.lastName}`
                          : inst.user.email}
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
            name="classroomId"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="class-room">Classroom/Venue (Optional)</FormLabel>
                <Select 
                  onValueChange={(val) => {
                    field.onChange(val)
                    if (val !== 'none') {
                      const room = classrooms.find(r => r.id === val)
                      if (room) {
                        const currentMax = form.getValues('maxStudents')
                        if (currentMax > room.capacity) {
                          form.setValue('maxStudents', room.capacity)
                          toast.info('Capacity Adjusted', { description: `Max students lowered to match room capacity (${room.capacity})` })
                        }
                      }
                    }
                  }} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger id="class-room">
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {classrooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} (Cap: {room.capacity})
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
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="class-start">Start Date</FormLabel>
                <FormControl>
                  <Input
                    id="class-start"
                    type="date"
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
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="class-end">End Date</FormLabel>
                <FormControl>
                  <Input
                    id="class-end"
                    type="date"
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
            name="maxStudents"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="class-max">Max Students</FormLabel>
                <FormControl>
                  <Input
                    id="class-max"
                    type="number"
                    autoComplete="off"
                    {...field}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      const roomId = form.getValues('classroomId')
                      if (roomId && roomId !== 'none') {
                        const room = classrooms.find(r => r.id === roomId)
                        if (room && val > room.capacity) {
                          toast.error('Capacity Exceeded', { description: `Room max capacity is ${room.capacity}` })
                          field.onChange(room.capacity)
                          return
                        }
                      }
                      field.onChange(val)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recurrenceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="class-recurrence">Recurrence</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger id="class-recurrence">
                      <SelectValue placeholder="Select recurrence" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NONE">Does not repeat</SelectItem>
                    <SelectItem value="WEEKLY">Weekly Schedule</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {recurrenceType === 'WEEKLY' && (
            <div className="col-span-full mt-4 space-y-4 rounded-xl border border-slate-200 p-6 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Weekly Schedule Configuration</h4>
                  <p className="text-xs text-slate-500">Configure instruction hours for each active day.</p>
                </div>
              </div>
              <div className="space-y-3">
                {weeklySchedule?.map((schedule, index) => (
                  <div key={index} className={`flex items-center gap-4 rounded-lg border p-3 transition-colors ${schedule.active ? 'border-aerojet-blue/30 bg-blue-50/50 dark:border-aerojet-blue/50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-800'}`}>
                    <label className="flex w-24 items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={schedule.active}
                        onChange={(e) => {
                          const schedules = [...form.getValues('weeklySchedule') || []]
                          schedules[index].active = e.target.checked
                          form.setValue('weeklySchedule', schedules)
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-aerojet-blue focus:ring-aerojet-blue"
                      />
                      <span className={`text-sm font-bold ${schedule.active ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                        {DAYS_OF_WEEK[index]}
                      </span>
                    </label>
                    
                    <div className={`flex flex-1 items-center gap-3 ${!schedule.active && 'opacity-30 pointer-events-none'}`}>
                      <Input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => {
                          const schedules = [...form.getValues('weeklySchedule') || []]
                          schedules[index].startTime = e.target.value
                          form.setValue('weeklySchedule', schedules)
                        }}
                        className="h-9 w-32"
                      />
                      <span className="text-slate-400">to</span>
                      <Input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => {
                          const schedules = [...form.getValues('weeklySchedule') || []]
                          schedules[index].endTime = e.target.value
                          form.setValue('weeklySchedule', schedules)
                        }}
                        className="h-9 w-32"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recurrenceType !== 'NONE' && (
            <FormField
              control={form.control}
              name="recurrenceUntil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="class-recurrence-until">Repeat Until</FormLabel>
                  <FormControl>
                    <Input
                      id="class-recurrence-until"
                      type="date"
                      autoComplete="off"
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
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
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Schedule Class
          </Button>
        </div>
      </form>
    </Form>
  )
}
