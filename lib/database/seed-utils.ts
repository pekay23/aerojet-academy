// lib/database/seed-utils.ts

import prisma from '@/lib/prisma/client'

export async function createAdminUser(userData: Record<string, unknown>) {
  return prisma.user.create({
    data: {
      ...userData,
      emailVerified: new Date(),
      role: 'ADMIN',
    } as unknown as Parameters<typeof prisma.user.create>[0]['data'],
  })
}

export async function createSystemSettings(settingsData: Array<Record<string, unknown>>) {
  const createOrUpdateSettings = settingsData.map((setting) => {
    const { key, value, type } = setting
    return prisma.systemSetting.upsert({
      where: { key: key as string },
      update: { value: value as string },
      create: {
        key: key as string,
        value: value as string,
        type: type as string,
      },
    })
  })

  return prisma.$transaction(createOrUpdateSettings)
}
