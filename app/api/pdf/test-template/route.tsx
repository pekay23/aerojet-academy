import { NextRequest, NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { TranscriptTemplate, TranscriptRecord } from '@/components/pdf/templates/TranscriptTemplate'
import { CertificateTemplate } from '@/components/pdf/templates/CertificateTemplate'
import { InvoiceTemplate, InvoiceItem } from '@/components/pdf/templates/InvoiceTemplate'
import { FinancialReportTemplate } from '@/components/pdf/templates/FinancialReportTemplate'
import { getPDFSettings } from '@/lib/pdf-settings'
import React from 'react'

async function generatePDFResponse(
  req: NextRequest,
  params: {
    type?: string
    logoUrl?: string
    watermarkUrl?: string
    footerText?: string
    watermarkOpacity?: string | number
  }
) {
  try {
    const type = params.type || 'transcript'

    // Fetch and resolve PDF settings
    const savedSettings = await getPDFSettings(req.nextUrl.origin)

    // Override with query params if provided (for live preview matching)
    const logoUrl = params.logoUrl || savedSettings.logoUrl
    const watermarkUrl = params.watermarkUrl || savedSettings.watermarkUrl
    const footerText = params.footerText || savedSettings.footerText
    const watermarkOpacityParam = params.watermarkOpacity
    const watermarkOpacity =
      watermarkOpacityParam !== undefined && watermarkOpacityParam !== null
        ? typeof watermarkOpacityParam === 'string'
          ? parseFloat(watermarkOpacityParam)
          : watermarkOpacityParam
        : savedSettings.watermarkOpacity

    // Common base template props
    const baseProps = {
      logoUrl,
      watermarkUrl,
      footerText,
      watermarkOpacity,
    }

    let stream: NodeJS.ReadableStream

    if (type === 'certificate') {
      stream = await renderToStream(
        <CertificateTemplate
          {...baseProps}
          studentName="Jane Doe"
          programName="EASA Part-66 B1.1 Aircraft Maintenance"
          issueDate="15 Dec 2025"
          certificateNumber="CERT-2025-089"
        />
      )
    } else if (type === 'invoice') {
      const sampleInvoiceItems: InvoiceItem[] = [
        {
          description: 'Tuition Fee - B1.1 Aircraft Maintenance',
          quantity: 1,
          unitPrice: 5500.0,
          total: 5500.0,
        },
        { description: 'Registration Fee', quantity: 1, unitPrice: 150.0, total: 150.0 },
        { description: 'Study Materials & PPE', quantity: 1, unitPrice: 350.0, total: 350.0 },
      ]

      stream = await renderToStream(
        <InvoiceTemplate
          {...baseProps}
          invoiceNumber="INV-2026-0089"
          date={new Date()}
          dueDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
          studentName="John Doe"
          studentEmail="john.doe@example.com"
          studentId="AERO-2026-001"
          items={sampleInvoiceItems}
          subtotal={6000.0}
          total={6000.0}
          currency="EUR"
        />
      )
    } else if (type === 'financial-report') {
      const sampleFinancialSummary = {
        totalRevenue: 1250000.0,
        revenueThisMonth: 150000.0,
        pendingAmount: 45000.0,
        avgTransactionValue: 4500.0,
      }

      const sampleMonthlyData = [
        { month: 'Jan', revenue: 95000, count: 21 },
        { month: 'Feb', revenue: 110000, count: 24 },
        { month: 'Mar', revenue: 105000, count: 23 },
        { month: 'Apr', revenue: 140000, count: 31 },
        { month: 'May', revenue: 150000, count: 33 },
      ]

      const sampleRevenueByType = [
        { name: 'B1.1 Aircraft Maintenance', value: 850000, percentage: 68 },
        { name: 'B2 Avionics', value: 350000, percentage: 28 },
        { name: 'Short Courses', value: 50000, percentage: 4 },
      ]

      const samplePaymentStatus = [
        { status: 'Completed', amount: 1205000, count: 260 },
        { status: 'Pending', amount: 45000, count: 12 },
      ]

      stream = await renderToStream(
        <FinancialReportTemplate
          {...baseProps}
          year={new Date().getFullYear()}
          month={new Date().getMonth() + 1}
          summary={sampleFinancialSummary}
          monthlyData={sampleMonthlyData}
          revenueByType={sampleRevenueByType}
          paymentStatus={samplePaymentStatus}
        />
      )
    } else {
      const sampleRecords: TranscriptRecord[] = [
        { code: 'M1', courseName: 'Mathematics', credits: 4, grade: '82%', status: 'Pass' },
        { code: 'M2', courseName: 'Physics', credits: 4, grade: '75%', status: 'Pass' },
        {
          code: 'M3',
          courseName: 'Electrical Fundamentals',
          credits: 3,
          grade: '68%',
          status: 'Fail',
        },
        {
          code: 'M4',
          courseName: 'Electronic Fundamentals',
          credits: 3,
          grade: '79%',
          status: 'Pass',
        },
        {
          code: 'M5',
          courseName: 'Digital Techniques / Electronic Instrument Systems',
          credits: 4,
          grade: '85%',
          status: 'Pass',
        },
        {
          code: 'M6',
          courseName: 'Materials and Hardware',
          credits: 4,
          grade: '71%',
          status: 'Pass',
        },
        {
          code: 'M7',
          courseName: 'Maintenance Practices',
          credits: 6,
          grade: 'In Progress',
          status: 'In Progress',
        },
        {
          code: 'M8',
          courseName: 'Basic Aerodynamics',
          credits: 3,
          grade: '62%',
          status: 'Fail',
        },
        {
          code: 'M9',
          courseName: 'Human Factors',
          credits: 2,
          grade: '88%',
          status: 'Pass',
        },
        {
          code: 'M10',
          courseName: 'Aviation Legislation',
          credits: 3,
          grade: '91%',
          status: 'Pass',
        },
      ]

      stream = await renderToStream(
        <TranscriptTemplate
          {...baseProps}
          studentName="John Doe"
          studentId="AERO-2026-001"
          programName="EASA Part-66 B1.1 Aircraft Maintenance"
          enrollmentDate="01 Sep 2025"
          generatedDate={new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
          records={sampleRecords}
        />
      )
    }

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="test-${type}.pdf"`,
      },
    })
  } catch (error: unknown) {
    console.error('Error generating PDF:', error)
    const details = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to generate PDF', details }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const params = {
    type: req.nextUrl.searchParams.get('type') || undefined,
    logoUrl: req.nextUrl.searchParams.get('logoUrl') || undefined,
    watermarkUrl: req.nextUrl.searchParams.get('watermarkUrl') || undefined,
    footerText: req.nextUrl.searchParams.get('footerText') || undefined,
    watermarkOpacity: req.nextUrl.searchParams.get('watermarkOpacity') || undefined,
  }
  return generatePDFResponse(req, params)
}

export async function POST(req: NextRequest) {
  let params = {}
  try {
    params = await req.json()
  } catch (_e) {
    // If not JSON or empty body, ignore
  }
  return generatePDFResponse(req, params)
}
