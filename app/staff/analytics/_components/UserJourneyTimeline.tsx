'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface UserJourneyTimelineProps {
  events: Array<{
    event: string
    entity: string
    timestamp: string
    payload: Record<string, any>
  }>
}

const EVENT_COLORS: Record<string, string> = {
  PAGE_VIEW: 'bg-blue-500',
  REGISTRATION_COMPLETED: 'bg-emerald-500',
  LOGIN: 'bg-indigo-500',
  LOGOUT: 'bg-slate-400',
  ENROLLMENT_CREATED: 'bg-purple-500',
  ENROLLMENT_CANCELLED: 'bg-red-400',
  PAYMENT_INITIATED: 'bg-amber-500',
  PAYMENT_APPROVED: 'bg-emerald-500',
  PAYMENT_REJECTED: 'bg-red-500',
  EXAM_COMPLETED: 'bg-fuchsia-500',
  FEATURE_USED: 'bg-cyan-500',
  SEARCH_PERFORMED: 'bg-teal-500',
  WALLET_TOP_UP: 'bg-green-600',
  REFERRAL_SUBMITTED: 'bg-pink-500',
  DOCUMENT_UPLOADED: 'bg-orange-500',
  PASSWORD_RESET: 'bg-yellow-500',
}

export default function UserJourneyTimeline({ events }: UserJourneyTimelineProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-4 text-sm font-bold text-slate-600 dark:text-slate-300">No events tracked yet</p>
          <p className="mt-1 max-w-xs text-xs text-slate-400">
            This user hasn&apos;t generated any analytics events in the system yet. Events will appear here as the user interacts with the platform.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Event Timeline
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {events.length} {events.length === 1 ? 'event' : 'events'} tracked
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {events.map((event, i) => {
            const dotColor = EVENT_COLORS[event.event] || 'bg-slate-400'
            return (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`h-2.5 w-2.5 rounded-full ${dotColor} shadow-sm ring-2 ring-white dark:ring-slate-900`} />
                  {i < events.length - 1 && <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 mt-1" />}
                </div>
                <div className="flex-1 pb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="rounded-md font-bold text-[10px] uppercase tracking-wider">
                      {event.event.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-[11px] text-slate-400">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {Object.entries(event.payload)
                        .slice(0, 4)
                        .map(([key, value]) => (
                          <span key={key} className="mr-3 inline-block">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{key}:</span>{' '}
                            <span className="font-mono text-[11px]">{String(value)}</span>
                          </span>
                        ))}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
