'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserRole } from '@prisma/client'

interface ChangeRoleDialogProps {
  userId: string
  currentRole: string
  userName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ChangeRoleDialog({
  userId,
  currentRole,
  userName,
  open,
  onOpenChange,
}: ChangeRoleDialogProps) {
  const [loading, setLoading] = useState(false)
  const [newRole, setNewRole] = useState(currentRole)
  const router = useRouter()

  const handleUpdate = async () => {
    if (newRole === currentRole) {
      onOpenChange(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/staff/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update role')
      }

      toast.success(`Role updated to ${newRole} for ${userName}`)
      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription className="sr-only">
            Select a new administrative or student role for this user.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex items-center gap-4 rounded-xl bg-amber-50 p-4 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <div className="text-xs font-medium">
              Changing the role for <strong>{userName}</strong> will grant them new permissions and
              may affect their access to specific portal features.
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">New Role</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="APPLICANT">Applicant</SelectItem>
                <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={loading} className="bg-aerojet-blue">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
