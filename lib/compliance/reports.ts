import prisma from '@/lib/prisma/client'
import { format } from 'date-fns'

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
