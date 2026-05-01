'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X, BookOpen, GraduationCap, CalendarDays, Filter, Link as LinkIcon } from 'lucide-react'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/app/student/actions'
import { toast } from 'sonner'
import { format, parseISO, isSameDay, addDays, addWeeks, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, addHours, subWeeks, getHours, getMinutes, getDay, startOfWeek, endOfWeek } from 'date-fns'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  userId: string
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

export default function CalendarGrid({ events, userId }: CalendarGridProps) {
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
  const [viewMode, setViewMode] = useState<'Month' | 'Week'>('Week')
  const [popupEvent, setPopupEvent] = useState<CalendarEvent | null>(null)
  const [selectedSources, setSelectedSources] = useState<string[]>(['personal', 'class', 'exam', 'semester'])

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
      if (!selectedSources.includes(evt.source)) return

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
  }, [events, year, month, selectedSources])

  const toggleSource = (source: string) => {
    if (selectedSources.includes(source)) {
      setSelectedSources(selectedSources.filter(s => s !== source))
    } else {
      setSelectedSources([...selectedSources, source])
    }
  }

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

  const startOfRange = viewMode === 'Week' ? startOfWeek(currentDate, { weekStartsOn: 1 }) : startOfMonth(currentDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfRange, i))
  const timeSlots = Array.from({ length: 24 }, (_, i) => i)
  const hourHeight = 80 // px per hour

  const getEventPosition = (evt: CalendarEvent) => {
    const start = new Date(evt.startDate)
    const end = evt.endDate ? new Date(evt.endDate) : addHours(start, 1)
    const startHour = start.getHours() + start.getMinutes() / 60
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return { top: startHour * hourHeight, height: Math.max(durationHours * hourHeight, 24) }
  }

  const getEventStyles = (evt: CalendarEvent) => {
    if (evt.source === 'exam') return 'bg-[#FF4F33] text-white border-l-4 border-white/20'
    if (evt.source === 'class') return 'bg-[#EBF1FF] text-[#4A72E8] border-l-4 border-[#4A72E8]'
    if (evt.source === 'semester') return 'bg-[#E8F8F0] text-[#1D9963] border-l-4 border-[#1D9963]'
    return 'bg-[#FFF0E6] text-[#E0662A] border-l-4 border-[#E0662A]'
  }

  const getEventIcon = (source: string) => {
    if (source === 'exam') return <GraduationCap className="h-4 w-4" />
    if (source === 'class') return <BookOpen className="h-4 w-4" />
    if (source === 'semester') return <CalendarDays className="h-4 w-4" />
    return <CalendarDays className="h-4 w-4" />
  }

  const handlePrev = () => {
    if (viewMode === 'Week') setCurrentDate(subWeeks(currentDate, 1))
    else prevMonth()
  }
  const handleNext = () => {
    if (viewMode === 'Week') setCurrentDate(addWeeks(currentDate, 1))
    else nextMonth()
  }

  const handleCopyFeedUrl = () => {
    const url = `${window.location.origin}/api/calendar/${userId}`
    navigator.clipboard.writeText(url)
    toast.success('Dynamic iCal feed URL copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between rounded-2xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Calendar</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your Personalized Calendar: The Smart Way to Stay on Top of Things</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyFeedUrl}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors select-none"
          >
            <LinkIcon className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Get iCal Feed</span>
          </button>
          <button
            onClick={() => toast.success('Calendar synchronized successfully!')}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors select-none"
          >
            <CalendarDays className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Sync Calendar</span>
          </button>
        </div>
      </div>

      {/* Grid Controls Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50/50 p-1 dark:border-slate-800 dark:bg-slate-800/50">
            <button onClick={handlePrev} className="p-2 hover:bg-white rounded-lg transition-all dark:hover:bg-slate-800" title="Previous">
              <ChevronLeft className="h-5 w-5 text-slate-500" />
            </button>
            <button onClick={goToToday} className="px-3 py-1 text-xs font-black tracking-widest uppercase hover:bg-white rounded-lg transition-all text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800" title="Go to today">
              Today
            </button>
            <button onClick={handleNext} className="p-2 hover:bg-white rounded-lg transition-all dark:hover:bg-slate-800" title="Next">
              <ChevronRight className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          <div className="flex items-center gap-2 font-black text-xl text-slate-900 dark:text-white cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl" onClick={goToToday}>
            {viewMode === 'Week' ? `Week of ${format(startOfRange, 'MMM dd, yyyy')}` : `${monthName} ${year}`}
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{events.length} Events • 4 Sources</span>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Dropdown for Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm outline-none select-none">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 select-none">
              <DropdownMenuCheckboxItem
                checked={selectedSources.includes('personal')}
                onCheckedChange={() => toggleSource('personal')}
                className="cursor-pointer font-bold text-xs gap-2 rounded-lg"
              >
                Personal Events
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedSources.includes('class')}
                onCheckedChange={() => toggleSource('class')}
                className="cursor-pointer font-bold text-xs gap-2 rounded-lg"
              >
                Class Schedule
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedSources.includes('exam')}
                onCheckedChange={() => toggleSource('exam')}
                className="cursor-pointer font-bold text-xs gap-2 rounded-lg"
              >
                Exams & Pool
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedSources.includes('semester')}
                onCheckedChange={() => toggleSource('semester')}
                className="cursor-pointer font-bold text-xs gap-2 rounded-lg"
              >
                Academic Calendar
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex items-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 select-none">
             <button onClick={() => setViewMode('Month')} className={cn("px-5 py-2.5 text-sm font-bold rounded-l-full transition-colors", viewMode === 'Month' ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200')}>Month</button>
             <button onClick={() => setViewMode('Week')} className={cn("px-5 py-2.5 text-sm font-bold rounded-r-full transition-colors border-l border-slate-200 dark:border-slate-700", viewMode === 'Week' ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200')}>Week</button>
          </div>

          <button onClick={() => openAddModal()} className="flex items-center gap-2 rounded-full bg-[#FF4F33] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#E6462D] transition-colors shadow-md shadow-[#FF4F33]/20 select-none">
            New Event <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {viewMode === 'Week' ? (
        <div className="flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
           {/* Week Header */}
           <div className="grid grid-cols-[80px_1fr] border-b border-slate-100 dark:border-slate-800">
             <div className="flex items-center justify-center gap-2 p-2 border-r border-slate-100 dark:border-slate-800">
                <button onClick={handlePrev} className="p-1 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800"><ChevronLeft className="h-4 w-4 text-slate-400"/></button>
                <button onClick={handleNext} className="p-1 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800"><ChevronRight className="h-4 w-4 text-slate-400"/></button>
             </div>
             <div className="grid grid-cols-7">
               {weekDays.map(day => {
                  const isToday = isSameDay(day, new Date())
                  return (
                    <div key={day.toISOString()} className={cn("p-4 text-center border-r border-slate-100 dark:border-slate-800 last:border-r-0", isToday && "bg-[#F8FBFF] dark:bg-blue-900/10 relative")}>
                      {isToday && <div className="absolute top-0 left-0 w-full h-1 bg-[#4A72E8]"></div>}
                      <span className={cn("text-sm font-bold", isToday ? "text-[#4A72E8]" : "text-slate-900 dark:text-white")}>{format(day, 'EEE, dd')}</span>
                    </div>
                  )
               })}
             </div>
           </div>
           
           {/* Week Grid */}
           <div className="flex h-[800px] overflow-y-auto">
              <div className="grid grid-cols-[80px_1fr] w-full relative">
                 {/* Times */}
                 <div className="border-r border-slate-100 dark:border-slate-800">
                    {timeSlots.map(hour => (
                      <div key={hour} className="h-[80px] relative">
                         <span className="absolute -top-3 left-0 w-full text-center text-xs font-medium text-slate-400">
                           {hour === 0 ? '12 am' : hour < 12 ? `${hour} am` : hour === 12 ? '12 pm' : `${hour-12} pm`}
                         </span>
                      </div>
                    ))}
                 </div>
                 
                 {/* Grid Lines & Events */}
                 <div className="grid grid-cols-7 relative">
                    {/* Horizontal Lines */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col">
                      {timeSlots.map(hour => (
                        <div key={hour} className="h-[80px] border-b border-slate-100 dark:border-slate-800"></div>
                      ))}
                    </div>
                    {/* Vertical Lines */}
                    {weekDays.map((day, i) => (
                      <div key={i} className="border-r border-slate-100 dark:border-slate-800 last:border-r-0 h-[1920px]"></div>
                    ))}
                    
                    {/* Events */}
                    {weekDays.map((day, dayIndex) => {
                       const dayStr = format(day, 'yyyy-MM-dd')
                       const dayEvents = eventsByDate[dayStr] || []
                       
                       return dayEvents.map(evt => {
                         const pos = getEventPosition(evt)
                         return (
                           <div
                             key={evt.id}
                             onClick={() => setPopupEvent(evt)}
                             className="absolute left-1 right-1 cursor-pointer transition-transform hover:scale-[1.01] hover:z-10"
                             style={{
                               top: `${pos.top}px`,
                               height: `${pos.height - 4}px`,
                               gridColumnStart: dayIndex + 1,
                               gridColumnEnd: dayIndex + 2
                             }}
                           >
                              <div className={cn("w-full h-full rounded-xl p-3 flex flex-col overflow-hidden shadow-sm relative", getEventStyles(evt))}>
                                 {evt.source === 'exam' && <div className="absolute top-2 right-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg></div>}
                                 <div className="mb-1 bg-white/30 w-fit p-1.5 rounded-lg text-current backdrop-blur-sm">
                                   {getEventIcon(evt.source)}
                                 </div>
                                 <span className="font-bold text-sm truncate leading-tight mt-1">{evt.title}</span>
                                 <span className="text-xs font-medium opacity-80 truncate">
                                   {format(new Date(evt.startDate), 'hh:mm a')} - {evt.endDate ? format(new Date(evt.endDate), 'hh:mm a') : 'TBD'}
                                 </span>
                              </div>
                           </div>
                         )
                       })
                    })}
                 </div>
              </div>
           </div>
        </div>
      ) : (
        /* Month View Grid */
        <div className="flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
           <div className="grid grid-cols-7 border-b border-slate-100 bg-[#F8FBFF] dark:bg-blue-900/10 dark:border-slate-800">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                 <div key={d} className="p-4 text-center text-sm font-bold text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 last:border-r-0">{d}</div>
              ))}
           </div>
           <div className="grid grid-cols-7">
              {calendarDays.map((dayInfo, idx) => {
                 const dayEvents = eventsByDate[dayInfo.date] || []
                 const isToday = dayInfo.date === todayStr
                 return (
                    <div key={idx} onClick={() => { setSelectedDate(dayInfo.date); setViewMode('Week'); setCurrentDate(new Date(dayInfo.date)) }} className={cn("min-h-[120px] p-2 border-r border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative", !dayInfo.isCurrentMonth && "bg-slate-50/50 dark:bg-slate-900/50", isToday && "bg-[#F8FBFF] dark:bg-blue-900/10")}>
                      {isToday && <div className="absolute top-0 left-0 w-full h-1 bg-[#4A72E8]"></div>}
                      <span className={cn("inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-bold mb-2", isToday ? "bg-[#4A72E8] text-white" : !dayInfo.isCurrentMonth ? "text-slate-400" : "text-slate-900 dark:text-white")}>
                         {dayInfo.day}
                      </span>
                      <div className="space-y-1.5">
                         {dayEvents.slice(0, 3).map(evt => (
                            <div key={evt.id} onClick={(e) => { e.stopPropagation(); setPopupEvent(evt) }} className={cn("px-2 py-1 rounded-md text-xs font-bold truncate", getEventStyles(evt))}>
                               {evt.title}
                            </div>
                         ))}
                         {dayEvents.length > 3 && (
                            <div className="text-xs font-bold text-slate-400 pl-1">+{dayEvents.length - 3} more</div>
                         )}
                      </div>
                    </div>
                 )
              })}
           </div>
        </div>
      )}

      {/* Popover Card */}
      {popupEvent && (
        <Dialog open={!!popupEvent} onOpenChange={() => setPopupEvent(null)}>
           <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-0 shadow-2xl rounded-[32px]">
              <DialogTitle className="sr-only">{popupEvent?.title ?? 'Event Details'}</DialogTitle>
              <div className="p-8 bg-white dark:bg-slate-900 relative">
                 <div className="flex items-center gap-2 mb-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF4F33] text-white">
                      <span className="font-bold text-sm">{popupEvent.title.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Event Details</span>
                 </div>
                 
                 {popupEvent.editable && (
                    <div className="absolute top-8 right-8 flex gap-2">
                       <button onClick={() => { setPopupEvent(null); openEditModal(popupEvent) }} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"><Pencil className="h-4 w-4"/></button>
                       <button onClick={() => { setPopupEvent(null); handleDelete(popupEvent.id) }} className="p-2 rounded-full hover:bg-red-50 text-red-400 transition-colors"><Trash2 className="h-4 w-4"/></button>
                    </div>
                 )}

                 <div className="mb-8 mt-2">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 leading-tight">{popupEvent.title}</h3>
                    {popupEvent.description && <p className="text-slate-500 font-medium text-sm">{popupEvent.description}</p>}
                 </div>

                 <div className="flex flex-wrap gap-2 mb-8">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full text-sm font-bold text-slate-700 dark:text-slate-200">
                       <CalendarDays className="h-4 w-4" />
                       {format(new Date(popupEvent.startDate), 'hh:mm a')} - {popupEvent.endDate ? format(new Date(popupEvent.endDate), 'hh:mm a') : 'End'}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full text-sm font-bold text-slate-700 dark:text-slate-200">
                       {format(new Date(popupEvent.startDate), 'dd MMMM')}
                    </div>
                 </div>

                 <button onClick={() => setPopupEvent(null)} className="w-full py-4 rounded-full bg-[#FF4F33] text-white font-bold text-base hover:bg-[#E6462D] transition-colors shadow-lg shadow-[#FF4F33]/25 flex items-center justify-center gap-2">
                    Close Details
                 </button>
              </div>
           </DialogContent>
        </Dialog>
      )}

      {/* Legacy Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {editingEvent ? 'Edit Event' : 'New Event'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Title</label>
                <input
                  id="calendar-event-title"
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-[#FF4F33] focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-[#FF4F33]"
                  placeholder="Study session, meeting..."
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Description (optional)</label>
                <textarea
                  id="calendar-event-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-[#FF4F33] focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-[#FF4F33]"
                  rows={2}
                  placeholder="Notes about this event..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Start</label>
                  <input
                    id="calendar-event-start"
                    type="datetime-local"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-[#FF4F33] focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-[#FF4F33]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">End (optional)</label>
                  <input
                    id="calendar-event-end"
                    type="datetime-local"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-[#FF4F33] focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-[#FF4F33]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Repeat</label>
                <select
                  id="calendar-event-recurrence"
                  value={formRecurrenceType}
                  onChange={(e) => setFormRecurrenceType(e.target.value)}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-[#FF4F33] focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-[#FF4F33]"
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
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Repeat on</label>
                  <div className="flex gap-2">
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
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                          formRecurrenceDays.includes(i)
                            ? 'bg-[#FF4F33] text-white shadow-md shadow-[#FF4F33]/20'
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
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Repeat until (optional)</label>
                  <input
                    id="calendar-event-recurrence-until"
                    type="date"
                    value={formRecurrenceUntil}
                    onChange={(e) => setFormRecurrenceUntil(e.target.value)}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-[#FF4F33] focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-[#FF4F33]"
                  />
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-full border-2 border-slate-100 bg-white py-4 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-full bg-[#FF4F33] py-4 text-sm font-bold text-white transition-all hover:bg-[#E6462D] shadow-lg shadow-[#FF4F33]/20 active:scale-95 disabled:opacity-50"
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
