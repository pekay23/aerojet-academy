import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { unstable_cache } from 'next/cache'

export async function getSystemSetting(key: string, defaultValue: string = ''): Promise<string> {
  return unstable_cache(
    async () => {
      const setting = await prisma.systemSetting.findUnique({
        where: { key },
      })
      return setting?.value ?? defaultValue
    },
    [`setting-${key}`],
    { revalidate: 300, tags: ['settings'] }
  )()
}

export async function isPdfTemplateSystemEnabled(): Promise<boolean> {
  const value = await getSystemSetting('pdf_template_system_enabled', 'false')
  return value === 'true'
}

export async function updateSystemSetting(
  key: string,
  value: string,
  type: string = 'STRING'
): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value, type },
  })
}

export async function getSystemSettings(keys: string[]): Promise<Map<string, string>> {
  return unstable_cache(
    async () => {
      const settings = await prisma.systemSetting.findMany({
        where: { key: { in: keys } },
      })
      const map = new Map<string, string>()
      settings.forEach((s) => map.set(s.key, s.value))
      return Array.from(map.entries()) // Cache returns serializable data
    },
    [`settings-${keys.sort().join('-')}`],
    { revalidate: 300, tags: ['settings'] }
  )().then((entries) => new Map(entries))
}

export async function getExamsConfig() {
  const settings = await getSystemSettings(['exams_open'])

  return {
    isOpen: (settings.get('exams_open') || 'true') === 'true',
  }
}

export async function getRegistrationConfig() {
  const settings = await getSystemSettings([
    'registration_fee',
    'registration_currency',
    'registration_open',
  ])

  return {
    fee: settings.get('registration_fee') || '500',
    currency: settings.get('registration_currency') || 'EUR',
    isOpen: (settings.get('registration_open') || 'true') === 'true',
  }
}

export async function getAdvisoryConfig() {
  const settings = await getSystemSettings(['advisory_enabled', 'advisory_message'])

  return {
    enabled: (settings.get('advisory_enabled') || 'false') === 'true',
    message: settings.get('advisory_message') || '',
  }
}

export async function getFinanceConfig() {
  const settings = await getSystemSettings(['course_currency', 'payment_methods'])

  // Try new PaymentMethod model first
  const bankMethods = await prisma.paymentMethod.findMany({
    where: { isActive: true, type: 'BANK_TRANSFER' },
    orderBy: { sortOrder: 'asc' },
    take: 1,
  })

  if (bankMethods.length > 0) {
    const bank = bankMethods[0]
    return {
      courseCurrency: settings.get('course_currency') || 'EUR',
      bankAccountName: bank.bankAccountName || '',
      bankAccountNumber: bank.bankAccountNumber || '',
      bankName: bank.bankName || '',
      bankSwift: bank.bankSwiftCode || '',
      bankBranch: bank.bankBranch || '',
      paymentMethods: ['BANK_TRANSFER'],
    }
  }

  // Fallback to legacy flat settings
  const legacySettings = await getSystemSettings([
    'bank_account_name',
    'bank_account_number',
    'bank_name',
    'bank_swift',
    'bank_branch',
  ])

  return {
    courseCurrency: settings.get('course_currency') || 'EUR',
    bankAccountName: legacySettings.get('bank_account_name') || '',
    bankAccountNumber: legacySettings.get('bank_account_number') || '',
    bankName: legacySettings.get('bank_name') || 'Fidelity Bank',
    bankSwift: legacySettings.get('bank_swift') || '',
    bankBranch: legacySettings.get('bank_branch') || '',
    paymentMethods: (settings.get('payment_methods') || 'BANK_TRANSFER').split(','),
  }
}

export async function getPaymentSplitConfig() {
  const settings = await getSystemSettings([
    'ft_y1_seat_pct',
    'ft_y1_sem1_pct',
    'ft_y1_sem2_pct',
    'ft_y2_sem1_pct',
    'ft_y2_sem2_pct',
  ])

  return {
    y1SeatPct: Number(settings.get('ft_y1_seat_pct') ?? 40),
    y1Sem1Pct: Number(settings.get('ft_y1_sem1_pct') ?? 30),
    y1Sem2Pct: Number(settings.get('ft_y1_sem2_pct') ?? 30),
    y2Sem1Pct: Number(settings.get('ft_y2_sem1_pct') ?? 50),
    y2Sem2Pct: Number(settings.get('ft_y2_sem2_pct') ?? 50),
  }
}

