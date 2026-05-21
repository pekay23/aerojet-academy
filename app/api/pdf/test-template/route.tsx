import { NextRequest, NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { TranscriptTemplate, TranscriptRecord } from '@/components/pdf/templates/TranscriptTemplate'
import { CertificateTemplate } from '@/components/pdf/templates/CertificateTemplate'
import { getPDFSettings } from '@/lib/pdf-settings'
import React from 'react'

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type') || 'transcript'

    // Fetch and resolve PDF settings
    const pdfSettings = await getPDFSettings(req.nextUrl.origin)

    // Common base template props
    const baseProps = {
      logoUrl: pdfSettings.logoUrl,
      watermarkUrl: pdfSettings.watermarkUrl,
      footerText: pdfSettings.footerText,
      watermarkOpacity: pdfSettings.watermarkOpacity,
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
    } else {
      const sampleRecords: TranscriptRecord[] = [
        { code: 'M1', courseName: 'Mathematics', credits: 4, grade: 'Pass', status: 'Pass' },
        { code: 'M2', courseName: 'Physics', credits: 4, grade: 'Pass', status: 'Pass' },
        {
          code: 'M3',
          courseName: 'Electrical Fundamentals',
          credits: 3,
          grade: 'Pass',
          status: 'Pass',
        },
        {
          code: 'M4',
          courseName: 'Electronic Fundamentals',
          credits: 3,
          grade: 'Pass',
          status: 'Pass',
        },
        {
          code: 'M5',
          courseName: 'Digital Techniques / Electronic Instrument Systems',
          credits: 4,
          grade: 'Pass',
          status: 'Pass',
        },
        {
          code: 'M6',
          courseName: 'Materials and Hardware',
          credits: 4,
          grade: 'Pass',
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
          grade: 'Fail',
          status: 'Fail',
        },
        {
          code: 'M9',
          courseName: 'Human Factors',
          credits: 2,
          grade: 'Pass',
          status: 'Pass',
        },
        {
          code: 'M10',
          courseName: 'Aviation Legislation',
          credits: 3,
          grade: 'Pass',
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

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="test-${type}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    )
  }
}
