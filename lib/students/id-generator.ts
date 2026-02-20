import prisma from '@/lib/database/prisma'

export async function generateNextStudentId(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `AJA-${year}-`

  // Find the highest existing student ID for this year
  const lastStudent = await prisma.studentProfile.findFirst({
    where: { studentId: { startsWith: prefix } },
    orderBy: { studentId: 'desc' },
  })

  let nextSeq = 1
  if (lastStudent) {
    const lastSeq = parseInt(lastStudent.studentId.replace(prefix, ''), 10)
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1
  }

  return `${prefix}${nextSeq.toString().padStart(4, '0')}`
}

export function parseStudentId(studentId: string): { year: number; sequence: number } | null {
  const match = studentId.match(/^AJA-(\d{4})-(\d{4})$/)
  if (!match) return null
  return { year: parseInt(match[1], 10), sequence: parseInt(match[2], 10) }
}
