import 'server-only'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

const STORAGE_BASE_PATH = 'certificates'

export interface CertificateData {
  certificateId: string
  studentName: string
  courseName: string
  moduleCode: string
  score: number
  percentage: number
  date: string
  passMarkPct?: number
}

export async function generateCertificatePdfLib(data: CertificateData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  page.drawText('Certificate of Completion', {
    x: 50,
    y: 750,
    size: 24,
    font: boldFont,
    color: rgb(0, 0.16, 0.36),
  })

  page.drawText(`This is to certify that`, {
    x: 50,
    y: 700,
    size: 12,
    font,
  })

  page.drawText(data.studentName, {
    x: 50,
    y: 660,
    size: 20,
    font: boldFont,
    color: rgb(0, 0.16, 0.36),
  })

  page.drawText(`has successfully completed the prescribed training and assessment requirements for`, {
    x: 50,
    y: 620,
    size: 12,
    font,
  })

  page.drawText(data.courseName, {
    x: 50,
    y: 580,
    size: 14,
    font: boldFont,
  })

  page.drawText(`Module: ${data.moduleCode}`, {
    x: 50,
    y: 550,
    size: 12,
    font,
  })

  page.drawText(`Score: ${data.score}  Percentage: ${data.percentage.toFixed(1)}%`, {
    x: 50,
    y: 520,
    size: 12,
    font,
  })

  if (data.passMarkPct != null && data.percentage >= data.passMarkPct) {
    page.drawText('PASSED', {
      x: 50,
      y: 480,
      size: 10,
      font: boldFont,
      color: rgb(0.72, 0.53, 0.04),
    })
  }

  page.drawText(`Certificate No. ${data.certificateId}`, {
    x: 50,
    y: 430,
    size: 10,
    font,
    color: rgb(0.39, 0.45, 0.52),
  })

  page.drawText(`Issued on ${data.date}`, {
    x: 50,
    y: 410,
    size: 11,
    font,
  })

  return Buffer.from(await pdfDoc.save())
}

export function buildPdfLibStoragePath(certificateId: string): string {
  return `${STORAGE_BASE_PATH}/${certificateId}.pdf`
}

export async function createCertificatePdfLib(params: {
  certificateId: string
  studentName: string
  courseName: string
  moduleCode: string
  score: number
  percentage: number
  date: string
  passMarkPct?: number
}): Promise<{ pdfBuffer: Buffer; pdfPath: string }> {
  const pdfBuffer = await generateCertificatePdfLib(params)
  const pdfPath = buildPdfLibStoragePath(params.certificateId)
  return { pdfBuffer, pdfPath }
}
