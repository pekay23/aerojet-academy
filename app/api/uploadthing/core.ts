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
      console.log('Uploadthing middleware started')
      try {
        const session = await getAuthSession()
        console.log('Session in middleware:', session ? 'Found' : 'Null')

        // If you throw, the user will not be able to upload
        if (!session) {
          console.error('Uploadthing unauthorized: No session')
          throw new UploadThingError('Unauthorized')
        }

        // Whatever is returned here is accessible in onUploadComplete as `metadata`
        return { userId: session.user.id }
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
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
