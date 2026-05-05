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

interface EditStaffProfileDialogProps {
  userId: string
  initialData: {
    department?: string | null
    position?: string | null
  }
}

export default function EditStaffProfileDialog({
  userId,
  initialData,
}: EditStaffProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    department: initialData.department || '',
    position: initialData.position || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        throw new Error(data.error || 'Failed to update staff profile')
      }

      toast.success('Staff details updated')
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
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit Staff Details</DialogTitle>
          <DialogDescription className="sr-only">
            Update the staff member's department and position.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              name="department"
              placeholder="e.g. Administration, Finance, IT"
              value={formData.department}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              name="position"
              placeholder="e.g. Registrar, Accountant, SysAdmin"
              value={formData.position}
              onChange={handleChange}
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
