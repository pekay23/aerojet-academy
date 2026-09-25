'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Layers,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
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
    id: 'email-verification',
    name: 'Verify Email Address',
    icon: Mail,
    description: 'Sent after registration for email address verification.',
    placeholders: ['firstName', 'verifyUrl'],
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
    name: 'Booking Confirmed',
    icon: Mail,
    description: 'Sent when an exam booking reaches minimum candidates.',
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
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)
  const [allTemplates, setAllTemplates] = useState(TEMPLATES) // Start with default TEMPLATES
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [editData, setEditData] = useState({
    subject: '',
    body: '',
  })
  const [testEmail, setTestEmail] = useState('')

  const fetchAllTemplates = async () => {
    try {
      const res = await fetch('/api/staff/email-templates')
      if (res.ok) {
        const dbTemplates = await res.json()

        // Merge DB templates with default TEMPLATES
        const mergedTemplates = [...TEMPLATES]

        dbTemplates.forEach((dbTemp: { name?: string; description?: string | null }) => {
          const existingIndex = mergedTemplates.findIndex((t) => t.id === dbTemp.name)
          if (existingIndex === -1 && dbTemp.name) {
            // It's a brand new custom template
            mergedTemplates.push({
              id: dbTemp.name,
              name: dbTemp.name.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
              icon: Layers, // Default icon for custom templates
              description: dbTemp.description || 'Custom Email Template',
              placeholders: ['firstName'], // Default placeholder, maybe more if parsable
            })
          }
        })

        setAllTemplates(mergedTemplates)
      }
    } catch (_error) {
      toast.error('Failed to load email templates')
    }
  }

  const fetchTemplateContent = useCallback(async () => {
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
    } catch (_error) {
      toast.error('Failed to load template')
    } finally {
      setLoading(false)
    }
  }, [activeTemplate])

  // Fetch template data when editing starts
  useEffect(() => {
    if (isEditing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchTemplateContent()
    }
  }, [isEditing, activeTemplate, fetchTemplateContent])

  // Fetch all templates on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAllTemplates()
  }, [])

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
        // Refresh templates list to get any new description
        fetchAllTemplates()
        // Refresh iframe (hacky but works)
        const iframe = document.querySelector('iframe')
        if (iframe) iframe.src = iframe.src
      } else {
        toast.error('Failed to save template')
      }
    } catch (_error) {
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
    } catch (_error) {
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
    } catch (_error) {
      toast.error('Error sending test email', { id: toastId })
    } finally {
      setSendingTest(false)
    }
  }

  const currentTemplate = allTemplates.find((t) => t.id === activeTemplate)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-aerojet-blue text-xl font-black tracking-tight dark:text-white">
            Email Templates
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review and customize automated email communications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              'text-xs font-bold tracking-widest uppercase transition-all',
              isEditing
                ? 'border-amber-500 text-amber-500'
                : 'border-aerojet-blue text-aerojet-blue'
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
            className="bg-aerojet-blue hover:bg-aerojet-sky text-xs font-bold tracking-widest uppercase shadow-lg transition-all"
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
            <Label htmlFor="test-recipient-email" className="sr-only">
              Test Recipient Email
            </Label>
            <Input
              id="test-recipient-email"
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
        <Card className="flex flex-col border-none border-slate-200 bg-slate-50/50 shadow-sm lg:sticky lg:top-6 lg:col-span-1 lg:max-h-[calc(100vh-120px)] lg:self-start">
          <CardHeader className="shrink-0 pb-3">
            <CardTitle className="text-sm font-bold tracking-wider text-slate-400 uppercase">
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent
            className="relative flex-1 space-y-1 overflow-y-auto p-2"
            onMouseLeave={() => setHoveredTemplate(null)}
          >
            {allTemplates.map((tmpl) => {
              const isActive = activeTemplate === tmpl.id
              const isHovered = hoveredTemplate === tmpl.id && !isActive
              return (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    setActiveTemplate(tmpl.id)
                    setIsEditing(false)
                  }}
                  onMouseEnter={() => setHoveredTemplate(tmpl.id)}
                  className={`relative flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${
                    isActive ? 'text-aerojet-blue font-bold' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {/* Hover highlight */}
                  {isHovered && (
                    <motion.div
                      layoutId="template-hover"
                      className="absolute inset-0 bg-slate-100 dark:bg-slate-800/50"
                      style={{ borderRadius: 12, zIndex: 0 }}
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="template-pill"
                      className="absolute inset-0 bg-white shadow-md"
                      style={{ borderRadius: 12, zIndex: 0 }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div
                    className={`relative z-10 rounded-lg p-2 ${
                      isActive ? 'bg-aerojet-blue text-white' : 'bg-slate-200'
                    }`}
                  >
                    <tmpl.icon className="h-4 w-4" />
                  </div>
                  <span className="relative z-10 text-sm">{tmpl.name}</span>
                </button>
              )
            })}
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
                      <CardTitle className="text-aerojet-blue text-xl font-bold">
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
                    <div className="my-8 w-full max-w-160 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
                      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 p-3">
                        <div className="flex gap-1.5">
                          <div className="h-3 w-3 rounded-full bg-red-400" />
                          <div className="h-3 w-3 rounded-full bg-yellow-400" />
                          <div className="h-3 w-3 rounded-full bg-green-400" />
                        </div>
                        <div className="ml-4 flex flex-1 items-center justify-between rounded border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-400">
                          <span>
                            From: Aerojet Aviation Training Academy
                            &lt;noreply@aerojet-academy.com&gt;
                          </span>
                          <Eye className="h-3 w-3" />
                        </div>
                      </div>
                      <iframe
                        src={`/api/staff/email-preview?template=${activeTemplate}`}
                        className="min-h-150 w-full border-none"
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
                        <CardTitle className="text-aerojet-blue text-xl font-bold">
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
                            className="text-aerojet-blue text-lg font-bold"
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
                            className="min-h-100"
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
                                type="button"
                                aria-label={`Copy placeholder ${p} to clipboard`}
                                onClick={() => {
                                  // Simple way to copy to clipboard or just show
                                  navigator.clipboard.writeText(`{{${p}}}`)
                                  toast.success(`Copied {{${p}}}`)
                                }}
                                className="group hover:border-aerojet-blue flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-[11px] transition-all"
                              >
                                <PlusCircle
                                  className="group-hover:text-aerojet-blue h-3 w-3 text-slate-300"
                                  role="presentation"
                                />
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
                <div className="bg-aerojet-sky/10 flex h-10 w-10 items-center justify-center rounded-full">
                  <Mail className="text-aerojet-sky h-5 w-5" />
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
                className="border-aerojet-blue text-aerojet-blue hover:bg-aerojet-blue text-[10px] font-bold tracking-widest uppercase transition-all hover:text-white"
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
