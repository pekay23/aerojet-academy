import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { getAuthSession } from '@/lib/auth/helpers'
import { UploadThingError } from 'uploadthing/server'

const f = createUploadthing()

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  paymentProof: f({ image: { maxFileSize: '4MB' }, pdf: { maxFileSize: '4MB' } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      console.log('Uploadthing middleware started for paymentProof')
      try {
        const session = await getAuthSession()
        console.log('Session in middleware:', session ? 'Found' : 'Null')

        if (session) {
          console.log('Session ID:', session.user?.id)
          console.log('Session Role:', session.user?.role)
        }

        // For payment proof, we allow anonymous uploads if the user is not logged in.
        // The security check is handled in the subsequent record creation step.
        const userId = session?.user?.id || 'anonymous_applicant'
        const metadata = { userId }

        console.log('Returning metadata for paymentProof:', metadata)
        return metadata
      } catch (error) {
        console.error('Error in Uploadthing middleware:', error)
        throw error
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log('Upload complete for userId:', metadata.userId)
      console.log('file url', file.ufsUrl)

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId }
    }),

  profileImage: f({ image: { maxFileSize: '2MB', maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getAuthSession()
      if (!session) throw new UploadThingError('Unauthorized')
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Profile Image Upload complete for userId:', metadata.userId)
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
      console.log('News Cover Image Upload complete for userId:', metadata.userId)
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
      console.log('News Attachment Upload complete for userId:', metadata.userId)
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
      console.log('News Image Upload complete for userId:', metadata.userId)
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
      console.log('News Audio Upload complete for userId:', metadata.userId)
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
      console.log('Applicant Document Upload complete for userId:', metadata.userId)
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
      console.log('Resource file uploaded by:', metadata.userId, 'url:', file.ufsUrl)
      return { uploadedBy: metadata.userId, fileUrl: file.ufsUrl, fileName: file.name }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
