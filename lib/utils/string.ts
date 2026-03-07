export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function toTitleCase(str: string): string {
  return str.toLowerCase().split(' ').map(capitalize).join(' ')
}

export function truncate(str: string, maxLength: number = 100): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength) + '...'
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (local.length <= 2) return `${local[0]}***@${domain}`
  return `${local[0]}${local[1]}***@${domain}`
}

export function formatPaymentType(type: string): string {
  if (!type) return 'Payment'

  // Normalize by removing extra underscores and converting to uppercase
  const normalized = type.toUpperCase().replace(/_/g, '')

  const mapping: Record<string, string> = {
    WALLETTOPUP: 'Wallet Top-Up',
    REGISTRATION: 'Registration Fee',
    REGISTRATIONFEE: 'Registration Fee',
    COURSE: 'Course Enrollment',
    COURSEFEE: 'Course Enrollment',
    EXAMBOOKING: 'Exam Booking',
    EXAMFEE: 'Exam Fee',
    SEATCONFIRMATION: 'Seat Confirmation',
    TUITION: 'Tuition Fee',
    TUITIONFEE: 'Tuition Fee',
    RESIT: 'Exam Resit',
    MODULAR: 'Modular Training',
    CUSTOMPARTPAYMENT: 'Part Payment',
    YEAR1FULL: 'Year 1 Full Payment',
    FULLPROGRAMME: 'Full Programme Payment',
  }

  return mapping[normalized] || toTitleCase(type.replace(/_/g, ' '))
}
