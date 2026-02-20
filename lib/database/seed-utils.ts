// lib/database/seed-utils.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createAdminUser(userData: any) {
  return prisma.user.create({
    data: {
      ...userData,
      emailVerified: new Date(),
      role: 'ADMIN', // FIX: Changed "SUPER_ADMIN" to "ADMIN"
    },
  });
}

export async function createSystemSettings(settingsData: any[]) {
  const createOrUpdateSettings = settingsData.map(setting => {
    const { key, value, type } = setting;
    return prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value,
        type, // FIX: Ensured 'type' is included, as it's required
      }, // The invalid 'group' property was here and has been removed
    });
  });

  return prisma.$transaction(createOrUpdateSettings);
}
