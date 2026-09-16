'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const _router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="text-aerojet-blue mb-3 text-2xl font-black tracking-tight uppercase">
          Invalid Link
        </h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          This password reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="text-aerojet-sky text-sm font-bold hover:underline"
        >
          Request a new link
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-aerojet-blue mb-3 text-2xl font-black tracking-tight uppercase">
          Password Updated
        </h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          You can now sign in with your new password.
        </p>
        <Link
          href="/login"
          className="bg-aerojet-blue hover:bg-aerojet-sky inline-block rounded-xl px-8 py-3 text-xs font-black tracking-widest text-white uppercase transition-all"
        >
          Sign In
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to reset password')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-aerojet-blue text-2xl font-black tracking-tight uppercase">
          New Password
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              minLength={8}
              className="focus:ring-aerojet-sky w-full rounded-xl border border-slate-200 bg-white py-3.5 pr-12 pl-11 text-sm text-slate-900 transition-all placeholder:text-slate-300 focus:border-transparent focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            required
            className="focus:ring-aerojet-sky w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 transition-all placeholder:text-slate-300 focus:border-transparent focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading || password.length < 8}
          className="bg-aerojet-blue hover:bg-aerojet-sky flex w-full items-center justify-center gap-2 rounded-xl py-4 text-xs font-black tracking-widest text-white uppercase shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Updating...
            </>
          ) : (
            'Update Password'
          )}
        </button>
      </form>
    </div>
  )
}
