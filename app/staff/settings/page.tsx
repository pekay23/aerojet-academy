import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { Metadata } from 'next'
import SettingsTabs from './_components/SettingsTabs'
import SettingsForm from './_components/SettingsForm'
import SystemSettingsForm from './_components/SystemSettingsForm'
import PaymentMethodsManager from './_components/PaymentMethodsManager'
import WelcomeMessagesManager from './_components/WelcomeMessagesManager'
import { getWelcomeMessagesGrouped } from '@/lib/welcome-messages'
import EmailPreviewsPage from './email-previews/page'
import AcademicCalendarManager from './academic-calendar/_components/AcademicCalendarManager'
import BackupManager from './_components/BackupManager'

export const metadata: Metadata = { title: 'Settings | Staff Portal' }
export const dynamic = 'force-dynamic'

// ── Field definitions per tab ─────────────────────────────────────────────

const GENERAL_FIELDS = [
  { key: 'academy_name', label: 'Academy Name', description: 'The official name of the aviation academy', type: 'STRING' as const, default: 'Aerojet Aviation Academy' },
  { key: 'academy_email', label: 'Contact Email', description: 'Main contact email address', type: 'STRING' as const, default: 'info@aerojet.aviation' },
  { key: 'academy_phone', label: 'Contact Phone', description: 'Main contact phone number', type: 'STRING' as const, default: '' },
  { key: 'academy_address', label: 'Address', description: 'Physical address of the academy', type: 'STRING' as const, default: '' },
  { key: 'registration_fee', label: 'Registration Fee', description: 'Default registration fee for new applicants', type: 'NUMBER' as const, default: '500' },
  { key: 'registration_open', label: 'Accept New Registrations', description: 'Allow new applicants to register on the platform', type: 'BOOLEAN' as const, default: 'true' },
]

const FINANCE_FIELDS = [
  { key: 'registration_currency', label: 'Registration Currency', description: 'Currency used for registration fees', type: 'SELECT' as const, default: 'EUR', options: ['EUR', 'GHS', 'USD'] },
  { key: 'course_currency', label: 'Course Currency', description: 'Currency used for course-related fees', type: 'SELECT' as const, default: 'EUR', options: ['EUR', 'GHS', 'USD'] },
  { key: 'exchange_rate_eur_ghs', label: 'Manual Rate: EUR to GHS', description: 'Set a fixed rate for Cedis. Leave empty to use automated bank rate.', type: 'NUMBER' as const, default: '' },
  { key: 'exchange_rate_eur_usd', label: 'Manual Rate: EUR to USD', description: 'Set a fixed rate for Dollars. Leave empty to use automated bank rate.', type: 'NUMBER' as const, default: '' },
]

const NOTIFICATION_FIELDS = [
  { key: 'notify_on_payment', label: 'Payment Notifications', description: 'Send staff email alerts when payments are submitted', type: 'BOOLEAN' as const, default: 'true' },
  { key: 'notify_on_registration', label: 'Registration Notifications', description: 'Send staff email alerts for new applicants', type: 'BOOLEAN' as const, default: 'true' },
  { key: 'smtp_from', label: 'Email Sender Address', description: 'From address for outgoing emails', type: 'STRING' as const, default: 'noreply@aerojet.aviation' },
]

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { tab = 'general' } = await searchParams

  // Fetch settings values from DB
  const existingSettings = await prisma.systemSetting.findMany()
  const values: Record<string, string> = {}
  for (const s of existingSettings) {
    values[s.key] = s.value
  }

  return (
    <div className="mx-auto max-w-5xl">
      <SettingsTabs>
        {/* ── General Tab ── */}
        {tab === 'general' && (
          <SettingsForm fields={GENERAL_FIELDS} values={values} groupLabel="General settings" />
        )}

        {/* ── Finance Tab ── */}
        {tab === 'finance' && (
          <div className="space-y-8">
            <SettingsForm fields={FINANCE_FIELDS} values={values} groupLabel="Currency settings" />
            <PaymentMethodsManager />
          </div>
        )}

        {/* ── Notifications Tab ── */}
        {tab === 'notifications' && (
          <SettingsForm fields={NOTIFICATION_FIELDS} values={values} groupLabel="Notification settings" />
        )}

        {/* ── System Tab ── */}
        {tab === 'system' && <SystemSettingsForm values={values} />}

        {/* ── Welcome Messages Tab ── */}
        {tab === 'welcome' && <WelcomeMessagesContent />}

        {/* ── Email Templates Tab ── */}
        {tab === 'emails' && <EmailPreviewsPage />}

        {/* ── Academic Calendar Tab ── */}
        {tab === 'calendar' && <CalendarContent />}

        {/* ── Backup Tab ── */}
        {tab === 'backup' && <BackupManager adminEmail={session.user?.email || ''} />}
      </SettingsTabs>
    </div>
  )
}

async function WelcomeMessagesContent() {
  const welcomeMessages = await getWelcomeMessagesGrouped(prisma)
  return <WelcomeMessagesManager initialMessages={welcomeMessages} />
}

async function CalendarContent() {
  const academicYears = await prisma.academicYear.findMany({
    include: {
      semesters: { orderBy: { startDate: 'asc' } },
      _count: { select: { classes: true } },
    },
    orderBy: { startDate: 'desc' },
  })
  return <AcademicCalendarManager initialYears={academicYears} />
}
