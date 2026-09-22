'use client'

import React, { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, ExternalLink, Trash2, Edit3, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { deleteResource } from '@/lib/actions/resources'
import { toast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'

interface Resource {
  id: string
  name: string
  description?: string | null
  url: string
  type: string
  category: string
  showToInstructors: boolean
  showToStaff: boolean
  showToStudents: boolean
  courses?: Array<{ id: string; code: string; name: string }> | null
  pathways?: Array<{ id: string; code: string; name: string }> | null
}

interface ResourceListProps {
  resources: Resource[]
}

export default function ResourceList({ resources: initialResources }: ResourceListProps) {
  const [resources, setResources] = useState(initialResources)
  const [, setEditingResource] = useState<Resource | null>(null)
  const [sortField, setSortField] = useState<'name' | 'category' | 'type' | 'visibility'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteResource(deleteTarget.id)
      setResources(resources.filter((r) => r.id !== deleteTarget.id))
      toast.success('Resource deleted')
      setDeleteTarget(null)
    } catch (_error) {
      toast.error('Failed to delete resource')
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleSort = (field: 'name' | 'category' | 'type' | 'visibility') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedResources = useMemo(() => {
    return [...resources].sort((a, b) => {
      let valA = ''
      let valB = ''

      if (sortField === 'name') {
        valA = a.name || ''
        valB = b.name || ''
      } else if (sortField === 'category') {
        valA = a.category || ''
        valB = b.category || ''
      } else if (sortField === 'type') {
        valA = a.type || ''
        valB = b.type || ''
      } else if (sortField === 'visibility') {
        valA = (a.showToInstructors ? '1' : '0') + (a.showToStaff ? '1' : '0') + (a.showToStudents ? '1' : '0')
        valB = (b.showToInstructors ? '1' : '0') + (b.showToStaff ? '1' : '0') + (b.showToStudents ? '1' : '0')
      }

      const comparison = valA.localeCompare(valB, undefined, { sensitivity: 'base' })
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [resources, sortField, sortOrder])

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
              <TableHead
                onClick={() => toggleSort('name')}
                className="cursor-pointer select-none text-[10px] font-bold tracking-wider uppercase group hover:text-slate-900 dark:hover:text-white"
                aria-label="Sort by Name"
                aria-sort={sortField === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center gap-1.5">
                  Resource
                  {sortField === 'name' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-600" /> : <ArrowDown className="h-3 w-3 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </TableHead>
              <TableHead
                onClick={() => toggleSort('category')}
                className="cursor-pointer select-none text-[10px] font-bold tracking-wider uppercase group hover:text-slate-900 dark:hover:text-white"
                aria-label="Sort by Category"
                aria-sort={sortField === 'category' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center gap-1.5">
                  Category
                  {sortField === 'category' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-600" /> : <ArrowDown className="h-3 w-3 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </TableHead>
              <TableHead
                onClick={() => toggleSort('type')}
                className="cursor-pointer select-none text-[10px] font-bold tracking-wider uppercase group hover:text-slate-900 dark:hover:text-white"
                aria-label="Sort by Type"
                aria-sort={sortField === 'type' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center gap-1.5">
                  Type
                  {sortField === 'type' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-600" /> : <ArrowDown className="h-3 w-3 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </TableHead>
              <TableHead
                onClick={() => toggleSort('visibility')}
                className="cursor-pointer select-none text-[10px] font-bold tracking-wider uppercase group hover:text-slate-900 dark:hover:text-white"
                aria-label="Sort by Visibility"
                aria-sort={sortField === 'visibility' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center gap-1.5">
                  Visibility
                  {sortField === 'visibility' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-600" /> : <ArrowDown className="h-3 w-3 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right text-[10px] font-bold tracking-wider uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedResources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-slate-500">
                  No general resources found.
                </TableCell>
              </TableRow>
            ) : (
              sortedResources.map((resource) => (
                <TableRow
                  key={resource.id}
                  className="group transition-all duration-150 ease-out hover:bg-white/80 dark:hover:bg-slate-800/40"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {resource.type === 'LINK' ? (
                          <ExternalLink className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {resource.name}
                        </div>
                        <div className="max-w-[200px] truncate font-mono text-[10px] text-slate-400">
                          {resource.url}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-slate-200 px-2 py-0 text-[10px] font-bold tracking-widest uppercase dark:border-slate-700"
                    >
                      {resource.category
                        .toLowerCase()
                        .split('_')
                        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                        .join(' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-slate-500">{resource.type}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      {resource.showToInstructors && (
                        <Badge className="h-5 border-blue-100 bg-blue-50 px-1.5 text-[9px] tracking-tighter text-blue-600 hover:bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400">
                          INS
                        </Badge>
                      )}
                      {resource.showToStaff && (
                        <Badge className="h-5 border-purple-100 bg-purple-50 px-1.5 text-[9px] tracking-tighter text-purple-600 hover:bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400">
                          STAFF
                        </Badge>
                      )}
                      {resource.showToStudents && (
                        <Badge className="h-5 border-emerald-100 bg-emerald-50 px-1.5 text-[9px] tracking-tighter text-emerald-600 hover:bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400">
                          STU
                        </Badge>
                      )}
                       {(resource.courses ?? []).length > 0 && (
                         <Badge variant="outline" className="h-5 px-1.5 text-[9px] tracking-tighter font-mono">
                           {(resource.courses ?? []).length} MOD
                         </Badge>
                       )}
                       {(resource.pathways ?? []).length > 0 && (
                         <Badge variant="outline" className="h-5 px-1.5 text-[9px] tracking-tighter">
                           {(resource.pathways ?? []).length} PTH
                         </Badge>
                       )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg outline-none"
                          aria-label="Resource actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl">
                        <DropdownMenuItem
                          onClick={() => setEditingResource(resource)}
                          className="cursor-pointer gap-2 rounded-lg"
                        >
                          <Edit3 className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(resource)}
                          className="cursor-pointer gap-2 rounded-lg text-rose-600 focus:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
      </div>

      {deleteTarget && (
        <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Resource</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deleteTarget.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
