import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Metadata } from 'next'
import { getPDFSettings } from '@/lib/pdf-settings'
import SettingsTabs from './_components/SettingsTabs'
import SettingsForm from './_components/SettingsForm'
import SystemSettingsForm from './_components/SystemSettingsForm'
import PDFSettingsForm from './_components/PDFSettingsForm'
import PaymentMethodsManager from './_components/PaymentMethodsManager'
import WelcomeMessagesManager from './_components/WelcomeMessagesManager'
import { getWelcomeMessagesGrouped } from '@/lib/welcome-messages'
import EmailPreviewsTab from './_components/EmailPreviewsTab'
import EmailRegistryTab from './_components/EmailRegistryTab'
import EmailDeliveryTab from './_components/EmailDeliveryTab'
import AcademicCalendarManager from './academic-calendar/_components/AcademicCalendarManager'
import BackupManager from './_components/BackupManager'
import ExchangeRateDisplay from './_components/ExchangeRateDisplay'
import TwoFactorSettings from './_components/TwoFactorSettings'
import CustomFieldsManager from './custom-fields/_components/CustomFieldsManager'
import { PasskeySettings } from './_components/PasskeySettings'

export const metadata: Metadata = { title: 'Settings | Staff Portal' }
export const dynamic = 'force-dynamic'

// ── Field definitions per tab ─────────────────────────────────────────────

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

const DATE_FORMAT_OPTIONS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MMM-YYYY']

const GENERAL_DETAILS_FIELDS = [
  {
    key: 'academy_name',
    label: 'Academy Name',
    description: 'The official name of the aviation academy',
    type: 'STRING' as const,
    default: 'Aerojet Aviation Training Academy',
  },
  {
    key: 'academy_email',
    label: 'Contact Email',
    description: 'Main contact email address for general enquiries',
    type: 'STRING' as const,
    default: 'info@aerojet.aviation',
  },
  {
    key: 'academy_phone',
    label: 'Contact Phone',
    description: 'Main contact phone number for the academy',
    type: 'STRING' as const,
    default: '',
  },
  {
    key: 'academy_address',
    label: 'Address',
    description: 'Physical location of the aviation academy',
    type: 'STRING' as const,
    default: '',
  },
]

const GENERAL_FEATURES_FIELDS = [
  {
    key: 'registration_open',
    label: 'Accept New Registrations',
    description: 'Enable or disable the public registration form',
    type: 'BOOLEAN' as const,
    default: 'true',
  },
  {
    key: 'advisory_enabled',
    label: 'Enable Public Advisory Banner',
    description: 'Display an emergency advisory note at the top of all public pages.',
    type: 'BOOLEAN' as const,
    default: 'false',
  },
  {
    key: 'advisory_message',
    label: 'Advisory Message',
    description: 'The text displayed inside the advisory banner.',
    type: 'STRING' as const,
    default: '',
  },
  {
    key: 'exams_open',
    label: 'Accept Exam Bookings',
    description: 'Enable or disable the public exam schedule page and exam booking.',
    type: 'BOOLEAN' as const,
    default: 'true',
  },
  {
    key: 'certificates_enabled',
    label: 'Enable Certificate Generation',
    description:
      'When enabled, certificates are automatically generated and stored as PDFs when exam results are published for passing students. Disabled by default.',
    type: 'BOOLEAN' as const,
    default: 'false',
  },
]

const GENERAL_ATTENDANCE_FIELDS = [
  {
    key: 'easa_attendance_threshold',
    label: 'EASA Approved Attendance Threshold (%)',
    description:
      'The EASA Part-147 approved minimum attendance percentage. Acts as the regulatory floor — the academy threshold can never be enforced below this.',
    type: 'NUMBER' as const,
    default: '80',
  },
  {
    key: 'academy_attendance_threshold',
    label: 'Academy Attendance Threshold (%)',
    description:
      'The attendance minimum the academy enforces. If set below the EASA approved threshold, the EASA value is used instead.',
    type: 'NUMBER' as const,
    default: '80',
  },
]

