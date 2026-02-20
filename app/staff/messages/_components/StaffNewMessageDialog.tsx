'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { sendStaffMessage } from '../../actions'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface Recipient {
  id: string
  label: string
  role: string
  email: string
  avatarUrl?: string | null
}

interface StaffNewMessageDialogProps {
  recipients: Recipient[]
}

const ROLE_ORDER = ['ADMIN', 'STAFF', 'INSTRUCTOR', 'STUDENT', 'APPLICANT']
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrators',
  STAFF: 'Staff',
  INSTRUCTOR: 'Instructors',
  STUDENT: 'Students',
  APPLICANT: 'Applicants',
}

export default function StaffNewMessageDialog({ recipients }: StaffNewMessageDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    recipientId: '',
    subject: '',
    body: '',
  })
  const router = useRouter()

  // Group recipients by role
  const grouped = useMemo(() => {
    const map: Record<string, Recipient[]> = {}
    for (const r of recipients) {
      if (!map[r.role]) map[r.role] = []
      map[r.role].push(r)
    }
    return map
  }, [recipients])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await sendStaffMessage(formData.recipientId, formData.subject, formData.body)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Message sent successfully')
      setOpen(false)
      setFormData({ recipientId: '', subject: '', body: '' })
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-red-600 text-white shadow-lg shadow-red-900/20 hover:bg-red-700">
          <Send className="h-4 w-4" />
          <span>New Message</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription>
            Send a message to any student, instructor, or staff member.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Recipient */}
          <div className="space-y-2">
            <Label htmlFor="recipient">To</Label>
            <Select
              value={formData.recipientId}
              onValueChange={(value) => setFormData({ ...formData, recipientId: value })}
            >
              <SelectTrigger id="recipient">
                <SelectValue placeholder="Select recipient..." />
              </SelectTrigger>
              <SelectContent>
                {recipients.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No recipients available
                  </div>
                ) : (
                  ROLE_ORDER.filter((role) => grouped[role]?.length > 0).map((role) => (
                    <SelectGroup key={role}>
                      <SelectLabel>{ROLE_LABELS[role] ?? role}</SelectLabel>
                      {grouped[role].map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g. Exam Schedule Update"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Type your message here..."
              className="min-h-[150px]"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.recipientId}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Message
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
