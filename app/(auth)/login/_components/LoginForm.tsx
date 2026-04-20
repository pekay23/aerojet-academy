'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, getSession } from 'next-auth/react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      setError('')
      try {
        const result = await signIn('credentials', {
          redirect: false,
          email: email.trim().toLowerCase(),
          password,
        })

        if (!result) {
          throw new Error('Something went wrong. Please try again.')
        }

        if (result.error) {
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
        window.location.href = redirectMap[role || ''] ?? '/login'
      } catch (err: any) {
        setError(err.message || 'Something went wrong. Please try again.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
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
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pr-4 pl-11 text-sm text-slate-900 transition-all placeholder:text-slate-300 focus:border-transparent focus:ring-2 focus:ring-aerojet-sky focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
            className="text-xs font-bold text-aerojet-sky hover:underline"
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
            className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pr-12 pl-11 text-sm text-slate-900 transition-all placeholder:text-slate-300 focus:border-transparent focus:ring-2 focus:ring-aerojet-sky focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-400"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-aerojet-blue py-4 text-xs font-black tracking-widest text-white uppercase shadow-lg transition-all hover:bg-aerojet-sky disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Signing In...
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  )
}
