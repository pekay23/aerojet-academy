import { ChevronUp, ChevronDown } from 'lucide-react'
import { GroupedCourse } from './examOnlyTypes'

interface BundleSelectionModalProps {
  bundleType: 'TWO_SEAT' | 'FOUR_SEAT' | null
  onCancel: () => void
  selectedModules: string[]
  setSelectedModules: (next: string[]) => void
  expandedCourse: string | null
  setExpandedCourse: (value: string | null) => void
  groupedComponents: Record<string, GroupedCourse>
  onConfirm: (bundleType: 'TWO_SEAT' | 'FOUR_SEAT', componentIds: string[]) => void
  fmt: (amount: number) => string
  twoSeatPrice: number
  fourSeatPrice: number
  purchasingBundle: string | null
}

export default function BundleSelectionModal({
  bundleType,
  onCancel,
  selectedModules,
  setSelectedModules,
  expandedCourse,
  setExpandedCourse,
  groupedComponents,
  onConfirm,
  fmt,
  twoSeatPrice,
  fourSeatPrice,
  _purchasingBundle,
}: BundleSelectionModalProps) {
  if (!bundleType) return null

  const requiredSeats = bundleType === 'TWO_SEAT' ? 2 : 4

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900">
        <div className="border-b border-slate-100 p-6 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Select {bundleType === 'TWO_SEAT' ? '2' : '4'} Modules
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Choose the modules for your {bundleType === 'TWO_SEAT' ? 'Twin Pack' : '4-Pack'}.
            <span className="ml-1 font-semibold text-indigo-600">
              {selectedModules.length}/{requiredSeats} selected
            </span>
          </p>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-6">
          <div className="space-y-2">
            {Object.values(groupedComponents)
              .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
              .map((course) => {
                const isExpanded = expandedCourse === `bun_${course.code}`
                const selectedInCourse = course.components.filter((c) =>
                  selectedModules.includes(c.id)
                ).length
                const isMaxSelected = selectedModules.length >= requiredSeats

                return (
                  <div
                    key={course.code}
                    className="rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <button
                      onClick={() =>
                        setExpandedCourse(isExpanded ? null : `bun_${course.code}`)
                      }
                      className="flex w-full items-center justify-between p-4 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {course.code}: {course.name}
                        </span>
                        {selectedInCourse > 0 && (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                            {selectedInCourse} selected
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{course.components.length}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-slate-100 px-4 pb-4 dark:border-slate-800">
                        <div className="mt-3 space-y-2">
                          {course.components
                            .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
                            .map((component) => {
                              const isSelected = selectedModules.includes(component.id)
                              return (
                                <label
                                  key={component.id}
                                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                                    isSelected
                                      ? 'border-indigo-500 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-900/20'
                                      : 'border-slate-100 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-600'
                                  } ${isMaxSelected && !isSelected ? 'cursor-not-allowed opacity-50' : ''}`}
                                >
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={isSelected}
                                    disabled={isMaxSelected && !isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked && !isMaxSelected) {
                                        setSelectedModules([...selectedModules, component.id])
                                      } else if (!e.target.checked) {
                                        setSelectedModules(
                                          selectedModules.filter((id) => id !== component.id)
                                        )
                                      }
                                    }}
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                      {component.code} - {component.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {component.type} &bull; {component.duration}m
                                    </p>
                                  </div>
                                </label>
                              )
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(bundleType, selectedModules)}
            disabled={selectedModules.length !== requiredSeats}
            className="flex-1 rounded-xl bg-indigo-600 py-3 text-center text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Confirm & Purchase ({fmt(bundleType === 'TWO_SEAT' ? twoSeatPrice : fourSeatPrice)})
          </button>
        </div>
      </div>
    </div>
  )
}
