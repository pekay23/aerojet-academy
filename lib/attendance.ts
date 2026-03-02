import prisma from '@/lib/prisma/client'

export const ATTENDANCE_WARNING_THRESHOLD = 80

export async function calculateAttendancePercentage(
  userId: string,
  enrollmentType?: string
): Promise<{
  percentage: number
  total: number
  present: number
  late: number
  absent: number
  excused: number
  belowThreshold: boolean
}> {
  const records = await prisma.attendanceRecord.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  })

  if (records.length === 0) {
    return {
      percentage: 0,
      total: 0,
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
      belowThreshold: false,
    }
  }

  const total = records.length
  const present = records.filter((r) => r.status === 'PRESENT').length
  const late = records.filter((r) => r.status === 'LATE').length
  const absent = records.filter((r) => r.status === 'ABSENT').length
  const excused = records.filter((r) => r.status === 'EXCUSED').length

  const attendedCount = present + late
  const percentage = Math.round((attendedCount / total) * 100)

  return {
    percentage,
    total,
    present,
    late,
    absent,
    excused,
    belowThreshold: percentage < ATTENDANCE_WARNING_THRESHOLD,
  }
}

export async function getAttendanceWarning(
  userId: string,
  enrollmentType?: string
): Promise<{
  hasWarning: boolean
  message: string | null
  percentage: number
}> {
  if (enrollmentType !== 'FULL_TIME') {
    return { hasWarning: false, message: null, percentage: 0 }
  }

  const attendance = await calculateAttendancePercentage(userId, enrollmentType)

  if (attendance.belowThreshold && attendance.total > 0) {
    return {
      hasWarning: true,
      message: `Your attendance is ${attendance.percentage}%, which is below the required 80%. Please improve your attendance to meet program requirements.`,
      percentage: attendance.percentage,
    }
  }

  return {
    hasWarning: false,
    message: null,
    percentage: attendance.percentage,
  }
}

export async function getAttendanceForClass(
  classId: string,
  userId: string
): Promise<{
  present: number
  late: number
  absent: number
  excused: number
  total: number
  percentage: number
}> {
  const records = await prisma.attendanceRecord.findMany({
    where: {
      classId,
      userId,
    },
  })

  const total = records.length
  const present = records.filter((r) => r.status === 'PRESENT').length
  const late = records.filter((r) => r.status === 'LATE').length
  const absent = records.filter((r) => r.status === 'ABSENT').length
  const excused = records.filter((r) => r.status === 'EXCUSED').length
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0

  return { present, late, absent, excused, total, percentage }
}
