'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toggleCourseAssignment } from '../actions'
import { toast } from 'sonner'
import { Loader2, Search, Layers, Sparkles } from 'lucide-react'

interface SchedulingClientProps {
  pathways: any[]
  courses: any[]
}

export default function SchedulingClient({ pathways, courses }: SchedulingClientProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Group courses by category for cleaner organization
  const groupedCourses = useMemo(() => {
    const filtered = courses.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
    )

    // Apply natural sort to courses (e.g. M1, M2... M10)
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
    const sorted = [...filtered].sort((a, b) => collator.compare(a.code, b.code))

    const groups: Record<string, any[]> = {}
    sorted.forEach((course) => {
      const cat = course.category?.name || 'General'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(course)
    })
    return groups
  }, [courses, search])

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
    <div className="mx-auto max-w-[1800px] space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
            Academic Scheduling
          </h1>
          <p className="mt-1 flex items-center gap-2 text-base font-medium text-slate-500 dark:text-slate-400">
            <Sparkles className="h-4 w-4 text-aerojet-sky" />
            Map modules to academic terms for automatic enrollment.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-xl border-slate-200 bg-white pl-11 shadow-sm transition-all focus:border-aerojet-sky focus:ring-2 focus:ring-aerojet-sky/10 dark:border-slate-800 dark:bg-slate-950"
          />
        </div>
      </motion.div>

      <Tabs defaultValue={pathways[0]?.id} className="w-full">
        <TabsList className="mb-8 h-auto flex-wrap gap-3 bg-transparent p-0">
          {pathways.map((p) => (
            <TabsTrigger
              key={p.id}
              value={p.id}
              className="rounded-xl border border-slate-200 bg-white px-8 py-3 text-sm font-bold text-aerojet-blue shadow-sm transition-all data-[state=active]:border-aerojet-blue data-[state=active]:bg-aerojet-blue data-[state=active]:text-white dark:border-slate-800 dark:bg-slate-900 dark:data-[state=active]:bg-aerojet-blue"
            >
              {p.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          {pathways.map((pathway) => (
            <TabsContent key={pathway.id} value={pathway.id}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="overflow-hidden rounded-2xl border-slate-100 shadow-xl dark:border-slate-800">
                  <CardContent className="p-0">
                    <div className="scrollbar-hide relative overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="sticky left-0 z-30 w-[300px] min-w-[300px] border-r bg-slate-50 py-6 text-sm font-bold text-aerojet-blue dark:bg-slate-900 dark:text-slate-300">
                              Module Name
                            </TableHead>
                            {pathway.academicTerms.map((term: any) => (
                              <TableHead
                                key={term.id}
                                className="min-w-[160px] border-r text-center align-middle"
                              >
                                <div className="flex flex-col items-center gap-1.5">
                                  <span className="text-sm font-bold text-aerojet-blue dark:text-slate-100">
                                    {term.name}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="rounded-md border-blue-200 bg-blue-50 text-[10px] font-black text-aerojet-blue uppercase dark:border-blue-900/30 dark:bg-blue-900/30 dark:text-blue-300"
                                  >
                                    Year {term.yearNumber} • Sem {term.semesterNumber}
                                  </Badge>
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(groupedCourses).map(([category, catCourses]) => (
                            <React.Fragment key={category}>
                              {/* Category Header */}
                              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 dark:bg-slate-800/10 dark:hover:bg-slate-800/10">
                                <TableCell
                                  colSpan={pathway.academicTerms.length + 1}
                                  className="px-6 py-2.5"
                                >
                                  <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                    <Layers className="h-3 w-3" />
                                    {category}
                                  </div>
                                </TableCell>
                              </TableRow>

                              {/* Course Rows */}
                              {catCourses.map((course) => (
                                <TableRow
                                  key={course.id}
                                  className="group border-b border-slate-50 transition-all duration-150 ease-out hover:bg-white/80 dark:border-slate-800/50 dark:hover:bg-slate-800/40"
                                >
                                  <TableCell className="sticky left-0 z-20 border-r bg-white py-5 transition-all duration-150 ease-out group-hover:bg-white group-hover:shadow-sm dark:bg-slate-950 dark:group-hover:bg-slate-900">
                                    <div className="space-y-1.5 px-2">
                                      <div className="text-lg leading-tight font-bold text-aerojet-blue dark:text-slate-100">
                                        {course.name}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-bold text-slate-500 dark:bg-slate-800">
                                          {course.code}
                                        </span>
                                        {course.duration > 0 && (
                                          <span className="text-xs font-medium text-slate-400">
                                            {course.duration} hrs
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>

                                  {pathway.academicTerms.map((term: any) => {
                                    const isAssigned = term.courseAssignments.some(
                                      (a: any) => a.courseId === course.id
                                    )
                                    const isLoading = loading === `${term.id}-${course.id}`

                                    return (
                                      <TableCell
                                        key={`${term.id}-${course.id}`}
                                        className={`relative border-r p-0 text-center transition-all ${
                                          isAssigned
                                            ? 'bg-blue-50/20 dark:bg-blue-900/5'
                                            : 'bg-transparent'
                                        }`}
                                      >
                                        <label
                                          htmlFor={`check-${term.id}-${course.id}`}
                                          className="flex h-full min-h-[80px] w-full cursor-pointer items-center justify-center transition-all hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                                        >
                                          {isLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin text-aerojet-sky" />
                                          ) : (
                                            <Checkbox
                                              id={`check-${term.id}-${course.id}`}
                                              checked={isAssigned}
                                              onCheckedChange={(checked) =>
                                                handleToggle(term.id, course.id, !!checked)
                                              }
                                              className="h-6 w-6 rounded-lg border-2 border-slate-200 transition-all data-[state=checked]:border-aerojet-blue data-[state=checked]:bg-aerojet-blue dark:border-slate-800"
                                            />
                                          )}
                                        </label>
                                      </TableCell>
                                    )
                                  })}
                                </TableRow>
                              ))}
                            </React.Fragment>
                          ))}

                          {Object.keys(groupedCourses).length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={pathway.academicTerms.length + 1}
                                className="py-24 text-center"
                              >
                                <p className="text-xl font-bold text-slate-400">
                                  No modules found matching "{search}"
                                </p>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          ))}
        </AnimatePresence>
      </Tabs>
    </div>
  )
}
