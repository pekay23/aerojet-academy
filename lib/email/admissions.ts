/**
 * Admissions Pipeline — Lifecycle Email Templates
 *
 * 14 email templates covering each stage transition in the admissions funnel.
 * Uses the shared `wrapEmail`, `sendEmail`, `getTemplate`, and `replacePlaceholders`
 * infrastructure from `lib/email/service.ts`.
 */

import { sendEmail, wrapEmail } from '@/lib/email/service'
import { getBaseUrl } from '@/lib/utils/url'

// ---------------------------------------------------------------------------
// UTILITY
// ---------------------------------------------------------------------------

function replacePlaceholders(template: string, data: Record<string, any>) {
  return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
    const value = data[key.trim()]
    return value !== undefined ? String(value) : match
  })
}

// ---------------------------------------------------------------------------
// 1. PAYMENT VERIFIED — Applicant's registration fee confirmed
// ---------------------------------------------------------------------------

export async function sendPaymentVerifiedEmail(email: string, firstName: string) {
  const baseUrl = await getBaseUrl()
  const body = `
    <p class="text">Hi ${firstName},</p>
    <p class="text">Great news! Your registration fee payment has been <strong>verified</strong>. Your application is now active in our admissions pipeline.</p>

    <div class="info-box" style="border-left-color: #22c55e;">
      <div class="info-row"><strong>Status:</strong> <span style="color:#15803d; font-weight:bold;">PAYMENT VERIFIED ✅</span></div>
    </div>

    <p class="text">Depending on your programme, the next step may be an aptitude test, document upload, or direct interview scheduling. Please log in to your portal to see what's required.</p>

    <div class="btn-container" style="text-align: center;">
      <a href="${baseUrl}/applicant/application/status" class="btn">
        <span>View Application Status</span>
      </a>
    </div>
  `
  const html = await wrapEmail('Payment Verified', body, email)
  return sendEmail({ to: email, subject: 'Aerojet Aviation — Payment Verified', html })
}

// ---------------------------------------------------------------------------
// 2. APTITUDE TEST READY — Applicant can now take the test
// ---------------------------------------------------------------------------

export async function sendAptitudeTestReadyEmail(email: string, firstName: string) {
  const baseUrl = await getBaseUrl()
  const body = `
    <p class="text">Hi ${firstName},</p>
    <p class="text">You are now eligible to take the <strong>Aptitude Test</strong>. This is a timed assessment that evaluates your readiness for the programme.</p>

    <div class="info-box" style="border-left-color: #7c3aed;">
      <p style="margin: 0 0 10px 0;"><strong>Test Guidelines:</strong></p>
      <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
        <li>Ensure a stable internet connection</li>
        <li>The test is timed — do not navigate away</li>
        <li>Answer all questions to the best of your ability</li>
        <li>You may only take this test once</li>
      </ul>
    </div>

    <div class="btn-container" style="text-align: center;">
      <a href="${baseUrl}/applicant/application/aptitude-test" class="btn" style="background-color: #7c3aed; border-color: #7c3aed;">
        <span>Start Aptitude Test</span>
      </a>
    </div>
  `
  const html = await wrapEmail('Aptitude Test Ready', body, email)
  return sendEmail({ to: email, subject: 'Aerojet Aviation — Your Aptitude Test Is Ready', html })
}

// ---------------------------------------------------------------------------
// 3. APTITUDE COMPLETED — Test finished, awaiting review
// ---------------------------------------------------------------------------

export async function sendAptitudeCompletedEmail(email: string, firstName: string, score: number) {
  const baseUrl = await getBaseUrl()
  const body = `
    <p class="text">Hi ${firstName},</p>
    <p class="text">Your aptitude test has been <strong>completed</strong>. Our admissions team is reviewing the results.</p>

    <div class="info-box" style="border-left-color: #7c3aed;">
      <div class="info-row"><strong>Score:</strong> ${score}%</div>
      <div class="info-row" style="margin-top: 5px;"><strong>Status:</strong> Under Review</div>
    </div>

    <p class="text">You will be notified once the review is complete and the next stage is determined.</p>

    <div class="btn-container" style="text-align: center;">
      <a href="${baseUrl}/applicant/application/status" class="btn">
        <span>Track Your Application</span>
      </a>
    </div>
  `
  const html = await wrapEmail('Aptitude Test Completed', body, email)
  return sendEmail({ to: email, subject: 'Aerojet Aviation — Aptitude Test Completed', html })
}

