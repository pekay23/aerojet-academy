import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { renderToStream } from '@react-pdf/renderer'
import { InvoiceTemplate, type InvoiceItem, type InvoiceTemplateProps } from '@/components/pdf/templates/InvoiceTemplate'
import { getPDFSettings } from '@/lib/pdf-settings'
import React from 'react'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          profile: true,
          studentProfile: true,
        },
      },
    },
  })

  if (!invoice) return new NextResponse('Not Found', { status: 404 })

  if (
    invoice.userId !== session.user.id &&
    !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)
  ) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const pdfSettings = await getPDFSettings(req.nextUrl.origin)
    const studentName =
      [invoice.user.profile?.firstName, invoice.user.profile?.lastName].filter(Boolean).join(' ') ||
      'Student'

    // Ensure items are properly shaped
    let items: InvoiceItem[]
    const rawItems = invoice.items as unknown as InvoiceItem[] | undefined
    if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
      items = [
        {
          description: 'Academy Fees',
          quantity: 1,
          unitPrice: Number(invoice.amount),
          total: Number(invoice.amount),
        },
      ]
    } else {
      items = rawItems
    }

    const invoiceProps: InvoiceTemplateProps = {
      logoUrl: pdfSettings.logoUrl,
      watermarkUrl: pdfSettings.watermarkUrl,
      watermarkOpacity: pdfSettings.watermarkOpacity,
      invoiceNumber: invoice.invoiceNumber || 'N/A',
      date: invoice.createdAt,
      dueDate: new Date(invoice.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
      studentName,
      studentEmail: invoice.user.email,
      studentId: invoice.user.studentProfile?.studentId || undefined,
      items,
      subtotal: Number(invoice.amount),
      total: Number(invoice.amount),
      currency: invoice.currency || 'EUR',
    }

    const stream = await renderToStream(
      <InvoiceTemplate {...invoiceProps} />
    )

    const filename = `Invoice_${invoice.invoiceNumber || id}.pdf`

    return new NextResponse(stream as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: unknown) {
    console.error('[Invoice Download Error]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
