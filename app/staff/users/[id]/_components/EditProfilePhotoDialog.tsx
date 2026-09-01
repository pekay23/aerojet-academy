'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'
import { ProtectedImage } from '@/components/ProtectedImage'
import { proxyImageUrl } from '@/lib/storage/signed-url'
import { toast } from 'sonner'
import { UploadButton } from '@/lib/uploads/uploadthing'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface EditProfilePhotoDialogProps {
  userId: string
  currentPhotoUrl?: string | null
}

export default function EditProfilePhotoDialog({
  userId,
  currentPhotoUrl,
}: EditProfilePhotoDialogProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleUploadComplete = async (res: any) => {
    if (!res || res.length === 0) return
    const fileUrl = res[0].url

    try {
      const updateRes = await fetch(`/api/staff/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePhotoUrl: fileUrl }),
      })

      if (!updateRes.ok) throw new Error('Failed to update profile photo URL')

      toast.success('Profile photo updated')
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error('Failed to save profile photo')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md transition-colors hover:scale-105 hover:bg-blue-700"
          title="Edit Profile Photo"
        >
          <Camera className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Photo</DialogTitle>
          <DialogDescription className="sr-only">
            Upload or change the user's profile picture.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-6 py-6">
          <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            {currentPhotoUrl ? (
              <ProtectedImage
                src={proxyImageUrl(currentPhotoUrl, 'profile-photos')}
                alt="Current"
                fill
                sizes="128px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
                <Camera className="h-10 w-10" />
              </div>
            )}
          </div>

          <div className="w-full">
            <UploadButton
              endpoint="profileImage"
              onClientUploadComplete={handleUploadComplete}
              onUploadError={(error: Error) => {
                toast.error(`Upload failed: ${error.message}`)
              }}
              appearance={{
                button:
                  'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl w-full transition-colors',
                allowedContent: 'text-slate-500 dark:text-slate-400 text-xs mt-1',
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
