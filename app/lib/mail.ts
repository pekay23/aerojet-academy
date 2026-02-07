import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://aerojet-academy.com';

// --- VISUAL ASSETS ---
const LOGO_DARK_ON_WHITE = `${DOMAIN}/AATA_logo_hor_onWhite.png`; // Header
const LOGO_WHITE_ON_DARK = `${DOMAIN}/ATA_logo_hor_onDark.png`;   // Footer

const COLORS = {
  navy: '#002a5c',
  sky: '#4c9ded',
  white: '#ffffff',
  gray: '#f4f6f8',
  text: '#334155'
};

// --- SHARED HTML WRAPPER ---
const wrapEmail = (title: string, bodyContent: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* RESET */
          body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: ${COLORS.gray}; color: ${COLORS.text}; }
          table { border-collapse: collapse; width: 100%; }
          
          /* CONTAINER */
          .wrapper { width: 100%; background-color: ${COLORS.gray}; padding: 40px 0; }
          .main-table { max-width: 600px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          
          /* HEADER (Sleek like Navbar) */
          .header { background-color: ${COLORS.white}; padding: 20px 30px; border-bottom: 1px solid #f1f5f9; text-align: left; }
          .header img { height: 32px; width: auto; display: block; }
          
          /* CONTENT */
          .content { padding: 40px 30px; }
          .h1 { color: ${COLORS.navy}; font-size: 22px; font-weight: 800; margin: 0 0 20px 0; letter-spacing: -0.5px; }
          .text { font-size: 15px; line-height: 1.6; color: ${COLORS.text}; margin-bottom: 15px; }
          
          /* BUTTON */
          .btn-container { margin: 30px 0; }
          .btn { background-color: ${COLORS.navy}; color: ${COLORS.white}; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; }
          
          /* INFO BOX */
          .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid ${COLORS.navy}; padding: 15px; margin: 25px 0; border-radius: 4px; }
          .info-row { margin-bottom: 5px; font-size: 14px; }
          
          /* FOOTER (Full width bottom) */
          .footer { background-color: ${COLORS.navy}; padding: 40px 30px; text-align: center; color: #94a3b8; font-size: 12px; }
          .footer img { height: 28px; width: auto; margin-bottom: 20px; opacity: 0.9; }
          .footer a { color: ${COLORS.sky}; text-decoration: none; margin: 0 8px; }
          .footer-divider { height: 1px; background-color: rgba(255,255,255,0.1); margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <table class="main-table" align="center">
            
            <!-- HEADER -->
            <tr>
              <td class="header">
                <img src="${LOGO_DARK_ON_WHITE}" alt="Aerojet Academy" />
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td class="content">
                <h1 class="h1">${title}</h1>
                ${bodyContent}
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td class="footer">
                <img src="${LOGO_WHITE_ON_DARK}" alt="Aerojet Academy" />
                <p>Accra Technical Training Centre (ATTC)<br/>Kokomlemle, Accra - Ghana</p>
                <div class="footer-divider"></div>
                <p>
                  <a href="${DOMAIN}">Website</a>
                  <a href="${DOMAIN}/login">Portal</a>
                  <a href="${DOMAIN}/contact">Support</a>
                </p>
                <p style="margin-top: 20px; font-size: 11px; opacity: 0.6;">&copy; ${new Date().getFullYear()} Aerojet Aviation. All rights reserved.</p>
              </td>
            </tr>

          </table>
        </div>
      </body>
    </html>
  `;
};

// --- EMAIL FUNCTIONS ---

export const sendRegistrationInvoiceEmail = async (email: string, name: string) => {
  const html = wrapEmail(
    "Complete Your Registration",
    `
    <p class="text">Dear ${name},</p>
    <p class="text">Thank you for starting your journey with Aerojet Academy. A registration fee of <strong>GHS 350.00</strong> is required to unlock your full application.</p>
    
    <div class="info-box">
      <div class="info-row"><strong>Bank:</strong> FNB Bank</div>
      <div class="info-row"><strong>Account No:</strong> 1020003980687</div>
      <div class="info-row"><strong>Branch:</strong> 330102</div>
      <div class="info-row"><strong>Ref:</strong> ${email}</div>
    </div>

    <p class="text">Once paid, please upload your proof of payment securely below.</p>
    
    <div class="btn-container">
      <a href="${DOMAIN}/upload-proof?email=${encodeURIComponent(email)}" class="btn">Upload Payment Proof</a>
    </div>
    `
  );

  await resend.emails.send({
    from: 'Admissions <admissions@aerojet-academy.com>',
    to: email,
    subject: 'Action Required: Registration Fee',
    html
  });
};

export const sendPaymentConfirmationEmail = async (email: string, name: string) => {
  const html = wrapEmail(
    "Account Activated",
    `
    <p class="text">Dear ${name},</p>
    <p class="text">Your registration fee has been verified. Your applicant account is now active and ready for the next step.</p>
    
    <div class="info-box" style="border-left-color: #22c55e;">
      <div class="info-row"><strong>Status:</strong> <span style="color:#15803d; font-weight:bold;">Verified ✅</span></div>
      <div class="info-row"><strong>Next Step:</strong> Complete Application Form</div>
    </div>

    <div class="btn-container">
      <a href="${DOMAIN}/login" class="btn">Login to Portal</a>
    </div>
    `
  );

  await resend.emails.send({
    from: 'Admissions <admissions@aerojet-academy.com>',
    to: email,
    subject: 'Account Unlocked - Next Steps',
    html
  });
};

export const sendEnquiryEmail = async (email: string, name: string) => {
  const html = wrapEmail(
    "Message Received",
    `
    <p class="text">Hello ${name},</p>
    <p class="text">We have received your enquiry and a member of our team will get back to you shortly.</p>
    <p class="text">In the meantime, you can browse our course catalog.</p>
    
    <div class="btn-container">
      <a href="${DOMAIN}/courses" class="btn">View Courses</a>
    </div>
    `
  );

  await resend.emails.send({
    from: 'Support <info@aerojet-academy.com>',
    to: email,
    subject: 'We received your message',
    html
  });
};

export const sendStaffNotification = async (name: string, email: string, message: string) => {
  await resend.emails.send({
    from: 'System <admin@aerojet-academy.com>',
    to: 'info@aerojet-academy.com',
    subject: `New Enquiry from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
  });
};
