'use client'

import { useState } from 'react'
import { useFormDirty } from '@/hooks/useFormDirty'
import { useRouter } from 'next/navigation'
import { Send, Loader2 } from 'lucide-react' // Changed MailPlus to Plus as MailPlus might not be in older lucide versions
import { toast } from 'sonner'
import { sendMessage } from '../../actions'

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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface Recipient {
  id: string
  label: string
  role: string
  avatarUrl?: string | null
}

interface NewMessageDialogProps {
  recipients: Recipient[]
  defaultSubject?: string
  defaultOpen?: boolean
}

export default function NewMessageDialog({
  recipients,
  defaultSubject = '',
  defaultOpen = false,
}: NewMessageDialogProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    recipientId: '',
    subject: defaultSubject,
    body: '',
  })
  const router = useRouter()

  const { markDirty, markClean } = useFormDirty()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await sendMessage(formData.recipientId, formData.subject, formData.body)

      if (!res || res.error) {
        toast.error(res?.error ?? 'Failed to send message')
        return
      }

      toast.success('Message sent successfully')
      markClean()
      setOpen(false)
      setFormData({ recipientId: '', subject: '', body: '' })
      router.refresh()
    } catch (error) {
      console.error('Send message error:', error)
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-700">
          <Send className="h-4 w-4" />
          <span>New Message</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription>
            Send a message to an administrator or your course instructors.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">To</Label>
            <Select
              value={formData.recipientId}
              onValueChange={(value) => {
                setFormData({ ...formData, recipientId: value })
                markDirty()
              }}
            >
              <SelectTrigger id="recipient">
                <SelectValue placeholder="Select recipient..." />
              </SelectTrigger>
              <SelectContent>
                {recipients.length === 0 ? (
                  <div className="text-muted-foreground p-2 text-center text-sm">
                    No recipients available
                  </div>
                ) : (
                  recipients.map((recipient) => (
                    <SelectItem key={recipient.id} value={recipient.id}>
                      <span className="flex items-center gap-2">
                        {/* Avatar could go here if SelectItem supports rich content properly */}
                        <span>{recipient.label}</span>
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g. Question about Exam Schedule"
              value={formData.subject}
              onChange={(e) => {
                setFormData({ ...formData, subject: e.target.value })
                markDirty()
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Type your message here..."
              className="min-h-37.5"
              value={formData.body}
              onChange={(e) => {
                setFormData({ ...formData, body: e.target.value })
                markDirty()
              }}
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
