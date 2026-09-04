'use client'

import { useState } from 'react'
import { Shield, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface TwoFactorSettingsProps {
  twoFactorEnabled: boolean
}

export default function TwoFactorSettings({ twoFactorEnabled }: TwoFactorSettingsProps) {
  const [enabled, setEnabled] = useState(twoFactorEnabled)
  const [step, setStep] = useState<'idle' | 'setup' | 'disable'>('idle')
  const [loading, setLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [code, setCode] = useState('')

  async function handleStartSetup() {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/generate', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to generate 2FA secret')
      const data = await res.json()
      setQrCodeUrl(data.qrCodeUrl)
      setStep('setup')
    } catch {
      toast.error('Failed to start 2FA setup')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyAndEnable() {
    if (code.length !== 6) {
      toast.error('Enter a 6-digit code')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: code }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Invalid code')
      }
      setEnabled(true)
      setStep('idle')
      setCode('')
      setQrCodeUrl('')
      toast.success('Two-factor authentication enabled')
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify code')
    } finally {
      setLoading(false)
    }
  }

  async function handleDisable() {
    if (code.length !== 6) {
      toast.error('Enter your current 2FA code to disable')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: code }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Invalid code')
      }
      setEnabled(false)
      setStep('idle')
      setCode('')
      toast.success('Two-factor authentication disabled')
    } catch (err: any) {
      toast.error(err.message || 'Failed to disable 2FA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20">
            <Shield className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-aerojet-blue text-lg font-black dark:text-white">
              Two-Factor Authentication
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add an extra layer of security to your account using a TOTP authenticator app.
            </p>

            <div className="mt-4 flex items-center gap-2">
              {enabled ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Enabled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  <ShieldOff className="h-3.5 w-3.5" />
                  Not Enabled
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Idle state — show enable or disable button */}
      {step === 'idle' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {enabled ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your account is protected with two-factor authentication. To disable it, you will
                need to enter a code from your authenticator app.
              </p>
              <Button
                variant="destructive"
                onClick={() => {
                  setStep('disable')
                  setCode('')
                }}
                disabled={loading}
              >
                Disable 2FA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Protect your staff account by requiring a verification code from an authenticator
                app (Google Authenticator, Authy, etc.) each time you log in.
              </p>
              <Button
                onClick={handleStartSetup}
                disabled={loading}
                className="bg-aerojet-blue hover:bg-aerojet-sky"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enable 2FA
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Setup step — show QR code and verification input */}
      {step === 'setup' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Step 1: Scan QR Code
              </h4>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Open your authenticator app and scan this QR code to add your account.
              </p>
            </div>

            {qrCodeUrl && (
              <div className="flex justify-center">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCodeUrl} alt="2FA QR Code" className="h-48 w-48" />
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Step 2: Enter Verification Code
              </h4>
              <p className="mt-1 mb-3 text-sm text-slate-500 dark:text-slate-400">
                Enter the 6-digit code from your authenticator app to verify setup.
              </p>
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-40 text-center font-mono text-lg tracking-[0.3em]"
                />
                <Button
                  onClick={handleVerifyAndEnable}
                  disabled={loading || code.length !== 6}
                  className="bg-aerojet-blue hover:bg-aerojet-sky"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Enable
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={() => {
                setStep('idle')
                setCode('')
                setQrCodeUrl('')
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Disable step — require current TOTP code */}
      {step === 'disable' && (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 shadow-sm dark:border-red-900/50 dark:bg-red-900/10">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-red-800 dark:text-red-400">
              Confirm Disable 2FA
            </h4>
            <p className="text-sm text-red-700/80 dark:text-red-400/80">
              Enter a code from your authenticator app to confirm you want to disable two-factor
              authentication.
            </p>
            <div className="flex items-center gap-3">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-40 text-center font-mono text-lg tracking-[0.3em]"
              />
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={loading || code.length !== 6}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Disable
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep('idle')
                  setCode('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
