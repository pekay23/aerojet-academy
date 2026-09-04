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
  const _router = useRouter()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-aerojet-blue/90">
          <Plus className="h-4 w-4" />
          Add Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl lg:max-w-[1100px] sm:max-w-[600px] overflow-hidden p-8">
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
            window.location.reload()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
