export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
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
