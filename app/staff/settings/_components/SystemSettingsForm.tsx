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
    label: 'Primary Timezone',
    description: 'System-wide timezone for all academic dates, exams, and logs',
    type: 'SELECT' as const,
    default: 'Africa/Accra',
    options: TIMEZONE_OPTIONS,
  },
  {
    key: 'date_format',
    label: 'Date Display Format',
    description: 'Preferred format for all date displays throughout the portal',
    type: 'SELECT' as const,
    default: 'DD/MM/YYYY',
    options: DATE_FORMAT_OPTIONS,
  },
  {
    key: 'session_timeout_hours',
    label: 'Session Inactivity Timeout',
    description: 'Security timeout before an inactive user is automatically logged out (in hours)',
    type: 'NUMBER' as const,
    default: '8',
  },
  {
    key: 'admissions_pipeline_enabled',
    label: 'Admissions Pipeline',
    description: 'Create Application records and use the full admissions tracker for new non-exam-only applicants',
    type: 'BOOLEAN' as const,
    default: 'false',
  },
  {
    key: 'document_uploads_enabled',
    label: 'Applicant Document Uploads',
    description: 'Show configurable document upload requirements in the applicant pipeline',
    type: 'BOOLEAN' as const,
    default: 'false',
  },
  {
    key: 'aptitude_test_enabled',
    label: 'Aptitude Tests',
    description: 'Require eligible applicants to complete the admissions aptitude test stage',
    type: 'BOOLEAN' as const,
    default: 'false',
  },
  {
    key: 'interview_system_enabled',
    label: 'Interview Scheduling',
    description: 'Enable applicant self-service interview booking and staff interview outcomes',
    type: 'BOOLEAN' as const,
    default: 'false',
  },
  {
    key: 'medical_review_enabled',
    label: 'Medical Review',
    description: 'Enable medical document submission and staff medical clearance decisions',
    type: 'BOOLEAN' as const,
    default: 'false',
  },
  {
    key: 'internal_exam_system_enabled',
    label: 'Internal Exam System',
    description: 'Enable student internal exam dashboards, test sessions, and staff internal exam bank management',
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
