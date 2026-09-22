import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Plus, Users, MapPin, Building, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import ClassesPagination from '../_components/ClassesPagination'

export const metadata: Metadata = {
  title: 'Classrooms | Staff Portal',
  description: 'Manage physical rooms and lab spaces.',
}

interface ClassroomsPageProps {
  searchParams: Promise<{ page?: string; limit?: string }>
}

export default async function ClassroomsPage({ searchParams }: ClassroomsPageProps) {
  const session = await getAuthSession()
  if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) redirect('/login')

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(params.limit || '24', 10) || 24))
  const skip = (page - 1) * limit

  const [classrooms, total] = await Promise.all([
    prismaUnfiltered.classroom.findMany({
      select: {
        id: true,
        name: true,
        capacity: true,
        type: true,
        _count: { select: { classes: true } },
      },
      orderBy: { name: 'asc' },
      take: limit,
      skip,
    }),
    prismaUnfiltered.classroom.count(),
  ])

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-[1400px] space-y-8 duration-700">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-aerojet-blue text-3xl font-black tracking-tight sm:text-4xl dark:text-white">
            Facilities Management
          </h1>
          <p className="flex items-center gap-2 text-base font-medium text-slate-500 dark:text-slate-400">
            <Building className="text-aerojet-sky h-5 w-5" />
            Manage classrooms, labs, and venue capacities.
          </p>
        </div>
        <Link
          href="/staff/classrooms/create"
          className="bg-aerojet-blue shadow-aerojet-blue/20 hover:bg-aerojet-sky inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-white shadow-lg transition-all hover:scale-105 active:scale-95 dark:bg-slate-800 dark:shadow-none dark:hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" />
          Add Room
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {classrooms.map((room) => (
          <div
            key={room.id}
            className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20">
                <MapPin className="h-6 w-6" />
              </div>
              <Badge variant="outline" className="text-[10px] font-black uppercase">
                {room.type || 'Standard'}
              </Badge>
            </div>

            <h3 className="text-aerojet-blue text-xl font-black dark:text-white">{room.name}</h3>

            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Users className="h-4 w-4 text-slate-400" />
                Capacity: {room.capacity} seats
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Building className="h-4 w-4 text-slate-400" />
                Active Classes: {room._count.classes}
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Link
                href={`/staff/classrooms/${room.id}`}
                className="text-aerojet-sky hover:text-aerojet-blue inline-flex items-center gap-1.5 text-xs font-bold transition-colors"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Design Floor Plan
              </Link>
            </div>
          </div>
        ))}

        {classrooms.length === 0 && (
          <div className="col-span-full flex h-60 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <MapPin className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-sm font-medium text-slate-400">No rooms configured.</p>
          </div>
        )}
      </div>

      <ClassesPagination page={page} perPage={limit} total={total} />
    </div>
  )
}
