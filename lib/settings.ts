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
