import { NextRequest, NextResponse } from 'next/server'
import * as emailService from '@/lib/email/service'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const template = searchParams.get('template')

  if (!template) {
    return new NextResponse('Template name is required', { status: 400 })
  }

  let html = ''

  switch (template) {
    case 'registration':
      html = await emailService.renderRegistrationEmail('John', 'REG-123456')
      break
    case 'email-verification':
      html = await emailService.renderEmailVerificationEmail('John', 'mock-verify-token')
      break
    case 'activation':
      html = await emailService.renderActivationEmail(
        'Jane',
        'jane.doe@aerojet-academy.com',
        'temp-pass-123',
        'mock-token'
      )
      break
    case 'promotion':
      html = await emailService.renderStudentPromotionEmail('Alex', 'STU-789-012')
      break
    case 'reset-password':
      html = await emailService.renderPasswordResetEmail('Sam', 'mock-reset-token')
      break
    case 'payment-approved':
      html = await emailService.renderPaymentApprovedEmail('Chris', 'Registration Fee', 250)
      break
    case 'payment-rejected':
      html = await emailService.renderPaymentRejectedEmail(
        'Pat',
        'Tuition Fee',
        'Invalid transaction reference'
      )
      break
    case 'pool-confirmed':
      html = await emailService.renderPoolConfirmedEmail(
        'Jordan',
        'Pool A',
        'Module 1',
        '2026-05-20',
        150
      )
      break
    case 'contact':
      html = await emailService.renderContactEnquiryConfirmation(
        'Taylor Swift',
        'Course Availability'
      )
      break
    default:
      // Try to fetch custom template from DB
      try {
        const dbTemplate = await prisma.emailTemplate.findUnique({
          where: { name: template },
        })

        if (dbTemplate) {
          // Replace common placeholder
          const body = dbTemplate.body.replace(/\{\{firstName\}\}/g, 'John')
          html = await emailService.wrapEmail(
            dbTemplate.subject.replace(/\{\{firstName\}\}/g, 'John'),
            body
          )
        } else {
          return new NextResponse('Invalid template name', { status: 400 })
        }
      } catch (error) {
        console.error('Error fetching custom template for preview:', error)
        return new NextResponse('Error rendering template', { status: 500 })
      }
  }

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
