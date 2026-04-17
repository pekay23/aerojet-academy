import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { Metadata } from 'next'
import { ProgrammeSemester } from './_components/ProgrammesClient'
import ProgrammesClient from './_components/ProgrammesClient'

export const metadata: Metadata = { title: 'Programmes | Staff Portal' }

export default async function ProgrammesPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const programmes = await prisma.fullTimeProgramme.findMany({
    include: {
      programmeYears: {
        orderBy: { yearNumber: 'asc' },
      },
      _count: { select: { enrollments: true } },
    },
    orderBy: { code: 'asc' },
  })

  // Serialize Decimals
  const serialized = programmes.map((p) => ({
    ...p,
    totalFee: p.totalFee.toString(),
    programmeYears: p.programmeYears.map((y) => ({
      ...y,
      yearFeeAmount: y.yearFeeAmount?.toString() ?? null,
      seatConfirmationFee: y.seatConfirmationFee.toString(),
      firstPaymentAmount: y.firstPaymentAmount.toString(),
      semesters: (Array.isArray(y.semesters) ? y.semesters : []) as unknown as ProgrammeSemester[],
      createdAt: y.createdAt.toISOString(),
    })),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  return <ProgrammesClient programmes={serialized} />
}
