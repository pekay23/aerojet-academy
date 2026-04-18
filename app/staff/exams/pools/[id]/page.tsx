import { getAuthSession } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  Users,
  Calendar,
  BookOpen,
  Trophy,
  MoreVertical,
  UserPlus,
  Settings,
} from 'lucide-react'
import { getPoolWithDetails, type PoolWithDetails } from '@/lib/pools/operations'
import { format } from 'date-fns'
import { Metadata } from 'next'
import PoolStatusBadge from '../../../_components/PoolStatusBadge'
import MemberActions from './MemberActions'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const pool = await getPoolWithDetails(id, { includeAllStatuses: true })
  return { title: `Pool: ${pool?.name || 'Details'} | Staff Portal` }
}

export default async function ExamPoolDetailPage({ params }: PageProps) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { id } = await params
  const pool = await getPoolWithDetails(id, { includeAllStatuses: true })
  if (!pool) notFound()

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="mb-6">
        <Link
          href={pool.eventId ? `/staff/exams/events/${pool.eventId}` : '/staff/exams'}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-aerojet-blue dark:text-slate-400"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Event: {pool.event?.name || 'Details'}
        </Link>
      </div>

      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
              {pool.name}
            </h1>
            <PoolStatusBadge status={pool.status} />
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              Exam Date: {pool.examDate ? format(new Date(pool.examDate), 'EEEE, MMM d, yyyy') : 'No Date Set'}
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-400" />
              {pool.currentMemberCount} / {pool.maxCandidates} Candidates
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/staff/exams/pools/${pool.id}/edit`}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-all duration-150 ease-out hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600"
          >
            <Settings className="h-4 w-4" />
            Edit Details
          </Link>
          <Link
            href={`/staff/exams/pools/${pool.id}/add-candidate`}
            className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-aerojet-blue/90"
          >
            <UserPlus className="h-4 w-4" />
            Add Candidate
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Booking Members</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Module</th>

                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pool.memberships.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                  >
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
                      <Users className="h-5 w-5 text-slate-300" />
                    </div>
                    <p className="text-sm">No members in this pool yet.</p>
                  </td>
                </tr>
              ) : (
                pool.memberships.map((member) => (
                  <tr key={member.id} className="group transition-all duration-150 ease-out hover:bg-white/80 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-aerojet-blue">
                          {member.user?.profile?.firstName?.charAt(0) || 'U'}
                          {member.user?.profile?.lastName?.charAt(0) || ''}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {(member.user?.profile?.firstName || member.user?.profile?.lastName)
                              ? `${member.user.profile.firstName || ''} ${member.user.profile.lastName || ''}`
                              : member.user?.email || 'Unknown User'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            ID: {member.user?.studentProfile?.studentId || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-aerojet-blue" />
                        <span className="font-medium text-slate-700">
                          {member.examComponent?.course?.code || 'N/A'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                          member.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-700'
                            : member.status === 'RESERVED'
                              ? 'bg-blue-100 text-blue-700'
                              : member.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <MemberActions
                        membershipId={member.id}
                        memberName={
                          (member.user?.profile?.firstName || member.user?.profile?.lastName)
                            ? `${member.user.profile.firstName || ''} ${member.user.profile.lastName || ''}`
                            : member.user?.email || 'Unknown User'
                        }
                        status={member.status}
                        poolId={pool.id}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
