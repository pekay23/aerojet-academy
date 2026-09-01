import { NextRequest, NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getPDFSettings } from '@/lib/pdf-settings'
import { TranscriptTemplate, TranscriptRecord } from '@/components/pdf/templates/TranscriptTemplate'
import React from 'react'

const STAFF_ROLES = ['ADMIN', 'SUPER_ADMIN', 'STAFF']

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession()
    if (!session || !STAFF_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: studentUserId } = await params

    // Fetch student data in parallel
    const [profile, examResults, pdfSettings] = await Promise.all([
      prismaUnfiltered.studentProfile.findUnique({
        where: { userId: studentUserId },
        select: {
          studentId: true,
          enrollmentType: true,
          enrollmentDate: true,
          user: {
            select: {
              profile: { select: { firstName: true, lastName: true } },
              email: true,
            },
          },
          pathwayRel: { select: { name: true } },
        },
      }),
      prisma.examResult.findMany({
        where: { userId: studentUserId },
        select: {
          moduleCode: true,
          percentage: true,
          passed: true,
          examCategory: true,
          attemptType: true,
          createdAt: true,
          exam: {
            select: {
              examDate: true,
              examComponent: {
                select: {
                  course: { select: { code: true, name: true, credits: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      getPDFSettings(req.nextUrl.origin),
    ])

    if (!profile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    const fullName = profile.user.profile
      ? `${profile.user.profile.firstName} ${profile.user.profile.lastName}`
      : (profile.user.email ?? 'Student')

    const programName = profile.pathwayRel?.name ?? profile.enrollmentType ?? 'EASA Programme'

    // Deduplicate by module code — keep the best (passed) result per module
    const moduleMap = new Map<string, TranscriptRecord>()
    for (const r of examResults) {
      const code = r.exam?.examComponent?.course?.code ?? r.moduleCode ?? '—'
      const courseName = r.exam?.examComponent?.course?.name ?? r.moduleCode ?? '—'
      const credits = r.exam?.examComponent?.course?.credits ?? 0

      const existing = moduleMap.get(code)
      if (!existing || (r.passed && !existing.status.includes('Pass'))) {
        moduleMap.set(code, {
          code,
          courseName,
          credits,
          grade: r.passed ? 'Pass' : 'Fail',
          status: r.passed ? 'Pass' : 'Fail',
        })
      }
    }

    const records: TranscriptRecord[] = Array.from(moduleMap.values()).sort((a, b) =>
      a.code.localeCompare(b.code, undefined, { numeric: true })
    )

    const now = new Date()

    const stream = await renderToStream(
      <TranscriptTemplate
        logoUrl={pdfSettings.logoUrl}
        watermarkUrl={pdfSettings.watermarkUrl}
        footerText={pdfSettings.footerText}
        watermarkOpacity={pdfSettings.watermarkOpacity}
        studentName={fullName}
        studentId={profile.studentId ?? '—'}
        programName={programName}
        enrollmentDate={
          profile.enrollmentDate?.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }) ?? '—'
        }
        generatedDate={now.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
        records={records}
      />
    )

    const safeId = (profile.studentId ?? 'student').replace(/[^a-zA-Z0-9-]/g, '_')

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Transcript_${safeId}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('[pdf/staff/student-transcript] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate transcript', details: error.message },
      { status: 500 }
    )
  }
}