const GENERAL_REGIONAL_FIELDS = [
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
]

// Audit 8a: admins toggle the full admissions pipeline on, or keep the
// simplified 4-step flow (master flag off). Individual stages are gated
// independently and consumed by lib/admissions/state-machine.ts.
const ADMISSIONS_FIELDS = [
  {
    key: 'admissions_pipeline_enabled',
    label: 'Full Admissions Pipeline',
    description:
      'On = full pipeline (document uploads, aptitude, interview, medical as enabled below). Off = simplified 4-step flow (register → pay → staff approve → portal access).',
    type: 'BOOLEAN' as const,
    default: 'false',
  },
  {
    key: 'document_uploads_enabled',
    label: 'Document Uploads Stage',
    description: 'Require applicants to upload required documents.',
    type: 'BOOLEAN' as const,
    default: 'false',
  },
  {
    key: 'aptitude_test_enabled',
    label: 'Aptitude Test Stage',
    description: 'Enable the aptitude testing stage in the pipeline.',
    type: 'BOOLEAN' as const,
    default: 'false',
  },
  {
    key: 'interview_system_enabled',
    label: 'Interview Stage',
    description: 'Enable interview scheduling and evaluation.',
    type: 'BOOLEAN' as const,
    default: 'false',
  },
  {
    key: 'medical_review_enabled',
    label: 'Medical Review Stage',
    description: 'Enable the medical document review stage.',
    type: 'BOOLEAN' as const,
    default: 'false',
  },
]

const FINANCE_FIELDS = [
  {
    key: 'registration_fee',
    label: 'Registration Fee',
    description: 'Standard fee for initial registration',
    type: 'NUMBER' as const,
    default: '500',
  },
  {
    key: 'registration_currency',
    label: 'Registration Currency',
    description: 'Currency used for registration fees',
    type: 'SELECT' as const,
    default: 'GHS',
    options: ['EUR', 'GHS', 'USD'],
  },
  {
    key: 'course_currency',
    label: 'Course Currency',
    description: 'Default currency for course tuition and modules',
    type: 'SELECT' as const,
    default: 'EUR',
    options: ['EUR', 'GHS', 'USD'],
  },
  {
    key: 'exchange_rate_eur_ghs',
    label: 'Manual Rate: EUR to GHS',
    description: 'Fixed exchange rate for Cedis. Leave empty for automated bank rate.',
    type: 'NUMBER' as const,
    default: '',
  },
  {
    key: 'exchange_rate_eur_usd',
    label: 'Manual Rate: EUR to USD',
    description: 'Fixed exchange rate for Dollars. Leave empty for automated bank rate.',
    type: 'NUMBER' as const,
    default: '',
  },
]

