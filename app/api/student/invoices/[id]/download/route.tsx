import { NextResponse } from 'next/server'
// Imports below are used by the commented-out full handler.
// import { NextRequest } from 'next/server'
// import { getAuthSession } from '@/lib/auth/helpers'
// import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
// import { generateInvoicePDF } from '@/lib/invoice/generator'

// Feature hidden — invoice workflow not finalized yet.
// To re-enable: remove the early return and uncomment the full handler below.
export async function GET() {
  return new NextResponse('Feature Disabled', { status: 403 })
}

/*
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { userId: true, invoiceNumber: true },
  })

  if (!invoice) return new NextResponse('Not Found', { status: 404 })

  if (
    invoice.userId !== session.user.id &&
    !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)
  ) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const pdfBuffer = await generateInvoicePDF(id)
    const filename = `Invoice_${invoice.invoiceNumber || id}.pdf`
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('[Invoice Download Error]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
*/
