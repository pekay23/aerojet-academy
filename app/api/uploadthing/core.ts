import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { getAuthSession } from '@/lib/auth/helpers'
import { UploadThingError } from 'uploadthing/server'
import { recordFileUpload } from '@/lib/storage/file-upload-record'

const f = createUploadthing()

/**
 * Capture every UploadThing upload into the `FileUpload` table so the nightly
 * `/api/cron/supabase-mirror` job can mirror bytes to the Supabase bucket.
 * Best-effort — failures here are logged, not thrown, so the user's upload
 * never breaks because of a record-write hiccup.
 */
async function captureUpload(args: {
  metadata: { userId: string }
  route: string
  file: { name: string; size: number; type: string; ufsUrl: string; key: string }
  referenceType?: string
  referenceId?: string
}) {
  // Anonymous applicant uploads (paymentProof pre-registration) — skip the
  // FileUpload row entirely; we'll backfill once they create an account.
  if (!args.metadata.userId || args.metadata.userId === 'anonymous_applicant') return
  await recordFileUpload({
    userId: args.metadata.userId,
    route: args.route,
    filename: args.file.key,
    originalName: args.file.name,
    mimeType: args.file.type,
    size: args.file.size,
    uploadthingUrl: args.file.ufsUrl,
    uploadthingKey: args.file.key,
    referenceType: args.referenceType,
    referenceId: args.referenceId,
  })
}

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  paymentProof: f({ image: { maxFileSize: '4MB' }, pdf: { maxFileSize: '4MB' } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      try {
        const session = await getAuthSession()
        // For payment proof, we allow anonymous uploads if the user is not logged in.
        // The security check is handled in the subsequent record creation step.
        const userId = session?.user?.id || 'anonymous_applicant'
        return { userId }
      } catch (error) {
        console.error('Error in Uploadthing middleware:', error)
        throw error
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await captureUpload({ metadata, route: 'paymentProof', file })
      return { uploadedBy: metadata.userId }
    }),

  profileImage: f({ image: { maxFileSize: '2MB', maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getAuthSession()
      if (!session) throw new UploadThingError('Unauthorized')
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await captureUpload({ metadata, route: 'profileImage', file })
      return { uploadedBy: metadata.userId }
    }),

  newsCoverImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getAuthSession()
      if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
        throw new UploadThingError('Unauthorized')
      }
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await captureUpload({ metadata, route: 'newsCoverImage', file })
      return { uploadedBy: metadata.userId }
    }),

  newsAttachment: f({
    image: { maxFileSize: '4MB', maxFileCount: 1 },
    video: { maxFileSize: '16MB', maxFileCount: 1 },
    audio: { maxFileSize: '8MB', maxFileCount: 1 },
    blob: { maxFileSize: '4MB', maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const session = await getAuthSession()
      if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
        throw new UploadThingError('Unauthorized')
      }
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await captureUpload({ metadata, route: 'newsAttachment', file })
      return { uploadedBy: metadata.userId, fileUrl: file.ufsUrl }
    }),

  newsImage: f({ blob: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getAuthSession()
      if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
        throw new UploadThingError('Unauthorized')
      }
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await captureUpload({ metadata, route: 'newsImage', file })
      return { uploadedBy: metadata.userId, fileUrl: file.ufsUrl }
    }),

  newsAudio: f({ blob: { maxFileSize: '32MB', maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getAuthSession()
      if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
        throw new UploadThingError('Unauthorized')
      }
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await captureUpload({ metadata, route: 'newsAudio', file })
      return { uploadedBy: metadata.userId, fileUrl: file.ufsUrl }
    }),
  // Admissions Pipeline — applicant document uploads (CV, ID, certificates, etc.)
  applicantDocument: f({
    pdf: { maxFileSize: '4MB', maxFileCount: 1 },
    image: { maxFileSize: '4MB', maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const session = await getAuthSession()
      if (!session) throw new UploadThingError('Unauthorized')
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await captureUpload({ metadata, route: 'applicantDocument', file })
      return { uploadedBy: metadata.userId, fileUrl: file.ufsUrl, fileName: file.name }
    }),

  resourceFile: f({
    pdf: { maxFileSize: '32MB', maxFileCount: 1 },
    image: { maxFileSize: '16MB', maxFileCount: 1 },
    blob: { maxFileSize: '32MB', maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const session = await getAuthSession()
      if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
        throw new UploadThingError('Unauthorized')
      }
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await captureUpload({ metadata, route: 'resourceFile', file })
      return { uploadedBy: metadata.userId, fileUrl: file.ufsUrl, fileName: file.name }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
