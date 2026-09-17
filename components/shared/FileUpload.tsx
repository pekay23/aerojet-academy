'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileIcon } from 'lucide-react'

interface FileUploadProps {
  accept?: string
  maxSize?: number // MB
  onFileSelect: (file: File) => void
  label?: string
}

export function FileUpload({
  accept = 'image/*,.pdf',
  maxSize = 4,
  onFileSelect,
  label = 'Upload file',
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')

    if (file.size > maxSize * 1024 * 1024) {
      setError(`File must be less than ${maxSize}MB`)
      return
    }

    setSelectedFile(file)
    onFileSelect(file)
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        className="hover:border-primary/50 hover:bg-muted/50 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors"
      >
        <Upload className="text-muted-foreground h-8 w-8" />
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">Max {maxSize}MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleSelect}
          className="hidden"
        />
      </div>
      {selectedFile && (
        <div className="flex items-center gap-2 rounded-md border p-2 text-sm">
          <FileIcon className="h-4 w-4" />
          <span className="flex-1 truncate">{selectedFile.name}</span>
          <button
            aria-label="Remove file"
            onClick={() => {
              setSelectedFile(null)
              if (inputRef.current) inputRef.current.value = ''
            }}
          >
            <X className="text-muted-foreground hover:text-foreground h-4 w-4" />
          </button>
        </div>
      )}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  )
}
