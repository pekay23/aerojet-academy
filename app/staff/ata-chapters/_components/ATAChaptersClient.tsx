'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Loader2, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown } from 'lucide-react'
import { upsertATAChapter, toggleATAChapterStatus } from '../actions'
import { useToast } from '@/hooks/use-toast'

interface ATAChapter {
  id: string
  code: string
  title: string
  description: string | null
  category: string
  sortOrder: number
  isActive: boolean
}

type SortField = 'code' | 'title' | 'sortOrder' | 'isActive'

export default function ATAChaptersClient({ initialChapters }: { initialChapters: ATAChapter[] }) {
  const router = useRouter()
  const toast = useToast()
  const [chapters, _setChapters] = useState(initialChapters)
  const [isPending, startTransition] = useTransition()
  const [editingChapter, setEditingChapter] = useState<ATAChapter | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Sorting and Grouping State
  const [sortField, setSortField] = useState<SortField>('sortOrder')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    GENERAL: true,
    AIRFRAME: true,
    AVIONICS: true,
    POWERPLANT: true,
  })

  // Form state
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<'AIRFRAME' | 'POWERPLANT' | 'AVIONICS' | 'GENERAL'>(
    'GENERAL'
  )
  const [sortOrder, setSortOrder] = useState<number>(0)
  const [isActive, setIsActive] = useState(true)

  const openModal = (chapter?: ATAChapter) => {
    if (chapter) {
      setEditingChapter(chapter)
      setCode(chapter.code)
      setTitle(chapter.title)
      setDescription(chapter.description || '')
      setCategory(chapter.category as 'AIRFRAME' | 'POWERPLANT' | 'AVIONICS' | 'GENERAL')
      setSortOrder(chapter.sortOrder)
      setIsActive(chapter.isActive)
    } else {
      setEditingChapter(null)
      setCode('')
      setTitle('')
      setDescription('')
      setCategory('GENERAL')
      setSortOrder(chapters.length > 0 ? Math.max(...chapters.map((c) => c.sortOrder)) + 10 : 10)
      setIsActive(true)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingChapter(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await upsertATAChapter({
        id: editingChapter?.id,
        code,
        title,
        description,
        category,
        sortOrder,
        isActive,
      })

      if (!res.success) {
        toast.error(res.error || 'Failed to save chapter')
      } else {
        closeModal()
        router.refresh()
      }
    })
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await toggleATAChapterStatus(id, !currentStatus)
      if (!res.success) {
        toast.error(res.error || 'Failed to toggle status')
      } else {
        router.refresh()
      }
    })
  }

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedChapters = useMemo(() => {
    return [...chapters].sort((a, b) => {
      let comparison = 0
      if (sortField === 'code') comparison = a.code.localeCompare(b.code)
      if (sortField === 'title') comparison = a.title.localeCompare(b.title)
      if (sortField === 'sortOrder') comparison = a.sortOrder - b.sortOrder
      if (sortField === 'isActive') {
        comparison = a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [chapters, sortField, sortDirection])

  const CATEGORIES = ['GENERAL', 'AIRFRAME', 'AVIONICS', 'POWERPLANT']

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="mb-0.5 ml-1 inline-block h-3 w-3 opacity-30" />
    return sortDirection === 'asc' ? (
      <ArrowUp className="mb-0.5 ml-1 inline-block h-3 w-3 text-blue-600 dark:text-blue-400" />
    ) : (
      <ArrowDown className="mb-0.5 ml-1 inline-block h-3 w-3 text-blue-600 dark:text-blue-400" />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
          Chapter Directory
        </h2>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Chapter
        </button>
      </div>

      <div className="space-y-4">
        {CATEGORIES.map((categoryName) => {
          const items = sortedChapters.filter((c) => c.category === categoryName)
          if (items.length === 0) return null

          const isOpen = openCategories[categoryName]

          return (
            <div
              key={categoryName}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <button
                onClick={() => toggleCategory(categoryName)}
                className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80"
              >
                <div className="flex items-center gap-3">
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition-transform ${
                      isOpen ? '' : '-rotate-90'
                    }`}
                  />
                  <h3 className="font-bold text-slate-800 dark:text-white">
                    {categoryName} CHAPTERS
                  </h3>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {items.length}
                  </span>
                </div>
              </button>

              {isOpen && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-slate-200/60 bg-white dark:border-slate-700/60 dark:bg-slate-900">
                      <th
                        className="cursor-pointer px-4 py-3 text-left font-semibold text-slate-500 select-none hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        onClick={() => handleSort('code')}
                      >
                        ATA Code <SortIndicator field="code" />
                      </th>
                      <th
                        className="cursor-pointer px-4 py-3 text-left font-semibold text-slate-500 select-none hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        onClick={() => handleSort('title')}
                      >
                        Title <SortIndicator field="title" />
                      </th>
                      <th
                        className="cursor-pointer px-4 py-3 text-center font-semibold text-slate-500 select-none hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        onClick={() => handleSort('sortOrder')}
                      >
                        Order <SortIndicator field="sortOrder" />
                      </th>
                      <th
                        className="cursor-pointer px-4 py-3 text-center font-semibold text-slate-500 select-none hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        onClick={() => handleSort('isActive')}
                      >
                        Status <SortIndicator field="isActive" />
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-500 dark:text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                    {items.map((chapter) => (
                      <tr
                        key={chapter.id}
                        className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                      >
                        <td className="w-32 px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">
                          {chapter.code}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          <div className="font-semibold">{chapter.title}</div>
                          {chapter.description && (
                            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {chapter.description}
                            </div>
                          )}
                        </td>
                        <td className="w-24 px-4 py-3 text-center font-mono text-slate-500">
                          {chapter.sortOrder}
                        </td>
                        <td className="w-28 px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleStatus(chapter.id, chapter.isActive)}
                            disabled={isPending}
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              chapter.isActive
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                            }`}
                          >
                            {chapter.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="w-20 px-4 py-3 text-right">
                          <button
                            onClick={() => openModal(chapter)}
                            className="inline-flex items-center rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
              {editingChapter ? 'Edit ATA Chapter' : 'Add ATA Chapter'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    ATA Code (e.g. 21)
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(
                        e.target.value as 'AIRFRAME' | 'POWERPLANT' | 'AVIONICS' | 'GENERAL'
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500"
                  >
                    <option value="GENERAL">General</option>
                    <option value="AIRFRAME">Airframe</option>
                    <option value="POWERPLANT">Powerplant</option>
                    <option value="AVIONICS">Avionics</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    required
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:checked:bg-blue-500"
                    />
                    Active Status
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
