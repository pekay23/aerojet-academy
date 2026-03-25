export const APP_NAME = 'Aerojet Aviation Training Academy'
export const APP_SHORT = 'Aerojet Academy'
export const APP_DOMAIN = 'aerojet-academy.com'
export const APP_EMAIL = 'info@aerojet-academy.com'
export const APP_ADMIN_EMAIL = 'admin@aerojet-academy.com'

/** Default/fallback currency. Prefer reading from wallet.currency or system setting. */
export const CURRENCY = 'EUR'
export const EXAM_FEE = 300
export const MIN_WALLET_TOPUP = 50
export const MAX_WALLET_TOPUP = 10000

export const POOL_MIN = 25
export const POOL_MAX = 28
export const POOL_NEAR_FULL = 23
export const POOL_DEADLINE_DAYS_BEFORE = 21
export const MODULE_DIVERSITY_CAP = 4

export const PROGRAMMES = [
  { value: 'FOUR_YEAR', label: '4-Year B1/B2 Programme', duration: '4 years' },
  { value: 'TWO_YEAR', label: '2-Year B1 Programme', duration: '2 years' },
  { value: 'MILITARY', label: 'Military/Industry Certification', duration: '12 months' },
  { value: 'MODULAR', label: 'Modular Training', duration: 'Flexible' },
  { value: 'EXAM_ONLY', label: 'Exam Only', duration: 'Per exam' },
  { value: 'REVISION', label: 'Revision Support', duration: 'Per module' },
] as const

export const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'INSTRUCTOR', label: 'Instructor' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'APPLICANT', label: 'Applicant' },
] as const

export const B1_MODULES = ['M1','M2','M3','M4','M5','M6','M7','M8','M9','M10','M11','M15','M16','M17'] as const
export const B2_MODULES = ['M1','M2','M3','M4','M5','M6','M7','M8','M9','M10','M11','M13','M14'] as const
