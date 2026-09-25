'use client'

import React, { useState, useMemo, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { toggleCourseAssignment, ensureTermsForPathwayLicense } from '../actions'
import { toast } from 'sonner'
import { Loader2, Search, Layers, Sparkles, ShieldCheck, Info } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TablePagination from '@/components/shared/TablePagination'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface LicenseCategoryRequirement {
  course: {
    id: string
  }
}

interface LicenseCategory {
  id: string
  code: string
  name: string
  requirements?: LicenseCategoryRequirement[]
}

interface AcademicTerm {
  id: string
  name: string
  licenseCategoryId: string | null
  yearNumber: number
  semesterNumber: number
  licenseCategory?: LicenseCategory | null
  courseAssignments: { courseId: string }[]
}

interface Pathway {
  id: string
  code: string
  name: string
  academicTerms: AcademicTerm[]
}

interface Programme {
  id: string
  code: string
  name: string
  durationYears: number
}

interface Course {
  id: string
  code: string
  name: string
  duration: number
  category?: { name: string } | null
}

interface SchedulingClientProps {
  pathways: Pathway[]
  programmes: Programme[]
  licenseCategories: LicenseCategory[]
  courses: Course[]
  courseTotal?: number
  coursePage?: number
  courseLimit?: number
  search?: string
  pagination?: {
    page: number
    pageSize: number
    total: number
    search: string
  }
}

interface Tab {
  pathway: Pathway
  programme: Programme
  licenseCategories: LicenseCategory[]
  totalYears: number
}

interface ProgrammeSchedulePanelProps {
  tab: Tab
  groupedCourses: Record<string, Course[]>
  licenseCourseMap: Record<string, Set<string>>
  loading: string | null
  isPending: boolean
  reduceMotion: boolean
  onToggle: (termId: string, courseId: string, assigned: boolean) => void
  onEnsureTerms: (pathwayId: string, licenseCategoryId: string, totalYears: number) => void
  search: string
  courseTotal: number
  coursePage: number
  courseLimit: number
  onPaginationChange: (search: string, page: number, limit: number) => void
}

/** Maps a pathway code to the matching programme(s) */
const PATHWAY_PROGRAMME_MAP: Record<string, string[]> = {
  FULL_TIME_4Y: ['FT_4Y_B1B2'],
  FULL_TIME_2Y: ['FT_2Y_B1'],
  MILITARY_1Y: ['MIL_1Y_B1'],
}

export default function SchedulingClient({
  pathways,
  programmes,
  licenseCategories,
  courses,
  courseTotal: explicitCourseTotal,
  coursePage: explicitCoursePage,
  courseLimit: explicitCourseLimit,
  search: explicitSearch,
  pagination,
}: SchedulingClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = explicitSearch ?? pagination?.search ?? searchParams.get('search') ?? ''
  const coursePage = Math.max(
    1,
    explicitCoursePage ??
      pagination?.page ??
      (Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)
  )
  const courseLimit = Math.min(
    100,
    Math.max(
      1,
      explicitCourseLimit ??
        pagination?.pageSize ??
        (Number.parseInt(searchParams.get('limit') ?? '25', 10) || 25)
    )
  )
  const courseTotal = Math.max(0, explicitCourseTotal ?? pagination?.total ?? 0)

  const updateCourseQuery = (nextSearch: string, nextPage: number, nextLimit: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (nextSearch.trim()) {
      params.set('search', nextSearch.trim())
    } else {
      params.delete('search')
    }
    params.set('page', String(nextPage))
    params.set('limit', String(nextLimit))
    const query = params.toString()
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }

  const [loading, setLoading] = useState<string | null>(null)
  const [operationStatus, setOperationStatus] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const reduceMotion = useReducedMotion() ?? false

  // Build programme tabs that link to pathways
  const programmeTabs = useMemo(() => {
    const tabs: {
      programme: Programme
      pathway: Pathway
      licenseCategories: LicenseCategory[]
      totalYears: number
    }[] = []

    for (const pathway of pathways) {
      // Find matching programmes for this pathway
      const matchingCodes = PATHWAY_PROGRAMME_MAP[pathway.code] || []
      const matchingProgrammes = programmes.filter((p) => matchingCodes.includes(p.code))

      if (matchingProgrammes.length === 0) {
        // Fallback: show the pathway itself (for pathways without a FullTimeProgramme)
        tabs.push({
          programme: { id: pathway.id, code: pathway.code, name: pathway.name, durationYears: 1 },
          pathway,
          licenseCategories,
          totalYears: 1,
        })
      } else {
        for (const prog of matchingProgrammes) {
          tabs.push({
            programme: prog,
            pathway,
            licenseCategories,
            totalYears: prog.durationYears,
          })
        }
      }
    }

    return tabs
  }, [pathways, programmes, licenseCategories])

  // Courses are searched and paginated on the server; group only the returned page.
  const groupedCourses = useMemo(() => {
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
    const sorted = [...courses].sort((a, b) => collator.compare(a.code, b.code))

    const groups: Record<string, Course[]> = {}
    sorted.forEach((course) => {
      const cat = course.category?.name || 'General'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(course)
    })
    return groups
  }, [courses])

  // Build a quick lookup: license category id → required course IDs
  const licenseCourseMap = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    for (const lc of licenseCategories) {
      map[lc.id] = new Set(lc.requirements?.map((r) => r.course.id) ?? [])
    }
    return map
  }, [licenseCategories])

  const handleToggle = async (termId: string, courseId: string, assigned: boolean) => {
    setLoading(`${termId}-${courseId}`)
    try {
      const result = await toggleCourseAssignment(termId, courseId, assigned)
      if ('error' in result) {
        setOperationStatus(
          `Failed to ${assigned ? 'assign' : 'remove'} the module. ${result.error}`
        )
        toast.error(result.error)
      } else {
        const status = `Module ${assigned ? 'assigned to' : 'removed from'} term.`
        setOperationStatus(status)
        toast.success(status)
      }
    } catch {
      const status = 'An unexpected error occurred while updating the module assignment.'
      setOperationStatus(status)
      toast.error(status)
    } finally {
      setLoading(null)
    }
  }

  const handleEnsureTerms = async (
    pathwayId: string,
    licenseCategoryId: string,
    totalYears: number
  ) => {
    startTransition(async () => {
      try {
        const result = await ensureTermsForPathwayLicense(pathwayId, licenseCategoryId, totalYears)
        if ('error' in result) {
          setOperationStatus(`Failed to create terms. ${result.error}`)
          toast.error(result.error)
        } else {
          const status = 'Terms created. Refresh the page to see them.'
          setOperationStatus(status)
          toast.success(status)
        }
      } catch {
        const status = 'An unexpected error occurred while creating terms.'
        setOperationStatus(status)
        toast.error(status)
      }
    })
  }

  const [activeProgrammeId, setActiveProgrammeId] = useState<string>(
    programmeTabs[0]?.programme.id || ''
  )

  const activeTab = useMemo(
    () => programmeTabs.find((t) => t.programme.id === activeProgrammeId) || programmeTabs[0],
    [programmeTabs, activeProgrammeId]
  )

  return (
    <div className="mx-auto max-w-450 space-y-8">
      <div className="sr-only" aria-live="polite" role="status">
        {operationStatus ?? ''}
      </div>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : undefined}
        className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-aerojet-blue text-3xl font-black tracking-tight text-balance dark:text-white">
            Academic Scheduling
          </h1>
          <p className="mt-1 flex items-center gap-2 text-base font-medium text-pretty text-slate-500 dark:text-slate-400">
            <Sparkles className="text-aerojet-sky h-4 w-4" aria-hidden="true" />
            Map modules to semesters per programme &amp; license category.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search
            className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <label htmlFor="scheduling-course-search" className="sr-only">
            Search modules by code or name
          </label>
          <Input
            id="scheduling-course-search"
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => updateCourseQuery(e.target.value, 1, courseLimit)}
            className="focus:border-aerojet-sky focus:ring-aerojet-sky/10 h-11 rounded-xl border-slate-200 bg-white pl-11 shadow-sm transition-all focus:ring-2 dark:border-slate-800 dark:bg-slate-900/50"
          />
        </div>
      </motion.div>

      {/* Programme Selector for all devices */}
      <div className="mb-2 w-full sm:max-w-md">
        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
          <Layers className="h-4 w-4" aria-hidden="true" />
          Select Programme
        </label>
        <Select value={activeProgrammeId} onValueChange={setActiveProgrammeId}>
          <SelectTrigger className="text-aerojet-blue focus:ring-aerojet-sky/20 h-12 w-full rounded-xl border-slate-200 bg-white font-semibold transition-all focus:ring-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <SelectValue placeholder="Select a programme" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
            {programmeTabs.map((tab) => (
              <SelectItem
                key={tab.programme.id}
                value={tab.programme.id}
                className="cursor-pointer font-medium"
              >
                {tab.programme.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeTab && (
        <ProgrammeSchedulePanel
          key={activeTab.programme.id}
          tab={activeTab}
          groupedCourses={groupedCourses}
          licenseCourseMap={licenseCourseMap}
          loading={loading}
          isPending={isPending}
          reduceMotion={reduceMotion}
          onToggle={handleToggle}
          onEnsureTerms={handleEnsureTerms}
          search={search}
          courseTotal={courseTotal}
          coursePage={coursePage}
          courseLimit={courseLimit}
          onPaginationChange={updateCourseQuery}
        />
      )}
    </div>
  )
}

function ProgrammeSchedulePanel({
  tab,
  groupedCourses,
  licenseCourseMap,
  loading,
  isPending,
  reduceMotion,
  onToggle,
  onEnsureTerms,
  search,
  courseTotal,
  coursePage,
  courseLimit,
  onPaginationChange,
}: ProgrammeSchedulePanelProps) {
  const { pathway, licenseCategories, totalYears } = tab

  // "All (General)" = terms without a licenseCategoryId
  // + each license category that has terms OR that's available
  const categoryOptions = useMemo(() => {
    const options: { id: string | null; code: string; name: string }[] = [
      { id: null, code: 'NO_LIC', name: 'No License Required (Short Courses)' },
    ]

    for (const lc of licenseCategories) {
      options.push({ id: lc.id, code: lc.code, name: `${lc.code} — ${lc.name}` })
    }
    return options
  }, [licenseCategories])

  const licensePanelId = `scheduling-license-panel-${pathway.id}`

  const [activeLicenseId, setActiveLicenseId] = useState<string | null>(
    categoryOptions[0]?.id ?? null
  )

  // Filter academic terms for the current license category selection
  const filteredTerms = useMemo(() => {
    return pathway.academicTerms.filter((term) => {
      if (activeLicenseId === null) {
        return term.licenseCategoryId === null
      }
      return term.licenseCategoryId === activeLicenseId
    })
  }, [pathway.academicTerms, activeLicenseId])

  const filteredGroupedCourses = useMemo(() => {
    return groupedCourses
  }, [groupedCourses])

  const hasTerms = filteredTerms.length > 0

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
      className="space-y-6"
    >
      <Tabs
        value={activeLicenseId ?? 'no_lic'}
        onValueChange={(val) => setActiveLicenseId(val === 'no_lic' ? null : val)}
      >
        <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto pb-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="mr-1 shrink-0 text-xs font-bold tracking-widest text-slate-400 uppercase">
            License:
          </span>
        </div>
        <TabsList
          aria-label="License categories"
          className="scrollbar-hide flex items-center gap-2 overflow-x-auto pb-2"
        >
          {categoryOptions.map((opt) => (
            <TabsTrigger
              key={opt.id ?? 'no_lic'}
              value={opt.id ?? 'no_lic'}
              className={cn(
                'shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                activeLicenseId === opt.id
                  ? 'bg-aerojet-blue text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              )}
            >
              {opt.code === 'NO_LIC' ? 'No License' : opt.code}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={activeLicenseId ?? 'no_lic'} id={licensePanelId}>
          {/* No Terms Yet - Prompt to create */}
          {!hasTerms && activeLicenseId !== null && (
            <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-8 text-center dark:border-blue-900/30 dark:bg-blue-900/10">
              <Info className="mx-auto mb-3 h-8 w-8 text-blue-400" aria-hidden="true" />
              <h3 className="font-bold text-blue-800 dark:text-blue-200">
                No schedule configured for this license category
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-blue-600 dark:text-blue-400">
                Create {totalYears * 2} semester terms for this programme + license combo to start
                assigning modules.
              </p>
              <Button
                aria-label="Create Terms"
                className="mt-4 gap-2"
                disabled={isPending}
                onClick={() => onEnsureTerms(pathway.id, activeLicenseId, totalYears)}
              >
                {isPending ? (
                  <Loader2
                    className={`h-4 w-4 ${!reduceMotion ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                ) : (
                  'Create Terms'
                )}
              </Button>
            </div>
          )}

          {/* Scheduling Matrix */}
          {hasTerms && (
            <Card className="overflow-hidden rounded-2xl border-slate-100 shadow-xl dark:border-slate-800">
              <CardContent className="p-0">
                <div className="scrollbar-hide relative overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-aerojet-blue sticky left-0 z-30 w-40 min-w-40 border-r bg-slate-50 py-6 text-sm font-bold sm:w-72 sm:min-w-72 dark:bg-slate-900 dark:text-slate-300">
                          Module Name
                        </TableHead>
                        {filteredTerms.map((term) => (
                          <TableHead
                            key={term.id}
                            className="min-w-40 border-r text-center align-middle"
                          >
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="text-aerojet-blue text-sm font-bold dark:text-slate-100">
                                Year {term.yearNumber} • Sem {term.semesterNumber}
                              </span>
                              {term.licenseCategory && (
                                <Badge
                                  variant="outline"
                                  className="rounded-md border-emerald-200 bg-emerald-50 text-[10px] font-black text-emerald-700 uppercase dark:border-emerald-900/30 dark:bg-emerald-900/30 dark:text-emerald-300"
                                >
                                  {term.licenseCategory.code}
                                </Badge>
                              )}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(filteredGroupedCourses).map(([category, catCourses]) => (
                        <React.Fragment key={category}>
                          {/* Category Header */}
                          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 dark:bg-slate-800/10 dark:hover:bg-slate-800/10">
                            <TableCell colSpan={filteredTerms.length + 1} className="px-6 py-2.5">
                              <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                <Layers className="h-3 w-3" aria-hidden="true" />
                                {category}
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Course Rows */}
                          {catCourses.map((course) => {
                            const isRequired =
                              activeLicenseId !== null &&
                              licenseCourseMap[activeLicenseId]?.has(course.id)

                            return (
                              <TableRow
                                key={course.id}
                                className={cn(
                                  'group border-b transition-all duration-150 ease-out hover:bg-white/80 dark:hover:bg-slate-800/40',
                                  isRequired
                                    ? 'border-amber-100 bg-amber-50/20 dark:border-amber-900/30 dark:bg-amber-900/10'
                                    : 'border-slate-50 dark:border-slate-800/50'
                                )}
                              >
                                <TableCell
                                  className={cn(
                                    'sticky left-0 z-20 w-40 min-w-40 border-r py-5 transition-all duration-150 ease-out group-hover:shadow-sm sm:w-72 sm:min-w-72',
                                    isRequired
                                      ? 'bg-amber-50/50 group-hover:bg-amber-100/50 dark:bg-amber-900/20 dark:group-hover:bg-amber-900/30'
                                      : 'bg-white group-hover:bg-white dark:bg-slate-950 dark:group-hover:bg-slate-900'
                                  )}
                                >
                                  <div className="space-y-1.5 px-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="text-aerojet-blue text-sm leading-tight font-bold break-words whitespace-normal sm:text-lg dark:text-slate-100">
                                        {course.name}
                                      </div>
                                      {isRequired && (
                                        <Badge
                                          variant="outline"
                                          className="shrink-0 border-amber-200 bg-amber-100 text-[9px] font-black tracking-widest text-amber-700 uppercase dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-400"
                                        >
                                          Required
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-bold text-slate-500 dark:bg-slate-800">
                                        {course.code}
                                      </span>
                                      {course.duration > 0 && (
                                        <span className="text-[10px] font-medium text-slate-400 sm:text-xs">
                                          {course.duration} hrs
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>

                                {filteredTerms.map((term) => {
                                  const isAssigned = term.courseAssignments.some(
                                    (a) => a.courseId === course.id
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
                                        className="flex h-full min-h-20 w-full cursor-pointer items-center justify-center transition-all hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                                      >
                                        {isLoading ? (
                                          <Loader2
                                            className={`text-aerojet-sky h-5 w-5 ${!reduceMotion ? 'animate-spin' : ''}`}
                                            aria-hidden="true"
                                          />
                                        ) : (
                                          <Checkbox
                                            id={`check-${term.id}-${course.id}`}
                                            checked={isAssigned}
                                            onCheckedChange={(checked) =>
                                              onToggle(term.id, course.id, !!checked)
                                            }
                                            className="data-[state=checked]:bg-aerojet-blue data-[state=checked]:border-aerojet-blue h-6 w-6 rounded-lg border-2 border-slate-200 transition-all dark:border-slate-800"
                                          />
                                        )}
                                      </label>
                                    </TableCell>
                                  )
                                })}
                              </TableRow>
                            )
                          })}
                        </React.Fragment>
                      ))}

                      {Object.keys(filteredGroupedCourses).length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={filteredTerms.length + 1}
                            className="py-24 text-center"
                          >
                            <p className="text-xl font-bold text-slate-400">
                              No modules found matching &quot;{search}&quot;
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No License tab with terms */}
          {hasTerms && activeLicenseId === null && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
              <strong>No License Required</strong> schedule is intended for short courses or
              university summer programmes that do not require EASA Part-66 compliance mapping.
              Select a specific license category above to create a tailored semester schedule for
              formal EASA programmes.
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Card className="overflow-hidden rounded-xl border-slate-100 shadow-sm dark:border-slate-800">
        <TablePagination
          page={coursePage}
          perPage={courseLimit}
          total={courseTotal}
          onPageChange={(page) => onPaginationChange(search, page, courseLimit)}
          onPerPageChange={(limit) => onPaginationChange(search, 1, limit)}
        />
      </Card>
    </motion.div>
  )
}
