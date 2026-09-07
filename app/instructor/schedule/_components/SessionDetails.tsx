'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Video, MapPin, BookOpen, Users, FileText, Edit } from 'lucide-react'

const MotionDiv = motion.div
const MotionAside = motion.aside

interface SessionCourse {
  code: string
  name: string
  _count?: {
    enrollments?: number
  }
}

interface SessionRoom {
  name?: string
}

interface SessionDetailsProps {
  session: {
    course: SessionCourse
    locationType?: string | null
    room?: SessionRoom | null
    name?: string
    description?: string | null
  } | null
  isOpen: boolean
  onClose: () => void
}

export default function SessionDetails({ session, isOpen, onClose }: SessionDetailsProps) {
  if (!session) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          />

          {/* Slide-over */}
          <MotionAside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-50 flex h-full w-full flex-col border-l border-slate-200 bg-white shadow-2xl sm:w-96 dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-6 dark:border-slate-800 dark:bg-slate-800/30">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-black tracking-wider text-blue-600 uppercase dark:bg-blue-900/40 dark:text-blue-400">
                    {session.course.code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                    </span>
                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-300">
                      Live Logic Pending
                    </span>
                  </div>
                </div>
                <h2 className="text-xl leading-tight font-black tracking-tight text-slate-900 dark:text-white">
                  {session.course.name}
                </h2>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {session.locationType === 'ONLINE' ? (
                    <>
                      <Video className="h-4 w-4 text-blue-500" />
                      Online Session (Zoom)
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {session.room?.name || 'Main Hall'}
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-8 overflow-y-auto p-6">
              {/* Primary Actions */}
              <div className="space-y-3">
                <button className="flex w-full transform items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95">
                  <Video className="h-4 w-4" />
                  Join Online Session
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 py-2.5 text-[10px] font-bold tracking-widest text-slate-600 uppercase transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 py-2.5 text-[10px] font-bold tracking-widest text-slate-600 uppercase transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                    <FileText className="h-3.5 w-3.5" />
                    Materials
                  </button>
                </div>
              </div>

              {/* Lesson Plan */}
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  <BookOpen className="h-3.5 w-3.5" />
                  Lesson Plan
                </h3>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
                    {session.name || 'Core Module Overview'}
                  </p>
                  <div className="space-y-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {session.description ? (
                      <p>{session.description}</p>
                    ) : (
                      <ul className="ml-1 list-inside list-disc space-y-1">
                        <li>Module curriculum review</li>
                        <li>Theoretical concepts application</li>
                        <li>Aviation safety standards compliance</li>
                        <li>Practical exercises & feedback</li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Students Overview */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    <Users className="h-3.5 w-3.5" />
                    Students ({session.course._count?.enrollments || 0})
                  </h3>
                  <button className="text-[10px] font-black tracking-widest text-blue-600 uppercase hover:underline">
                    View Roster
                  </button>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800/50">
                  {/* Student placeholders / summary */}
                  <div className="p-4 text-center">
                    <p className="text-xs font-medium text-slate-400">
                      Student attendance tracking is available via the roster.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto border-t border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/30">
              <button className="w-full rounded-xl border border-red-100 py-3 text-xs font-bold tracking-widest text-red-600 uppercase transition-all hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20">
                Cancel Session
              </button>
            </div>
          </MotionAside>
        </>
      )}
    </AnimatePresence>
  )
}
