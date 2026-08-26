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

export default function UserJourneyTimeline({ events }: UserJourneyTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                {i < events.length - 1 && <div className="w-px h-12 bg-slate-200 mt-1" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{event.event}</Badge>
                  <span className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  {Object.entries(event.payload)
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <span key={key} className="mr-3">
                        {key}: {String(value)}
                      </span>
                    ))}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
