const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_DOC_TYPES = ['application/pdf']

export function validateFileType(file: { type: string }, category: 'image' | 'document' | 'any'): boolean {
  if (category === 'image') return ALLOWED_IMAGE_TYPES.includes(file.type)
  if (category === 'document') return ALLOWED_DOC_TYPES.includes(file.type)
  return [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES].includes(file.type)
}

export function validateFileSize(sizeBytes: number, maxMB: number): boolean {
  return sizeBytes <= maxMB * 1024 * 1024
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase()
}
