import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { unstable_cache } from 'next/cache'

export async function getSystemSetting(key: string, defaultValue: string = ''): Promise<string> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key },
  })
  return setting?.value ?? defaultValue
}

export async function updateSystemSetting(key: string, value: string, type: string = 'STRING'): Promise<void> {
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
    rootDomain: 'aerojet-academy.com', // Base domain for the academy
  }
}
