'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FeatureChart } from './FeatureChart'

const DEFAULT_FEATURES = [
  'registration',
  'payment',
  'enrollment',
  'exam_booking',
  'wallet_topup',
  'messages',
  'attendance',
  'transcript',
]

export default function FeatureAdoption() {
  const [features, setFeatures] = useState<string[]>(DEFAULT_FEATURES)
  const [selectedFeature, setSelectedFeature] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadFeature = async (feature: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/analytics/features?feature=${encodeURIComponent(feature)}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (err) {
      console.error('Failed to load feature adoption:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedFeature) {
      loadFeature(selectedFeature)
    }
  }, [selectedFeature])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Feature Adoption</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <Button
                key={feature}
                variant={selectedFeature === feature ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFeature(feature)}
              >
                {feature.replace(/_/g, ' ')}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {data && <FeatureChart data={data} />}
    </div>
  )
}