// ---------------------------------------------------------------------------
// 4. SHORTLISTED — Applicant made the shortlist
// ---------------------------------------------------------------------------

export async function sendShortlistedEmail(email: string, firstName: string) {
  const baseUrl = await getBaseUrl()
  const body = `
    <p class="text">Hi ${firstName},</p>
    <p class="text"><strong>Congratulations!</strong> You have been <strong>shortlisted</strong> for the next stage of the admissions process.</p>

    <div class="info-box" style="border-left-color: #4f46e5;">
      <div class="info-row"><strong>Status:</strong> <span style="color:#4f46e5; font-weight:bold;">SHORTLISTED 🎯</span></div>
    </div>

    <p class="text">You will be invited to schedule an interview shortly. Please keep your contact information up to date.</p>

    <div class="btn-container" style="text-align: center;">
      <a href="${baseUrl}/applicant/application/status" class="btn" style="background-color: #4f46e5; border-color: #4f46e5;">
        <span>View Application Status</span>
      </a>
    </div>
  `
  const html = await wrapEmail('You Have Been Shortlisted!', body, email)
  return sendEmail({ to: email, subject: 'Aerojet Aviation — You\'ve Been Shortlisted!', html })
}

// ---------------------------------------------------------------------------
// 5. INTERVIEW SCHEDULED — Date confirmed
// ---------------------------------------------------------------------------

export async function sendInterviewScheduledEmail(
  email: string,
  firstName: string,
  date: string,
  time: string,
  location: string
) {
  const body = `
    <p class="text">Hi ${firstName},</p>
    <p class="text">Your admissions interview has been <strong>scheduled</strong>. Please arrive on time with a valid ID.</p>

    <div class="info-box" style="border-left-color: #0891b2;">
      <div class="info-row"><strong>Date:</strong> ${date}</div>
      <div class="info-row"><strong>Time:</strong> ${time}</div>
      <div class="info-row"><strong>Location:</strong> ${location}</div>
    </div>

    <p class="text"><strong>Tips for your interview:</strong></p>
    <ul style="color: #334155; line-height: 1.6;">
      <li>Dress professionally</li>
      <li>Bring a valid photo ID</li>
      <li>Be prepared to discuss your motivation for the programme</li>
    </ul>
  `
  const html = await wrapEmail('Interview Scheduled', body, email)
  return sendEmail({ to: email, subject: 'Aerojet Aviation — Interview Scheduled', html })
}

// ---------------------------------------------------------------------------
// 6. INTERVIEW REMINDER — 24h before
// ---------------------------------------------------------------------------

export async function sendInterviewReminderEmail(
  email: string,
  firstName: string,
  date: string,
  time: string,
  location: string
) {
  const body = `
    <p class="text">Hi ${firstName},</p>
    <p class="text">This is a reminder that your admissions interview is <strong>tomorrow</strong>.</p>

    <div class="info-box" style="border-left-color: #f59e0b;">
      <div class="info-row"><strong>📅 Date:</strong> ${date}</div>
      <div class="info-row"><strong>🕐 Time:</strong> ${time}</div>
      <div class="info-row"><strong>📍 Location:</strong> ${location}</div>
    </div>

    <p class="text">Please arrive at least 15 minutes early with a valid photo ID. Good luck!</p>
  `
  const html = await wrapEmail('Interview Reminder — Tomorrow', body, email)
  return sendEmail({ to: email, subject: 'Aerojet Aviation — Interview Reminder', html })
}

// ---------------------------------------------------------------------------
// 7. SELECTED — Post-interview, applicant selected
// ---------------------------------------------------------------------------

export async function sendSelectedEmail(email: string, firstName: string) {
  const baseUrl = await getBaseUrl()
  const body = `
    <p class="text">Hi ${firstName},</p>
    <p class="text"><strong>Congratulations!</strong> Following your interview, you have been <strong>selected</strong> for admission to Aerojet Aviation Training Academy.</p>

    <div class="info-box" style="border-left-color: #059669;">
      <div class="info-row"><strong>Status:</strong> <span style="color:#059669; font-weight:bold;">SELECTED ✅</span></div>
    </div>

    <p class="text">The next step is to complete your <strong>medical examination</strong> at an approved facility. Please log in to your portal for detailed instructions.</p>

    <div class="btn-container" style="text-align: center;">
      <a href="${baseUrl}/applicant/application/medical" class="btn" style="background-color: #059669; border-color: #059669;">
        <span>Begin Medical Process</span>
      </a>
    </div>
  `
  const html = await wrapEmail('You Have Been Selected!', body, email)
  return sendEmail({ to: email, subject: 'Aerojet Aviation — You\'ve Been Selected!', html })
}

