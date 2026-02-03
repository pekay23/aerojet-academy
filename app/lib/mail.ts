import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// --- CONFIGURATION ---
// Verbatim text for the "From" address
const FROM_EMAIL = 'Aerojet Academy <admissions@aerojet-academy.com>';

// The internal email address where YOUR TEAM will receive lead notifications
const STAFF_INBOX = 'info@aerojet-academy.com'; 

// --- 1. STUDENT: AUTO-REPLY TO ENQUIRY ---
export const sendEnquiryEmail = async (email: string, name: string) => {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Aerojet Academy - Enquiry Received',
    html: `
      <div style="font-family: sans-serif; color: #333;">
        <h1>Hello ${name},</h1>
        <p>Thank you for reaching out to Aerojet Aviation Training Academy.</p>
        <p>We have received your enquiry. Our admissions team will review your interest and contact you shortly.</p>
        <p><strong>Next Step:</strong> We will first issue an invoice for the GHS 350 registration fee. Payment of the registration fee is required before you can complete the online application.</p>
        <p>Regards,<br/><b>Admissions Team</b></p>
      </div>
    `,
  });
};

// --- 2. STAFF: INTERNAL NOTIFICATION OF NEW LEAD ---
export const sendStaffNotification = async (name: string, email: string, message: string) => {
  await resend.emails.send({
    from: 'Website System <system@aerojet-academy.com>',
    to: STAFF_INBOX,
    subject: `New Website Enquiry: ${name}`,
    html: `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #002a5c;">New Lead Captured</h2>
        <p>A new enquiry has been submitted via the website contact form.</p>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; border: 1px solid #eee;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
        <p style="font-size: 12px; color: #999; mt-4;">This is an automated notification from the Aerojet Academy System.</p>
      </div>
    `,
  });
};

// --- 3. STUDENT: REGISTRATION INVOICE ---
export const sendRegistrationInvoiceEmail = async (email: string, name: string) => {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Your Registration Fee Invoice - Aerojet Academy',
    html: `
      <div style="font-family: sans-serif; color: #333;">
        <h1>Welcome ${name},</h1>
        <p>To begin your journey at Aerojet Academy, please complete the mandatory one-time registration fee.</p>
        <div style="background: #eef6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #2880b9;">
            <p><strong>Amount Due:</strong> GHS 350.00</p>
            <p><strong>Bank Details:</strong> [Your Bank Name] | Account: [Your Account Number] | Ref: REG-${name.substring(0,3).toUpperCase()}</p>
        </div>
        <p>Once paid, log in to the portal and upload your receipt to unlock the Online Application Form.</p>
        <p>Regards,<br/><b>Finance Department</b></p>
      </div>
    `,
  });
};

// --- 4. STUDENT: PAYMENT VERIFIED / APP UNLOCKED ---
export const sendPaymentVerifiedEmail = async (email: string, name: string) => {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Payment Verified - Application Unlocked',
    html: `
      <div style="font-family: sans-serif; color: #333;">
        <h1>Good news, ${name}!</h1>
        <p>Your payment has been verified by our finance team.</p>
        <p>The <strong>Online Application Form</strong> is now unlocked in your student portal. Please log in to provide your academic details and upload your documents.</p>
        <div style="margin-top: 30px;">
            <a href="https://aerojet-academy.com/portal/login" style="background: #2880b9; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log in to Portal</a>
        </div>
        <p style="margin-top: 30px;">Regards,<br/><b>Aerojet Academy Admissions</b></p>
      </div>
    `,
  });
};
