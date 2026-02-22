'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, ArrowRight, Info } from 'lucide-react'
import { NATIONALITIES } from '@/lib/data/nationalities'

export default function RegistrationForm() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    nationality: NATIONALITIES[0].name,
    phoneCountryCode: NATIONALITIES[0].dialCode,
    phone: '',
    program: 'FULL_TIME_2YEAR',
  })

  const handleNationalityChange = (val: string) => {
    const nation = NATIONALITIES.find((n) => n.name === val)
    setData({
      ...data,
      nationality: val,
      phoneCountryCode: nation ? nation.dialCode : data.phoneCountryCode,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          middleName: data.middleName || undefined,
          lastName: data.lastName,
          email: data.email,
          nationality: data.nationality,
          phoneCountryCode: data.phoneCountryCode,
          phone: data.phone,
          selectedProgramme: data.program,
        }),
      })

      const responseData = await res.json()

      if (res.ok) {
        toast.success('Application submitted successfully!')
        // Redirect to success state via URL
        window.location.href = `/register?success=true&code=${responseData.data?.registrationCode}`
      } else {
        toast.error(responseData.error || 'Registration failed')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">First Name</label>
          <input
            required
            type="text"
            className="focus:ring-aerojet-blue w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-slate-900 transition-all outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100"
            value={data.firstName}
            onChange={(e) => setData({ ...data, firstName: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Middle/Other Names</label>
          <input
            type="text"
            placeholder="Optional"
            className="focus:ring-aerojet-blue w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:ring-2 dark:bg-slate-900 dark:text-slate-100"
            value={data.middleName}
            onChange={(e) => setData({ ...data, middleName: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Last Name</label>
          <input
            required
            type="text"
            className="focus:ring-aerojet-blue w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-slate-900 transition-all outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100"
            value={data.lastName}
            onChange={(e) => setData({ ...data, lastName: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email Address</label>
          <input
            required
            type="email"
            className="focus:ring-aerojet-blue w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-slate-900 transition-all outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nationality</label>
          <div className="relative">
            <select
              value={data.nationality}
              onChange={(e) => handleNationalityChange(e.target.value)}
              className="focus:ring-aerojet-blue w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-slate-900 transition-all outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100"
            >
              {NATIONALITIES.map((n) => (
                <option key={n.name} value={n.name}>
                  {n.name}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
              <svg
                className="h-4 w-4 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number</label>
        <div className="flex gap-2">
          <div className="relative w-36 shrink-0">
            <select
              value={data.phoneCountryCode}
              onChange={(e) => setData({ ...data, phoneCountryCode: e.target.value })}
              className="focus:ring-aerojet-blue w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-3 text-slate-900 transition-all outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100"
            >
              {NATIONALITIES.map((n) => (
                <option key={n.name + n.dialCode} value={n.dialCode}>
                  {n.flag} {n.dialCode} ({n.name.substring(0, 3)})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg
                className="h-4 w-4 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
          <input
            required
            type="tel"
            placeholder="0XX XXX XXXX"
            className="focus:ring-aerojet-blue w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-slate-900 transition-all outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100"
            value={data.phone}
            onChange={(e) => setData({ ...data, phone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Select Programme</label>
        <div className="relative">
          <select
            value={data.program}
            onChange={(e) => setData({ ...data, program: e.target.value })}
            className="focus:ring-aerojet-blue w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-slate-900 transition-all outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="FULL_TIME_2YEAR">EASA Part-66 Full-Time (2 Years)</option>
            <option value="FULL_TIME_4YEAR">EASA Part-66 Full-Time (4 Years)</option>
            <option value="MODULAR">EASA Part-66 Modular</option>
            <option value="EXAM_ONLY">Examination Only</option>
            <option value="MILITARY_1YEAR">Military (1 Year)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg
              className="h-4 w-4 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Fee Notice */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <Info className="text-aerojet-blue mt-0.5 h-5 w-5 shrink-0" />
        <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          <span className="text-aerojet-blue mb-1 block font-bold">Registration Fee Required</span>A
          non-refundable fee of <strong>GHS 350.00</strong> is required to process your application.
          You will receive payment details and a link to upload your proof of payment immediately
          after registering.
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-aerojet-blue hover:bg-aerojet-sky mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-white shadow-lg transition-all"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            Start Application <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>

      <p className="mt-4 text-center text-xs text-gray-500">
        By clicking Start, you agree to our Terms. Your account login details will be emailed after
        payment verification.
      </p>
    </form>
  )
}
