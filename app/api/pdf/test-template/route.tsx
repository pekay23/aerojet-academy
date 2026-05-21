import { NextRequest, NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { TranscriptTemplate, TranscriptRecord } from '@/components/pdf/templates/TranscriptTemplate'
import { getSystemSettings } from '@/lib/system-settings'
import React from 'react'

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch SystemSettings for PDF Customizations
    const settings = await getSystemSettings([
      'pdf_header_logo_url',
      'pdf_watermark_url',
      'pdf_footer_text',
      'pdf_watermark_opacity',
    ])

    const logoUrl = settings['pdf_header_logo_url'] || '/apple-touch-icon.webp'
    const watermarkUrl = settings['pdf_watermark_url'] || '/apple-touch-icon.webp'
    const footerText =
      settings['pdf_footer_text'] ||
      'Aerojet Aviation Academy | 123 Flight Way | contact@aerojet.com'

    // Use default values for host to resolve relative URLs for React PDF since it needs absolute URLs in some environments
    const hostUrl = req.nextUrl.origin

    // Resolve full URLs if they are relative
    const resolvedLogoUrl = logoUrl.startsWith('/') ? `${hostUrl}${logoUrl}` : logoUrl
    const resolvedWatermarkUrl = watermarkUrl.startsWith('/')
      ? `${hostUrl}${watermarkUrl}`
      : watermarkUrl

    // 2. Dummy Data for Transcript
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
      { code: 'M5', courseName: 'Digital Techniques', credits: 4, grade: 'Pass', status: 'Pass' },
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
    ]

    // 3. Render the PDF
    const stream = await renderToStream(
      <TranscriptTemplate
        logoUrl={resolvedLogoUrl}
        watermarkUrl={resolvedWatermarkUrl}
        footerText={footerText}
        studentName="John Doe"
        studentId="Aero-2026-001"
        programName="EASA Part-66 B1.1 Aircraft Maintenance"
        enrollmentDate="01 Sep 2025"
        records={sampleRecords}
      />
    )

    // 4. Return as PDF stream
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="test-transcript.pdf"',
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
