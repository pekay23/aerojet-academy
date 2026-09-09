import prisma from '@/lib/prisma/client'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { format } from 'date-fns'
import { ACADEMIC_RULES } from '@/lib/constants/business-rules'

export interface EasaModuleCompliance {
  moduleCode: string
  moduleName: string
  totalAttempts: number
  passed: number
  failed: number
  passRate: number
  avgScore: number | null
  complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'INSUFFICIENT_DATA'
}

export interface EasaComplianceReport {
  overallPassRate: number
  passMark: number
  totalAttempts: number
  totalPassed: number
  totalFailed: number
  modules: EasaModuleCompliance[]
  generatedAt: Date
}

/**
 * Generates a CSV roster for a specific pool.
 * Includes module code, candidate name, registration number, and payment status.
 */
export async function generatePoolRosterCSV(poolId: string): Promise<string> {
  const pool = await prisma.examPool.findUnique({
    where: { id: poolId },
    include: {
      event: true,
      memberships: {
        where: { status: 'CONFIRMED' },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          examComponent: true,
        },
      },
    },
  })

  if (!pool) {
    throw new Error('Pool not found')
  }

  // CSV Headers
  const rows = [
    ['Pool Name', pool.name],
    ['Event Name', pool.event.name],
    ['Exam Date', format(new Date(pool.examDate), 'yyyy-MM-dd')],
    [''],
    ['Candidate Name', 'Registration Number', 'Module Code', 'Module Name', 'Status'],
  ]

  // Add members
  pool.memberships.forEach((m) => {
    const fullName =
      `${m.user.profile?.firstName || ''} ${m.user.profile?.lastName || ''}`.trim() || m.user.email
    rows.push([
      fullName,
      m.user.registrationCode || 'N/A',
      m.examComponent?.code || 'N/A',
      m.examComponent?.name || 'N/A',
      m.status,
    ])
  })

  // Convert to CSV string
  return rows
    .map((row) =>
      row
        .map((field) => {
          const escaped = String(field).replace(/"/g, '""')
          return `"${escaped}"`
        })
        .join(',')
    )
    .join('\n')
}

export async function getEasaComplianceReport(): Promise<EasaComplianceReport> {
  const passMark = ACADEMIC_RULES.EASA_PASS_MARK

  // Fetch all exam results with their exam component and course/module info
  const results = await prismaUnfiltered.examResult.findMany({
    include: {
      exam: {
        include: {
          examComponent: {
            include: {
              course: true,
            },
          },
        },
      },
    },
  })

  const moduleMap = new Map<
    string,
    {
      moduleCode: string
      moduleName: string
      attempts: number
      passed: number
      failed: number
      scores: number[]
    }
  >()

  for (const result of results) {
    const moduleCode = result.exam?.examComponent?.course?.code || 'UNKNOWN'
    const moduleName = result.exam?.examComponent?.course?.name || 'Unknown Module'
    const entry = moduleMap.get(moduleCode) || {
      moduleCode,
      moduleName,
      attempts: 0,
      passed: 0,
      failed: 0,
      scores: [],
    }

    entry.attempts += 1
    if (result.passed) {
      entry.passed += 1
    } else {
      entry.failed += 1
    }
    if (result.score != null) {
      entry.scores.push(Number(result.score))
    }
    moduleMap.set(moduleCode, entry)
  }

  const modules: EasaModuleCompliance[] = Array.from(moduleMap.values()).map((m) => {
    const passRate = m.attempts > 0 ? Math.round((m.passed / m.attempts) * 100) : 0
    const avgScore =
      m.scores.length > 0 ? Math.round(m.scores.reduce((a, b) => a + b, 0) / m.scores.length) : null
    const complianceStatus: EasaModuleCompliance['complianceStatus'] =
      m.attempts === 0 ? 'INSUFFICIENT_DATA' : passRate >= passMark ? 'COMPLIANT' : 'NON_COMPLIANT'

    return {
      moduleCode: m.moduleCode,
      moduleName: m.moduleName,
      totalAttempts: m.attempts,
      passed: m.passed,
      failed: m.failed,
      passRate,
      avgScore,
      complianceStatus,
    }
  })

  const totalAttempts = modules.reduce((sum, m) => sum + m.totalAttempts, 0)
  const totalPassed = modules.reduce((sum, m) => sum + m.passed, 0)
  const totalFailed = modules.reduce((sum, m) => sum + m.failed, 0)
  const overallPassRate = totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 100) : 0

  return {
    overallPassRate,
    passMark,
    totalAttempts,
    totalPassed,
    totalFailed,
    modules,
    generatedAt: new Date(),
  }
}

export function generateEasaComplianceCSV(report: EasaComplianceReport): string {
  const rows: string[][] = [
    ['EASA Compliance Report'],
    [`Generated`, format(report.generatedAt, 'yyyy-MM-dd HH:mm')],
    [`Pass Mark`, `${report.passMark}%`],
    [`Overall Pass Rate`, `${report.overallPassRate}%`],
    [`Total Attempts`, String(report.totalAttempts)],
    [`Passed`, String(report.totalPassed)],
    [`Failed`, String(report.totalFailed)],
    [],
    [
      'Module Code',
      'Module Name',
      'Attempts',
      'Passed',
      'Failed',
      'Pass Rate',
      'Avg Score',
      'Status',
    ],
  ]

  for (const m of report.modules) {
    rows.push([
      m.moduleCode,
      m.moduleName,
      String(m.totalAttempts),
      String(m.passed),
      String(m.failed),
      `${m.passRate}%`,
      m.avgScore != null ? `${m.avgScore}%` : '—',
      m.complianceStatus,
    ])
  }

  return rows
    .map((row) =>
      row
        .map((field) => {
          const escaped = String(field).replace(/"/g, '""')
          return `"${escaped}"`
        })
        .join(',')
    )
    .join('\n')
}
