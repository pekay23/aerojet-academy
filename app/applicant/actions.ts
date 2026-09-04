'use server'

import { revalidatePath } from 'next/cache'
import { requireApplicant } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export async function updateApplicantProfile(formData: FormData) {
  const user = await requireApplicant()
  const userId = user.id

  const data = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    phone: (formData.get('phone') as string) || null,
    alternatePhone: (formData.get('alternatePhone') as string) || null,
    gender: (formData.get('gender') as string) || null,
    nationality: (formData.get('nationality') as string) || null,
    dateOfBirth: formData.get('dateOfBirth')
      ? new Date(formData.get('dateOfBirth') as string)
      : null,
    address: (formData.get('address') as string) || null,
    city: (formData.get('city') as string) || null,
    state: (formData.get('state') as string) || null,
    country: (formData.get('country') as string) || null,
    postalCode: (formData.get('postalCode') as string) || null,
    emergencyContactName: (formData.get('emergencyContactName') as string) || null,
    emergencyContactPhone: (formData.get('emergencyContactPhone') as string) || null,
    emergencyContactRelation: (formData.get('emergencyContactRelation') as string) || null,
  }

  if (!data.firstName || !data.lastName) {
    return { error: 'First name and last name are required.' }
  }

  try {
    await prisma.profile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    })

    revalidatePath('/applicant')
    revalidatePath('/applicant/profile')
    revalidatePath('/applicant/application/status')

    return { success: true }
  } catch (err) {
    console.error('updateApplicantProfile error:', err)
    return { error: 'Failed to save profile. Please try again.' }
  }
}
