import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
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
import ExchangeRateDisplay from './_components/ExchangeRateDisplay'
import TwoFactorSettings from './_components/TwoFactorSettings'
import CustomFieldsManager from './custom-fields/_components/CustomFieldsManager'

export const metadata: Metadata = { title: 'Settings | Staff Portal' }
export const dynamic = 'force-dynamic'

// ── Field definitions per tab ─────────────────────────────────────────────

const GENERAL_FIELDS = [
  { key: 'academy_name', label: 'Academy Name', description: 'The official name of the aviation academy', type: 'STRING' as const, default: 'Aerojet Aviation Academy' },
  { key: 'academy_email', label: 'Contact Email', description: 'Main contact email address for general enquiries', type: 'STRING' as const, default: 'info@aerojet.aviation' },
  { key: 'academy_phone', label: 'Contact Phone', description: 'Main contact phone number for the academy', type: 'STRING' as const, default: '' },
  { key: 'academy_address', label: 'Address', description: 'Physical location of the aviation academy', type: 'STRING' as const, default: '' },
  { key: 'registration_open', label: 'Accept New Registrations', description: 'Enable or disable the public registration form', type: 'BOOLEAN' as const, default: 'true' },
]

const FINANCE_FIELDS = [
  { key: 'registration_fee', label: 'Registration Fee', description: 'Standard fee for initial registration', type: 'NUMBER' as const, default: '500' },
  { key: 'registration_currency', label: 'Registration Currency', description: 'Currency used for registration fees', type: 'SELECT' as const, default: 'GHS', options: ['EUR', 'GHS', 'USD'] },
  { key: 'course_currency', label: 'Course Currency', description: 'Default currency for course tuition and modules', type: 'SELECT' as const, default: 'EUR', options: ['EUR', 'GHS', 'USD'] },
  { key: 'exchange_rate_eur_ghs', label: 'Manual Rate: EUR to GHS', description: 'Fixed exchange rate for Cedis. Leave empty for automated bank rate.', type: 'NUMBER' as const, default: '' },
  { key: 'exchange_rate_eur_usd', label: 'Manual Rate: EUR to USD', description: 'Fixed exchange rate for Dollars. Leave empty for automated bank rate.', type: 'NUMBER' as const, default: '' },
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
  const existingSettings = await prismaUnfiltered.systemSetting.findMany({ take: 200 })
  const values: Record<string, string> = {}
  for (const s of existingSettings) {
    values[s.key] = s.value
  }

  return (
    <div className="mx-auto w-full max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
      <SettingsTabs>
        {/* ── General Tab ── */}
        {tab === 'general' && (
          <SettingsForm fields={GENERAL_FIELDS} values={values} groupLabel="General settings" />
        )}

        {/* ── Finance Tab ── */}
        {tab === 'finance' && (
          <div className="space-y-8">
            <ExchangeRateDisplay />
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

        {/* ── Custom Fields Tab ── */}
        {tab === 'custom-fields' && <CustomFieldsContent />}

        {/* ── Security Tab ── */}
        {tab === 'security' && <SecurityContent userId={session.user.id} />}

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
  const welcomeMessages = await getWelcomeMessagesGrouped(prismaUnfiltered)
  return <WelcomeMessagesManager initialMessages={welcomeMessages} />
}

import { PasskeySettings } from './_components/PasskeySettings'

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
