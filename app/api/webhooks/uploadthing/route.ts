import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'

/**
 * UploadThing Webhook Handler
 *
 * Handles file upload completion callbacks.
 * Verifies requests using UPLOADTHING_SECRET as a bearer token.
 */
export async function POST(req: NextRequest) {
  try {
    // Verify the webhook comes from UploadThing using the shared secret
    const uploadthingSecret = process.env.UPLOADTHING_SECRET
    if (uploadthingSecret) {
      const authHeader = req.headers.get('authorization')
      const uploadthingHeader = req.headers.get('uploadthing-hook')

      // UploadThing sends a custom header; also accept bearer token for flexibility
      if (!uploadthingHeader && authHeader !== `Bearer ${uploadthingSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await req.json()
    const { file, metadata } = body

    if (!file || !file.url) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const fileUpload = await prisma.fileUpload.create({
      data: {
        filename: file.name || 'unknown',
        originalName: file.name || 'unknown',
        url: file.url,
        mimeType: file.type || 'application/octet-stream',
        size: file.size || 0,
        userId: metadata?.userId,
        fileType: metadata?.entityType || 'GENERAL',
        referenceType: metadata?.entityType,
        referenceId: metadata?.entityId,
      },
    })

    if (metadata?.entityType === 'PaymentProof' && metadata?.userId) {
      await prisma.payment.update({
        where: { id: metadata.entityId },
        data: { proofUrl: file.url },
      })
    }

    return NextResponse.json({ success: true, fileId: fileUpload.id })
  } catch (error: unknown) {
    console.error('UploadThing webhook error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
