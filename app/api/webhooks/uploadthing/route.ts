import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'

// UploadThing webhook: handles file upload completion callbacks
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { file, metadata } = body

    if (!file || !file.url) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Create FileUpload record
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

    // If it's a payment proof upload, update the user's record
    if (metadata?.entityType === 'PaymentProof' && metadata?.userId) {
      await prisma.payment.update({
        where: { id: metadata.entityId },
        data: { proofUrl: file.url },
      })
    }

    // If it's a course material, no extra action needed — FileUpload record is enough

    return NextResponse.json({ success: true, fileId: fileUpload.id })
  } catch (error: any) {
    console.error('UploadThing webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