const NOTIFICATION_FIELDS = [
  {
    key: 'notify_on_payment',
    label: 'Payment Notifications',
    description: 'Send staff email alerts when payments are submitted',
    type: 'BOOLEAN' as const,
    default: 'true',
  },
  {
    key: 'notify_on_registration',
    label: 'Registration Notifications',
    description: 'Send staff email alerts for new applicants',
    type: 'BOOLEAN' as const,
    default: 'true',
  },
  {
    key: 'smtp_from',
    label: 'Email Sender Address',
    description: 'From address for outgoing emails',
    type: 'STRING' as const,
    default: 'Aerojet Academy <admissions@mail.aerojet-academy.com>',
  },
]

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { tab = 'general' } = await searchParams

  // Fetch settings values and PDF-resolved settings in parallel
  const [existingSettings, pdfSettings] = await Promise.all([
    prismaUnfiltered.systemSetting.findMany({ take: 200 }),
    tab === 'pdf' ? getPDFSettings('') : Promise.resolve(null),
  ])
  const values: Record<string, string> = {}
  for (const s of existingSettings) {
    values[s.key] = s.value
  }

  return (
    <div className="mx-auto w-full px-4 pt-0 pb-8 sm:px-6 lg:px-8">
      <SettingsTabs>
        {/* ── General Tab ── */}
        {tab === 'general' && (
          <div className="space-y-8">
            <SettingsForm
              fields={GENERAL_DETAILS_FIELDS}
              values={values}
              groupLabel="Academy Details"
            />
            <SettingsForm
              fields={GENERAL_REGIONAL_FIELDS}
              values={values}
              groupLabel="Regional Settings"
            />
            <SettingsForm
              fields={GENERAL_FEATURES_FIELDS}
              values={values}
              groupLabel="Public Features"
            />
            <SettingsForm
              fields={GENERAL_ATTENDANCE_FIELDS}
              values={values}
              groupLabel="Attendance Rules"
            />
          </div>
        )}

        {/* ── Admissions Tab ── */}
        {tab === 'admissions' && (
          <SettingsForm
            fields={ADMISSIONS_FIELDS}
            values={values}
            groupLabel="Admissions pipeline"
          />
        )}

        {/* ── Finance Tab ── */}
        {tab === 'finance' && (
          <div className="space-y-8">
            <ExchangeRateDisplay />
            <SettingsForm fields={FINANCE_FIELDS} values={values} groupLabel="Currency settings" />
            <PaymentMethodsManager />
          </div>
        )}

        {/* ── Emails & Comms Tab ── */}
        {tab === 'comms' && (
          <div className="space-y-12">
            <SettingsForm
              fields={NOTIFICATION_FIELDS}
              values={values}
              groupLabel="Notification Preferences"
            />
            <EmailPreviewsTab />
            <EmailRegistryTab />
            <EmailDeliveryTab />
          </div>
        )}

        {/* ── Academic Tab ── */}
        {tab === 'academic' && <CalendarContent />}

        {/* ── Templates Tab ── */}
        {tab === 'templates' && (
          <div className="space-y-12">
            <WelcomeMessagesContent />
            {pdfSettings && <PDFSettingsForm values={values} pdfSettings={pdfSettings} />}
          </div>
        )}

        {/* ── System & Data Tab ── */}
        {tab === 'system' && (
          <div className="space-y-12">
            <SystemSettingsForm values={values} />
            <CustomFieldsContent />
            <BackupManager adminEmail={session.user?.email || ''} />
          </div>
        )}

        {/* ── My Security Tab ── */}
        {tab === 'security' && <SecurityContent userId={session.user.id} />}
      </SettingsTabs>
    </div>
  )
}

async function WelcomeMessagesContent() {
  const welcomeMessages = await getWelcomeMessagesGrouped(prismaUnfiltered as import('@/lib/welcome-messages').WelcomeMessagesPrismaClient)
  return <WelcomeMessagesManager initialMessages={welcomeMessages} />
}
async function SecurityContent({ userId }: { userId: string }) {
  const user = await prismaUnfiltered.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  })
  return (
    <div className="space-y-8">
      <TwoFactorSettings twoFactorEnabled={user?.twoFactorEnabled ?? false} />
      <PasskeySettings />
    </div>
  )
}

async function CalendarContent() {
  const academicYears = await prismaUnfiltered.academicYear.findMany({
    include: {
      semesters: { orderBy: { startDate: 'asc' } },
      _count: { select: { classes: true } },
    },
    orderBy: { startDate: 'desc' },
    take: 200,
  })
  return <AcademicCalendarManager initialYears={academicYears} />
}

async function CustomFieldsContent() {
  const fields = await prismaUnfiltered.customFieldDefinition.findMany({
    orderBy: [{ appliesTo: 'asc' }, { sortOrder: 'asc' }],
    take: 200,
  })
  return <CustomFieldsManager initialFields={fields} />
}
