import { Metadata } from 'next'

import { requireInstructor } from '@/lib/auth/helpers'
import { serializePrisma } from '@/lib/utils/serialization'
import {
  getInstructorMaterials,
  getInstructorCourseAndClassOptions,
} from '@/lib/teaching-materials/actions'
import MaterialsManager from './_components/MaterialsManager'

export const metadata: Metadata = { title: 'Teaching Materials | Instructor Portal' }
export const dynamic = 'force-dynamic'

export default async function InstructorMaterialsPage() {
  await requireInstructor()

  const [materials, options] = await Promise.all([
    getInstructorMaterials(),
    getInstructorCourseAndClassOptions(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
          Teaching Materials
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Share lesson materials with your classes. Files are stored in organized Supabase storage.
        </p>
      </div>
      <MaterialsManager
        materials={serializePrisma(materials)}
        courseOptions={options.courses}
        classOptions={options.classes}
      />
    </div>
  )
}