// ---------------------------------------------------------------------------
// 8. MEDICAL PENDING — Applicant must submit medical docs
// ---------------------------------------------------------------------------

export async function sendMedicalPendingEmail(email: string, firstName: string) {
  const baseUrl = await getBaseUrl()
  const body = `
    <p class="text">Hi ${firstName},</p>
    <p class="text">To complete your admission, please arrange a <strong>medical examination</strong> at an approved aviation medical facility.</p>

    <div class="info-box" style="border-left-color: #e11d48;">
      <p style="margin: 0 0 10px 0;"><strong>Required Documents:</strong></p>
      <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
        <li>Aviation Medical Certificate (Class 1 or 2)</li>
        <li>Supporting lab reports (if applicable)</li>
        <li>Vision & hearing test results</li>
      </ul>
    </div>

    <div class="btn-container" style="text-align: center;">
      <a href="${baseUrl}/applicant/application/medical" class="btn" style="background-color: #e11d48; border-color: #e11d48;">
        <span>Upload Medical Documents</span>
      </a>
    </div>
  `
  const html = await wrapEmail('Medical Examination Required', body, email)
  return sendEmail({ to: email, subject: 'Aerojet Aviation — Medical Examination Required', html })
}

// ---------------------------------------------------------------------------
// 9. MEDICAL SUBMITTED — Docs under review
// ---------------------------------------------------------------------------

export async function sendMedicalSubmittedEmail(email: string, firstName: string) {
  const body = `
    <p class="text">Hi ${firstName},</p>
    <p class="text">Your medical examination documents have been <strong>submitted</strong> and are now under review by our admissions team.</p>

    <div class="info-box" style="border-left-color: #3b82f6;">
      <div class="info-row"><strong>Status:</strong> <span style="color:#3b82f6; font-weight:bold;">UNDER REVIEW 📋</span></div>
    </div>

    <p class="text">You will be notified once the review is complete. This typically takes 2–5 business days.</p>
  `
  const html = await wrapEmail('Medical Documents Under Review', body, email)
  return sendEmail({ to: email, subject: 'Aerojet Aviation — Medical Documents Received', html })
}

// ---------------------------------------------------------------------------
// 10. MEDICAL CLEARED — Cleared for enrollment
// ---------------------------------------------------------------------------

export async function sendMedicalClearedEmail(email: string, firstName: string) {
  const baseUrl = await getBaseUrl()
  const body = `
    <p class="text">Hi ${firstName},</p>
    <p class="text"><strong>Great news!</strong> Your medical examination has been <strong>cleared</strong>. You are now being enrolled into the academy.</p>

    <div class="info-box" style="border-left-color: #22c55e;">
      <div class="info-row"><strong>Medical Status:</strong> <span style="color:#15803d; font-weight:bold;">CLEARED ✅</span></div>
    </div>

    <p class="text">Your enrollment is being finalized. You will receive your student credentials and portal access shortly.</p>

    <div class="btn-container" style="text-align: center;">
      <a href="${baseUrl}/applicant/application/status" class="btn" style="background-color: #22c55e; border-color: #22c55e; color: #0f172a !important;">
        <span>View Application Status</span>
      </a>
    </div>
  `
  const html = await wrapEmail('Medical Cleared — Enrollment in Progress', body, email)
  return sendEmail({ to: email, subject: 'Aerojet Aviation — Medical Cleared!', html })
}

// ---------------------------------------------------------------------------
// 11. ENROLLED — Full enrollment confirmed
// ---------------------------------------------------------------------------

export async function sendEnrolledEmail(email: string, firstName: string, studentId: string) {
  const baseUrl = await getBaseUrl()
  const body = `
    <p class="text">Hi ${firstName},</p>
    <p class="text"><strong>Welcome to Aerojet Aviation Training Academy!</strong> 🎓 Your enrollment is now complete.</p>

    <div class="info-box" style="border-left-color: #22c55e;">
      <div class="info-row"><strong>Student ID:</strong></div>
      <div style="font-family: monospace; font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #0f172a; margin-top: 5px;">
        ${studentId}
      </div>
    </div>

    <p class="text"><strong>What's next?</strong></p>
    <ul style="color: #334155; line-height: 1.6;">
      <li>Access your Student Portal to view your schedule</li>
      <li>Review your programme modules and requirements</li>
      <li>Complete your student profile</li>
      <li>Attend your first orientation session</li>
    </ul>

    <div class="btn-container" style="text-align: center;">
      <a href="${baseUrl}/student/dashboard" class="btn" style="background-color: #22c55e; border-color: #22c55e; color: #0f172a !important;">
        <span>Go to Student Portal</span>
      </a>
    </div>
  `
  const html = await wrapEmail('Welcome to Aerojet Academy!', body, email)
  return sendEmail({ to: email, subject: 'Aerojet Aviation — Welcome, Student!', html })
}

