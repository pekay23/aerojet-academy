export interface Course {
  id: string
  code: string
  name: string
  description?: string | null
  type: 'FOUR_YEAR' | 'TWO_YEAR' | 'MILITARY' | 'MODULAR' | 'EXAM_ONLY' | 'REVISION'
  hours?: number | null
  price: number
  currency: string
  isActive: boolean
  createdAt: Date | string
}

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  status: 'PENDING' | 'ENROLLED' | 'COMPLETED' | 'WITHDRAWN' | 'FAILED'
  enrolledAt?: Date | string | null
  completedAt?: Date | string | null
  course?: Course
}

export type CourseType = Course['type']
export type EnrollmentStatus = Enrollment['status']
