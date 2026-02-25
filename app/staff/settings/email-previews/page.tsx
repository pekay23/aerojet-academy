'use client'

import { useState, useEffect } from 'react'
import {
  Mail,
  Send,
  Eye,
  UserPlus,
  UserCheck,
  GraduationCap,
  Key,
  CheckCircle,
  XCircle,
  MessageSquare,
  Edit3,
  Save,
  RotateCcw,
  PlusCircle,
  Info,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'
import RichTextEditor from '@/components/shared/RichTextEditor'
import { cn } from '@/lib/utils'

const TEMPLATES = [
  {
    id: 'registration',
    name: 'Welcome / Registration',
    icon: UserPlus,
    description: 'Sent after initial registration with payment details.',
    placeholders: ['firstName', 'registrationCode', 'currency', 'fee', 'bankName', 'uploadUrl'],
  },
  {
    id: 'activation',
    name: 'Account Activation',
    icon: UserCheck,
    description: 'Sent after applicant approval with credentials.',
    placeholders: ['firstName', 'academyEmail', 'tempPassword', 'verifyUrl'],
  },
  {
    id: 'promotion',
    name: 'Student Promotion',
    icon: GraduationCap,
    description: 'Sent when an applicant is promoted to a student.',
    placeholders: ['firstName', 'studentId', 'loginUrl'],
  },
  {
    id: 'reset-password',
    name: 'Password Reset',
    icon: Key,
    description: 'Sent when a user requests a password reset link.',
    placeholders: ['firstName', 'resetUrl'],
  },
  {
    id: 'payment-approved',
    name: 'Payment Approved',
    icon: CheckCircle,
    description: 'Confirmation for any approved payment.',
    placeholders: ['firstName', 'paymentType', 'amount'],
  },
  {
    id: 'payment-rejected',
    name: 'Payment Rejected',
    icon: XCircle,
    description: 'Notification for rejected payments with reason.',
    placeholders: ['firstName', 'paymentType', 'reason', 'loginUrl'],
  },
  {
    id: 'pool-confirmed',
    name: 'Pool Confirmed',
    icon: Mail,
    description: 'Sent when an exam pool reaches minimum candidates.',
    placeholders: ['firstName', 'poolName', 'module', 'examDate', 'amount'],
  },
  {
    id: 'contact',
    name: 'Contact Enquiry',
    icon: MessageSquare,
    description: 'Auto-reply for new contact form submissions.',
    placeholders: ['firstName', 'subject'],
  },
]

export default function EmailPreviewsPage() {
  const [activeTemplate, setActiveTemplate] = useState('registration')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [editData, setEditData] = useState({
    subject: '',
    body: '',
  })
  const [testEmail, setTestEmail] = useState('')

  // Fetch template data when editing starts
  useEffect(() => {
    if (isEditing) {
      fetchTemplate()
    }
  }, [isEditing, activeTemplate])

  const fetchTemplate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/email-templates?name=${activeTemplate}`)
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setEditData({
            subject: data.subject || '',
            body: data.body || '',
          })
        } else {
          // No custom template yet
          setEditData({ subject: '', body: '' })
        }
      }
    } catch (error) {
      console.error('Failed to fetch template:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editData.subject || !editData.body) {
      toast.error('Subject and Body are required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/staff/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: activeTemplate,
          ...editData,
        }),
      })

      if (res.ok) {
        toast.success('Template saved successfully')
        setIsEditing(false)
        // Refresh iframe (hacky but works)
        const iframe = document.querySelector('iframe')
        if (iframe) iframe.src = iframe.src
      } else {
        toast.error('Failed to save template')
      }
    } catch (error) {
      toast.error('Error saving template')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset to default? This will delete your custom layout.'))
      return

    try {
      await fetch(`/api/staff/email-templates?name=${activeTemplate}`, {
        method: 'DELETE',
      })
      toast.success('Reset to default')
      setIsEditing(false)
      const iframe = document.querySelector('iframe')
      if (iframe) iframe.src = iframe.src
    } catch (error) {
      toast.error('Failed to reset')
    }
  }

  const handleSendTest = async (sendAll = false) => {
    setSendingTest(true)
    const toastId = toast.loading(sendAll ? 'Sending all test emails...' : `Sending test email...`)

    try {
      const res = await fetch('/api/staff/email-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: sendAll ? undefined : activeTemplate,
          sendAll,
          targetEmail: testEmail || undefined,
        }),
      })

      if (res.ok) {
        toast.success(sendAll ? 'Global test suite sent!' : 'Test email sent to your inbox!', {
          id: toastId,
        })
      } else {
        toast.error('Failed to send test email', { id: toastId })
      }
    } catch (error) {
      toast.error('Error sending test email', { id: toastId })
    } finally {
      setSendingTest(false)
    }
  }

  const currentTemplate = TEMPLATES.find((t) => t.id === activeTemplate)

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#002a5c] uppercase">
            Email System Management
          </h1>
          <p className="mt-1 text-slate-500">
            Review and customize the automated email communications sent to users.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              'text-xs font-bold tracking-widest uppercase transition-all',
              isEditing ? 'border-amber-500 text-amber-500' : 'border-[#002a5c] text-[#002a5c]'
            )}
          >
            {isEditing ? (
              <>
                <Eye className="mr-2 h-4 w-4" /> Switch to Preview
              </>
            ) : (
              <>
                <Edit3 className="mr-2 h-4 w-4" /> Customize Template
              </>
            )}
          </Button>
          <Button
            disabled={sendingTest}
            onClick={() => handleSendTest(true)}
            className="bg-[#002a5c] text-xs font-bold tracking-widest uppercase shadow-lg transition-all hover:bg-[#4c9ded]"
          >
            <Send className="mr-2 h-4 w-4" />
            {sendingTest ? 'Sending...' : 'Send Global Test'}
          </Button>
        </div>
      </div>

      {/* Recipient Input Card */}
      <Card className="border-slate-200 bg-blue-50/30 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Mail className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">Test Recipient</p>
            <p className="text-xs text-slate-500">
              Specify where to send test emails. Defaults to your account email if left blank.
            </p>
          </div>
          <div className="w-full md:w-80">
            <Input
              type="email"
              placeholder="e.g. test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="bg-white"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar List */}
        <Card className="border-none border-slate-200 bg-slate-50/50 shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold tracking-wider text-slate-400 uppercase">
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-2">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => {
                  setActiveTemplate(tmpl.id)
                  setIsEditing(false)
                }}
                className={`relative flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${
                  activeTemplate === tmpl.id
                    ? 'font-bold text-[#002a5c]'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {activeTemplate === tmpl.id && (
                  <motion.div
                    layoutId="template-pill"
                    className="absolute inset-0 bg-white shadow-md"
                    style={{ borderRadius: 12, zIndex: 0 }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div
                  className={`relative z-10 rounded-lg p-2 ${
                    activeTemplate === tmpl.id ? 'bg-[#002a5c] text-white' : 'bg-slate-200'
                  }`}
                >
                  <tmpl.icon className="h-4 w-4" />
                </div>
                <span className="relative z-10 text-sm">{tmpl.name}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Work Area */}
        <div className="space-y-6 lg:col-span-3">
          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="overflow-hidden border-slate-200 shadow-none">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-white">
                    <div>
                      <CardTitle className="text-xl font-bold text-[#002a5c]">
                        {currentTemplate?.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {currentTemplate?.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px] uppercase">
                        HTML Template
                      </Badge>
                      <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex justify-center bg-slate-100 p-0">
                    <div className="my-8 w-full max-w-[640px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
                      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 p-3">
                        <div className="flex gap-1.5">
                          <div className="h-3 w-3 rounded-full bg-red-400" />
                          <div className="h-3 w-3 rounded-full bg-yellow-400" />
                          <div className="h-3 w-3 rounded-full bg-green-400" />
                        </div>
                        <div className="ml-4 flex flex-1 items-center justify-between rounded border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-400">
                          <span>
                            From: Aerojet Academy Training Academy
                            &lt;noreply@aerojet-academy.com&gt;
                          </span>
                          <Eye className="h-3 w-3" />
                        </div>
                      </div>
                      <iframe
                        src={`/api/staff/email-preview?template=${activeTemplate}`}
                        className="min-h-[600px] w-full border-none"
                        title="Email Preview"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="editor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-slate-200 shadow-xl">
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-[#002a5c]">
                          Edit Template: {currentTemplate?.name}
                        </CardTitle>
                        <CardDescription>
                          Customize the content and layout. Use placeholders like{' '}
                          <code className="rounded bg-slate-100 px-1 py-0.5">
                            {'{' + '{firstName}' + '}'}
                          </code>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleReset}
                          className="text-slate-500 hover:text-red-500"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" /> Reset to Default
                        </Button>
                        <Button
                          disabled={saving}
                          onClick={handleSave}
                          className="bg-[#16a34a] hover:bg-[#15803d]"
                        >
                          {saving ? (
                            'Saving...'
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" /> Save Template
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    {loading ? (
                      <div className="py-20 text-center text-slate-400">Loading template...</div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                            Email Subject
                          </Label>
                          <Input
                            placeholder="Enter subject line..."
                            value={editData.subject}
                            onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                            className="text-lg font-bold text-[#002a5c]"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                              Email Body (HTML)
                            </Label>
                            <Badge variant="outline" className="gap-1 text-[10px]">
                              <Info className="h-3 w-3" />
                              Placeholders supported
                            </Badge>
                          </div>
                          <RichTextEditor
                            content={editData.body}
                            onChange={(body) => setEditData({ ...editData, body })}
                            className="min-h-[400px]"
                          />
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="mb-3 text-xs font-bold tracking-wider text-slate-500 uppercase">
                            Available Placeholders
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {currentTemplate?.placeholders.map((p) => (
                              <button
                                key={p}
                                onClick={() => {
                                  // Simple way to copy to clipboard or just show
                                  navigator.clipboard.writeText(`{{${p}}}`)
                                  toast.success(`Copied {{${p}}}`)
                                }}
                                className="group flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-[11px] transition-all hover:border-[#002a5c]"
                              >
                                <PlusCircle className="h-3 w-3 text-slate-300 group-hover:text-[#002a5c]" />
                                <span>
                                  {'{' + '{'}
                                  {p}
                                  {'}' + '}'}
                                </span>
                              </button>
                            ))}
                          </div>
                          <p className="mt-3 text-[10px] text-slate-400">
                            Click a placeholder to copy it to your clipboard.
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {!isEditing && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4c9ded]/10">
                  <Mail className="h-5 w-5 text-[#4c9ded]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Individual Template Test</p>
                  <p className="text-xs text-slate-500">
                    Send a test of the <strong>{currentTemplate?.name}</strong> template.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                disabled={sendingTest}
                onClick={() => handleSendTest(false)}
                className="border-[#002a5c] text-[10px] font-bold tracking-widest text-[#002a5c] uppercase transition-all hover:bg-[#002a5c] hover:text-white"
              >
                {sendingTest ? 'Sending...' : 'Send Live Test'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
