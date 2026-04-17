import { DbCourse, DbEnrollment } from './database'
import { CourseModuleType } from './enums'

export interface Course extends DbCourse {
  moduleType: CourseModuleType | null
}

export interface Enrollment extends DbEnrollment {
  course?: Course
}

export type { CourseModuleType }
