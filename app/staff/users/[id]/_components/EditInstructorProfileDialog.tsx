'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface EditInstructorProfileDialogProps {
  userId: string
  initialData: {
    specialization?: string | null
    qualifications?: string | null
    department?: string | null
  }
}

export default function EditInstructorProfileDialog({
  userId,
  initialData,
}: EditInstructorProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    specialization: initialData.specialization || '',
    qualifications: initialData.qualifications || '',
    department: initialData.department || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update instructor profile')
      }

      toast.success('Instructor details updated')
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-slate-400 hover:text-blue-600"
        >
          <Pencil className="mr-1 h-3 w-3" /> Edit Details
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Instructor Details</DialogTitle>
          <DialogDescription className="sr-only">
            Update the instructor's specialization, qualifications, and department.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              name="department"
              placeholder="e.g. Mechanical, Avionics, General Studies"
              value={formData.department}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="specialization">Specializations</Label>
            <Input
              id="specialization"
              name="specialization"
              placeholder="e.g. B1.1, B2, Engines, Avionics"
              value={formData.specialization}
              onChange={handleChange}
            />
            <p className="text-xs text-slate-400">Comma separated list of expertise</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="qualifications">Qualifications</Label>
            <Textarea
              id="qualifications"
              name="qualifications"
              placeholder="List certifications, degrees, etc."
              value={formData.qualifications}
              onChange={handleChange}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
