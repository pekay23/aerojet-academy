'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X, BookOpen, GraduationCap, CalendarDays } from 'lucide-react'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/app/student/actions'
import { toast } from 'sonner'
import { format, parseISO, isSameDay, addDays, addWeeks, addMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

export interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  startDate: string
  endDate?: string | null
  color?: string | null
  source: 'personal' | 'class' | 'exam' | 'semester'
  editable: boolean
  isSystemEvent?: boolean
  recurrenceType?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM' | string
  recurrenceDays?: string | null
  recurrenceUntil?: string | null
}

interface CalendarGridProps {
  events: CalendarEvent[]
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const EVENT_COLORS = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
]

const SOURCE_ICONS: Record<string, typeof BookOpen> = {
  class: BookOpen,
  exam: GraduationCap,
  semester: CalendarDays,
}

export default function CalendarGrid({ events }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formColor, setFormColor] = useState('#3b82f6')
  const [formRecurrenceType, setFormRecurrenceType] = useState('NONE')
  const [formRecurrenceDays, setFormRecurrenceDays] = useState<number[]>([])
  const [formRecurrenceUntil, setFormRecurrenceUntil] = useState('')
  const [saving, setSaving] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthName = currentDate.toLocaleString('default', { month: 'long' })
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPad = firstDay.getDay()
    const totalDays = lastDay.getDate()

    const days: { date: string; day: number; isCurrentMonth: boolean }[] = []

    // Previous month padding
    const prevMonthLast = new Date(year, month, 0).getDate()
    for (let i = startPad - 1; i >= 0; i--) {
      const d = prevMonthLast - i
      const m = month === 0 ? 12 : month
      const y = month === 0 ? year - 1 : year
      days.push({
        date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        day: d,
        isCurrentMonth: false,
      })
    }

    // Current month
    for (let d = 1; d <= totalDays; d++) {
      days.push({
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        day: d,
        isCurrentMonth: true,
      })
    }

    // Next month padding (fill to 42 cells = 6 rows)
    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
      const m = month + 2 > 12 ? 1 : month + 2
      const y = month + 2 > 12 ? year + 1 : year
      days.push({
        date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        day: d,
        isCurrentMonth: false,
      })
    }

    return days
  }, [year, month])

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    
    const addToMap = (date: Date, evt: CalendarEvent) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      if (!map[dateStr]) map[dateStr] = []
      // Avoid duplicate entries of the same event ID on the same day
      if (!map[dateStr].some(e => e.id === evt.id)) {
        map[dateStr].push(evt)
      }
    }

    // Define the window of time we care about (current view +/- 1 month)
    const viewStart = startOfMonth(new Date(year, month - 1, 1))
    const viewEnd = endOfMonth(new Date(year, month + 1, 1))

    events.forEach((evt) => {
      const start = parseISO(evt.startDate)
      
      if (!evt.recurrenceType || evt.recurrenceType === 'NONE') {
        addToMap(start, evt)
        return
      }

      const until = evt.recurrenceUntil ? parseISO(evt.recurrenceUntil) : viewEnd
      const effectiveUntil = until < viewEnd ? until : viewEnd
      
      let current = start
      const maxIterations = 1000
      let count = 0

      while (current <= effectiveUntil && count < maxIterations) {
        if (current >= viewStart) {
          let matches = false
          if (evt.recurrenceType === 'DAILY') matches = true
          else if (evt.recurrenceType === 'WEEKLY') matches = true
          else if (evt.recurrenceType === 'MONTHLY') matches = true
          else if (evt.recurrenceType === 'CUSTOM' && evt.recurrenceDays) {
            const days = evt.recurrenceDays.split(',').map(Number)
            if (days.includes(current.getDay())) matches = true
          }

          if (matches) addToMap(current, evt)
        }

        // Advance to next possible occurrence
        if (evt.recurrenceType === 'DAILY') current = addDays(current, 1)
        else if (evt.recurrenceType === 'WEEKLY') current = addWeeks(current, 1)
        else if (evt.recurrenceType === 'MONTHLY') current = addMonths(current, 1)
        else if (evt.recurrenceType === 'CUSTOM') current = addDays(current, 1)
        else break // Security
        
        count++
      }
    })
    return map
  }, [events, year, month])

  // Get events for selected date
  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : []

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(todayStr)
  }

  const openAddModal = (date?: string) => {
    setEditingEvent(null)
    setFormTitle('')
    setFormDescription('')
    setFormStartDate(date || selectedDate || todayStr)
    setFormEndDate('')
    setFormColor('#3b82f6')
    setFormRecurrenceType('NONE')
    setFormRecurrenceDays([])
    setFormRecurrenceUntil('')
    setShowModal(true)
  }

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event)
    setFormTitle(event.title)
    setFormDescription(event.description || '')
    setFormStartDate(event.startDate.slice(0, 16))
    setFormEndDate(event.endDate?.slice(0, 16) || '')
    setFormColor(event.color || '#3b82f6')
    setFormRecurrenceType(event.recurrenceType || 'NONE')
    setFormRecurrenceDays(event.recurrenceDays ? event.recurrenceDays.split(',').map(Number) : [])
    setFormRecurrenceUntil(event.recurrenceUntil?.slice(0, 10) || '')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast.error('Title is required.')
      return
    }

    setSaving(true)
    try {
      const eventData = {
        title: formTitle,
        description: formDescription,
        startDate: formStartDate,
        endDate: formEndDate || undefined,
        color: formColor,
        recurrenceType: formRecurrenceType,
        recurrenceDays: formRecurrenceDays.join(','),
        recurrenceUntil: formRecurrenceUntil || undefined,
      }

      if (editingEvent) {
        const res = await updateCalendarEvent(editingEvent.id, eventData)
        if (res.error) {
          toast.error(res.error)
        } else {
          toast.success('Event updated!')
          setShowModal(false)
        }
      } else {
        const res = await createCalendarEvent(eventData)
        if (res.error) {
          toast.error(res.error)
        } else {
          toast.success('Event added!')
          setShowModal(false)
        }
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const res = await deleteCalendarEvent(eventId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Event deleted!')
      }
    } catch {
      toast.error('Failed to delete event.')
    }
  }

  const getSourceLabel = (evt: CalendarEvent) => {
    if (evt.source === 'personal' && evt.isSystemEvent) return 'School Event'
    return {
      personal: 'Personal',
      class: 'Class Schedule',
      exam: 'Exam',
      semester: 'Academic',
    }[evt.source] || 'Event'
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-aerojet-blue active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            {monthName} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-aerojet-blue active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-aerojet-blue active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Today
          </button>
          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 rounded-xl bg-aerojet-blue px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-aerojet-blue/90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Event
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/30">
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Legend:</span>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="text-[10px] font-bold text-slate-500">Personal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
          <span className="text-[10px] font-bold text-slate-500">Classes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          <span className="text-[10px] font-bold text-slate-500">Exams</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-slate-500">Semesters</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar Grid */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-2 py-2.5 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((dayInfo, idx) => {
              const dayEvents = eventsByDate[dayInfo.date] || []
              const isToday = dayInfo.date === todayStr
              const isSelected = dayInfo.date === selectedDate

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(dayInfo.date)}
                  className={`group relative min-h-[80px] border-b border-r border-slate-100 p-1.5 text-left transition-colors dark:border-slate-800 ${
                    !dayInfo.isCurrentMonth
                      ? 'bg-slate-50/50 dark:bg-slate-900/50'
                      : isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-900/10'
                        : 'bg-white hover:bg-slate-50/50 dark:bg-slate-900 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isToday
                        ? 'bg-aerojet-blue text-white'
                        : !dayInfo.isCurrentMonth
                          ? 'text-slate-300 dark:text-slate-600'
                          : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {dayInfo.day}
                  </span>

                  {/* Event dots */}
                  <div className="mt-0.5 space-y-0.5">
                    {dayEvents.slice(0, 3).map((evt) => (
                      <div
                        key={evt.id}
                        className="truncate rounded px-1 py-0.5 text-[9px] font-bold leading-tight text-white"
                        style={{
                          backgroundColor:
                            evt.source === 'class' ? '#6366f1' :
                            evt.source === 'exam' ? '#e11d48' :
                            evt.source === 'semester' ? '#10b981' :
                            evt.color || '#3b82f6',
                        }}
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] font-bold text-slate-400">+{dayEvents.length - 3} more</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Sidebar: Selected Date Events */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {selectedDate
                ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Select a date'}
            </h3>
            {selectedDate && (
              <button
                onClick={() => openAddModal(selectedDate)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-aerojet-blue text-white transition-all hover:bg-aerojet-blue/90 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {selectedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarDays className="mb-2 h-8 w-8 text-slate-200 dark:text-slate-700" />
              <p className="text-xs font-bold text-slate-400">No events</p>
              {selectedDate && (
                <button
                  onClick={() => openAddModal(selectedDate)}
                  className="mt-2 text-xs font-bold text-aerojet-blue hover:underline"
                >
                  Add an event
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {selectedEvents.map((evt) => {
                const SourceIcon = SOURCE_ICONS[evt.source]
                return (
                  <div
                    key={evt.id}
                    className="group/evt rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/30"
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            evt.source === 'class' ? '#6366f1' :
                            evt.source === 'exam' ? '#e11d48' :
                            evt.source === 'semester' ? '#10b981' :
                            evt.color || '#3b82f6',
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {SourceIcon && <SourceIcon className="h-3 w-3 text-slate-400" />}
                          <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                            {getSourceLabel(evt)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                          {evt.title}
                        </p>
                        {evt.description && (
                          <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">{evt.description}</p>
                        )}
                      </div>
                      {evt.editable && (
                        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover/evt:opacity-100">
                          <button
                            onClick={() => openEditModal(evt)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(evt.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingEvent ? 'Edit Event' : 'New Event'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">Title</label>
                <input
                  id="calendar-event-title"
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-aerojet-blue focus:ring-2 focus:ring-aerojet-blue/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="Study session, meeting..."
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">Description (optional)</label>
                <textarea
                  id="calendar-event-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-aerojet-blue focus:ring-2 focus:ring-aerojet-blue/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  rows={2}
                  placeholder="Notes about this event..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">Start</label>
                  <input
                    id="calendar-event-start"
                    type="datetime-local"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-900 outline-none transition-colors focus:border-aerojet-blue dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">End (optional)</label>
                  <input
                    id="calendar-event-end"
                    type="datetime-local"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-900 outline-none transition-colors focus:border-aerojet-blue dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">Repeat</label>
                <select
                  id="calendar-event-recurrence"
                  value={formRecurrenceType}
                  onChange={(e) => setFormRecurrenceType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-aerojet-blue dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="NONE">Does not repeat</option>
                  <option value="DAILY">Every day</option>
                  <option value="WEEKLY">Every week</option>
                  <option value="MONTHLY">Every month</option>
                  <option value="CUSTOM">Custom days...</option>
                </select>
              </div>

              {formRecurrenceType === 'CUSTOM' && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-400">Repeat on</label>
                  <div className="flex gap-1.5">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (formRecurrenceDays.includes(i)) {
                            setFormRecurrenceDays(formRecurrenceDays.filter(d => d !== i))
                          } else {
                            setFormRecurrenceDays([...formRecurrenceDays, i].sort())
                          }
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                          formRecurrenceDays.includes(i)
                            ? 'bg-aerojet-blue text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {formRecurrenceType !== 'NONE' && (
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">Repeat until (optional)</label>
                  <input
                    id="calendar-event-recurrence-until"
                    type="date"
                    value={formRecurrenceUntil}
                    onChange={(e) => setFormRecurrenceUntil(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-900 outline-none transition-colors focus:border-aerojet-blue dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-400">Color</label>
                <div className="flex gap-2">
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setFormColor(c.value)}
                      className={`h-7 w-7 rounded-full transition-all ${
                        formColor === c.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-aerojet-blue py-2.5 text-xs font-bold text-white transition-all hover:bg-aerojet-blue/90 active:scale-95 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingEvent ? 'Update' : 'Add Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
