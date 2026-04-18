'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, ArrowRight, Info } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema } from '@/lib/validation/schemas'
import type { z } from 'zod'
import { NATIONALITIES } from '@/lib/data/nationalities'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { formatCurrency } from '@/lib/currency'

const getIsoCode = (emoji: string) => {
  if (!emoji) return 'un'
  const c1 = emoji.codePointAt(0)
  const c2 = emoji.codePointAt(2)
  if (c1 && c2 && c1 >= 0x1f1e6 && c1 <= 0x1f1ff && c2 >= 0x1f1e6 && c2 <= 0x1f1ff) {
    return String.fromCharCode(c1 - 0x1f1e6 + 97) + String.fromCharCode(c2 - 0x1f1e6 + 97)
  }
  return 'un'
}

const getPhonePlaceholder = (dialCode: string) => {
  const formats: Record<string, string> = {
    '+1': '(XXX) XXX-XXXX',
    '+44': 'XXXX XXXXXX',
    '+233': 'XX XXX XXXX',
    '+234': 'XXX XXX XXXX',
    '+61': 'XXX XXX XXX',
    '+91': 'XXXXX XXXXX',
    '+49': 'XXXX XXXXXXX',
    '+33': 'X XX XX XX XX',
    '+27': 'XX XXX XXXX',
    '+254': 'XXX XXX XXXX',
    '+971': 'XX XXX XXXX',
    '+86': 'XXX XXXX XXXX',
  }
  return formats[dialCode] || 'XXXXXXXXXX'
}

const LICENSE_CATEGORIES = [
  { code: 'B1.1', label: 'B1.1 — Turbine Aeroplane' },
  { code: 'B1.2', label: 'B1.2 — Piston Aeroplane' },
  { code: 'B1.3', label: 'B1.3 — Turbine Helicopter' },
  { code: 'B1.4', label: 'B1.4 — Piston Helicopter' },
  { code: 'B2', label: 'B2 — Avionics' },
]

const PROGRAMMES_REQUIRING_LICENSE = ['FULL_TIME_4YEAR', 'FULL_TIME_2YEAR', 'MILITARY_1YEAR']

type RegistrationFormValues = z.infer<typeof registerSchema>

