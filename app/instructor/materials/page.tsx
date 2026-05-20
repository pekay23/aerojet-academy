import { Metadata } from 'next'

import { requireInstructor } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import MaterialsManager from './_components/MaterialsManager'

export const metadata: Metadata = { title: 'Teaching Materials | Instructor Portal' }
export const dynamic = 'force-dynamic'

export default async function InstructorMaterialsPage() {
  const user = await requireInstructor()
  const instructorProfile = await getInstructorProfileByUserId(user.id)

  const [materials, classes] = await Promise.all([
    prismaUnfiltered.teachingMaterial.findMany({
      where: { uploadedById: user.id },
      orderBy: { createdAt: 'desc' },
    }),
    instructorProfile
      ? prismaUnfiltered.class.findMany({
          where: { instructorId: instructorProfile.id },
          select: { courseId: true, course: { select: { code: true, name: true } } },
        })
      : Promise.resolve([]),
  ])

  const courseOptions = Array.from(
    new Map(
      classes.map((c) => [
        c.courseId,
        { id: c.courseId, label: `${c.course.code} — ${c.course.name}` },
      ])
    ).values()
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Teaching Materials
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Share lesson materials with your classes. Files are stored in organized Supabase
          storage.
        </p>
      </div>
      <MaterialsManager
        materials={serializePrisma(materials)}
        courseOptions={courseOptions}
      />
    </div>
  )
}
