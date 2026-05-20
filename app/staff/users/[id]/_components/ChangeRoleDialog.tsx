'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, Loader2, ChevronRight, AlertTriangle, CheckCircle2, Mail, Database } from 'lucide-react'
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

interface ChangeRoleDialogProps {
  userId: string
  currentRole: string
  userName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PreviewSideEffect {
  kind: string
  description: string
}

interface PreviewResponse {
  currentRole: string
  newRole: string
  userEmail: string
  userName: string
  sideEffects: PreviewSideEffect[]
  sendsEmail: boolean
  warnings: string[]
}

type Step = 'select' | 'preview' | 'confirm'

const SIDE_EFFECT_ICON: Record<string, React.ComponentType<any>> = {
  CREATE_INSTRUCTOR_PROFILE: Database,
  CREATE_STAFF_PROFILE: Database,
  CREATE_STUDENT_PROFILE: Database,
  CREATE_WALLET: Database,
  SEND_EMAIL: Mail,
  AUDIT_LOG: CheckCircle2,
}

export default function ChangeRoleDialog({
  userId,
  currentRole,
  userName,
  open,
  onOpenChange,
}: ChangeRoleDialogProps) {
  const [step, setStep] = useState<Step>('select')
  const [loading, setLoading] = useState(false)
  const [newRole, setNewRole] = useState(currentRole)
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [confirmName, setConfirmName] = useState('')
  const router = useRouter()

  const reset = () => {
    setStep('select')
    setPreview(null)
    setConfirmName('')
    setNewRole(currentRole)
  }

  const close = () => {
    onOpenChange(false)
    // Reset after dialog close animation
    setTimeout(reset, 300)
  }

  const onLoadPreview = async () => {
    if (newRole === currentRole) {
      toast.info('Role unchanged.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/users/${userId}/role/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Preview failed')
      setPreview(json.data ?? json)
      setStep('preview')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const onCommit = async () => {
    if (confirmName.trim() !== userName.trim()) {
      toast.error('Typed name must match exactly to confirm.')
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
      close()
      router.refresh()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription className="sr-only">3-step wizard: select role, preview side effects, confirm.</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 text-xs font-bold">
          {(['select', 'preview', 'confirm'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${step === s ? 'bg-aerojet-blue text-white' : ['select', 'preview', 'confirm'].indexOf(step) > i ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{i + 1}</span>
              <span className={step === s ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}>{s[0].toUpperCase() + s.slice(1)}</span>
              {i < 2 && <ChevronRight className="h-3 w-3 text-slate-300" />}
            </div>
          ))}
        </div>

        {step === 'select' && (
          <div className="grid gap-6 py-4">
            <div className="flex items-center gap-4 rounded-xl bg-amber-50 p-4 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <div className="text-xs font-medium">
                Pick the target role for <strong>{userName}</strong>. Next step shows exactly what will change.
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">New Role</Label>
              <Select value={newRole} onValueChange={setNewRole} name="role" autoComplete="off">
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="APPLICANT">Applicant</SelectItem>
                  <SelectItem value="EXAMINER">Examiner</SelectItem>
                  <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 'preview' && preview && (
          <div className="grid gap-3 py-4">
            <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/40">
              <p className="font-bold text-slate-700 dark:text-slate-200">{preview.currentRole} → {preview.newRole}</p>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">Side effects ({preview.sideEffects.length})</p>
              <ul className="space-y-1.5">
                {preview.sideEffects.map((s, i) => {
                  const Icon = SIDE_EFFECT_ICON[s.kind] ?? Database
                  return (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-aerojet-blue" />
                      <span className="text-slate-700 dark:text-slate-300">{s.description}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
            {preview.warnings.length > 0 && (
              <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                <p className="mb-1 flex items-center gap-1 font-bold"><AlertTriangle className="h-3 w-3" /> Warnings</p>
                <ul className="ml-4 list-disc space-y-0.5">
                  {preview.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {step === 'confirm' && (
          <div className="grid gap-3 py-4">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              Type the user's name <strong>exactly</strong> to commit the role change:
            </p>
            <code className="rounded bg-slate-100 px-2 py-1 text-sm dark:bg-slate-800">{userName}</code>
            <input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder="Type the name here"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
            <a href="/docs/html/role-transitions.html" target="_blank" className="text-xs text-aerojet-blue hover:underline">What does this change exactly?</a>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={loading}>Cancel</Button>
          {step === 'select' && (
            <Button onClick={onLoadPreview} disabled={loading || newRole === currentRole} className="bg-aerojet-blue">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Preview changes
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('select')}>Back</Button>
              <Button onClick={() => setStep('confirm')} className="bg-aerojet-blue">Continue</Button>
            </>
          )}
          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => setStep('preview')}>Back</Button>
              <Button onClick={onCommit} disabled={loading || confirmName.trim() !== userName.trim()} className="bg-red-600 hover:bg-red-700">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Commit role change
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
