'use client'

import SettingsForm from './SettingsForm'

const SYSTEM_FIELDS = [
  {
    key: 'session_timeout_hours',
    label: 'Session Inactivity Timeout',
    description: 'Security timeout before an inactive user is automatically logged out (in hours)',
    type: 'NUMBER' as const,
    default: '8',
  },
  {
    key: 'internal_exam_system_enabled',
    label: 'Internal Exam System',
    description:
      'Enable student internal exam dashboards, test sessions, and staff internal exam bank management',
    type: 'BOOLEAN' as const,
    default: 'false',
  },
]

interface SystemSettingsFormProps {
  values: Record<string, string>
}

export default function SystemSettingsForm({ values }: SystemSettingsFormProps) {
  return <SettingsForm fields={SYSTEM_FIELDS} values={values} groupLabel="System settings" />
}
