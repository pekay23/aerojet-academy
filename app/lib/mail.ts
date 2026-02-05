import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://aerojet-academy.com';

// --- VISUAL ASSETS ---
const LOGO_URL = `${DOMAIN}/email-logo.png`; // Ensure this exists in your public folder
const FOOTER_BG_COLOR = '#002a5c'; // Aerojet Navy
const ACCENT_COLOR = '#2880b9'; // Aerojet Sky

// --- SHARED HTML WRAPPER ---
// This wraps every email in the branded header and footer
const wrapEmail = (title: string, contentHtml: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { text-align: center; padding: 30px 20px; border-bottom: 1px solid #eaeaea; }
          .header img { height: 50px; width: auto; }
          .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
          .h1 { color: ${FOOTER_BG_COLOR}; font-size: 24px; font-weight: 800; margin-bottom: 20px; letter-spacing: -0.5px; }
          .button { display: inline-block; padding: 12px 24px; background-color: ${ACCENT_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
          .footer { background-color: ${FOOTER_BG_COLOR}; color: #ffffff; padding: 30px; text-align: center; font-size: 12px; }
          .footer a { color: #8ecae6; text-decoration: none; margin: 0 8px; }
          .footer-divider { height: 1px; background-color: rgba(255,255,255,0.1); margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${LOGO_URL}" alt="Aerojet Aviation Academy" />
          </div>
          <div class="content">
            <div class="h1">${title}</div>
            ${contentHtml}
          </div>
          <div class="footer">
            <p style="font-weight: bold; font-size: 14px; margin-bottom: 10px;">AEROJET AVIATION TRAINING ACADEMY</p>
            <p>Accra Technical Training Centre (ATTC)<br/>Kokomlemle, Accra - Ghana</p>
            <p>+233 551 010 108 | info@aerojet-academy.com</p>
            
            <div class="footer-divider"></div>
            
            <p>
              <a href="${DOMAIN}">Website</a> • 
              <a href="${DOMAIN}/portal">Student Portal</a> • 
              <a href="https://linkedin.com/company/aerojet">LinkedIn</a>
            </p>
            <p style="opacity: 0.6; margin-top: 20px;">&copy; ${new Date().getFullYear()} Aerojet Aviation. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

// --- 1. REGISTRATION INVOICE EMAIL ---
export const sendRegistrationInvoiceEmail = async (email: string, name: string) => {
  const subject = "Action Required: Registration Fee Invoice";
  const html = wrapEmail(
    "Complete Your Registration",
    `
    <p>Dear ${name},</p>
    <p>Thank you for starting your enrollment process with Aerojet Aviation Training Academy.</p>
    <p>To unlock the official application form and secure your candidate profile, a non-refundable registration fee of <strong>GHS 350.00</strong> is required.</p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid ${ACCENT_COLOR}; margin: 20px 0;">
      <p style="margin:0; font-weight:bold; color: #555;">PAYMENT DETAILS</p>
      <p style="margin: 5px 0;"><strong>Bank:</strong> FNB Bank</p>
      <p style="margin: 5px 0;"><strong>Account Name:</strong> Aerojet Foundation</p>
      <p style="margin: 5px 0;"><strong>Account No:</strong> 1020003980687</p>
      <p style="margin: 5px 0;"><strong>Branch Code:</strong> 330102</p>
    </div>

    <p>Once payment is made, please upload your proof of payment via the link below or reply to this email.</p>
    <a href="${DOMAIN}/portal/login" class="button">Log In to Upload Proof</a>
    `
  );

  await resend.emails.send({
    from: 'Admissions <admissions@aerojet-academy.com>',
    to: email,
    subject,
    html
  });
};

// --- 2. PAYMENT RECEIVED / WELCOME EMAIL ---
export const sendPaymentVerifiedEmail = async (email: string, name: string) => {
  const subject = "Payment Verified: Application Access Granted";
  const html = wrapEmail(
    "Payment Confirmed",
    `
    <p>Dear ${name},</p>
    <p>We have successfully verified your registration fee payment. Your candidate profile is now active.</p>
    <p>You can now access the full <strong>Online Application Form</strong> in your student portal. Please complete this at your earliest convenience to be considered for the next intake.</p>
    <a href="${DOMAIN}/portal/dashboard" class="button">Go to Dashboard</a>
    `
  );

  await resend.emails.send({
    from: 'Finance <finance@aerojet-academy.com>',
    to: email,
    subject,
    html
  });
};

// --- 3. ENQUIRY AUTO-REPLY ---
export const sendEnquiryEmail = async (email: string, name: string) => {
  const subject = "We received your enquiry";
  const html = wrapEmail(
    "Thank You for Contacting Us",
    `
    <p>Dear ${name},</p>
    <p>This is a quick note to let you know we have received your message. A member of our admissions team will review your query and get back to you within 24 business hours.</p>
    <p>In the meantime, feel free to browse our <a href="${DOMAIN}/courses">course catalog</a>.</p>
    `
  );

  await resend.emails.send({
    from: 'Support <info@aerojet-academy.com>',
    to: email,
    subject,
    html
  });
};

// --- 4. STAFF NOTIFICATION ---
export const sendStaffNotification = async (name: string, email: string, message: string) => {
  // Simple internal text email
  await resend.emails.send({
    from: 'Admin <admin@aerojet-academy.com>',
    to: 'info@aerojet-academy.com', // Your staff inbox
    subject: `New Website Enquiry: ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
  });
};
