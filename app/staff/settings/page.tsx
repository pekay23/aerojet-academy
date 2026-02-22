import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { Metadata } from 'next'
import { Settings, Save, School, Globe, Clock, DollarSign, Mail, Shield } from 'lucide-react'
import WelcomeMessagesManager from './_components/WelcomeMessagesManager'
import { getWelcomeMessagesGrouped } from '@/lib/welcome-messages'

export const metadata: Metadata = { title: 'Settings | Staff Portal' }

const DEFAULT_SETTINGS = [
  {
    group: 'Academy',
    icon: School,
    color: 'bg-blue-50 text-blue-600',
    keys: [
      {
        key: 'academy_name',
        label: 'Academy Name',
        description: 'The official name of the aviation academy',
        type: 'STRING',
        default: 'Aerojet Aviation Academy',
      },
      {
        key: 'academy_email',
        label: 'Contact Email',
        description: 'Main contact email address',
        type: 'STRING',
        default: 'info@aerojet.aviation',
      },
      {
        key: 'academy_phone',
        label: 'Contact Phone',
        description: 'Main contact phone number',
        type: 'STRING',
        default: '',
      },
      {
        key: 'academy_address',
        label: 'Address',
        description: 'Physical address of the academy',
        type: 'STRING',
        default: '',
      },
    ],
  },
  {
    group: 'Registration',
    icon: Shield,
    color: 'bg-green-50 text-green-600',
    keys: [
      {
        key: 'registration_fee',
        label: 'Registration Fee',
        description: 'Default registration fee for new applicants',
        type: 'NUMBER',
        default: '500',
      },
      {
        key: 'registration_open',
        label: 'Accept New Registrations',
        description: 'Allow new applicants to register on the platform',
        type: 'BOOLEAN',
        default: 'true',
      },
    ],
  },
  {
    group: 'Finance',
    icon: DollarSign,
    color: 'bg-amber-50 text-amber-600',
    keys: [
      {
        key: 'registration_currency',
        label: 'Registration Currency',
        description: 'Currency used for registration fees',
        type: 'STRING',
        default: 'EUR',
      },
      {
        key: 'course_currency',
        label: 'Course Currency',
        description: 'Currency used for course-related fees',
        type: 'STRING',
        default: 'EUR',
      },
      {
        key: 'payment_methods',
        label: 'Accepted Payment Methods',
        description: 'Comma-separated list: BANK_TRANSFER,MOBILE_MONEY,CARD',
        type: 'STRING',
        default: 'BANK_TRANSFER,MOBILE_MONEY',
      },
      {
        key: 'bank_name',
        label: 'Bank Name',
        description: 'Name of the academy bank',
        type: 'STRING',
        default: '',
      },
      {
        key: 'bank_account_name',
        label: 'Bank Account Name',
        description: 'Name on the academy bank account',
        type: 'STRING',
        default: '',
      },
      {
        key: 'bank_account_number',
        label: 'Bank Account Number',
        description: 'Academy bank account number',
        type: 'STRING',
        default: '',
      },
      {
        key: 'bank_currency',
        label: 'Bank Currency',
        description: 'Currency for the bank account (e.g., GHS, EUR)',
        type: 'STRING',
        default: 'GHS',
      },
      {
        key: 'bank_swift',
        label: 'Swift / BIC Code',
        description: 'Academy bank Swift or BIC code',
        type: 'STRING',
        default: '',
      },
      {
        key: 'bank_branch',
        label: 'Bank Branch',
        description: 'Branch name or code',
        type: 'STRING',
        default: '',
      },
    ],
  },
  {
    group: 'Notifications',
    icon: Mail,
    color: 'bg-purple-50 text-purple-600',
    keys: [
      {
        key: 'notify_on_payment',
        label: 'Payment Notifications',
        description: 'Send staff email alerts when payments are submitted',
        type: 'BOOLEAN',
        default: 'true',
      },
      {
        key: 'notify_on_registration',
        label: 'Registration Notifications',
        description: 'Send staff email alerts for new applicants',
        type: 'BOOLEAN',
        default: 'true',
      },
      {
        key: 'smtp_from',
        label: 'Email Sender Address',
        description: 'From address for outgoing emails',
        type: 'STRING',
        default: 'noreply@aerojet.aviation',
      },
    ],
  },
  {
    group: 'System',
    icon: Globe,
    color: 'bg-slate-100 text-slate-600',
    keys: [
      {
        key: 'timezone',
        label: 'Timezone',
        description: 'Default timezone for dates and times',
        type: 'STRING',
        default: 'Africa/Nairobi',
      },
      {
        key: 'date_format',
        label: 'Date Format',
        description: 'Display format for dates',
        type: 'STRING',
        default: 'DD/MM/YYYY',
      },
      {
        key: 'session_timeout_hours',
        label: 'Session Timeout (hours)',
        description: 'How long before user sessions expire',
        type: 'NUMBER',
        default: '8',
      },
    ],
  },
]

export default async function SettingsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  // Fetch existing settings from DB
  const existingSettings = await prisma.systemSetting.findMany()
  const settingMap = new Map(existingSettings.map((s) => [s.key, s.value]))

  const welcomeMessages = await getWelcomeMessagesGrouped(prisma)

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">
          Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Configure your academy platform settings
        </p>
      </div>

      <form action="/api/staff/settings" method="POST" className="space-y-6">
        {DEFAULT_SETTINGS.map(({ group, icon: Icon, color, keys }) => (
          <div
            key={group}
            className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
          >
            {/* Group header */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{group}</h2>
            </div>

            {/* Settings rows */}
            <div className="divide-y divide-slate-50">
              {keys.map(({ key, label, description, type, default: defaultVal }) => {
                const currentValue = settingMap.get(key) ?? defaultVal
                return (
                  <div key={key} className="flex items-center gap-6 px-6 py-5">
                    <div className="flex-1">
                      <label
                        htmlFor={key}
                        className="block text-sm font-bold text-slate-900 dark:text-slate-200"
                      >
                        {label}
                      </label>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {description}
                      </p>
                    </div>
                    <div className="w-72 shrink-0">
                      {type === 'BOOLEAN' ? (
                        <div className="flex items-center gap-3">
                          <input type="hidden" name={`${key}__type`} value="BOOLEAN" />
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              id={key}
                              name={key}
                              type="checkbox"
                              defaultChecked={currentValue === 'true'}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-[#002a5c] peer-focus:ring-2 peer-focus:ring-[#002a5c]/30 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full dark:bg-slate-900"></div>
                          </label>
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {currentValue === 'true' ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      ) : (
                        <>
                          <input type="hidden" name={`${key}__type`} value={type} />
                          <input
                            id={key}
                            name={key}
                            type={type === 'NUMBER' ? 'number' : 'text'}
                            defaultValue={currentValue}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#002a5c] focus:ring-2 focus:ring-[#002a5c]/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                          />
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-[#002a5c] px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#003875]"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </button>
        </div>
      </form>

      {/* Welcome Messages — separate interactive section */}
      <div className="mt-6">
        <WelcomeMessagesManager initialMessages={welcomeMessages} />
      </div>
    </div>
  )
}
