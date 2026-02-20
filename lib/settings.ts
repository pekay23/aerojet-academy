import prisma from '@/lib/prisma/client'

export async function getSystemSetting(key: string, defaultValue: string = ''): Promise<string> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key },
  })
  return setting?.value ?? defaultValue
}

export async function getSystemSettings(keys: string[]): Promise<Map<string, string>> {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { in: keys },
    },
  })

  const map = new Map<string, string>()
  settings.forEach((s) => map.set(s.key, s.value))
  return map
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
  const settings = await getSystemSettings([
    'course_currency',
    'bank_account_name',
    'bank_account_number',
    'bank_name',
    'payment_methods',
  ])

  return {
    courseCurrency: settings.get('course_currency') || 'EUR',
    bankAccountName: settings.get('bank_account_name') || '',
    bankAccountNumber: settings.get('bank_account_number') || '',
    bankName: settings.get('bank_name') || 'Fidelity Bank',
    paymentMethods: (settings.get('payment_methods') || 'BANK_TRANSFER').split(','),
  }
}
