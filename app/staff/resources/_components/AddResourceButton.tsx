'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import ResourceForm from './ResourceForm'
import { useRouter } from 'next/navigation'

export default function AddResourceButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-aerojet-blue hover:bg-aerojet-blue/90 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors">
          <Plus className="h-4 w-4" />
          Add Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden rounded-3xl p-8 sm:max-w-150 lg:max-w-275">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 dark:text-slate-100">
            Add New Resource
          </DialogTitle>
          <DialogDescription className="sr-only">
            Upload and configure a new training resource.
          </DialogDescription>
        </DialogHeader>
        <ResourceForm
          onSuccess={() => {
            setOpen(false)
            router.refresh()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
