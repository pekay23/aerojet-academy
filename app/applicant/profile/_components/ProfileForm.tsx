'use client'

import { useState, useTransition } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateApplicantProfile } from '../../actions'

interface ProfileData {
  firstName: string | null
  lastName: string | null
  phone: string | null
  alternatePhone: string | null
  gender: string | null
  nationality: string | null
  dateOfBirth: Date | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postalCode: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  emergencyContactRelation: string | null
}

interface Props {
  profile: ProfileData | null
}

function Field({
  label,
  name,
  type = 'text',
  defaultValue,
  required,
  placeholder,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string | null
  required?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ''}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 transition-shadow placeholder:text-slate-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-aerojet-blue"
      />
    </div>
  )
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string
  name: string
  defaultValue?: string | null
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <select
        name={name}
        defaultValue={defaultValue ?? ''}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-aerojet-blue"
      >
        <option value="">— Select —</option>
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function ProfileForm({ profile }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateApplicantProfile(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Profile saved successfully.')
      }
    })
  }

  const dob = profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : ''

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Info */}
      <div className="space-y-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">
          Personal Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First Name" name="firstName" defaultValue={profile?.firstName} required />
          <Field label="Last Name" name="lastName" defaultValue={profile?.lastName} required />
          <SelectField
            label="Gender"
            name="gender"
            defaultValue={profile?.gender}
            options={[
              { value: 'MALE', label: 'Male' },
              { value: 'FEMALE', label: 'Female' },
              { value: 'OTHER', label: 'Other / Prefer not to say' },
            ]}
          />
          <Field label="Date of Birth" name="dateOfBirth" type="date" defaultValue={dob} />
          <Field
            label="Nationality"
            name="nationality"
            defaultValue={profile?.nationality}
            placeholder="e.g. Ghanaian"
          />
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">
          Contact Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Phone Number"
            name="phone"
            type="tel"
            defaultValue={profile?.phone}
            placeholder="+233 20 000 0000"
          />
          <Field
            label="Alternate Phone"
            name="alternatePhone"
            type="tel"
            defaultValue={profile?.alternatePhone}
          />
          <Field label="Address" name="address" defaultValue={profile?.address} />
          <Field label="City" name="city" defaultValue={profile?.city} />
          <Field label="State / Region" name="state" defaultValue={profile?.state} />
          <Field
            label="Country"
            name="country"
            defaultValue={profile?.country}
            placeholder="e.g. Ghana"
          />
          <Field label="Postal Code" name="postalCode" defaultValue={profile?.postalCode} />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">
          Emergency Contact
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Full Name"
            name="emergencyContactName"
            defaultValue={profile?.emergencyContactName}
          />
          <Field
            label="Phone"
            name="emergencyContactPhone"
            type="tel"
            defaultValue={profile?.emergencyContactPhone}
          />
          <Field
            label="Relationship"
            name="emergencyContactRelation"
            defaultValue={profile?.emergencyContactRelation}
            placeholder="e.g. Mother, Spouse"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-aerojet-blue px-7 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#003875] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </form>
  )
}
