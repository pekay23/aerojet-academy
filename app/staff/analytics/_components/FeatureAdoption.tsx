'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GitBranch } from 'lucide-react'
import FeatureChart from './FeatureChart'
import type { FeatureAdoption } from '@/lib/analytics/queries'

const DEFAULT_FEATURES = [
  { key: 'registration', label: 'Registration' },
  { key: 'payment', label: 'Payment' },
  { key: 'enrollment', label: 'Enrollment' },
  { key: 'exam_booking', label: 'Exam Booking' },
  { key: 'wallet_topup', label: 'Wallet Top-up' },
  { key: 'messages', label: 'Messages' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'transcript', label: 'Transcript' },
]

export default function FeatureAdoption() {
  const [features] = useState(DEFAULT_FEATURES)
  const [selectedFeature, setSelectedFeature] = useState('')
  const [data, setData] = useState<FeatureAdoption | null>(null)
  const [loading, setLoading] = useState(false)

  const loadFeature = async (feature: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/analytics/features?feature=${encodeURIComponent(feature)}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (_err) {
      toast.error('Failed to load feature adoption')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedFeature) {
   
  // eslint-disable-next-line react-hooks/set-state-in-effect
      loadFeature(selectedFeature)
    }
  }, [selectedFeature])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-aerojet-sky" />
            Feature Adoption
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select a feature to see adoption metrics
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <Button
                key={feature.key}
                variant={selectedFeature === feature.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFeature(feature.key)}
                className="rounded-lg font-bold"
              >
                {feature.label}
              </Button>
            ))}
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-aerojet-blue border-t-transparent" />
              Loading metrics...
            </div>
          )}
        </CardContent>
      </Card>

      {data && !loading && <FeatureChart data={data} />}
    </div>
  )
}
