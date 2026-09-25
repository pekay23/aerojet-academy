import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { notFound } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import Link from 'next/link'
import { ArrowLeft, MapPin, Users, Building } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import FloorPlanDesigner, { type LayoutData } from './_components/FloorPlanDesigner'

export const metadata: Metadata = {
  title: 'Classroom Layout | Staff Portal',
  description: 'Design the floor plan and seating layout for a classroom.',
}

export default async function ClassroomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role))
    return await redirectToLogin()

  const { id } = await params

  const classroom = await prismaUnfiltered.classroom.findUnique({
    where: { id },
    include: {
      seats: { orderBy: [{ row: 'asc' }, { col: 'asc' }] },
      _count: { select: { classes: true } },
    },
  })

  if (!classroom) notFound()

  const layout = classroom.layout as unknown as LayoutData | null

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-350 space-y-8 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Link
            href="/staff/classrooms"
            className="hover:text-aerojet-sky mb-1 inline-flex w-fit items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Facilities
          </Link>
          <h1 className="text-aerojet-blue text-3xl font-black tracking-tight sm:text-4xl dark:text-white">
            {classroom.name}
          </h1>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="text-aerojet-sky h-4 w-4" />
              {classroom.type || 'Standard Room'}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-400" />
              Capacity: {classroom.capacity}
            </span>
            <span className="flex items-center gap-1.5">
              <Building className="h-4 w-4 text-slate-400" />
              {classroom._count.classes} classes
            </span>
          </div>
        </div>
        <Badge variant="outline" className="h-fit text-xs font-black uppercase">
          {classroom.seats.length} seats configured
        </Badge>
      </div>

      {/* Floor Plan Designer */}
      <FloorPlanDesigner
        classroomId={classroom.id}
        classroomName={classroom.name}
        initialLayout={layout}
      />
    </div>
  )
}
