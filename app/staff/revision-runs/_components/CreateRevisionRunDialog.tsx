'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2 } from 'lucide-react'
import { createTuitionRun } from '../../scheduling/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function CreateRevisionRunDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const capacity = parseInt(formData.get('capacity') as string)
    const minClassSize = parseInt(formData.get('minClassSize') as string)

    if (isNaN(capacity) || capacity < 1) {
      toast.error('Invalid Capacity', { description: 'Capacity must be a positive number' })
      setLoading(false)
      return
    }
    if (isNaN(minClassSize) || minClassSize < 1) {
      toast.error('Invalid Minimum', {
        description: 'Minimum class size must be a positive number',
      })
      setLoading(false)
      return
    }
    if (minClassSize > capacity) {
      toast.error('Invalid Configuration', {
        description: 'Minimum class size cannot exceed maximum capacity',
      })
      setLoading(false)
      return
    }

    const data = {
      title: formData.get('title') as string,
      moduleTag: formData.get('moduleTag') as string,
      description: formData.get('description') as string,
      startDatetime: new Date(formData.get('startDatetime') as string),
      endDatetime: new Date(formData.get('endDatetime') as string),
      capacity,
      minClassSize,
      price: parseFloat(formData.get('price') as string),
    }

    try {
      const res = await createTuitionRun(data)
      if ('success' in res && res.success) {
        toast.success('Revision run created successfully')
        setOpen(false)
        router.refresh()
      } else {
        toast.error('error' in res ? res.error : 'Failed to create revision run')
      }
    } catch (_error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-aerojet-blue hover:bg-aerojet-blue/90 rounded-xl font-bold text-white">
          <Plus className="mr-2 h-4 w-4" />
          Schedule Revision
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="text-aerojet-blue text-2xl font-black uppercase">
            Schedule Revision Run
          </DialogTitle>
          <DialogDescription>
            Create a new paid revision support class for students.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Module 1 Mathematics Intensive Revision"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="moduleTag">Module Code (Tag)</Label>
              <Input id="moduleTag" name="moduleTag" placeholder="e.g. M1" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price (€)</Label>
              <Input id="price" name="price" type="number" step="0.01" defaultValue="50" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDatetime">Start Date & Time</Label>
              <Input id="startDatetime" name="startDatetime" type="datetime-local" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDatetime">End Date & Time</Label>
              <Input id="endDatetime" name="endDatetime" type="datetime-local" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="capacity">Max Capacity</Label>
              <Input id="capacity" name="capacity" type="number" defaultValue="20" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="minClassSize">Min Students (to run)</Label>
              <Input
                id="minClassSize"
                name="minClassSize"
                type="number"
                defaultValue="5"
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Details about the revision session..."
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-aerojet-blue text-white">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Revision Run
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
