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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Edit2, Trash2, Loader2 } from 'lucide-react'
import { updateTuitionRun, deleteTuitionRun } from '../../scheduling/actions'
import type { TuitionRunStatus } from '@prisma/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface EditRevisionRunDialogProps {
  run: {
    id: string
    title: string
    moduleTag: string | null
    description: string | null
    startDatetime: Date
    endDatetime: Date
    capacity: number
    minClassSize: number
    price: number
    status: string
  }
}

export default function EditRevisionRunDialog({ run }: EditRevisionRunDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const formatDateForInput = (date: Date) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

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
      status: formData.get('status') as TuitionRunStatus,
    }

    try {
      const res = await updateTuitionRun(run.id, data)
      if ('success' in res && res.success) {
        toast.success('Revision run updated successfully')
        setOpen(false)
        router.refresh()
      } else {
        toast.error('error' in res ? res.error : 'Failed to update revision run')
      }
    } catch (_error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this revision run? This will delete all student bookings for this session.'
      )
    ) {
      return
    }
    setDeleting(true)
    try {
      const res = await deleteTuitionRun(run.id)
      if ('success' in res && res.success) {
        toast.success('Revision run deleted successfully')
        setOpen(false)
        router.refresh()
      } else {
        toast.error('error' in res ? res.error : 'Failed to delete revision run')
      }
    } catch (_error) {
      toast.error('An unexpected error occurred')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="text-aerojet-blue text-2xl font-black uppercase">
            Edit Revision Run
          </DialogTitle>
          <DialogDescription>Update session details or cancel this revision run.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={run.title}
              placeholder="e.g. Module 1 Mathematics"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="moduleTag">Module Code (Tag)</Label>
              <Input
                id="moduleTag"
                name="moduleTag"
                defaultValue={run.moduleTag || ''}
                placeholder="e.g. M1"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price (€)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                defaultValue={Number(run.price)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDatetime">Start Date & Time</Label>
              <Input
                id="startDatetime"
                name="startDatetime"
                type="datetime-local"
                defaultValue={formatDateForInput(run.startDatetime)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDatetime">End Date & Time</Label>
              <Input
                id="endDatetime"
                name="endDatetime"
                type="datetime-local"
                defaultValue={formatDateForInput(run.endDatetime)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="capacity">Max Capacity</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                defaultValue={run.capacity}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="minClassSize">Min Size</Label>
              <Input
                id="minClassSize"
                name="minClassSize"
                type="number"
                defaultValue={run.minClassSize}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={run.status}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEDULED">SCHEDULED</SelectItem>
                  <SelectItem value="OPEN">OPEN</SelectItem>
                  <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={run.description || ''}
              placeholder="Details about the revision session..."
            />
          </div>

          <DialogFooter className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="w-full sm:w-auto"
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
            <div className="flex w-full gap-2 sm:w-auto sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-aerojet-blue w-full text-white sm:w-auto"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
