// Database model types (mirrors Prisma schema for frontend use)
export interface DbUser {
  id: string
  email: string
  academyEmail?: string | null
  role: string
  status: string
  registrationCode?: string | null
  studentId?: string | null
  mustChangePassword: boolean
  createdAt: Date | string
  lastLoginAt?: Date | string | null
}

export interface DbProfile {
  id: string
  userId: string
  firstName: string
  lastName: string
  middleName?: string | null
  phone?: string | null
  dateOfBirth?: Date | string | null
  nationality?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  photoUrl?: string | null
  selectedProgramme?: string | null
}

export interface DbCourse {
  id: string
  code: string
  name: string
  description?: string | null
  type: string
  hours?: number | null
  price: number
  currency: string
  isActive: boolean
  createdAt: Date | string
}

export interface DbClass {
  id: string
  courseId: string
  instructorId?: string | null
  topic?: string | null
  date: Date | string
  startTime: string
  endTime: string
  location?: string | null
}

export interface DbEnrollment {
  id: string
  userId: string
  courseId: string
  status: string
  enrolledAt?: Date | string | null
  completedAt?: Date | string | null
}
