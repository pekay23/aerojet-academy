'use client'
import { formatDate } from '@/lib/utils/formatters'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserCheck, X, Mail, Calendar, Clock } from 'lucide-react'
import { toast } from 'sonner'
import UserJourneyTimeline from './UserJourneyTimeline'
import UserSearchInput from './UserSearchInput'
import Image from 'next/image'

interface UserProfile {
  id: string
  email: string
  role: string
  createdAt: string
  lastSeenAt: string | null
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  studentId: string | null
}

interface JourneyData {
  user: UserProfile
  events: Array<{
    event: string
    entity: string
    timestamp: string
    payload: Record<string, unknown>
  }>
}

export default function UserJourney() {
  const [userId, setUserId] = useState('')
  const [data, setData] = useState<JourneyData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadJourney = async (id: string) => {
    if (!id.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/staff/analytics/journey/${encodeURIComponent(id)}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      } else if (res.status === 404) {
        setError('User not found. Please check the user ID.')
        setData(null)
      } else {
        setError(json.error || 'Failed to load journey')
        setData(null)
      }
    } catch (_err) {
      toast.error('Failed to load user journey')
      setError('Network error. Please try again.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (id: string) => {
    setUserId(id)
    setError(null)
    setData(null)
    loadJourney(id)
  }

  const handleClear = () => {
    setUserId('')
    setData(null)
    setError(null)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="text-aerojet-sky h-5 w-5" />
            User Journey
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track a specific user&apos;s event timeline across the platform
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <UserSearchInput
              onSelect={handleSelect}
              onTrack={() => loadJourney(userId)}
              loading={loading}
              disabled={!userId.trim()}
            />
            {userId && (
              <Button
                onClick={handleClear}
                variant="outline"
                size="icon"
                className="rounded-xl border-slate-200 dark:border-slate-700"
                title="Clear selection"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-900/10 dark:text-red-400">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {data && (
        <div className="space-y-4">
          <UserProfileCard user={data.user} />
          <UserJourneyTimeline events={data.events} />
        </div>
      )}
    </div>
  )
}

function UserProfileCard({ user }: { user: UserProfile }) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unknown User'
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="from-aerojet-blue/10 to-aerojet-sky/10 dark:from-aerojet-blue/20 dark:to-aerojet-sky/20 flex h-24 w-full items-center justify-center bg-gradient-to-br sm:h-auto sm:w-24">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={fullName}
                width={80}
                height={80}
                className="h-20 w-20 rounded-full object-cover ring-4 ring-white dark:ring-slate-900"
              />
            ) : (
              <div className="bg-aerojet-blue flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black text-white ring-4 ring-white dark:ring-slate-900">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{fullName}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </span>
                  {user.studentId && (
                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-mono dark:bg-slate-800">
                      ID: {user.studentId}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-aerojet-blue/10 text-aerojet-blue dark:bg-aerojet-blue/20 rounded-full px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                  {user.role}
                </span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-3 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
              {user.lastSeenAt && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Active {formatDate(user.lastSeenAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
