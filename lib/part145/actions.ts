'use server'

import { revalidatePath } from 'next/cache'
import { requireStaff, requireAdmin } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getLicenseProgress } from '@/lib/license/progress'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

/**
 * Audit 12 — the academy is an EASA Part-147 training organisation linked to a
 * Part-145 maintenance organisation (Aerojet Aviation or a partner). Students
 * pass through the academy and transition their training data into the linked
 * Part-145. This is NOT a full Part-145 build — only the data hand-off.
 */

export async function createPartner145(input: {
  name: string
  easaApprovalRef?: string
  contactEmail?: string
  address?: string
}) {
  try {
    const admin = await requireAdmin()
    if (!input.name?.trim()) return { error: 'Organisation name is required.' }
    const org = await prismaUnfiltered.partner145Organisation.create({
      data: {
        name: input.name.trim(),
        easaApprovalRef: input.easaApprovalRef?.trim() || null,
        contactEmail: input.contactEmail?.trim() || null,
        address: input.address?.trim() || null,
      },
    })
    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'Partner145Organisation',
      entityId: org.id,
      userId: admin.id,
      description: `Added Part-145 partner: ${org.name}`,
    })
    revalidatePath('/staff/part-145')
    return { success: true }
  } catch (e) {
    console.error('[createPartner145]', e)
    return { error: 'Failed to add organisation.' }
  }
}

/** Initiate a transfer and package the student's training data (JSON). */
export async function initiate145Transfer(studentQuery: string, organisationId: string) {
  try {
    const staff = await requireStaff()
    if (!organisationId) return { error: 'Select a Part-145 organisation.' }

    const q = studentQuery.trim()
    const student = await prismaUnfiltered.user.findFirst({
      where: {
        OR: [
          { id: q },
          { email: q },
          { academyEmail: q },
          { studentProfile: { studentId: q } },
        ],
      },
      select: {
        id: true,
        email: true,
        profile: { select: { firstName: true, lastName: true } },
        studentProfile: { select: { studentId: true, enrollmentType: true } },
      },
    })
    if (!student) return { error: 'No student found for that email / ID.' }

    const [results, licenseProgress] = await Promise.all([
      prismaUnfiltered.examResult.findMany({
        where: { userId: student.id, passed: true, examCategory: 'OFFICIAL_EASA' },
        select: { moduleCode: true, percentage: true, createdAt: true },
      }),
      getLicenseProgress(student.id),
    ])

    const dataPackage = {
      packagedAt: new Date().toISOString(),
      student: {
        name: student.profile
          ? `${student.profile.firstName} ${student.profile.lastName}`
          : student.email,
        studentId: student.studentProfile?.studentId ?? null,
        pathway: student.studentProfile?.enrollmentType ?? null,
      },
      passedModules: results.map((r) => ({
        moduleCode: r.moduleCode,
        percentage: r.percentage ? Number(r.percentage) : null,
        date: r.createdAt.toISOString(),
      })),
      licenseProgress: licenseProgress.map((lp) => ({
        category: lp.code,
        passed: lp.passedCount,
        required: lp.totalRequired,
        percentage: lp.percentage,
      })),
    }

    const transfer = await prismaUnfiltered.maintenance145Transfer.create({
      data: {
        userId: student.id,
        organisationId,
        status: 'DATA_PACKAGED',
        initiatedById: staff.id,
        notes: JSON.stringify(dataPackage),
      },
    })
    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'Maintenance145Transfer',
      entityId: transfer.id,
      userId: staff.id,
      description: `Packaged Part-145 transfer for ${student.id}.`,
    })
    revalidatePath('/staff/part-145')
    return { success: true }
  } catch (e) {
    console.error('[initiate145Transfer]', e)
    return { error: 'Failed to initiate transfer.' }
  }
}

export async function advance145Transfer(
  id: string,
  status: 'SENT' | 'ACCEPTED' | 'REJECTED',
  rejectedReason?: string
) {
  try {
    const staff = await requireStaff()
    const t = await prismaUnfiltered.maintenance145Transfer.findUnique({ where: { id } })
    if (!t) return { error: 'Transfer not found.' }
    await prismaUnfiltered.maintenance145Transfer.update({
      where: { id },
      data: {
        status,
        acceptedAt: status === 'ACCEPTED' ? new Date() : null,
        rejectedReason: status === 'REJECTED' ? rejectedReason?.trim() || null : null,
      },
    })
    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'Maintenance145Transfer',
      entityId: id,
      userId: staff.id,
      description: `Part-145 transfer → ${status}`,
    })
    revalidatePath('/staff/part-145')
    return { success: true }
  } catch (e) {
    console.error('[advance145Transfer]', e)
    return { error: 'Failed to update transfer.' }
  }
}
