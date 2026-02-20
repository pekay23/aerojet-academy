export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPhone(phone: string): boolean {
  return /^(\+233|0)?[2-5]\d{8}$/.test(phone.replace(/\s/g, ''))
}

export function isValidStudentId(id: string): boolean {
  return /^AJA-\d{4}-\d{4}$/.test(id)
}

export function isValidRegistrationCode(code: string): boolean {
  return /^AERO-\d{4}-[A-Z0-9]{6}$/.test(code)
}

export function isStrongPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (password.length < 8) errors.push('At least 8 characters')
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter')
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter')
  if (!/[0-9]/.test(password)) errors.push('At least one number')
  return { valid: errors.length === 0, errors }
}
