'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'
import { format } from 'date-fns'

interface Enrollment {
  id: string
  status: string
  course: {
    name: string
    code: string
  }
  grades: Array<{
    id: string
    assessmentName: string
    assessmentDate: string
    score: number
  }>
}

interface StudentEnrollmentsViewProps {
  enrollments: Enrollment[]
}

export default function StudentEnrollmentsView({ enrollments }: StudentEnrollmentsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const filtered = useMemo(() => {
    return enrollments.filter((enr) => {
      const matchesSearch =
        enr.course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enr.course.code.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'ALL' || enr.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [enrollments, searchQuery, statusFilter])

  return (
    <Card className="rounded-4xl border-slate-100 shadow-sm dark:border-slate-800">
      <CardHeader className="border-b border-slate-50 dark:border-slate-800/50">
        <CardTitle className="flex items-center gap-3 text-xl font-black text-aerojet-blue dark:text-white">
          <BookOpen className="h-5 w-5 text-aerojet-sky" />
          Enrolled Modules (Your Classes)
        </CardTitle>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-300" />
            <Input
              placeholder="Search by module name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-xl border-slate-100 bg-white pl-11 text-sm font-medium shadow-sm transition-all focus:border-aerojet-sky focus:ring-4 focus:ring-blue-50/50 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>
          <div className="flex gap-2">
            {['ALL', 'ACTIVE', 'ENROLLED', 'APPROVED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-xl px-3 py-1.5 text-xs font-black tracking-widest uppercase transition-all ${
                  statusFilter === status
                    ? 'bg-aerojet-sky text-white'
                    : 'border border-slate-100 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filtered.length > 0 ? (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {filtered.map((enr) => (
              <div
                key={enr.id}
                className="p-6 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 dark:text-white">
                      {enr.course.name}
                    </h4>
                    <p className="text-sm font-bold tracking-widest text-aerojet-sky uppercase">
                      {enr.course.code}
                    </p>
                  </div>
                  <Badge className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                    {enr.status}
                  </Badge>
                </div>

                <div className="mt-6 space-y-4">
                  <h5 className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-300 uppercase">
                    Recent Grades in this Module
                  </h5>
                  {enr.grades.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {enr.grades.map((grade) => (
                        <div
                          key={grade.id}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/50"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {grade.assessmentName}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-300">
                              {format(new Date(grade.assessmentDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <span className="text-sm font-black text-aerojet-sky">
                            {grade.score}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-300 italic">
                      No grades recorded by you for this module.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-20 text-center">
            <p className="font-medium text-slate-400 dark:text-slate-300">No modules match your search.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
