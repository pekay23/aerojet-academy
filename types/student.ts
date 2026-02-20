export interface StudentProfile {
  id: string
  userId: string
  studentId: string
  enrollmentType?: string | null
  enrollmentDate?: Date | string | null
  expectedGraduationDate?: Date | string | null
}

export interface Grade {
  id: string
  enrollmentId: string
  userId: string
  type: string
  score: number
  maxScore: number
  percentage: number
  passed: boolean
  remarks?: string | null
  gradedBy?: string | null
  createdAt: Date | string
}

export interface AttendanceRecord {
  id: string
  classId: string
  userId: string
  date: Date | string
  present: boolean
  notes?: string | null
}