export default function RegistrationForm({
  currency = 'EUR',
  fee = '350',
}: {
  currency?: string
  fee?: string
}) {
  const [loading, setLoading] = useState(false)

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      nationality: 'Ghanaian',
      phoneCountryCode: '+233',
      phone: '',
      dateOfBirth: '',
      selectedProgramme: undefined, // Will require selection
    },
    mode: 'onTouched', // Validate on touch for immediate feedback
  })

  // We need to keep track of the display name for the phone code select
  const [phoneCountryCodeName, setPhoneCountryCodeName] = useState('Ghanaian')

  const handleNationalityChange = (val: string) => {
    const nation = NATIONALITIES.find((n) => n.name === val)
    form.setValue('nationality', val, { shouldValidate: true })
    if (nation) {
      setPhoneCountryCodeName(val)
      form.setValue('phoneCountryCode', nation.dialCode, { shouldValidate: true })
    }
  }

  const onSubmit = async (data: RegistrationFormValues) => {
    setLoading(true)

    try {
      const res = await fetch('/api/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const responseData = await res.json()

      if (res.ok) {
        toast.success('Application submitted successfully!')
        window.location.href = '/register?success=true'
      } else {
        toast.error(responseData.error || 'Registration failed')
      }
    } catch {
      toast.error('Something went wrong. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle generic validation errors visually via toast if they fail silently
  const onError = (errors: any) => {
    const errorCount = Object.keys(errors).length
    if (errorCount > 0) {
      toast.error(`Please correct the ${errorCount} error${errorCount > 1 ? 's' : ''} in the form.`)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="focus:ring-aerojet-blue rounded-lg border-gray-300 bg-white px-4 py-6 text-slate-900 focus:ring-2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="middleName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Middle/Other Names</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Optional"
                    className="focus:ring-aerojet-blue rounded-lg border-gray-300 bg-white px-4 py-6 text-slate-900 placeholder:text-slate-400 focus:ring-2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="focus:ring-aerojet-blue rounded-lg border-gray-300 bg-white px-4 py-6 text-slate-900 focus:ring-2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    {...field}
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="focus:ring-aerojet-blue rounded-lg border-gray-300 bg-white px-4 py-6 text-slate-900 focus:ring-2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">
                  Date of Birth <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    {...field}
                    className="focus:ring-aerojet-blue block h-12 w-full rounded-lg border-gray-300 bg-white px-4 text-slate-900 focus:ring-2 md:h-auto md:py-6"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">
                    Nationality <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={handleNationalityChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="focus:ring-aerojet-blue h-auto w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-slate-900 transition-all outline-none focus:ring-2">
                        <SelectValue placeholder="Select Nationality" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-64">
                      {NATIONALITIES.map((n) => {
                        const iso = getIsoCode(n.flag)
                        return (
                          <SelectItem key={`nat-${n.name}`} value={n.name}>
                            <div className="flex items-center gap-2">
                              <img
                                src={`https://flagcdn.com/w20/${iso}.png`}
                                srcSet={`https://flagcdn.com/w40/${iso}.png 2x`}
                                width="20"
                                alt={iso}
                                className="shrink-0 rounded-sm shadow-sm"
                              />
                              <span>{n.name}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div>
          <FormLabel className="mb-2 block text-sm font-medium text-gray-700">
            Phone Number <span className="text-red-500">*</span>
          </FormLabel>
          <div className="flex flex-col items-start gap-2 sm:flex-row">
            <div className="relative w-full shrink-0 sm:w-36">
              <FormField
                control={form.control}
                name="phoneCountryCode"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <Select
                      value={phoneCountryCodeName}
                      onValueChange={(val) => {
                        const n = NATIONALITIES.find((x) => x.name === val)
                        if (n) {
                          setPhoneCountryCodeName(val)
                          field.onChange(n.dialCode)
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="focus:ring-aerojet-blue h-[50px] w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-slate-900 transition-all outline-none focus:ring-2 [&>span]:flex [&>span]:items-center [&>span]:gap-2">
                          <SelectValue placeholder="Code" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-64">
                        {NATIONALITIES.map((n) => {
                          const iso = getIsoCode(n.flag)
                          return (
                            <SelectItem key={`phone-${n.name}`} value={n.name}>
                              <div className="flex items-center gap-2">
                                <img
                                  src={`https://flagcdn.com/w20/${iso}.png`}
                                  srcSet={`https://flagcdn.com/w40/${iso}.png 2x`}
                                  width="20"
                                  alt={iso}
                                  className="shrink-0 rounded-sm shadow-sm"
                                />
                                <span>{n.dialCode}</span>
                                <span className="hidden text-xs text-slate-500 md:inline">
                                  ({n.name.substring(0, 3)})
                                </span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="w-full flex-1">
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder={getPhonePlaceholder(form.watch('phoneCountryCode'))}
                      {...field}
                      className="focus:ring-aerojet-blue h-[50px] w-full rounded-lg border-gray-300 bg-white px-4 text-slate-900 focus:ring-2"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div>
          <FormField
            control={form.control}
            name="selectedProgramme"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">
                  Select Programme <span className="text-red-500">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="focus:ring-aerojet-blue h-auto w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-slate-900 transition-all outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                      <SelectValue placeholder="Select a study pathway" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FULL_TIME_2YEAR">
                      EASA Part-66 Full-Time (2 Years)
                    </SelectItem>
                    <SelectItem value="FULL_TIME_4YEAR">
                      EASA Part-66 Full-Time (4 Years)
                    </SelectItem>
                    <SelectItem value="MODULAR">EASA Part-66 Modular</SelectItem>
                    <SelectItem value="EXAM_ONLY">Examination Only</SelectItem>
                    <SelectItem value="MILITARY_1YEAR">Military (1 Year)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* License Category Selection — only for Full-Time & Military */}
        {PROGRAMMES_REQUIRING_LICENSE.includes(form.watch('selectedProgramme')) && (
          <div>
            <FormField
              control={form.control}
              name="licenseCategories"
              render={() => (
                <FormItem>
                  <FormLabel className="text-gray-700">
                    License Category <span className="text-red-500">*</span>
                  </FormLabel>
                  <p className="mb-2 text-xs text-slate-500">
                    Select the EASA Part-66 license category/categories you want to pursue (max 3).
                  </p>
                  <div className="space-y-2">
                    {LICENSE_CATEGORIES.map((cat) => {
                      const current = form.watch('licenseCategories') || []
                      const isChecked = current.includes(cat.code)
                      return (
                        <label
                          key={cat.code}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const prev = form.getValues('licenseCategories') || []
                              const next = checked
                                ? [...prev, cat.code]
                                : prev.filter((c: string) => c !== cat.code)
                              form.setValue('licenseCategories', next, { shouldValidate: true })
                            }}
                          />
                          <span className="text-sm text-slate-700">{cat.label}</span>
                        </label>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Fee Notice */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <Info className="text-aerojet-blue mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-xs leading-relaxed text-slate-600">
            <span className="text-aerojet-blue mb-1 block font-bold">
              Registration Fee Required
            </span>
            A non-refundable fee of <strong>{formatCurrency(fee, currency)}</strong> is required to
            process your application. You will receive payment details and a link to upload your
            proof of payment immediately after registering.
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="bg-aerojet-blue hover:bg-aerojet-sky mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl text-base font-bold text-white shadow-lg transition-all"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Start Application <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>

        <p className="mt-4 text-center text-xs text-gray-500">
          By clicking Start, you agree to our Terms. Your account login details will be emailed
          after payment verification.
        </p>
      </form>
    </Form>
  )
}
