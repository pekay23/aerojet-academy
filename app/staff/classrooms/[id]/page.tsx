import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import Link from 'next/link'
import { ArrowLeft, MapPin, Users, Building } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import FloorPlanDesigner from './_components/FloorPlanDesigner'

export const metadata: Metadata = {
  title: 'Classroom Layout | Staff Portal',
  description: 'Design the floor plan and seating layout for a classroom.',
}

export default async function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getAuthSession()
  if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) redirect('/login')

  const { id } = await params

  const classroom = await prismaUnfiltered.classroom.findUnique({
    where: { id },
    include: {
      seats: { orderBy: [{ row: 'asc' }, { col: 'asc' }] },
      _count: { select: { classes: true } },
    },
  })

  if (!classroom) notFound()

  const layout = classroom.layout as { rows: number; cols: number; cells: any[] } | null

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Link
            href="/staff/classrooms"
            className="mb-1 inline-flex w-fit items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-aerojet-sky"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Facilities
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue sm:text-4xl dark:text-white">
            {classroom.name}
          </h1>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-aerojet-sky" />
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
