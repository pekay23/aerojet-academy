'use server'

import prisma from '@/lib/prisma/client'
import { getAuthSession, requireStaff, requireAuth } from '@/lib/auth/helpers'
import { serializePrisma } from '@/lib/utils/serialization'
import { revalidatePath } from 'next/cache'

export async function getAdminResources() {
  await requireStaff()

  const resources = await prisma.generalResource.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return serializePrisma(resources)
}

export async function getStudentResources() {
  await requireAuth() // Standard student check can be more specific if needed

  const resources = await prisma.generalResource.findMany({
    where: {
      showToStudents: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return serializePrisma(resources)
}

export async function upsertResource(data: {
  id?: string
  name: string
  description?: string
  url: string
  type: string
  category: string
  showToInstructors: boolean
  showToStaff: boolean
  showToStudents: boolean
}) {
  await requireStaff()

  const resource = await prisma.generalResource.upsert({
    where: { id: data.id || 'new' },
    update: {
      name: data.name,
      description: data.description,
      url: data.url,
      type: data.type,
      category: data.category,
      showToInstructors: data.showToInstructors,
      showToStaff: data.showToStaff,
      showToStudents: data.showToStudents,
    },
    create: {
      name: data.name,
      description: data.description,
      url: data.url,
      type: data.type,
      category: data.category,
      showToInstructors: data.showToInstructors,
      showToStaff: data.showToStaff,
      showToStudents: data.showToStudents,
    },
  })

  revalidatePath('/instructor/resources')
  revalidatePath('/staff/resources')
  revalidatePath('/student/resources')
  return serializePrisma(resource)
}

export async function deleteResource(id: string) {
  await requireStaff()

  await prisma.generalResource.delete({
    where: { id },
  })

  revalidatePath('/instructor/resources')
  revalidatePath('/staff/resources')
  revalidatePath('/student/resources')
  return { success: true }
}
