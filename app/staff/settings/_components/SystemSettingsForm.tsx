'use client'

import SettingsForm from './SettingsForm'

const TIMEZONE_OPTIONS = [
  'Africa/Accra',
  'Africa/Nairobi',
  'Africa/Lagos',
  'Africa/Johannesburg',
  'Africa/Cairo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
]

const DATE_FORMAT_OPTIONS = [
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
  'DD-MMM-YYYY',
]

const SYSTEM_FIELDS = [
  {
    key: 'timezone',
    label: 'Timezone',
    description: 'Default timezone for displaying dates and times across the platform',
    type: 'SELECT' as const,
    default: 'Africa/Accra',
    options: TIMEZONE_OPTIONS,
  },
  {
    key: 'date_format',
    label: 'Date Format',
    description: 'How dates are displayed throughout the platform',
    type: 'SELECT' as const,
    default: 'DD/MM/YYYY',
    options: DATE_FORMAT_OPTIONS,
  },
  {
    key: 'session_timeout_hours',
    label: 'Session Timeout (hours)',
    description: 'How long before user sessions expire and require re-login',
    type: 'NUMBER' as const,
    default: '8',
  },
]

interface SystemSettingsFormProps {
  values: Record<string, string>
}

export default function SystemSettingsForm({ values }: SystemSettingsFormProps) {
  return <SettingsForm fields={SYSTEM_FIELDS} values={values} groupLabel="System settings" />
}
