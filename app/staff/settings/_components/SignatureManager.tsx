'use client'
import { formatDate } from '@/lib/utils/formatters'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Upload,
  Trash2,
  Edit2,
  X,
  Loader2,
  Image as ImageIcon,
  Clock,
  AlertCircle,
  FileText,
  Plus,
  PenTool,
} from 'lucide-react'
import Image from 'next/image'
import {
  listSignaturesForAdmin,
  uploadSignatureAction,
  deleteSignatureAction,
  updateSignatureAction,
} from '@/app/staff/settings/_actions/pdf-template-actions'
import SignatureCanvas from './SignatureCanvas'
import { useFormDirty } from '@/hooks/useFormDirty'

export type Signature = {
  id: string
  label: string
  signerName: string
  imageUrl: string
  signedUrl: string
  isActive: boolean
  sortOrder: number
  expiresAt: string | null
  uploadedBy: string | null
  consentGivenBy: string | null
  consentMethod: string | null
  createdAt: string
  updatedAt: string
  templates: {
    id: string
    templateId: string
    signatureId: string
    position: number
    template: {
      id: string
      name: string
      type: string
    }
  }[]
}

export default function SignatureManager() {
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [drawMode, setDrawMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const [label, setLabel] = useState('')
  const [signerName, setSignerName] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  const [editLabel, setEditLabel] = useState('')
  const [editSignerName, setEditSignerName] = useState('')
  const [editExpiresAt, setEditExpiresAt] = useState('')
  const [saving, setSaving] = useState(false)

  const { markDirty, markClean } = useFormDirty()

  const fetchSignatures = useCallback(async () => {
    try {
      const data = await listSignaturesForAdmin()
      setSignatures(data as unknown as Signature[])
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load signatures'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSignatures()
  }, [fetchSignatures])

  const resetUploadForm = () => {
    setLabel('')
    setSignerName('')
    setExpiresAt('')
    setFile(null)
    setFilePreview(null)
    setDrawMode(false)
    setShowUpload(false)
  }

  const readFileAsBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(f)
    })
  }

  const handleFileChange = (f: File) => {
    if (!f.type.startsWith('image/png') && !f.type.startsWith('image/jpeg')) {
      toast.error('Only PNG and JPG files are supported')
      return
    }
    setFile(f)
    setFilePreview(URL.createObjectURL(f))
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileChange(droppedFile)
  }

  const handleUpload = async () => {
    if (!file || !label.trim() || !signerName.trim()) {
      toast.error('Label, signer name, and file are required')
      return
    }
    setUploading(true)
    try {
      const base64 = await readFileAsBase64(file)
      await uploadSignatureAction({
        label: label.trim(),
        signerName: signerName.trim(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        file: base64,
        contentType: file.type,
      })
      toast.success('Signature uploaded')
      markClean()
      resetUploadForm()
      fetchSignatures()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload signature')
    } finally {
      setUploading(false)
    }
  }

  const handleDrawSave = async (dataUrl: string) => {
    if (!label.trim() || !signerName.trim()) {
      toast.error('Label and signer name are required')
      return
    }
    setUploading(true)
    try {
      // dataUrl is already base64 (data:image/png;base64,...)
      const base64 = dataUrl.split(',')[1]
      await uploadSignatureAction({
        label: label.trim(),
        signerName: signerName.trim(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        file: base64,
        contentType: 'image/png',
      })
      toast.success('Signature drawn and saved')
      markClean()
      resetUploadForm()
      fetchSignatures()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save signature')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const sig = signatures.find((s) => s.id === id)
    if (!sig) return
    if (sig.templates.length > 0) {
      toast.error('Cannot delete: signature is assigned to a template')
      return
    }
    if (!confirm(`Delete signature "${sig.label}" (${sig.signerName})?`)) return
    try {
      await deleteSignatureAction(id)
      toast.success('Signature deleted')
      fetchSignatures()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete signature')
    }
  }

  const startEdit = (sig: Signature) => {
    setEditingId(sig.id)
    setEditLabel(sig.label)
    setEditSignerName(sig.signerName)
    setEditExpiresAt(sig.expiresAt ? sig.expiresAt.split('T')[0] : '')
  }

  const handleEditSave = async (id: string) => {
    if (!editLabel.trim() || !editSignerName.trim()) {
      toast.error('Label and signer name are required')
      return
    }
    setSaving(true)
    try {
      await updateSignatureAction(id, {
        label: editLabel.trim(),
        signerName: editSignerName.trim(),
        expiresAt: editExpiresAt || null,
      })
      toast.success('Signature updated')
      markClean()
      setEditingId(null)
      fetchSignatures()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update signature')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditLabel('')
    setEditSignerName('')
    setEditExpiresAt('')
  }

  const isExpired = (expiresAtStr: string | null) => {
    if (!expiresAtStr) return false
    return new Date(expiresAtStr) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/50">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-500">Loading signatures...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
        <button
          type="button"
          onClick={fetchSignatures}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Signatures</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload and manage digital signature images for certificates and transcripts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="bg-aerojet-blue flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#003875]"
        >
          <Plus className="h-3.5 w-3.5" />
          Upload Signature
        </button>
      </div>

      {/* Signature Grid */}
      {signatures.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
          <ImageIcon className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-bold text-slate-500">No signatures uploaded</p>
          <p className="text-xs text-slate-400">Upload a signature image to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {signatures.map((sig) => {
            const expired = isExpired(sig.expiresAt)
            const isEditing = editingId === sig.id
            return (
              <div
                key={sig.id}
                className={`rounded-xl border p-4 transition-all ${
                  expired
                    ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10'
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                    {sig.signedUrl ? (
                      <Image
                        src={sig.signedUrl}
                        alt={sig.label}
                        fill
                        style={{ objectFit: 'contain' }}
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => {
                            setEditLabel(e.target.value)
                            markDirty()
                          }}
                          placeholder="Label"
                          className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs focus:ring-1 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          value={editSignerName}
                          onChange={(e) => {
                            setEditSignerName(e.target.value)
                            markDirty()
                          }}
                          placeholder="Signer name"
                          className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs focus:ring-1 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                        <input
                          type="date"
                          value={editExpiresAt}
                          onChange={(e) => {
                            setEditExpiresAt(e.target.value)
                            markDirty()
                          }}
                          className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs focus:ring-1 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditSave(sig.id)}
                            disabled={saving}
                            className="bg-aerojet-blue flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-white disabled:opacity-50"
                          >
                            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-lg px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {sig.label}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {sig.signerName}
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          {sig.expiresAt ? formatDate(sig.expiresAt) : 'No expiry'}
                          {expired && (
                            <span className="ml-1 inline-flex items-center gap-0.5 text-red-600 dark:text-red-400">
                              <AlertCircle className="h-3 w-3" />
                              Expired
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Template assignments */}
                {sig.templates.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {sig.templates.map((t) => (
                      <span
                        key={t.id}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                      >
                        <FileText className="h-2.5 w-2.5" />
                        {t.template.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {!isEditing && (
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400">
                      {sig.templates.length === 0
                        ? 'Not assigned'
                        : `Assigned to ${sig.templates.length} template${sig.templates.length !== 1 ? 's' : ''}`}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(sig)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(sig.id)}
                        disabled={sig.templates.length > 0}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                        title={sig.templates.length > 0 ? 'Assigned to template' : 'Delete'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Upload Dialog */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Signature</h3>
              <button
                type="button"
                onClick={resetUploadForm}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mode toggle */}
            <div className="mb-4 flex rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setDrawMode(false)
                  setFile(null)
                  setFilePreview(null)
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-l-lg px-3 py-2 text-xs font-bold transition-colors ${
                  !drawMode
                    ? 'bg-aerojet-blue text-white'
                    : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Image
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawMode(true)
                  setFile(null)
                  setFilePreview(null)
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-r-lg px-3 py-2 text-xs font-bold transition-colors ${
                  drawMode
                    ? 'bg-aerojet-blue text-white'
                    : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <PenTool className="h-3.5 w-3.5" />
                Draw Signature
              </button>
            </div>

            <div className="space-y-4">
              {drawMode ? (
                <SignatureCanvas onClose={() => setDrawMode(false)} onSave={handleDrawSave} />
              ) : (
                <>
                  {/* Drag-and-drop zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOver(true)
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault()
                      setDragOver(true)
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('signature-file-input')?.click()}
                    className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                      dragOver
                        ? 'border-aerojet-blue bg-aerojet-blue/5'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <input
                      id="signature-file-input"
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleFileChange(f)
                      }}
                      className="hidden"
                    />
                    {filePreview ? (
                      <div className="mx-auto h-24 w-24">
                        <Image
                          src={filePreview}
                          alt="Preview"
                          fill
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Drop a PNG or JPG file here, or click to browse
                        </p>
                        <p className="mt-1 text-xs text-slate-400">Max 500KB</p>
                      </>
                    )}
                    {file && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setFile(null)
                          setFilePreview(null)
                        }}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                        Remove
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Fields */}
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">
                    Label *
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => {
                      setLabel(e.target.value)
                      markDirty()
                    }}
                    placeholder="e.g. Training Manager"
                    className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">
                    Signer Name *
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => {
                      setSignerName(e.target.value)
                      markDirty()
                    }}
                    placeholder="e.g. Capt. John Doe"
                    className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">
                    Expiry Date (optional)
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => {
                      setExpiresAt(e.target.value)
                      markDirty()
                    }}
                    className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
                <button
                  type="button"
                  onClick={resetUploadForm}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 transition-colors hover:text-slate-700"
                >
                  Cancel
                </button>
                {!drawMode && (
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading || !file}
                    className="bg-aerojet-blue flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#003875] disabled:opacity-50"
                  >
                    {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Upload
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
