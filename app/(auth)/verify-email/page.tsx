'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const hasAttempted = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link.')
      return
    }

    if (hasAttempted.current) return
    hasAttempted.current = true

    const verifyAndLogin = async () => {
      try {
        const result = await signIn('credentials', {
          token,
          redirect: false,
        })

        if (result?.error) {
          throw new Error(result.error)
        }

        setStatus('success')
        setMessage('Your email has been verified. Redirecting to your portal...')

        // Short delay to show success before redirect
        setTimeout(() => {
          router.push('/dashboard') // This will hit middleware and route user correctly
        }, 1500)
      } catch (err: any) {
        setStatus('error')
        setMessage(err.message || 'This verification link is invalid or has expired.')
      }
    }

    verifyAndLogin()
  }, [token, router])

  return (
    <div className="text-center">
      {status === 'loading' && (
        <>
          <Loader2 className="mx-auto mb-6 h-12 w-12 animate-spin text-[#4c9ded]" />
          <h2 className="mb-3 text-2xl font-black tracking-tight text-[#002a5c] uppercase">
            Verifying & Logging In
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Please wait while we secure your session...
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="mb-3 text-2xl font-black tracking-tight text-[#002a5c] uppercase">
            Email Verified
          </h2>
          <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">{message}</p>
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
        </>
      )}

      {status === 'error' && (
        <>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="mb-3 text-2xl font-black tracking-tight text-[#002a5c] uppercase">
            Verification Failed
          </h2>
          <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">{message}</p>

          <div className="mx-auto max-w-sm space-y-4">
            <p className="mb-4 text-xs text-slate-400 italic">
              If your link expired or didn't work, enter your email below to receive a new one.
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
                    setMessage('A new verification link has been sent to your email.')
                    // Don't transition to true success since that redirects.
                    // Just show a success message in the error UI.
                    alert('A new verification link has been sent to your email.')
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
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-[#4c9ded] focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-[#002a5c] px-6 py-3 text-xs font-bold tracking-widest text-white uppercase transition-all hover:bg-[#4c9ded] disabled:opacity-50"
              >
                Resend Verification Link
              </button>
            </form>

            <div className="pt-4">
              <Link href="/login" className="text-sm font-bold text-[#4c9ded] hover:underline">
                Return to Login
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
