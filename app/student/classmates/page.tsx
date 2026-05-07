import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Users, Search, GraduationCap, BookOpen, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Classmates | Student Portal',
  description: 'Connect with your fellow batch-mates and classmates.',
}

export default async function ClassmatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: 'batch' | 'classmates' }>
}) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'STUDENT') redirect('/login')

  const { q = '', filter = 'batch' } = await searchParams

  // Get current student's profile to find their batch
  const studentProfile = await prismaUnfiltered.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      academicYear: true,
    },
  })

  if (!studentProfile || !studentProfile.academicYearId) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
          <Users className="h-12 w-12 text-slate-400" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Batch Not Assigned</h2>
          <p className="text-slate-500 dark:text-slate-400">
            You haven't been assigned to an academic batch yet.
          </p>
        </div>
      </div>
    )
  }

  const batchName = studentProfile.academicYear?.name || 'Current Batch'

  let classPeerIds: string[] | undefined = undefined;

  if (filter === 'classmates') {
    const myClasses = await prismaUnfiltered.attendanceRecord.findMany({
      where: { userId: session.user.id },
      distinct: ['classId'],
      select: { classId: true },
    })
    
    if (myClasses.length > 0) {
      const peersInClasses = await prismaUnfiltered.attendanceRecord.findMany({
        where: { 
          classId: { in: myClasses.map(c => c.classId) },
          userId: { not: session.user.id }
        },
        distinct: ['userId'],
        select: { userId: true },
      })
      classPeerIds = peersInClasses.map(p => p.userId)
    } else {
      classPeerIds = []
    }
  }

  // Fetch classmates (sharing same academic year)
  // We exclude the current user and filter by search query if provided
  const peers = await prismaUnfiltered.studentProfile.findMany({
    where: {
      academicYearId: studentProfile.academicYearId,
      userId: classPeerIds !== undefined ? { in: classPeerIds } : { not: session.user.id },
      user: {
        OR: [
          { profile: { firstName: { contains: q, mode: 'insensitive' } } },
          { profile: { lastName: { contains: q, mode: 'insensitive' } } },
          { academyEmail: { contains: q, mode: 'insensitive' } },
        ],
      },
    },
    include: {
      user: {
        include: {
          profile: true,
          studentProfile: {
            include: {
              pathwayRel: true,
            },
          },
        },
      },
    },
    orderBy: {
      user: {
        profile: {
          firstName: 'asc',
        },
      },
    },
  })

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue sm:text-4xl dark:text-white">
            Classmate Directory
          </h1>
          <p className="flex items-center gap-2 text-base font-medium text-slate-500 dark:text-slate-400">
            <Sparkles className="h-5 w-5 text-aerojet-sky" />
            Connect with your peers from <span className="font-bold text-aerojet-blue dark:text-aerojet-sky">{batchName}</span>.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            className="pl-10 rounded-2xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            defaultValue={q}
          />
        </div>
        <div className="flex gap-2">
          <Link href={`/student/classmates?filter=batch${q ? `&q=${encodeURIComponent(q)}` : ''}`}>
            <Badge 
              variant={filter === 'batch' ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-1.5 rounded-full text-xs font-bold"
            >
              All Batch-mates
            </Badge>
          </Link>
          <Link href={`/student/classmates?filter=classmates${q ? `&q=${encodeURIComponent(q)}` : ''}`}>
            <Badge 
              variant={filter === 'classmates' ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-1.5 rounded-full text-xs font-bold"
            >
              My Classes
            </Badge>
          </Link>
        </div>
      </div>

      {/* Grid of Classmates */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {peers.length === 0 ? (
          <div className="col-span-full flex h-40 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-400">No peers found matching your search.</p>
          </div>
        ) : (
          peers.map((peer) => {
            const name = [peer.user.profile?.firstName, peer.user.profile?.lastName].filter(Boolean).join(' ')
            const initials = [peer.user.profile?.firstName?.[0], peer.user.profile?.lastName?.[0]].filter(Boolean).join('')
            const pathway = peer.user.studentProfile?.pathwayRel?.name || 'Full-Time'
            
            return (
              <div 
                key={peer.id}
                className="group relative flex flex-col items-center rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="relative mb-4">
                  <div className="absolute -inset-1 rounded-full bg-linear-to-tr from-aerojet-blue to-aerojet-sky opacity-0 blur transition-opacity group-hover:opacity-20" />
                  <Avatar className="h-20 w-20 border-4 border-white shadow-md dark:border-slate-800">
                    <AvatarImage src={peer.user.profile?.profilePhotoUrl || undefined} />
                    <AvatarFallback className="bg-slate-100 text-lg font-black text-aerojet-blue dark:bg-slate-800 dark:text-slate-400">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <h3 className="text-lg font-black text-aerojet-blue dark:text-white line-clamp-1">
                  {name}
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {peer.user.academyEmail || peer.user.email}
                </p>
                
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary" className="bg-blue-50 text-[10px] font-black text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 uppercase">
                    <GraduationCap className="mr-1 h-3 w-3" />
                    {pathway}
                  </Badge>
                  <Badge variant="secondary" className="bg-emerald-50 text-[10px] font-black text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 uppercase">
                    <BookOpen className="mr-1 h-3 w-3" />
                    Year {peer.currentYearNumber}
                  </Badge>
                </div>

                <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="rounded-full bg-slate-50 p-2 dark:bg-slate-800">
                    <Users className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
