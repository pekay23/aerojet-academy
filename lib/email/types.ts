export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
  /** Logical template identifier for the EmailDelivery log */
  template?: string
  /** When the recipient maps to a User.id — surfaces failures per account */
  userId?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export type EmailTemplate =
  | 'welcome'
  | 'activation'
  | 'password-reset'
  | 'payment-approved'
  | 'payment-rejected'
  | 'enrollment-approved'
  | 'promotion-to-student'
  | 'pool-joined'
  | 'pool-confirmed'
  | 'pool-failed'
  | 'exam-reminder'
  | 'contact-form'
  | 'scheduled-report'
