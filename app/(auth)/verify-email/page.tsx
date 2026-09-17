'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const type = searchParams.get('type') // 'registration' or null (activation)
  const [status, setStatus] = useState<'loading' | 'verified' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const hasAttempted = useRef(false)

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('error')
      setMessage('Invalid verification link.')
      return
    }

    if (hasAttempted.current) return
    hasAttempted.current = true

    const verify = async () => {
      try {
        if (type === 'registration') {
          // Pre-approval: Just verify email, don't try to login (no password yet)
          const res = await fetch(`/api/auth/verify-email?token=${token}`)
          const data = await res.json()

          if (!res.ok) {
            throw new Error(data.error || 'Verification failed')
          }

          setStatus('verified')

          if (data.registrationCode) {
            // setTimeout(() => {
            //   router.push(`/register?success=true&code=${data.registrationCode}`)
            // }, 2000)
          }

          setMessage(
            'Your email has been verified successfully! Please check your inbox for payment instructions to complete your registration.'
          )
        } else {
          // Post-approval: Verify and auto-login with credentials
          const result = await signIn('credentials', {
            token,
            redirect: false,
          })

          if (result?.error) {
            throw new Error(result.error)
          }

          setStatus('success')
          setMessage('Login successful! Redirecting to your portal...')

          setTimeout(() => {
            router.push('/student')
          }, 1500)
        }
      } catch (err) {
        setStatus('error')
        setMessage(
          err instanceof Error ? err.message : 'Verification failed. The link may have expired.'
        )
      }
    }

    verify()
  }, [token, type, router])

  return (
    <div className="mx-auto max-w-md overflow-hidden rounded-3xl bg-white p-8 shadow-2xl dark:bg-white">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="text-aerojet-sky mx-auto mb-6 h-12 w-12 animate-spin" />
            <h2 className="mb-3 text-2xl font-black tracking-tight text-slate-800 uppercase">
              {type === 'registration' ? 'Verifying Email' : 'Logging You In'}
            </h2>
            <p className="text-sm text-slate-500">Please wait...</p>
          </>
        )}

        {/* Registration verification — no auto-login */}
        {status === 'verified' && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="mb-3 text-2xl font-black tracking-tight text-slate-800 uppercase">
              Email Verified
            </h2>
            <p className="mb-6 text-sm text-slate-500">{message}</p>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-left">
              <div className="mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-700 uppercase">Next Steps</span>
              </div>
              <ol className="ml-5 list-decimal space-y-1 text-sm text-blue-800">
                <li>Check your email for the "Registration Received" message</li>
                <li>Follow the payment instructions and copy your reference code</li>
                <li>Log in to your portal and upload your payment proof</li>
              </ol>
            </div>

            <div className="mt-6 flex flex-col items-center gap-4">
              <button
                onClick={() => {
                  window.close()
                  // Fallback: If window.close() is blocked, redirect after a short delay
                  setTimeout(() => {
                    router.push('/')
                  }, 1000)
                }}
                className="bg-aerojet-blue hover:bg-aerojet-sky inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold tracking-widest text-white uppercase transition-all"
              >
                Close Page
              </button>
              <Link
                href="/"
                className="hover:text-aerojet-sky text-xs font-bold text-slate-400 hover:underline"
              >
                Return to Homepage
              </Link>
            </div>
          </>
        )}

        {/* Activation verification — auto-login */}
        {status === 'success' && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="mb-3 text-2xl font-black tracking-tight text-slate-800 uppercase">
              Success
            </h2>
            <p className="mb-8 text-sm text-slate-500">{message}</p>
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="mb-3 text-2xl font-black tracking-tight text-slate-800 uppercase">
              Verification Failed
            </h2>
            <p className="mb-8 text-sm text-slate-500">{message}</p>

            <div className="mx-auto max-w-sm space-y-4">
              <p className="mb-4 text-xs text-slate-400 italic">
                If your link expired or didn&apos;t work, enter your email below to receive a new
                one.
              </p>
              <form
                className="flex flex-col gap-3"
                onSubmit={async (e) => {
                  e.preventDefault()
                  const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement)
                    .value
                  if (!email) return

                  try {
                    const btn = e.currentTarget.querySelector('button')
                    if (btn) btn.disabled = true

                    const res = await fetch('/api/auth/resend-verification', {
                      method: 'POST',
                      body: JSON.stringify({ email }),
                      headers: { 'Content-Type': 'application/json' },
                    })

                    if (res.ok) {
                      const data = await res.json()
                      setMessage(
                        data.message ||
                          'A new verification link has been sent to your email. (Please check your spam/junk folder)'
                      )
                      alert(
                        data.message ||
                          'A new verification link has been sent to your email. (Please check your spam/junk folder)'
                      )
                    } else {
                      const data = await res.json()
                      alert(data.error || 'Failed to resend link')
                    }
                  } catch {
                    alert('An error occurred. Please try again.')
                  } finally {
                    const btn = e.currentTarget.querySelector('button')
                    if (btn) btn.disabled = false
                  }
                }}
              >
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  required
                  className="focus:ring-aerojet-sky w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-aerojet-blue hover:bg-aerojet-sky w-full rounded-xl px-6 py-3 text-xs font-bold tracking-widest text-white uppercase transition-all disabled:opacity-50"
                >
                  Resend Verification Link
                </button>
              </form>

              <div className="pt-4">
                <Link href="/login" className="text-aerojet-sky text-sm font-bold hover:underline">
                  Return to Login
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
