'use client'

import React, { useState, useMemo, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toggleCourseAssignment, ensureTermsForPathwayLicense } from '../actions'
import { toast } from 'sonner'
import { Loader2, Search, Layers, Sparkles, ShieldCheck, Info } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SchedulingClientProps {
  pathways: any[]
  programmes: any[]
  licenseCategories: any[]
  courses: any[]
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
}: SchedulingClientProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  // Build programme tabs that link to pathways
  const programmeTabs = useMemo(() => {
    const tabs: {
      programme: any
      pathway: any
      licenseCategories: any[]
      totalYears: number
    }[] = []

    for (const pathway of pathways) {
      // Find matching programmes for this pathway
      const matchingCodes = PATHWAY_PROGRAMME_MAP[pathway.code] || []
      const matchingProgrammes = programmes.filter((p) =>
        matchingCodes.includes(p.code)
      )

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

  // Group courses by category for cleaner organization
  const groupedCourses = useMemo(() => {
    const filtered = courses.filter(
      (c: any) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
    )

    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
    const sorted = [...filtered].sort((a: any, b: any) => collator.compare(a.code, b.code))

    const groups: Record<string, any[]> = {}
    sorted.forEach((course: any) => {
      const cat = course.category?.name || 'General'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(course)
    })
    return groups
  }, [courses, search])

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
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Module ${assigned ? 'assigned to' : 'removed from'} term.`)
      }
    } catch {
      toast.error('An unexpected error occurred.')
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
      const result = await ensureTermsForPathwayLicense(
        pathwayId,
        licenseCategoryId,
        totalYears
      )
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Terms created. Refresh the page to see them.')
      }
    })
  }

  const [activeProgrammeId, setActiveProgrammeId] = useState<string>(
    programmeTabs[0]?.programme.id || ''
  )
  
  const activeTab = useMemo(
    () => programmeTabs.find(t => t.programme.id === activeProgrammeId) || programmeTabs[0],
    [programmeTabs, activeProgrammeId]
  )

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
            Map modules to semesters per programme &amp; license category.
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

      {/* Programme Selector for all devices */}
      <div className="w-full sm:max-w-md mb-2">
        <label className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 block flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Select Programme
        </label>
        <Select value={activeProgrammeId} onValueChange={setActiveProgrammeId}>
          <SelectTrigger className="w-full h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-aerojet-blue dark:text-slate-200 font-semibold rounded-xl focus:ring-2 focus:ring-aerojet-sky/20 transition-all">
            <SelectValue placeholder="Select a programme" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
            {programmeTabs.map((tab) => (
              <SelectItem key={tab.programme.id} value={tab.programme.id} className="cursor-pointer font-medium">
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
          onToggle={handleToggle}
          onEnsureTerms={handleEnsureTerms}
          search={search}
        />
      )}
    </div>
  )
}

/**
 * Sub-panel: shows license category sub-tabs and the scheduling matrix for a single programme.
 */
function ProgrammeSchedulePanel({
  tab,
  groupedCourses,
  licenseCourseMap,
  loading,
  isPending,
  onToggle,
  onEnsureTerms,
  search,
}: {
  tab: any
  groupedCourses: Record<string, any[]>
  licenseCourseMap: Record<string, Set<string>>
  loading: string | null
  isPending: boolean
  onToggle: (termId: string, courseId: string, assigned: boolean) => void
  onEnsureTerms: (pathwayId: string, licenseCategoryId: string, totalYears: number) => void
  search: string
}) {
  const { pathway, licenseCategories, totalYears } = tab

  // "All (General)" = terms without a licenseCategoryId
  // + each license category that has terms OR that's available
  const categoryOptions = useMemo(() => {
    const options: { id: string | null; code: string; name: string }[] = [
      { id: null, code: 'ALL', name: 'All Modules (General)' },
    ]
    
    const progCode = (tab.programme.code || '').toUpperCase()
    const progName = (tab.programme.name || '').toUpperCase()

    // Determine if the programme code or name explicitly mentions ANY license category
    let hasAnyExplicitMatch = false
    for (const lc of licenseCategories) {
      const lcCodeStripped = lc.code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() // 'B1.1' -> 'B11'
      const looseMatch = lcCodeStripped.replace('11', '1') // 'B11' -> 'B1'
      
      if (
        progCode.includes(lcCodeStripped) || 
        progCode.includes(looseMatch) || 
        progName.includes(lc.code.toUpperCase())
      ) {
        hasAnyExplicitMatch = true
        break
      }
    }

    for (const lc of licenseCategories) {
      const lcCodeStripped = lc.code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
      const looseMatch = lcCodeStripped.replace('11', '1')
      
      const isMatch = 
        progCode.includes(lcCodeStripped) || 
        progCode.includes(looseMatch) || 
        progName.includes(lc.code.toUpperCase())

      // If the programme specifies specific licenses, only show those.
      // If it's a generic programme (no specific licenses mentioned), show all.
      if (!hasAnyExplicitMatch || isMatch) {
        options.push({ id: lc.id, code: lc.code, name: `${lc.code} — ${lc.name}` })
      }
    }
    return options
  }, [licenseCategories, tab.programme.code, tab.programme.name])

  const [activeLicenseId, setActiveLicenseId] = useState<string | null>(null)

  // Filter academic terms for the current license category selection
  const filteredTerms = useMemo(() => {
    return pathway.academicTerms.filter((term) => {
      if (activeLicenseId === null) {
        return term.licenseCategoryId === null
      }
      return term.licenseCategoryId === activeLicenseId
    })
  }, [pathway.academicTerms, activeLicenseId])

  // Filter courses to only those relevant to the selected license category
  const filteredGroupedCourses = useMemo(() => {
    if (activeLicenseId === null) return groupedCourses
    const requiredCourseIds = licenseCourseMap[activeLicenseId]
    if (!requiredCourseIds) return groupedCourses

    const filtered: Record<string, any[]> = {}
    for (const [cat, catCourses] of Object.entries(groupedCourses)) {
      const matching = catCourses.filter((c) => requiredCourseIds.has(c.id))
      if (matching.length > 0) {
        filtered[cat] = matching
      }
    }
    return filtered
  }, [groupedCourses, activeLicenseId, licenseCourseMap])

  const hasTerms = filteredTerms.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* License Category Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="mr-1 shrink-0 text-xs font-bold tracking-widest text-slate-400 uppercase">
          License:
        </span>
        {categoryOptions.map((opt) => (
          <button
            key={opt.code}
            onClick={() => setActiveLicenseId(opt.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeLicenseId === opt.id
                ? 'bg-aerojet-blue text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            {opt.code === 'ALL' ? 'General' : opt.code}
          </button>
        ))}
      </div>

      {/* No Terms Yet - Prompt to create */}
      {!hasTerms && activeLicenseId !== null && (
        <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-8 text-center dark:border-blue-900/30 dark:bg-blue-900/10">
          <Info className="mx-auto mb-3 h-8 w-8 text-blue-400" />
          <h3 className="font-bold text-blue-800 dark:text-blue-200">
            No schedule configured for this license category
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-blue-600 dark:text-blue-400">
            Create {totalYears * 2} semester terms for this programme + license combo to start assigning modules.
          </p>
          <Button
            className="mt-4 gap-2"
            disabled={isPending}
            onClick={() => onEnsureTerms(pathway.id, activeLicenseId, totalYears)}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
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
                    <TableHead className="sticky left-0 z-30 w-[160px] sm:w-[300px] min-w-[160px] sm:min-w-[300px] border-r bg-slate-50 py-6 text-sm font-bold text-aerojet-blue dark:bg-slate-900 dark:text-slate-300">
                      Module Name
                    </TableHead>
                    {filteredTerms.map((term) => (
                      <TableHead
                        key={term.id}
                        className="min-w-[160px] border-r text-center align-middle"
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-sm font-bold text-aerojet-blue dark:text-slate-100">
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
                        <TableCell
                          colSpan={filteredTerms.length + 1}
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
                          <TableCell className="sticky left-0 z-20 border-r bg-white py-5 w-[160px] sm:w-[300px] min-w-[160px] sm:min-w-[300px] transition-all duration-150 ease-out group-hover:bg-white group-hover:shadow-sm dark:bg-slate-950 dark:group-hover:bg-slate-900">
                            <div className="space-y-1.5 px-2">
                              <div className="text-sm sm:text-lg leading-tight font-bold text-aerojet-blue dark:text-slate-100 whitespace-normal break-words">
                                {course.name}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-bold text-slate-500 dark:bg-slate-800">
                                  {course.code}
                                </span>
                                {course.duration > 0 && (
                                  <span className="text-[10px] sm:text-xs font-medium text-slate-400">
                                    {course.duration} hrs
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {filteredTerms.map((term: any) => {
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
                                        onToggle(term.id, course.id, !!checked)
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

      {/* General tab with terms */}
      {hasTerms && activeLicenseId === null && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
          <strong>General</strong> schedule applies to all students regardless of license category.
          Select a specific license category above to create a tailored semester schedule (e.g. B1.1 students see different modules than B2).
        </div>
      )}
    </motion.div>
  )
}
