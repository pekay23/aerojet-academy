import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Metadata } from 'next'
import { serializePrisma } from '@/lib/utils/serialization'
import { ProgrammeSemester } from './_components/ProgrammesClient'
import ProgrammesClient from './_components/ProgrammesClient'

export const metadata: Metadata = { title: 'Programmes | Staff Portal' }

export default async function ProgrammesPage() {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  const programmes = await prismaUnfiltered.fullTimeProgramme.findMany({
    include: {
      programmeYears: {
        orderBy: { yearNumber: 'asc' },
      },
      _count: { select: { enrollments: true } },
    },
    orderBy: { code: 'asc' },
  })

  const serialized = serializePrisma(programmes).map((p) => ({
    ...p,
    programmeYears: p.programmeYears.map((y) => ({
      ...y,
      semesters: (Array.isArray(y.semesters) ? y.semesters : []) as unknown as ProgrammeSemester[],
    })),
  }))

  return <ProgrammesClient programmes={serialized} />
}
