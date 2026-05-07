'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BatchEnrollmentFormProps {
  classId: string
  cohorts: { id: string; name: string }[]
  currentOccupancy: number
  maxCapacity: number
}

export default function BatchEnrollmentForm({ classId, cohorts, currentOccupancy, maxCapacity }: BatchEnrollmentFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState<string>('')

  async function handleBatchEnroll() {
    if (!selectedCohort) {
      toast.error('Error', { description: 'Please select a cohort' })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/staff/classes/${classId}/batch-enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohortId: selectedCohort }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to enroll cohort')
      }

      const data = await response.json()
      toast.success('Batch Enrolled', { 
        description: `Successfully added ${data.addedCount} students to the class.` 
      })
      router.refresh()
    } catch (error: any) {
      toast.error('Enrollment Failed', { description: error.message })
    } finally {
      setIsLoading(false)
      setSelectedCohort('')
    }
  }

  const spacesLeft = maxCapacity - currentOccupancy

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
          Select Cohort (Academic Year)
        </label>
        <Select value={selectedCohort} onValueChange={setSelectedCohort} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Select a cohort" />
          </SelectTrigger>
          <SelectContent>
            {cohorts.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
        <p className="font-bold">Available Seats: {spacesLeft}</p>
        <p className="mt-1 opacity-80">Batch enrollment will fail if the cohort size exceeds available seats.</p>
      </div>

      <Button 
        onClick={handleBatchEnroll} 
        disabled={isLoading || !selectedCohort || spacesLeft <= 0}
        className="w-full bg-aerojet-blue hover:bg-aerojet-blue/90"
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Enroll Entire Batch
      </Button>
    </div>
  )
}
