'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserJourneyTimeline } from './UserJourneyTimeline'

export default function UserJourney() {
  const [userId, setUserId] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadJourney = async () => {
    if (!userId.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/analytics/journey/${encodeURIComponent(userId)}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (err) {
      console.error('Failed to load user journey:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Journey</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
              className="flex-1"
            />
            <Button onClick={loadJourney} disabled={loading}>
              {loading ? 'Loading...' : 'Track'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && <UserJourneyTimeline events={data.events} />}
    </div>
  )
}
