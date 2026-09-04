'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface Slot {
  id: string
  date: string
  startTime: string
  endTime: string
  location: string | null
}

export default function SlotBooking({ currentSlot }: { currentSlot: Slot | null }) {
  const router = useRouter()
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/applicant/interview/slots')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setSlots(data.data.availableSlots)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleBook = async (slotId: string) => {
    if (!confirm('Are you sure you want to book this slot?')) return

    setBooking(slotId)
    setError(null)
    
    try {
      const res = await fetch('/api/applicant/interview/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId })
      })

      if (res.ok) {
        router.push('/applicant/application/status')
        router.refresh()
      } else {
        const err = await res.json()
        setError(err.error || 'Failed to book slot')
      }
    } catch (_e) {
      setError('An unexpected error occurred')
    } finally {
      setBooking(null)
    }
  }

  if (loading) {
    return <div className="animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800 h-64 w-full" />
  }

  return (
    <div className="space-y-6">
      {currentSlot && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-900/50 dark:bg-green-900/20">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="mt-1 h-6 w-6 text-green-600 dark:text-green-400" />
            <div>
              <h2 className="text-lg font-bold text-green-900 dark:text-green-300">Your Interview is Confirmed</h2>
              <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                You are currently scheduled for the following time slot. If you need to reschedule, please select a new slot below. Note that frequent rescheduling may negatively impact your application.
              </p>
              
              <div className="mt-4 flex flex-wrap gap-6 rounded-xl bg-white/60 p-4 dark:bg-slate-900/40">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                  <Calendar className="h-5 w-5 text-aerojet-blue" />
                  {format(new Date(currentSlot.date), 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                  <Clock className="h-5 w-5 text-aerojet-blue" />
                  {format(new Date(currentSlot.startTime), 'h:mm a')} - {format(new Date(currentSlot.endTime), 'h:mm a')}
                </div>
                {currentSlot.location && (
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                    <MapPin className="h-5 w-5 text-aerojet-blue" />
                    {currentSlot.location}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          {currentSlot ? 'Available Alternative Slots' : 'Available Slots'}
        </h2>
        
        {slots.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-slate-500">No interview slots are currently available. Please check back later or contact admissions.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {slots.map((slot) => {
              const isCurrent = currentSlot?.id === slot.id
              return (
                <div 
                  key={slot.id} 
                  className={`flex flex-col justify-between rounded-xl border p-5 shadow-xs transition-shadow hover:shadow-md ${
                    isCurrent 
                      ? 'border-green-500 bg-green-50/50 dark:border-green-500/50 dark:bg-green-900/10' 
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <Calendar className="h-4 w-4 text-aerojet-blue" />
                      {format(new Date(slot.date), 'MMM d, yyyy')}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Clock className="h-4 w-4" />
                      {format(new Date(slot.startTime), 'h:mm a')} - {format(new Date(slot.endTime), 'h:mm a')}
                    </div>
                    {slot.location && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{slot.location}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    {isCurrent ? (
                      <button disabled className="w-full rounded-lg bg-green-100 py-2.5 text-sm font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Current Booking
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBook(slot.id)}
                        disabled={!!booking}
                        className="w-full rounded-lg bg-aerojet-blue py-2.5 text-sm font-bold text-white transition-colors hover:bg-aerojet-blue/90 disabled:opacity-50"
                      >
                        {booking === slot.id ? 'Booking...' : currentSlot ? 'Reschedule to this Slot' : 'Book this Slot'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
