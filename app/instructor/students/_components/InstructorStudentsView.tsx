'use client'

import React, { useState, useMemo } from 'react'
import { Search, Filter, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import StudentCard from './StudentCard'
import FormerStudentCard from './FormerStudentCard'
import TablePagination from '@/components/shared/TablePagination'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Student {
  id: string
  name: string
  email?: string | null
  image?: string | null
  studentId?: string | null
  phone?: string | null
  courses: Array<{
    id: string
    code: string
    name: string
  }>
  status?: string
}

interface InstructorStudentsViewProps {
  initialStudents: Student[]
  initialFormerStudents: Student[]
}

export default function InstructorStudentsView({
  initialStudents,
  initialFormerStudents,
}: InstructorStudentsViewProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'former'>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const currentList = activeTab === 'active' ? initialStudents : initialFormerStudents

  const filteredStudents = useMemo(() => {
    return currentList.filter((student) => {
      const lowerQuery = searchQuery.toLowerCase()
      return (
        student.name.toLowerCase().includes(lowerQuery) ||
        student.studentId?.toLowerCase().includes(lowerQuery) ||
        student.email?.toLowerCase().includes(lowerQuery) ||
        student.courses.some(
          (c) =>
            c.code.toLowerCase().includes(lowerQuery) || c.name.toLowerCase().includes(lowerQuery)
        )
      )
    })
  }, [currentList, searchQuery])

  const total = filteredStudents.length
  const paged = filteredStudents.slice((page - 1) * perPage, page * perPage)

  const renderCard = (student: Student) =>
    activeTab === 'former' ? (
      <FormerStudentCard student={student} />
    ) : (
      <StudentCard student={student} />
    )

  return (
    <div className="flex flex-col space-y-8">
      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as 'active' | 'former')
          setPage(1)
          setSearchQuery('')
        }}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Active Students
          </TabsTrigger>
          <TabsTrigger value="former" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Former Students
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {/* Search Header */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-xl flex-1">
              <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, ID, email or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-100 bg-white py-4 pr-4 pl-11 text-sm font-medium text-slate-900 shadow-sm transition-all outline-none placeholder:text-slate-400 focus:border-aerojet-sky focus:ring-4 focus:ring-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-900/40 dark:focus:ring-blue-900/20"
              />
            </div>

            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <Users className="h-4 w-4" />
              <span>{total} Active students</span>
            </div>
          </div>

          {/* Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filteredStudents.length > 0 ? (
                paged.map((student) => (
                  <motion.div
                    key={student.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <StudentCard student={student} />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  className="col-span-full py-20 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
                    <Filter className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    No students match your search
                  </h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                    Try searching for a name, student ID, or a specific module code.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {total > 0 && (
            <TablePagination
              page={page}
              perPage={perPage}
              total={total}
              onPageChange={setPage}
              onPerPageChange={setPerPage}
            />
          )}
        </TabsContent>

        <TabsContent value="former" className="space-y-6">
          {/* Search Header */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-xl flex-1">
              <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, ID, email or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-100 bg-white py-4 pr-4 pl-11 text-sm font-medium text-slate-900 shadow-sm transition-all outline-none placeholder:text-slate-400 focus:border-aerojet-sky focus:ring-4 focus:ring-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-900/40 dark:focus:ring-blue-900/20"
              />
            </div>

            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <Users className="h-4 w-4" />
              <span>{total} Former students</span>
            </div>
          </div>

          {/* Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filteredStudents.length > 0 ? (
                paged.map((student) => (
                  <motion.div
                    key={student.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderCard(student)}
                  </motion.div>
                ))
              ) : (
                <motion.div
                  className="col-span-full py-20 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
                    <Users className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    No former students found
                  </h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                    Students who leave your classes will appear here with their status and last course.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {total > 0 && (
            <TablePagination
              page={page}
              perPage={perPage}
              total={total}
              onPageChange={setPage}
              onPerPageChange={setPerPage}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
