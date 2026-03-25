'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { changePasswordSchema } from '@/lib/validation/schemas'
import { z } from 'zod'
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type ChangePasswordValues = z.infer<typeof changePasswordSchema>

interface ChangePasswordFormProps {
  apiEndpoint: string
  onSuccess?: () => void
}

export default function ChangePasswordForm({ apiEndpoint, onSuccess }: ChangePasswordFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: ChangePasswordValues) => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await resp.json()

      if (!resp.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      setSuccess(true)
      if (onSuccess) {
        setTimeout(onSuccess, 2000)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="animate-in fade-in zoom-in flex flex-col items-center justify-center py-10 text-center duration-300">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-black tracking-tight text-slate-800 uppercase">
          Password Updated
        </h3>
        <p className="mt-2 max-w-xs text-sm text-slate-500">
          Your password has been changed successfully. You can now continue using your portal.
        </p>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div className="animate-in slide-in-from-top-1 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 duration-200">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Current Password
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    {...field}
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="h-12 border-slate-200 bg-white pr-12 pl-11 text-sm shadow-sm transition-all focus:border-transparent focus:ring-2 focus:ring-aerojet-sky dark:border-slate-800 dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                New Password
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    {...field}
                    type={showNew ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="h-12 border-slate-200 bg-white pr-12 pl-11 text-sm shadow-sm transition-all focus:border-transparent focus:ring-2 focus:ring-aerojet-sky dark:border-slate-800 dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Confirm New Password
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    {...field}
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="h-12 border-slate-200 bg-white pr-12 pl-11 text-sm shadow-sm transition-all focus:border-transparent focus:ring-2 focus:ring-aerojet-sky dark:border-slate-800 dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full bg-aerojet-blue text-[11px] font-black tracking-widest text-white uppercase shadow-lg transition-all hover:bg-aerojet-sky disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
            </>
          ) : (
            'Change Password'
          )}
        </Button>
      </form>
    </Form>
  )
}
