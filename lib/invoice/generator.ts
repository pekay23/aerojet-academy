import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { format } from 'date-fns'

/**
 * Generates a unique invoice number like INV-2026-0001
 */
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`

  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  })

  let nextSequence = 1
  if (lastInvoice?.invoiceNumber) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.replace(prefix, ''), 10)
    if (!isNaN(lastSequence)) {
      nextSequence = lastSequence + 1
    }
  }

  return `${prefix}${nextSequence.toString().padStart(4, '0')}`
}

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

/**
 * Generates a PDF buffer for an invoice
 */
export async function generateInvoicePDF(invoiceId: string): Promise<Buffer> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      user: {
        include: {
          profile: true,
          studentProfile: true,
        },
      },
    },
  })

  if (!invoice) throw new Error('Invoice not found')

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width

  // Header - Logo Placeholder
  doc.setFontSize(24)
  doc.setTextColor(30, 64, 175) // aerojet-blue
  doc.text('AEROJET ACADEMY', 20, 30)

  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139) // slate-500
  doc.text('Aviation Training Excellence', 20, 38)

  // Invoice Details
  doc.setFontSize(12)
  doc.setTextColor(30, 64, 175)
  doc.text('INVOICE', pageWidth - 60, 30)
  
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Number: ${invoice.invoiceNumber || 'N/A'}`, pageWidth - 60, 40)
  doc.text(`Date: ${format(invoice.createdAt, 'dd MMM yyyy')}`, pageWidth - 60, 46)
  doc.text(`Due Date: ${format(new Date(invoice.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000), 'dd MMM yyyy')}`, pageWidth - 60, 52)

  // Bill To
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text('BILL TO:', 20, 60)
  
  doc.setTextColor(0, 0, 0)
  const studentName = [invoice.user.profile?.firstName, invoice.user.profile?.lastName].filter(Boolean).join(' ')
  doc.text(studentName, 20, 66)
  doc.text(invoice.user.email, 20, 72)
  if (invoice.user.studentProfile?.studentId) {
    doc.text(`Student ID: ${invoice.user.studentProfile.studentId}`, 20, 78)
  }

  // Items Table
  const items = (invoice.items as unknown as Array<{ description: string; quantity: number; unitPrice: number; total: number }>) || [
    { description: 'Academy Fees', quantity: 1, unitPrice: Number(invoice.amount), total: Number(invoice.amount) }
  ]

  const tableData = items.map(item => [
    item.description,
    item.quantity.toString(),
    `${Number(item.unitPrice).toFixed(2)}`,
    `${Number(item.total).toFixed(2)}`
  ])

  ;(doc as unknown as { autoTable: (opts: unknown) => void }).autoTable({
    startY: 90,
    head: [['Description', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 30 },
    },
  })

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 150

  // Totals
  doc.setFontSize(10)
  doc.text('Subtotal:', pageWidth - 60, finalY + 15, { align: 'right' })
  doc.text(`${Number(invoice.amount).toFixed(2)}`, pageWidth - 20, finalY + 15, { align: 'right' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', pageWidth - 60, finalY + 25, { align: 'right' })
  doc.text(`${invoice.currency || 'EUR'} ${Number(invoice.amount).toFixed(2)}`, pageWidth - 20, finalY + 25, { align: 'right' })

  // Footer
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('Payment is due within 7 days. Please use the invoice number as reference.', pageWidth / 2, 280, { align: 'center' })

  return Buffer.from(doc.output('arraybuffer'))
}
