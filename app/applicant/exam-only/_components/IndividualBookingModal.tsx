import { BookOpen, ChevronUp, ChevronDown, Loader2 } from 'lucide-react'
import { ExamComponent, GroupedCourse, WalletInfo } from './examOnlyTypes'

interface IndividualBookingModalProps {
  open: boolean
  onClose: () => void
  groupedComponents: Record<string, GroupedCourse>
  expandedCourse: string | null
  setExpandedCourse: (value: string | null) => void
  wallet: WalletInfo | null
  bookingExam: string | null
  onBook: (componentId: string) => void
  fmt: (amount: number) => string
  individualPrice: number
}

export default function IndividualBookingModal({
  open,
  onClose,
  groupedComponents,
  expandedCourse,
  setExpandedCourse,
  wallet,
  bookingExam,
  onBook,
  fmt,
  individualPrice,
}: IndividualBookingModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900">
        <div className="border-b border-slate-100 p-6 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Select Exam Module</h3>
          <p className="mt-1 text-sm text-slate-500">
            Choose an exam component to book an individual seat ({fmt(individualPrice)})
          </p>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-6">
          {Object.keys(groupedComponents).length === 0 ? (
            <div className="py-8 text-center">
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">No exam components available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.values(groupedComponents)
                .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
                .map((course) => {
                  const isExpanded = expandedCourse === `ind_${course.code}`
                  return (
                    <div
                      key={course.code}
                      className="rounded-xl border border-slate-200 dark:border-slate-700"
                    >
                      <button
                        onClick={() =>
                          setExpandedCourse(isExpanded ? null : `ind_${course.code}`)
                        }
                        className="flex w-full items-center justify-between p-4 text-left"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {course.code}: {course.name}
                          </span>
                          <span className="ml-2 text-xs text-slate-400">
                            {course.components.length} component(s)
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="border-t border-slate-100 px-4 pb-4 dark:border-slate-800">
                          <div className="mt-3 space-y-2">
                            {course.components
                              .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
                              .map((component: ExamComponent) => (
                                <div
                                  key={component.id}
                                  className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {component.code} - {component.name}
                                      </span>
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${component.type === 'MCQ' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}
                                      >
                                        {component.type}
                                      </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-500">{component.duration}m</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      onClose()
                                      onBook(component.id)
                                    }}
                                    disabled={bookingExam === component.id || !wallet}
                                    className="rounded-lg bg-aerojet-blue px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-[#003875] disabled:opacity-50"
                                  >
                                    {bookingExam === component.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      `Book ${fmt(Number(component.individualPrice))}`
                                    )}
                                  </button>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
