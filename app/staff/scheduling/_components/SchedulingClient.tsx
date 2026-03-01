'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toggleCourseAssignment } from '../actions'
import { toast } from 'sonner'
import { Loader2, Calendar, BookOpen, ShieldCheck } from 'lucide-react'

interface SchedulingClientProps {
  pathways: any[]
  courses: any[]
}

export default function SchedulingClient({ pathways, courses }: SchedulingClientProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleToggle = async (termId: string, courseId: string, assigned: boolean) => {
    setLoading(`${termId}-${courseId}`)
    try {
      const result = await toggleCourseAssignment(termId, courseId, assigned)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Module ${assigned ? 'assigned to' : 'removed from'} term.`)
      }
    } catch (err) {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Academic Scheduling
          </h1>
          <p className="font-medium text-slate-500 dark:text-slate-400">
            Map modules to academic terms for automatic enrollment.
          </p>
        </div>
      </div>

      <Tabs defaultValue={pathways[0]?.id} className="w-full">
        <TabsList className="mb-4 bg-slate-100 p-1 dark:bg-slate-800">
          {pathways.map((p) => (
            <TabsTrigger
              key={p.id}
              value={p.id}
              className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
            >
              {p.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {pathways.map((pathway) => (
          <TabsContent key={pathway.id} value={pathway.id} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pathway.academicTerms.map((term: any) => (
                <Card
                  key={term.id}
                  className="overflow-hidden border-slate-200 dark:border-slate-800"
                >
                  <CardHeader className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <CardTitle className="text-lg font-bold">{term.name}</CardTitle>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        EY {term.yearNumber} S{term.semesterNumber}
                      </Badge>
                    </div>
                    <CardDescription>
                      {term.courseAssignments.length} Modules assigned
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2 p-4">
                        {courses.map((course) => {
                          const isAssigned = term.courseAssignments.some(
                            (a: any) => a.courseId === course.id
                          )
                          const isLoading = loading === `${term.id}-${course.id}`

                          return (
                            <div
                              key={course.id}
                              className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                                isAssigned
                                  ? 'border-blue-100 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-900/10'
                                  : 'border-slate-100 bg-white hover:border-slate-200 dark:border-slate-800 dark:bg-slate-900'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  id={`check-${term.id}-${course.id}`}
                                  checked={isAssigned}
                                  onCheckedChange={(checked) =>
                                    handleToggle(term.id, course.id, !!checked)
                                  }
                                  disabled={!!loading}
                                />
                                <div className="space-y-0.5">
                                  <label
                                    htmlFor={`check-${term.id}-${course.id}`}
                                    className="cursor-pointer text-sm leading-none font-bold text-slate-900 dark:text-slate-100"
                                  >
                                    {course.code}: {course.name}
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold tracking-tight text-slate-500 uppercase">
                                      {course.category?.name || 'General'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {isLoading && (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
