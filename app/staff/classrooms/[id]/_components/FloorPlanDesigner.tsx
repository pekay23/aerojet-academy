'use client'

import { useState, useCallback } from 'react'
import {
  Save,
  Loader2,
  RotateCcw,
  Grid3X3,
  Armchair,
  Square,
  Ban,
  Minus,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type CellType = 'DESK' | 'AISLE' | 'OBSTACLE'

interface Cell {
  row: number
  col: number
  type: CellType
  label: string | null
}

interface LayoutData {
  rows: number
  cols: number
  cells: Cell[]
}

interface FloorPlanDesignerProps {
  classroomId: string
  classroomName: string
  initialLayout: LayoutData | null
}

const TOOLS: { type: CellType; label: string; icon: typeof Armchair; color: string }[] = [
  { type: 'DESK', label: 'Desk', icon: Armchair, color: 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-700' },
  { type: 'AISLE', label: 'Aisle', icon: Square, color: 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800/50 dark:text-slate-500 dark:border-slate-700' },
  { type: 'OBSTACLE', label: 'Obstacle', icon: Ban, color: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' },
]

function generateLabels(cells: Cell[]): Cell[] {
  const desks = cells
    .filter((c) => c.type === 'DESK')
    .sort((a, b) => a.row - b.row || a.col - b.col)

  let currentRow = -1
  let rowLetter = 64 // ASCII before 'A'
  let colNum = 0

  return cells.map((cell) => {
    if (cell.type !== 'DESK') return { ...cell, label: null }

    const deskIndex = desks.findIndex((d) => d.row === cell.row && d.col === cell.col)
    const desk = desks[deskIndex]

    if (desk.row !== currentRow) {
      currentRow = desk.row
      rowLetter++
      colNum = 0
    }
    colNum++

    return { ...cell, label: `${String.fromCharCode(rowLetter)}${colNum}` }
  })
}

function buildInitialGrid(rows: number, cols: number): Cell[] {
  const cells: Cell[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ row: r, col: c, type: 'AISLE', label: null })
    }
  }
  return cells
}

export default function FloorPlanDesigner({
  classroomId,
  classroomName,
  initialLayout,
}: FloorPlanDesignerProps) {
  const [rows, setRows] = useState(initialLayout?.rows ?? 6)
  const [cols, setCols] = useState(initialLayout?.cols ?? 8)
  const [cells, setCells] = useState<Cell[]>(
    initialLayout?.cells ?? buildInitialGrid(6, 8)
  )
  const [activeTool, setActiveTool] = useState<CellType>('DESK')
  const [saving, setSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const deskCount = cells.filter((c) => c.type === 'DESK').length

  const getCell = useCallback(
    (row: number, col: number) => cells.find((c) => c.row === row && c.col === col),
    [cells]
  )

  function updateCell(row: number, col: number) {
    setCells((prev) => {
      const updated = prev.map((c) =>
        c.row === row && c.col === col ? { ...c, type: activeTool, label: null } : c
      )
      return generateLabels(updated)
    })
  }

  function handleResizeGrid(newRows: number, newCols: number) {
    const clamped = {
      rows: Math.max(1, Math.min(30, newRows)),
      cols: Math.max(1, Math.min(30, newCols)),
    }
    setRows(clamped.rows)
    setCols(clamped.cols)

    setCells((prev) => {
      const newCells: Cell[] = []
      for (let r = 0; r < clamped.rows; r++) {
        for (let c = 0; c < clamped.cols; c++) {
          const existing = prev.find((p) => p.row === r && p.col === c)
          newCells.push(existing ?? { row: r, col: c, type: 'AISLE', label: null })
        }
      }
      return generateLabels(newCells)
    })
  }

  function handleReset() {
    setCells(generateLabels(buildInitialGrid(rows, cols)))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const labeled = generateLabels(cells)
      const res = await fetch(`/api/staff/classrooms/${classroomId}/layout`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, cols, cells: labeled }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save layout')
      }
      toast.success('Floor plan saved', {
        description: `${deskCount} desks configured for ${classroomName}`,
      })
    } catch (err: any) {
      toast.error(err.message || 'Failed to save layout')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Tool selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Tool:
          </span>
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <button
                key={tool.type}
                onClick={() => setActiveTool(tool.type)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all',
                  activeTool === tool.type
                    ? tool.color + ' ring-2 ring-offset-1 ring-aerojet-sky'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tool.label}
              </button>
            )
          })}
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

        {/* Grid size */}
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-slate-400" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleResizeGrid(rows - 1, cols)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              type="number"
              min={1}
              max={30}
              value={rows}
              onChange={(e) => handleResizeGrid(parseInt(e.target.value) || 1, cols)}
              className="h-7 w-12 text-center text-xs"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleResizeGrid(rows + 1, cols)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <span className="text-xs text-slate-400">x</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleResizeGrid(rows, cols - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              type="number"
              min={1}
              max={30}
              value={cols}
              onChange={(e) => handleResizeGrid(rows, parseInt(e.target.value) || 1)}
              className="h-7 w-12 text-center text-xs"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleResizeGrid(rows, cols + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>
            <Armchair className="mr-1 inline h-3.5 w-3.5 text-indigo-500" />
            {deskCount} desks
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-aerojet-blue hover:bg-aerojet-sky"
          >
            {saving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            Save Layout
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex justify-center">
          {/* Instructor area label */}
          <div className="space-y-2">
            <div className="mb-4 flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/50 px-6 py-2 dark:border-slate-700 dark:bg-slate-900/50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Front of Room
              </span>
            </div>

            <div
              className="grid gap-1.5 select-none"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              }}
              onMouseLeave={() => setIsDragging(false)}
            >
              {Array.from({ length: rows }, (_, r) =>
                Array.from({ length: cols }, (_, c) => {
                  const cell = getCell(r, c)
                  const type = cell?.type ?? 'AISLE'
                  const label = cell?.label

                  return (
                    <button
                      key={`${r}-${c}`}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setIsDragging(true)
                        updateCell(r, c)
                      }}
                      onMouseEnter={() => {
                        if (isDragging) updateCell(r, c)
                      }}
                      onMouseUp={() => setIsDragging(false)}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg border text-[10px] font-bold transition-all sm:h-12 sm:w-12',
                        type === 'DESK' &&
                          'border-indigo-300 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
                        type === 'AISLE' &&
                          'border-slate-200 bg-white/60 text-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-600',
                        type === 'OBSTACLE' &&
                          'border-red-200 bg-red-50 text-red-400 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-500'
                      )}
                      title={`Row ${r + 1}, Col ${c + 1} — ${type}${label ? ` (${label})` : ''}`}
                    >
                      {type === 'DESK' && label}
                      {type === 'OBSTACLE' && <Ban className="h-3.5 w-3.5" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-bold uppercase tracking-widest">Legend:</span>
        {TOOLS.map((tool) => {
          const Icon = tool.icon
          return (
            <span key={tool.type} className="flex items-center gap-1.5">
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded border',
                  tool.color
                )}
              >
                <Icon className="h-3 w-3" />
              </span>
              {tool.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
