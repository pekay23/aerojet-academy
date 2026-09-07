'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Calendar, Clock, MapPin, Users, ChevronDown, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

export interface InterviewSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  capacity: number
  location: string | null
  bookedCount: number
}

export interface InterviewSchedule {
  id: string
  name: string
  startDate: string
  endDate: string
  slots: InterviewSlot[]
}

export default function InterviewSchedulesManager({ initialSchedules }: { initialSchedules: InterviewSchedule[] }) {
  const router = useRouter()
  const [schedules, _setSchedules] = useState(initialSchedules)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // New Schedule State
  const [showNewSchedule, setShowNewSchedule] = useState(false)
  const [newSchedule, setNewSchedule] = useState({ name: '', startDate: '', endDate: '' })

  // New Slot State
  const [addingSlotTo, setAddingSlotTo] = useState<string | null>(null)
  const [newSlot, setNewSlot] = useState({ date: '', startTime: '', endTime: '', capacity: 1, location: '' })

  const handleCreateSchedule = async () => {
    try {
      const res = await fetch('/api/staff/admissions/interviews/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSchedule.name,
          startDate: new Date(newSchedule.startDate).toISOString(),
          endDate: new Date(newSchedule.endDate).toISOString(),
        })
      })
      if (res.ok) {
        setShowNewSchedule(false)
        setNewSchedule({ name: '', startDate: '', endDate: '' })
        router.refresh()
      } else {
        alert('Failed to create schedule')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreateSlot = async (scheduleId: string) => {
    try {
      const startDateTime = new Date(`${newSlot.date}T${newSlot.startTime}`)
      const endDateTime = new Date(`${newSlot.date}T${newSlot.endTime}`)

      const res = await fetch(`/api/staff/admissions/interviews/schedules/${scheduleId}/slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date(newSlot.date).toISOString(),
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          capacity: Number(newSlot.capacity),
          location: newSlot.location,
        })
      })
      if (res.ok) {
        setAddingSlotTo(null)
        setNewSlot({ date: '', startTime: '', endTime: '', capacity: 1, location: '' })
        router.refresh()
      } else {
        alert('Failed to create slot')
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white">Interview Schedules</h3>
        <button
          onClick={() => setShowNewSchedule(!showNewSchedule)}
          className="flex items-center gap-2 rounded-lg bg-aerojet-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-aerojet-blue/90"
        >
          <Plus className="h-4 w-4" />
          New Schedule
        </button>
      </div>

      {showNewSchedule && (
        <div className="border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Schedule Name</label>
              <input
                type="text"
                className="w-48 rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                placeholder="e.g., Spring 2027 Interviews"
                value={newSchedule.name}
                onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Start Date</label>
              <input
                type="date"
                className="w-40 rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={newSchedule.startDate}
                onChange={(e) => setNewSchedule({ ...newSchedule, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">End Date</label>
              <input
                type="date"
                className="w-40 rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={newSchedule.endDate}
                onChange={(e) => setNewSchedule({ ...newSchedule, endDate: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateSchedule}
                className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={() => setShowNewSchedule(false)}
                className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {schedules.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No schedules defined yet.</div>
        ) : (
          schedules.map((schedule) => (
            <div key={schedule.id} className="group">
              <div
                className="flex cursor-pointer items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                onClick={() => setExpandedId(expandedId === schedule.id ? null : schedule.id)}
              >
                <div className="flex items-center gap-4">
                  {expandedId === schedule.id ? (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{schedule.name}</h4>
                    <p className="text-xs text-slate-500">
                      {format(new Date(schedule.startDate), 'MMM d, yyyy')} - {format(new Date(schedule.endDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {schedule.slots.length} Slots defined
                </div>
              </div>

              {expandedId === schedule.id && (
                <div className="bg-slate-50 p-4 dark:bg-slate-800/30">
                  <div className="mb-4 flex items-center justify-between">
                    <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300">Time Slots</h5>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setAddingSlotTo(addingSlotTo === schedule.id + '-bulk' ? null : schedule.id + '-bulk')}
                        className="flex items-center gap-1 text-xs font-medium text-aerojet-blue hover:underline"
                      >
                        <Calendar className="h-3 w-3" /> Bulk Generate
                      </button>
                      <button
                        onClick={() => setAddingSlotTo(addingSlotTo === schedule.id ? null : schedule.id)}
                        className="flex items-center gap-1 text-xs font-medium text-aerojet-blue hover:underline"
                      >
                        <Plus className="h-3 w-3" /> Add Single Slot
                      </button>
                    </div>
                  </div>

                  {addingSlotTo === schedule.id + '-bulk' && (
                    <div className="mb-4 rounded-lg border border-aerojet-blue/30 bg-aerojet-blue/5 p-4 dark:border-aerojet-sky/30 dark:bg-aerojet-sky/5">
                      <h6 className="mb-3 text-xs font-bold text-aerojet-blue dark:text-aerojet-sky">Bulk Generate Slots</h6>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-slate-500 uppercase">Start Date</label>
                          <input type="date" className="w-full rounded border px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900" 
                            id={`bulk-start-${schedule.id}`} defaultValue={format(new Date(schedule.startDate), 'yyyy-MM-dd')} />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-slate-500 uppercase">End Date</label>
                          <input type="date" className="w-full rounded border px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900" 
                            id={`bulk-end-${schedule.id}`} defaultValue={format(new Date(schedule.endDate), 'yyyy-MM-dd')} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-[10px] font-medium text-slate-500 uppercase">Days of Week (0=Sun, 6=Sat)</label>
                          <input type="text" className="w-full rounded border px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900" 
                            id={`bulk-days-${schedule.id}`} defaultValue="1,2,3,4,5" placeholder="e.g. 1,2,3,4,5" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-slate-500 uppercase">Time Block 1 Start</label>
                          <input type="time" className="w-full rounded border px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900" 
                            id={`bulk-t1-start-${schedule.id}`} defaultValue="09:00" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-slate-500 uppercase">Time Block 1 End</label>
                          <input type="time" className="w-full rounded border px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900" 
                            id={`bulk-t1-end-${schedule.id}`} defaultValue="10:00" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-slate-500 uppercase">Capacity per Slot</label>
                          <input type="number" className="w-full rounded border px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900" 
                            id={`bulk-capacity-${schedule.id}`} defaultValue="1" min="1" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-slate-500 uppercase">Location</label>
                          <input type="text" className="w-full rounded border px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900" 
                            id={`bulk-location-${schedule.id}`} placeholder="e.g. Zoom" />
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={async () => {
                            const start = (document.getElementById(`bulk-start-${schedule.id}`) as HTMLInputElement).value
                            const end = (document.getElementById(`bulk-end-${schedule.id}`) as HTMLInputElement).value
                            const days = (document.getElementById(`bulk-days-${schedule.id}`) as HTMLInputElement).value.split(',').map(d => parseInt(d.trim(), 10))
                            const t1s = (document.getElementById(`bulk-t1-start-${schedule.id}`) as HTMLInputElement).value
                            const t1e = (document.getElementById(`bulk-t1-end-${schedule.id}`) as HTMLInputElement).value
                            const cap = parseInt((document.getElementById(`bulk-capacity-${schedule.id}`) as HTMLInputElement).value, 10)
                            const loc = (document.getElementById(`bulk-location-${schedule.id}`) as HTMLInputElement).value

                            try {
                              const res = await fetch(`/api/staff/admissions/interviews/schedules/${schedule.id}/slots/generate`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  dateStart: new Date(start).toISOString(),
                                  dateEnd: new Date(end).toISOString(),
                                  daysOfWeek: days,
                                  timeBlocks: [{ start: t1s, end: t1e, capacity: cap, location: loc }]
                                })
                              })
                              if (res.ok) {
                                setAddingSlotTo(null)
                                router.refresh()
                              } else {
                                alert('Failed to bulk generate slots')
                              }
                            } catch (e) {
                              console.error(e)
                            }
                          }}
                          className="rounded bg-aerojet-blue px-4 py-1.5 text-sm font-medium text-white hover:bg-aerojet-blue/90"
                        >
                          Generate Slots
                        </button>
                        <button
                          onClick={() => setAddingSlotTo(null)}
                          className="rounded border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {addingSlotTo === schedule.id && (
                    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-slate-500 uppercase">Date</label>
                        <input
                          type="date"
                          className="w-32 rounded border px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
                          value={newSlot.date}
                          onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-slate-500 uppercase">Start Time</label>
                        <input
                          type="time"
                          className="w-24 rounded border px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
                          value={newSlot.startTime}
                          onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-slate-500 uppercase">End Time</label>
                        <input
                          type="time"
                          className="w-24 rounded border px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
                          value={newSlot.endTime}
                          onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-slate-500 uppercase">Capacity</label>
                        <input
                          type="number"
                          min="1"
                          className="w-16 rounded border px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
                          value={newSlot.capacity}
                          onChange={(e) => setNewSlot({ ...newSlot, capacity: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-slate-500 uppercase">Location/Link</label>
                        <input
                          type="text"
                          className="w-40 rounded border px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
                          placeholder="Room 101 or Zoom link"
                          value={newSlot.location}
                          onChange={(e) => setNewSlot({ ...newSlot, location: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCreateSlot(schedule.id)}
                          className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setAddingSlotTo(null)}
                          className="rounded border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {schedule.slots.length === 0 ? (
                    <div className="text-sm text-slate-500">No slots defined for this schedule.</div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {schedule.slots.map((slot) => (
                        <div key={slot.id} className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-700 dark:bg-slate-900">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {format(new Date(slot.date), 'MMM d, yyyy')}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {format(new Date(slot.startTime), 'h:mm a')} - {format(new Date(slot.endTime), 'h:mm a')}
                          </div>
                          {slot.location && (
                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              <span className="truncate">{slot.location}</span>
                            </div>
                          )}
                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                              <Users className="h-3.5 w-3.5" />
                              {slot.bookedCount} / {slot.capacity} Booked
                            </div>
                            <span className={`text-[10px] font-bold uppercase ${slot.bookedCount >= slot.capacity ? 'text-red-500' : 'text-green-500'}`}>
                              {slot.bookedCount >= slot.capacity ? 'Full' : 'Available'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