// ---------------------------------------------------------------------------
// 12. REJECTED — Application rejected at any stage
// ---------------------------------------------------------------------------

export async function sendRejectedEmail(email: string, firstName: string, reason?: string) {
  const body = `
    <p class="text">Hi ${firstName},</p>
    <p class="text">We regret to inform you that your application to Aerojet Aviation Training Academy has not been successful at this time.</p>

    ${reason ? `
    <div class="info-box" style="border-left-color: #ef4444;">
      <div class="info-row"><strong>Reason:</strong> ${reason}</div>
    </div>
    ` : ''}

    <p class="text">We appreciate your interest in our programmes and encourage you to reapply in a future intake cycle. For any questions, please contact our admissions office.</p>

    <p class="text" style="font-size: 13px; color: #666;">
      If you believe this decision was made in error, please contact admissions@aerojet-academy.com.
    </p>
  `
  const html = await wrapEmail('Application Update', body, email)
  return sendEmail({ to: email, subject: 'Aerojet Aviation — Application Update', html })
}

// ---------------------------------------------------------------------------
// 13. APTITUDE TEST REMINDER — 24h before test deadline
// ---------------------------------------------------------------------------

export async function sendAptitudeTestReminderEmail(email: string, firstName: string, deadline: string) {
  const baseUrl = await getBaseUrl()
  const body = `
    <p class="text">Hi ${firstName},</p>
    <p class="text">This is a reminder that you have a pending <strong>aptitude test</strong> that needs to be completed.</p>

    <div class="info-box" style="border-left-color: #f59e0b;">
      <div class="info-row"><strong>⚠️ Deadline:</strong> ${deadline}</div>
      <div class="info-row" style="margin-top: 5px; font-size: 13px;">Failure to complete the test may result in your application being deferred.</div>
    </div>

    <div class="btn-container" style="text-align: center;">
      <a href="${baseUrl}/applicant/application/aptitude-test" class="btn" style="background-color: #f59e0b; border-color: #f59e0b; color: #0f172a !important;">
        <span>Take Aptitude Test Now</span>
      </a>
    </div>
  `
  const html = await wrapEmail('Aptitude Test Reminder', body, email)
  return sendEmail({ to: email, subject: 'Aerojet Aviation — Aptitude Test Reminder', html })
}

// ---------------------------------------------------------------------------
// 14. MODULAR DEADLINE WARNING — 75% or 90% of time elapsed
// ---------------------------------------------------------------------------

export async function sendModularDeadlineWarningEmail(
  email: string,
  firstName: string,
  percentElapsed: number,
  completionDeadline: string,
  modulesRemaining: number
) {
  const urgency = percentElapsed >= 90 ? 'CRITICAL' : 'WARNING'
  const color = percentElapsed >= 90 ? '#dc2626' : '#f59e0b'
  const body = `
    <p class="text">Hi ${firstName},</p>
    <p class="text">Your modular programme completion deadline is approaching. Please review your progress and plan accordingly.</p>

    <div class="info-box" style="border-left-color: ${color};">
      <div class="info-row"><strong>${urgency}:</strong> <span style="color:${color}; font-weight:bold;">${percentElapsed}% of time elapsed</span></div>
      <div class="info-row" style="margin-top: 5px;"><strong>Completion Deadline:</strong> ${completionDeadline}</div>
      <div class="info-row"><strong>Modules Remaining:</strong> ${modulesRemaining}</div>
    </div>

    <p class="text">${percentElapsed >= 90
      ? '<strong>Urgent:</strong> You have very little time remaining. Please contact your advisor immediately if you need assistance.'
      : 'We recommend scheduling your remaining modules as soon as possible to stay on track.'
    }</p>
  `
  const html = await wrapEmail(`Programme Deadline ${urgency}`, body, email)
  return sendEmail({
    to: email,
    subject: `Aerojet Aviation — Programme Deadline ${urgency} (${percentElapsed}% elapsed)`,
    html,
  })
}
