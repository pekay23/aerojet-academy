'use client'

import { useState } from 'react'
import { format, startOfWeek, addDays, isSameDay, startOfDay } from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
} from 'lucide-react'
import SessionDetails from './SessionDetails'
import { cn } from '@/lib/utils'

interface CalendarGridProps {
  schedule: any[]
  initialDate?: Date
}

export default function CalendarGrid({ schedule, initialDate }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date())
  const [selectedSession, setSelectedSession] = useState<any>(null)

  const startOfRange = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfRange, i))

  // Time slots from 08:00 to 17:00
  const timeSlots = Array.from({ length: 10 }, (_, i) => 8 + i)
  const hourHeight = 96 // px per hour

  const getEventPosition = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    // Offset from 08:00
    const startHour = start.getHours() + start.getMinutes() / 60
    const offsetHours = startHour - 8
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

    return {
      top: offsetHours * hourHeight,
      height: durationHours * hourHeight,
    }
  }

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      CORE: 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20',
      SPECIALIST: 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/20',
      AVIONICS: 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/20',
    }
    return colors[category || ''] || 'border-slate-400 bg-slate-50/50 dark:bg-slate-800/20'
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/30 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-xl border border-slate-100 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 px-3">
              <CalendarIcon className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-bold tracking-tight text-slate-700 uppercase dark:text-slate-200">
                {format(startOfRange, 'MMM d')} – {format(addDays(startOfRange, 6), 'MMM d, yyyy')}
              </span>
            </div>
            <button
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
          {['Day', 'Week', 'Month'].map((view) => (
            <button
              key={view}
              className={cn(
                'rounded-lg px-4 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all',
                view === 'Week'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-8 border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/10">
          <div className="border-r border-slate-100 p-4 dark:border-slate-800"></div>
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date())
            return (
              <div
                key={day.toString()}
                className={cn(
                  'border-r border-slate-100 p-4 text-center last:border-r-0 dark:border-slate-800',
                  isToday && 'relative bg-blue-50/30 dark:bg-blue-900/10'
                )}
              >
                {isToday && <div className="absolute top-0 left-0 h-1 w-full bg-blue-500" />}
                <span
                  className={cn(
                    'mb-1 block text-[10px] font-black tracking-widest uppercase',
                    isToday ? 'text-blue-500' : 'text-slate-400'
                  )}
                >
                  {format(day, 'EEE')}
                </span>
                <span
                  className={cn(
                    'block text-xl font-black tracking-tight',
                    isToday
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-200'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>
            )
          })}
        </div>

        {/* Grid Scroll Area */}
        <div className="relative flex-1 overflow-y-auto scroll-smooth bg-slate-50/20 dark:bg-slate-900/20">
          <div className="grid min-h-full grid-cols-8">
            {/* Time Column */}
            <div className="col-span-1 border-r border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30">
              {timeSlots.map((hour) => (
                <div
                  key={hour}
                  className="flex h-24 items-center justify-center border-b border-slate-100/50 text-[10px] font-black text-slate-400 dark:border-slate-800/50"
                >
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Content Columns Wrapper */}
            <div className="relative col-span-7 grid grid-cols-7">
              {/* Horizontal Grid Lines */}
              <div className="pointer-events-none absolute inset-0 flex flex-col">
                {timeSlots.map((hour) => (
                  <div
                    key={hour}
                    className="h-24 w-full border-b border-dashed border-slate-200/60 dark:border-slate-800/60"
                  ></div>
                ))}
              </div>

              {/* Vertical Grid Lines */}
              <div className="pointer-events-none absolute inset-0 flex">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-full w-1/7 border-r border-slate-100 last:border-r-0 dark:border-slate-800"
                  ></div>
                ))}
              </div>

              {/* Current Time Indicator logic could go here */}

              {/* Events Layer */}
              {schedule.map((cls) => {
                const clsStart = new Date(cls.startDate)
                const dayIndex = weekDays.findIndex((d) => isSameDay(d, clsStart))

                if (dayIndex === -1) return null

                const { top, height } = getEventPosition(cls.startDate, cls.endDate)

                return (
                  <div
                    key={cls.id}
                    className="group relative cursor-pointer"
                    style={{
                      gridColumnStart: dayIndex + 1,
                      gridColumnEnd: dayIndex + 2,
                    }}
                    onClick={() => setSelectedSession(cls)}
                  >
                    <div
                      className={cn(
                        'absolute right-1 left-1 z-10 overflow-hidden rounded-xl border-l-4 p-3 shadow-sm transition-all duration-300 hover:shadow-md',
                        getCategoryColor(cls.course.category)
                      )}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <div>
                          <div className="mb-1.5 flex items-center gap-1.5">
                            <span className="rounded-md bg-white px-1.5 py-0.5 text-[9px] font-black text-slate-600 uppercase shadow-sm dark:bg-slate-800 dark:text-slate-300">
                              {cls.course.code}
                            </span>
                            {/* Dummy status mapping for now */}
                            {height > 100 && (
                              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-500 capitalize dark:bg-blue-900/40">
                                Upcoming
                              </span>
                            )}
                          </div>
                          <h4 className="text-[11px] leading-tight font-black text-slate-800 dark:text-slate-100">
                            {cls.course.name}
                          </h4>
                          <div className="mt-2 flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Clock className="h-3 w-3" />
                            <span className="text-[10px] font-medium tracking-tight">
                              {format(new Date(cls.startDate), 'HH:mm')} -{' '}
                              {format(new Date(cls.endDate), 'HH:mm')}
                            </span>
                          </div>
                        </div>

                        {height > 150 && (
                          <div className="animate-in fade-in slide-in-from-bottom-2 mt-auto hidden duration-300 group-hover:block">
                            <button className="w-full rounded-lg bg-blue-600 py-1.5 text-[9px] font-black tracking-widest text-white uppercase shadow-sm transition-all hover:bg-blue-700">
                              Open Session
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <SessionDetails
        session={selectedSession}
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  )
}
