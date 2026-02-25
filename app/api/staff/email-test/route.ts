import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import * as emailService from '@/lib/email/service'

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { templateName, sendAll, targetEmail } = await req.json()
  const userEmail = targetEmail || session.user.email

  if (!userEmail) {
    return new NextResponse('Recipient email not found', { status: 400 })
  }

  try {
    const results = []

    if (sendAll) {
      // Send all templates
      const templatesToSend = [
        {
          id: 'registration',
          render: () => emailService.renderRegistrationEmail('John', 'REG-123456'),
        },
        {
          id: 'activation',
          render: () =>
            emailService.renderActivationEmail(
              'Jane',
              'jane.doe@aerojet-academy.com',
              'temp-pass-123',
              'mock-token'
            ),
        },
        {
          id: 'promotion',
          render: () => emailService.renderStudentPromotionEmail('Alex', 'STU-789-012'),
        },
        {
          id: 'reset-password',
          render: () => emailService.renderPasswordResetEmail('Sam', 'mock-reset-token'),
        },
        {
          id: 'payment-approved',
          render: () => emailService.renderPaymentApprovedEmail('Chris', 'Registration Fee', 250),
        },
        {
          id: 'payment-rejected',
          render: () =>
            emailService.renderPaymentRejectedEmail(
              'Pat',
              'Tuition Fee',
              'Invalid transaction reference'
            ),
        },
        {
          id: 'pool-confirmed',
          render: () =>
            emailService.renderPoolConfirmedEmail(
              'Jordan',
              'Pool A',
              'Module 1',
              '2026-05-20',
              150
            ),
        },
        {
          id: 'contact',
          render: () =>
            emailService.renderContactEnquiryConfirmation('Taylor Swift', 'Course Availability'),
        },
      ]

      for (const t of templatesToSend) {
        const html = await t.render()
        const success = await emailService.sendEmail({
          to: userEmail,
          subject: `[TEST] ${t.id.toUpperCase()}`,
          html,
        })
        results.push({ template: t.id, success })
      }
    } else if (templateName) {
      // Send specific template
      let html = ''
      switch (templateName) {
        case 'registration':
          html = await emailService.renderRegistrationEmail('John', 'REG-123456')
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
          return new NextResponse('Invalid template name', { status: 400 })
      }

      const success = await emailService.sendEmail({
        to: userEmail,
        subject: `[TEST] ${templateName.toUpperCase()}`,
        html,
      })
      results.push({ template: templateName, success })
    } else {
      return new NextResponse('Template name or sendAll flag required', { status: 400 })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('[EmailTest] Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