export async function getEmailConfig() {
  const settings = await getSystemSettings([
    'email_from_name',
    'email_from_address',
    'email_subdomain',
  ])

  return {
    fromName: settings.get('email_from_name') || 'Aerojet Academy',
    fromAddress: settings.get('email_from_address') || 'admissions',
    subdomain: settings.get('email_subdomain') || 'mail',
    rootDomain: 'aerojet-academy.com',
  }
}

export async function getAptitudeConfig() {
  const settings = await getSystemSettings([
    'aptitude_time_limit_minutes',
    'aptitude_pass_threshold_pct',
    'aptitude_math_count',
    'aptitude_english_count',
    'aptitude_engineering_count',
    'aptitude_reasoning_count',
    'aptitude_physics_count',
    'aptitude_max_tab_switches',
    'aptitude_require_for_modular',
    'aptitude_shuffle_questions',
    'aptitude_shuffle_options',
  ])

  return {
    aptitude_time_limit_minutes: Number(settings.get('aptitude_time_limit_minutes') ?? 60),
    aptitude_pass_threshold_pct: Number(settings.get('aptitude_pass_threshold_pct') ?? 50),
    aptitude_math_count: Number(settings.get('aptitude_math_count') ?? 10),
    aptitude_english_count: Number(settings.get('aptitude_english_count') ?? 10),
    aptitude_engineering_count: Number(settings.get('aptitude_engineering_count') ?? 5),
    aptitude_reasoning_count: Number(settings.get('aptitude_reasoning_count') ?? 5),
    aptitude_physics_count: Number(settings.get('aptitude_physics_count') ?? 0),
    aptitude_max_tab_switches: Number(settings.get('aptitude_max_tab_switches') ?? 3),
    aptitude_require_for_modular:
      (settings.get('aptitude_require_for_modular') ?? 'false') === 'true',
    aptitude_shuffle_questions: (settings.get('aptitude_shuffle_questions') ?? 'true') === 'true',
    aptitude_shuffle_options: (settings.get('aptitude_shuffle_options') ?? 'true') === 'true',
  }
}

export async function getShortlistConfig() {
  const settings = await getSystemSettings([
    'shortlist_aptitude_weight',
    'shortlist_profile_weight',
    'shortlist_referral_weight',
    'shortlist_experience_weight',
    'shortlist_auto_threshold',
    'shortlist_auto_reject_threshold',
  ])

  return {
    shortlist_aptitude_weight: Number(settings.get('shortlist_aptitude_weight') ?? 60),
    shortlist_profile_weight: Number(settings.get('shortlist_profile_weight') ?? 20),
    shortlist_referral_weight: Number(settings.get('shortlist_referral_weight') ?? 10),
    shortlist_experience_weight: Number(settings.get('shortlist_experience_weight') ?? 10),
    shortlist_auto_threshold: Number(settings.get('shortlist_auto_threshold') ?? 70),
    shortlist_auto_reject_threshold: Number(settings.get('shortlist_auto_reject_threshold') ?? 30),
  }
}

export async function getInterviewConfig() {
  const settings = await getSystemSettings([
    'interview_max_reschedules',
    'interview_reschedule_cutoff_hours',
    'interview_duration_minutes',
    'interview_daily_capacity',
  ])

  return {
    interview_max_reschedules: Number(settings.get('interview_max_reschedules') ?? 2),
    interview_reschedule_cutoff_hours: Number(
      settings.get('interview_reschedule_cutoff_hours') ?? 24
    ),
    interview_duration_minutes: Number(settings.get('interview_duration_minutes') ?? 60),
    interview_daily_capacity: Number(settings.get('interview_daily_capacity') ?? 10),
  }
}
