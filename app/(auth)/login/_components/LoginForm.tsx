'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, getSession } from 'next-auth/react'
import Link from 'next/link'
import { startAuthentication, type AuthenticationResponseJSON } from '@simplewebauthn/browser'
import { Eye, EyeOff, Loader2, Mail, Lock, ShieldCheck, Fingerprint } from 'lucide-react'
import { useFormErrorAnnouncer } from '@/hooks/useFormErrorAnnouncer'

export default function LoginForm({ returnTo }: { returnTo?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [needs2FA, setNeeds2FA] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false)
  const [supportsConditionalUI, setSupportsConditionalUI] = useState(false)
  const { announcerRef } = useFormErrorAnnouncer({
    errors: error ? { _global: error } : {},
    touched: error ? { _global: true } : {},
  })

  // Complete passkey login after browser returns a credential (shared by button + conditional UI)
  const completePasskeyLogin = useCallback(
    async (credential: AuthenticationResponseJSON) => {
      const verifyRes = await fetch('/api/auth/passkey/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })

      if (!verifyRes.ok) {
        throw new Error((await verifyRes.text()) || 'Passkey verification failed')
      }

      const { token } = await verifyRes.json()

      startTransition(async () => {
        const result = await signIn('credentials', { redirect: false, token })
        if (result?.error) {
          setError(result.error)
          return
        }
        const session = await getSession()
        const userRole = session?.user?.role
        if (returnTo) {
          router.push(returnTo)
        } else if (userRole === 'STUDENT' || userRole === 'APPLICANT') {
          router.push('/student')
        } else {
          router.push('/staff')
        }
        router.refresh()
      })
    },
    [router, returnTo]
  )

  // Conditional UI: automatically prompt passkey when email field is focused (if browser supports it)
  useEffect(() => {
    let aborted = false

    async function initConditionalUI() {
      if (
        typeof window === 'undefined' ||
        !window.PublicKeyCredential ||
        !PublicKeyCredential.isConditionalMediationAvailable
      ) {
        return
      }

      const available = await PublicKeyCredential.isConditionalMediationAvailable()
      if (!available || aborted) return

      setSupportsConditionalUI(true)

      try {
        // Get authentication options (discoverable credential flow)
        const optionsRes = await fetch('/api/auth/passkey/login-options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        if (!optionsRes.ok || aborted) return
        const { options } = await optionsRes.json()

        // Start conditional mediation — browser shows passkey in autofill dropdown
        const credential = await startAuthentication({
          optionsJSON: options,
          useBrowserAutofill: true,
        })
        if (aborted) return

        await completePasskeyLogin(credential)
      } catch (err: unknown) {
        // AbortError is normal when user navigates away or uses password instead
        if (err instanceof Error && err.name !== 'AbortError' && !aborted) {
          console.debug('[ConditionalUI]', err.message)
        }
      }
    }

    initConditionalUI()
    return () => {
      aborted = true
    }
  }, [completePasskeyLogin])

  const handlePasskeyLogin = async () => {
    try {
      setIsPasskeyLoading(true)
      setError('')

      // 1. Get options from server
      const optionsRes = await fetch('/api/auth/passkey/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() || undefined }),
      })

      if (!optionsRes.ok) {
        throw new Error('Failed to initiate passkey login')
      }
      const { options } = await optionsRes.json()

      // 2. Browser authentication
      let credential
      try {
        credential = await startAuthentication({ optionsJSON: options })
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'NotAllowedError') {
          return // User cancelled
        }
        throw err
      }

      // 3. Verify and complete login
      await completePasskeyLogin(credential)
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'An error occurred during passkey login')
    } finally {
      setIsPasskeyLoading(false)
    }
  }

  // Extracted so we can trigger it from both the explicit submit and the
  // auto-submit-on-6-digits path. The optional `codeOverride` bypasses React's
  // state-lag: when the user types the 6th digit, the onChange-derived value
  // is passed directly instead of waiting for the next render.
  const performLogin = useCallback(
    (codeOverride?: string) => {
      startTransition(async () => {
        setError('')
        try {
          const result = await signIn('credentials', {
            redirect: false,
            email: email.trim().toLowerCase(),
            password,
            totpCode: needs2FA ? (codeOverride ?? totpCode) : undefined,
          })

          if (!result) {
            throw new Error('Something went wrong. Please try again.')
          }

          if (result.error) {
            // Check if the error indicates 2FA is required
            if (result.error.includes('2FA_REQUIRED')) {
              setNeeds2FA(true)
              setTotpCode('')
              return
            }
            if (needs2FA && result.error.includes('Invalid 2FA code')) {
              // Wipe the code on invalid attempt so the user can retype
              // (and the autosubmit fires again on the 6th digit).
              setTotpCode('')
              throw new Error('Invalid verification code. Please try again.')
            }
            throw new Error('Invalid email or password.')
          }

          // Get session to read role and redirect accordingly
          const session = await getSession()
          const role = session?.user?.role

          const redirectMap: Record<string, string> = {
            SUPER_ADMIN: '/staff',
            ADMIN: '/staff',
            STAFF: '/staff',
            INSTRUCTOR: '/instructor',
            STUDENT: '/student',
            APPLICANT: '/applicant',
          }

          // Use window.location for full page navigation after auth
          // If a returnTo destination was provided, redirect there instead of the role default
          window.location.href = returnTo || redirectMap[role || ''] || '/login'
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
        }
      })
    },
    [email, password, needs2FA, totpCode, returnTo]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performLogin()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div ref={announcerRef} aria-live="polite" aria-atomic="true" className="sr-only" />
      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400"
        >
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete={supportsConditionalUI ? 'username webauthn' : 'email'}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            className="focus:ring-aerojet-sky w-full rounded-xl border border-slate-200 bg-white py-3.5 pr-4 pl-11 text-sm text-slate-900 transition-all placeholder:text-slate-300 focus:border-transparent focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-aerojet-sky text-xs font-bold hover:underline"
          >
            Forgot?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="focus:ring-aerojet-sky w-full rounded-xl border border-slate-200 bg-white py-3.5 pr-12 pl-11 text-sm text-slate-900 transition-all placeholder:text-slate-300 focus:border-transparent focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-400"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* 2FA Code */}
      {needs2FA && (
        <div>
          <label
            htmlFor="totpCode"
            className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400"
          >
            Verification Code
          </label>
          <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
            Enter the 6-digit code from your authenticator app. It will submit automatically.
          </p>
          <div className="relative">
            <ShieldCheck className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="totpCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={totpCode}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, '').slice(0, 6)
                setTotpCode(next)
                // Auto-submit the moment the 6th digit lands. We pass the
                // value directly (instead of relying on state) because
                // setState hasn't flushed yet. Guard on !isPending so we
                // don't double-fire if the user pastes a code while a
                // submit is already in flight.
                if (next.length === 6 && !isPending) {
                  performLogin(next)
                }
              }}
              placeholder="000000"
              required
              autoFocus
              autoComplete="one-time-code"
              className="focus:ring-aerojet-sky w-full rounded-xl border border-slate-200 bg-white py-3.5 pr-4 pl-11 text-center font-mono text-lg tracking-[0.3em] text-slate-900 transition-all placeholder:text-slate-300 focus:border-transparent focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="bg-aerojet-blue hover:bg-aerojet-sky flex w-full items-center justify-center gap-2 rounded-xl py-4 text-xs font-black tracking-widest text-white uppercase shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Signing In...
          </>
        ) : (
          'Sign In'
        )}
      </button>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
            Or continue with
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePasskeyLogin}
        disabled={isPending || isPasskeyLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-4 text-xs font-bold tracking-widest text-slate-700 uppercase shadow-sm transition-all hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {isPasskeyLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
        ) : (
          <Fingerprint className="h-4 w-4 text-slate-500" />
        )}
        Sign in with Passkey
      </button>
    </form>
  )
}
