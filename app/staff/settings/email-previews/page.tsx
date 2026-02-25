'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

const TEMPLATES = [
  {
    id: 'registration',
    name: 'Welcome / Registration',
    icon: UserPlus,
    description: 'Sent after initial registration with payment details.',
  },
  {
    id: 'activation',
    name: 'Account Activation',
    icon: UserCheck,
    description: 'Sent after applicant approval with credentials.',
  },
  {
    id: 'promotion',
    name: 'Student Promotion',
    icon: GraduationCap,
    description: 'Sent when an applicant is promoted to a student.',
  },
  {
    id: 'reset-password',
    name: 'Password Reset',
    icon: Key,
    description: 'Sent when a user requests a password reset link.',
  },
  {
    id: 'payment-approved',
    name: 'Payment Approved',
    icon: CheckCircle,
    description: 'Confirmation for any approved payment.',
  },
  {
    id: 'payment-rejected',
    name: 'Payment Rejected',
    icon: XCircle,
    description: 'Notification for rejected payments with reason.',
  },
  {
    id: 'pool-confirmed',
    name: 'Pool Confirmed',
    icon: Mail,
    description: 'Sent when an exam pool reaches minimum candidates.',
  },
  {
    id: 'contact',
    name: 'Contact Enquiry',
    icon: MessageSquare,
    description: 'Auto-reply for new contact form submissions.',
  },
]

export default function EmailPreviewsPage() {
  const [activeTemplate, setActiveTemplate] = useState('registration')

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#002a5c] uppercase">
            Email System Previews
          </h1>
          <p className="mt-1 text-slate-500">
            Review and test the automated email communications sent to users.
          </p>
        </div>
        <Button className="bg-[#002a5c] text-xs font-bold tracking-widest uppercase shadow-lg transition-all hover:bg-[#4c9ded]">
          <Send className="mr-2 h-4 w-4" /> Send Global Test
        </Button>
      </div>

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
                onClick={() => setActiveTemplate(tmpl.id)}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${
                  activeTemplate === tmpl.id
                    ? 'bg-white font-bold text-[#002a5c] shadow-md'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`rounded-lg p-2 ${activeTemplate === tmpl.id ? 'bg-[#002a5c] text-white' : 'bg-slate-200'}`}
                >
                  <tmpl.icon className="h-4 w-4" />
                </div>
                <span className="text-sm">{tmpl.name}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Preview Area */}
        <div className="space-y-6 lg:col-span-3">
          <Card className="overflow-hidden border-slate-200 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-white">
              <div>
                <CardTitle className="text-xl font-bold text-[#002a5c]">
                  {TEMPLATES.find((t) => t.id === activeTemplate)?.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  {TEMPLATES.find((t) => t.id === activeTemplate)?.description}
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
                      From: Aerojet Academy Training Academy &lt;noreply@aerojet-academy.com&gt;
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

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4c9ded]/10">
                <Mail className="h-5 w-5 text-[#4c9ded]" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Want to see it in your inbox?</p>
                <p className="text-xs text-slate-500">
                  Send a real test email to your account email.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-[#002a5c] text-[10px] font-bold tracking-widest text-[#002a5c] uppercase transition-all hover:bg-[#002a5c] hover:text-white"
            >
              Send Live Test
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
