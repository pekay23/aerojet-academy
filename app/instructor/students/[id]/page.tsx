import { notFound } from 'next/navigation'
import { getStudentDetails } from '@/lib/actions/instructor'
import { Metadata } from 'next'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  ArrowLeft,
  BookOpen,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import StudentEnrollmentsView from './_components/StudentEnrollmentsView'

export const metadata: Metadata = {
  title: 'Student Profile | Instructor Portal',
}
export const dynamic = 'force-dynamic'

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const student = await getStudentDetails(id)

  if (!student) {
    notFound()
  }

  const profile = student.profile
  const studentProfile = student.studentProfile

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Back Link */}
      <Link
        href="/instructor/students"
        className="group flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-aerojet-sky"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-white transition-all group-hover:border-aerojet-sky/50 group-hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900">
          <ArrowLeft className="h-4 w-4" />
        </div>
        Back to Students
      </Link>

      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-4xl border border-slate-100 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-blue-50/50 dark:bg-blue-900/10" />

        <div className="relative flex flex-col gap-8 md:flex-row md:items-center">
          <UserAvatar
            src={profile?.profilePhotoUrl}
            firstName={profile?.firstName}
            lastName={profile?.lastName}
            className="h-32 w-32 ring-8 ring-blue-50 dark:ring-blue-900/20"
          />

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
                {profile?.firstName} {profile?.lastName}
              </h1>
              <Badge
                variant="outline"
                className="rounded-full border-aerojet-sky bg-blue-50 px-4 py-1.5 text-xs font-black text-aerojet-sky uppercase dark:bg-blue-900/20"
              >
                Active Student
              </Badge>
            </div>
            <p className="text-lg font-medium text-slate-400 dark:text-slate-300">
              Student ID:{' '}
              <span className="text-slate-900 dark:text-slate-100">
                {studentProfile?.studentId || 'N/A'}
              </span>
            </p>

            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Mail className="h-4 w-4 text-slate-300" />
                <span className="text-sm font-bold">{student.email}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Phone className="h-4 w-4 text-slate-300" />
                  <span className="text-sm font-bold">{profile.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Enrollment History */}
        <div className="space-y-8 lg:col-span-2">
          <Card className="rounded-4xl border-slate-100 shadow-sm dark:border-slate-800">
            <CardHeader className="border-b border-slate-50 dark:border-slate-800/50">
              <CardTitle className="flex items-center gap-3 text-xl font-black text-aerojet-blue dark:text-white">
                <BookOpen className="h-5 w-5 text-aerojet-sky" />
                Enrolled Modules (Your Classes)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <StudentEnrollmentsView enrollments={student.enrollments} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Personal Stats/Bio */}
        <div className="space-y-8">
          <Card className="rounded-4xl border-slate-100 shadow-sm dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-black text-aerojet-blue dark:text-white">
                Student Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500 dark:bg-orange-900/20">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-300 uppercase">
                    Enrolled Since
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {studentProfile?.enrollmentDate
                      ? format(new Date(studentProfile.enrollmentDate), 'MMMM yyyy')
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-900/20">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-300 uppercase">
                    Enrollment Type
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {studentProfile?.enrollmentType || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
