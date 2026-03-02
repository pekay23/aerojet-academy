import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'
import { triggerAutoEnrollmentIfRequired } from '@/lib/enrollment/engine'
import { generateStudentId } from '@/lib/auth/helpers'

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id

  try {
    const { studyPathway, licenseCodes } = await req.json()

    // Validate using relational pathway codes
    const pathway = await prisma.studyPathwayModel.findUnique({
      where: { code: studyPathway },
    })

    if (!pathway) {
      return NextResponse.json({ error: 'Invalid study pathway selected' }, { status: 400 })
    }

    // Check if a pathway is already locked
    const existingProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true, pathwayId: true },
    })

    if (existingProfile?.pathwayId) {
      return NextResponse.json(
        { error: 'Study pathway is already locked and cannot be changed' },
        { status: 400 }
      )
    }

    let profileId = ''

    await prisma.$transaction(async (tx) => {
      // 1. Create or update StudentProfile
      if (existingProfile) {
        await tx.studentProfile.update({
          where: { userId },
          data: {
            pathwayId: pathway.id,
            studyPathwayLockedAt: new Date(),
            studyPathwayLocked: true,
          },
        })
        profileId = existingProfile.id
      } else {
        const created = await tx.studentProfile.create({
          data: {
            userId,
            studentId: await generateStudentId(),
            pathwayId: pathway.id,
            studyPathwayLockedAt: new Date(),
            studyPathwayLocked: true,
          },
        })
        profileId = created.id
      }

      // 2. Link License Targets
      if (licenseCodes && Array.isArray(licenseCodes)) {
        const licenseCats = await tx.licenseCategory.findMany({
          where: { code: { in: licenseCodes } },
        })

        for (const lc of licenseCats) {
          await tx.studentLicenseTarget.upsert({
            where: {
              studentProfileId_licenseCategoryId: {
                studentProfileId: profileId,
                licenseCategoryId: lc.id,
              },
            },
            update: {},
            create: {
              studentProfileId: profileId,
              licenseCategoryId: lc.id,
            },
          })
        }
      }

      // 3. Ensure they have a Wallet
      const existingWallet = await tx.wallet.findUnique({ where: { userId } })
      if (!existingWallet) {
        await tx.wallet.create({
          data: {
            userId,
            balance: 0,
            reservedBalance: 0,
            availableBalance: 0,
            currency: 'EUR',
          },
        })
      }
    })

    // 4. Trigger Auto-Enrollment (after transaction)
    await triggerAutoEnrollmentIfRequired(profileId)

    await createAuditLog({
      action: 'PATHWAY_SETUP',
      entity: 'student_profiles',
      entityId: userId,
      userId,
      description: `Student chose ${studyPathway} pathway and licenses: ${licenseCodes?.join(', ') || 'none'}. Locked.`,
    })

    return NextResponse.json({
      success: true,
      studyPathway,
      message: 'Pathway locked and auto-enrollment triggered.',
    })
  } catch (error: any) {
    console.error('Pathway selection error:', error)
    return NextResponse.json({ error: 'Failed to process pathway selection' }, { status: 500 })
  }
}
