export interface StudentProfile {
  id: string
  userId: string
  studentId: string
  enrollmentType?: string | null
  enrollmentDate?: string | null
  expectedGraduationDate?: string | null
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
  createdAt: string
}

export interface AttendanceRecord {
  id: string
  classId: string
  userId: string
  date: string
  present: boolean
  notes?: string | null
}
