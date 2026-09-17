'use client'

import ChangePasswordForm from '@/components/shared/ChangePasswordForm'
import { ShieldCheck, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ForcePasswordChangeProps {
  apiEndpoint?: string
  portalName?: string
}

export default function ForcePasswordChange({
  apiEndpoint = '/api/applicant/profile/change-password',
  portalName = 'Aerojet Academy',
}: ForcePasswordChangeProps) {
  const _router = useRouter()

  const handleSuccess = () => {
    window.location.reload()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Branding/Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-aerojet-blue shadow-lg shadow-blue-900/20">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            Security Update
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Welcome to the {portalName}. For your security, please update your temporary password
            before continuing.
          </p>
        </div>

        {/* Form Container */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
          <div className="mb-8 flex items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-sm">
              <p className="font-bold text-blue-900">Mandatory Security Step</p>
              <p className="text-blue-700/70">
                Your new password must be at least 8 characters long and different from your
                temporary one.
              </p>
            </div>
          </div>

          <ChangePasswordForm apiEndpoint={apiEndpoint} onSuccess={handleSuccess} />
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Aerojet Academy Secure Data Gateway
        </p>
      </div>
    </div>
  )
}
