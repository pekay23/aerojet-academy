import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma/client'
import { Metadata } from 'next'
import {
  Settings,
  Save,
  School,
  Globe,
  Clock,
  DollarSign,
  Mail,
  Shield,
  Sparkles,
} from 'lucide-react'
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
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Configure your academy platform settings and preferences
          </p>
        </div>
        <Link
          href="/staff/settings/email-previews"
          className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:group-hover:bg-blue-900/50">
            <Mail className="h-4 w-4" />
          </div>
          <span className="flex items-center gap-2">
            Email Previews
            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-black text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              NEW
            </span>
          </span>
        </Link>
      </div>

      <form action="/api/staff/settings" method="POST" className="space-y-6">
        {DEFAULT_SETTINGS.map(({ group, icon: Icon, color, keys }) => (
          <div
            key={group}
            className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 shadow-sm transition-all hover:shadow-xl hover:shadow-blue-500/5 dark:border-white/5 dark:bg-[#111827]/60 dark:backdrop-blur-xl"
          >
            {/* Group header */}
            <div className="flex items-center gap-4 border-b border-slate-100/60 bg-slate-50/40 px-8 py-6 dark:border-white/5 dark:bg-white/2">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner ${color} dark:bg-opacity-20`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-[#002a5c] uppercase dark:text-white">
                  {group}
                </h2>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Configuration Group
                </p>
              </div>
            </div>

            {/* Settings rows */}
            <div className="divide-y divide-slate-100/60 dark:divide-white/5">
              {keys.map(({ key, label, description, type, default: defaultVal }) => {
                const currentValue = settingMap.get(key) ?? defaultVal
                return (
                  <div
                    key={key}
                    className="group flex flex-col justify-between gap-6 px-8 py-7 transition-colors hover:bg-slate-50/50 md:flex-row md:items-center dark:hover:bg-white/1"
                  >
                    <div className="max-w-xl flex-1">
                      <label
                        htmlFor={key}
                        className="block text-sm font-bold text-slate-900 dark:text-slate-100"
                      >
                        {label}
                      </label>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {description}
                      </p>
                    </div>
                    <div className="w-full shrink-0 md:w-72">
                      {type === 'BOOLEAN' ? (
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            {currentValue === 'true' ? 'Active' : 'Disabled'}
                          </span>
                          <input type="hidden" name={`${key}__type`} value="BOOLEAN" />
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              id={key}
                              name={key}
                              type="checkbox"
                              defaultChecked={currentValue === 'true'}
                              className="peer sr-only"
                            />
                            <div className="peer h-7 w-12 rounded-full bg-slate-200 shadow-inner transition-colors peer-checked:bg-[#002a5c] peer-focus:ring-4 peer-focus:ring-[#002a5c]/20 peer-focus:outline-none after:absolute after:top-[4px] after:left-[4px] after:h-[1.35rem] after:w-[1.35rem] after:rounded-full after:bg-white after:shadow-md after:transition-all peer-checked:after:translate-x-5 peer-checked:after:border-white dark:bg-slate-700 dark:peer-checked:bg-blue-600 dark:peer-focus:ring-blue-600/30"></div>
                          </label>
                        </div>
                      ) : (
                        <div className="group/input relative">
                          <input type="hidden" name={`${key}__type`} value={type} />
                          <input
                            id={key}
                            name={key}
                            type={type === 'NUMBER' ? 'number' : 'text'}
                            defaultValue={currentValue}
                            className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-[#002a5c] focus:ring-4 focus:ring-[#002a5c]/5 focus:outline-none dark:border-white/10 dark:bg-black/20 dark:text-white dark:focus:border-blue-500/50 dark:focus:ring-blue-500/10"
                          />
                        </div>
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
