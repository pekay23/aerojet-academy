export function isValidEmail(email: string): boolean {
  // Stricter email validation: local part allows alphanumeric, dots, hyphens, underscores, plus;
  // domain must have at least two labels, TLD at least 2 chars
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(email)
}

export function isValidPhone(phone: string): boolean {
  // Accept international phone numbers: optional + prefix, 7-15 digits, allow spaces/dashes/parens
  const cleaned = phone.replace(/[\s\-()]/g, '')
  return /^\+?[0-9]{7,15}$/.test(cleaned)
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
