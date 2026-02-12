import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://aerojet-academy.com';

const LOGO_DARK_ON_WHITE = `${DOMAIN}/AATA_logo_hor_onWhite.png`;
const LOGO_WHITE_ON_DARK = `${DOMAIN}/ATA_logo_hor_onDark.png`;

const COLORS = {
  navy: '#002a5c',
  sky: '#4c9ded',
  white: '#ffffff',
  gray: '#f4f6f8',
  text: '#334155'
};

const wrapEmail = (title: string, bodyContent: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: ${COLORS.gray}; color: ${COLORS.text}; }
          table { border-collapse: collapse; width: 100%; border-spacing: 0; }
          img { border: 0; outline: none; text-decoration: none; }
          .wrapper { width: 100%; background-color: ${COLORS.gray}; padding: 20px 0 0 0; } 
          .main-table { max-width: 600px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 8px 8px 0 0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background-color: ${COLORS.white}; padding: 20px 30px; border-bottom: 1px solid #f1f5f9; text-align: left; }
          .header img { height: 36px; width: auto; display: block; }
          .content { padding: 40px 30px; }
          .h1 { color: ${COLORS.navy}; font-size: 22px; font-weight: 800; margin: 0 0 20px 0; letter-spacing: -0.5px; }
          .text { font-size: 15px; line-height: 1.6; color: ${COLORS.text}; margin-bottom: 15px; }
          .btn-container { margin: 30px 0; }
          .btn { background-color: ${COLORS.navy}; color: ${COLORS.white}; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; }
          .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid ${COLORS.navy}; padding: 15px; margin: 25px 0; border-radius: 4px; }
          .info-row { margin-bottom: 5px; font-size: 14px; }
          .footer { background-color: ${COLORS.navy}; padding: 40px 30px; color: #94a3b8; font-size: 12px; }
          .footer-logo { width: 160px; height: auto; display: block; }
          .footer-contact { text-align: right; color: #cbd5e1; line-height: 1.5; }
          .footer-links { text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 20px; }
          .footer-links a { color: ${COLORS.sky}; text-decoration: none; margin: 0 10px; font-weight: bold; }
          .copyright { text-align: center; margin-top: 15px; opacity: 0.5; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <table class="main-table" align="center">
            <tr><td class="header"><img src="${LOGO_DARK_ON_WHITE}" alt="Aerojet Academy" /></td></tr>
            <tr><td class="content"><h1 class="h1">${title}</h1>${bodyContent}</td></tr>
            <tr>
              <td class="footer">
                <table width="100%">
                  <tr>
                    <td valign="top" width="50%"><img src="${LOGO_WHITE_ON_DARK}" class="footer-logo" alt="Aerojet Academy" /></td>
                    <td valign="top" width="50%" class="footer-contact"><strong>AEROJET AVIATION</strong><br/>Accra Technical Training Centre<br/>Kokomlemle, Accra - Ghana<br/>+233 551 010 108</td>
                  </tr>
                </table>
                <div class="footer-links">
                  <a href="${DOMAIN}">Website</a>
                  <a href="${DOMAIN}/login">Portal</a>
                  <a href="${DOMAIN}/contact">Support</a>
                </div>
                <div class="copyright">&copy; ${new Date().getFullYear()} Aerojet Aviation. All rights reserved.</div>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;
};

// --- EMAIL FUNCTIONS ---

export const sendRegistrationInvoiceEmail = async (email: string, name: string, password: string) => {
  const html = wrapEmail(
    "Welcome to Aerojet Academy!",
    `
    <p class="text">Dear ${name},</p>
    <p class="text">Thank you for registering with Aerojet Academy. Your account has been created successfully!</p>
    
    <div class="info-box" style="border-left-color: #22c55e;">
      <div class="info-row"><strong>Your Login Credentials:</strong></div>
      <div class="info-row" style="margin-top:10px;">
        <strong>Email:</strong><br/>
        <span style="font-size: 15px; color: #002a5c; font-weight:bold;">${email}</span>
      </div>
      <div class="info-row" style="margin-top:5px;">
        <strong>Password:</strong><br/>
        <span style="font-family: monospace; font-size: 16px; letter-spacing: 1px; color: #000; background: #fff3cd; padding: 4px 8px; border-radius: 4px;">${password}</span>
      </div>
    </div>

    <p class="text" style="font-size: 13px; color: #d97706; background: #fef3c7; padding: 10px; border-radius: 4px; border-left: 3px solid #d97706;">
      <strong>⚠️ Important:</strong> Please save these credentials securely. You will need them to access your applicant portal.
    </p>

    <div class="btn-container">
      <a href="${DOMAIN}/login" class="btn">Login to Your Portal</a>
    </div>

    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">

    <p class="text"><strong>Next Step: Complete Registration Payment</strong></p>
    <p class="text">A registration fee of <strong>GHS 350.00</strong> is required to activate your application.</p>
    
    <div class="info-box">
      <div class="info-row"><strong>Bank:</strong> FNB Bank</div>
      <div class="info-row"><strong>Account No:</strong> 1020003980687</div>
      <div class="info-row"><strong>Branch:</strong> 330102</div>
      <div class="info-row"><strong>Ref:</strong> ${email}</div>
    </div>

    <p class="text">After making your payment, log in to your portal to upload proof of payment for verification.</p>
    `
  );

  await resend.emails.send({
    from: 'Admissions <admissions@aerojet-academy.com>',
    to: email,
    subject: 'Welcome to Aerojet Academy - Login Credentials',
    html
  });
};

export const sendPaymentConfirmationEmail = async (
  toEmail: string,
  name: string,
  password?: string,
  newAcademyEmail?: string
) => {
  const html = wrapEmail(
    "Student Portal Unlocked",
    `
    <p class="text">Dear ${name},</p>
    <p class="text">Your registration is verified. We have created your official <strong>Aerojet Academy Account</strong>.</p>
    
    <div class="info-box" style="border-left-color: #22c55e;">
      <div class="info-row"><strong>Status:</strong> <span style="color:#15803d; font-weight:bold;">Active ✅</span></div>
      
      ${newAcademyEmail ? `
      <div class="info-row" style="margin-top:10px; border-top:1px dashed #ccc; padding-top:10px;">
        <strong>Your New Login Email:</strong><br/>
        <span style="font-size: 16px; color: #002a5c; font-weight:bold;">${newAcademyEmail}</span>
      </div>
      ` : ''}

      ${password ? `
      <div class="info-row" style="margin-top:5px;">
        <strong>Access Code:</strong><br/>
        <span style="font-family: monospace; font-size: 16px; letter-spacing: 1px; color: #000;">${password}</span>
      </div>
      ` : ''}
    </div>

    <p class="text" style="font-size: 13px; color: #666;">
        Please use the <strong>Academy Email</strong> above to log in from now on. Your personal email will no longer work for login.
    </p>

    <div class="btn-container">
      <a href="${DOMAIN}/login" class="btn">Login to Student Portal</a>
    </div>
    `
  );

  await resend.emails.send({
    from: 'Admissions <admissions@aerojet-academy.com>',
    to: toEmail,
    subject: 'Student Portal Access - Login Details',
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

export const sendStaffNotification = async (name: string, email: string, message: string, subject?: string) => {
  await resend.emails.send({
    from: 'System <admin@aerojet-academy.com>',
    to: 'info@aerojet-academy.com',
    subject: subject || `New Enquiry from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
  });
};

export const sendPaymentReceiptEmail = async (email: string, name: string, amount: number, feeDescription: string, transactionId: string) => {
  const html = wrapEmail(
    "Payment Receipt",
    `
    <p class="text">Dear ${name},</p>
    <p class="text">We acknowledge receipt of your payment. Thank you for settling your fees.</p>
    
    <div class="info-box" style="border-left-color: #22c55e;">
      <div class="info-row"><strong>Receipt No:</strong> <span style="font-family:monospace;">${transactionId}</span></div>
      <div class="info-row"><strong>Amount Paid:</strong> GHS ${amount.toFixed(2)}</div>
      <div class="info-row"><strong>Description:</strong> ${feeDescription}</div>
      <div class="info-row"><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
      <div class="info-row"><strong>Status:</strong> <span style="color:#15803d; font-weight:bold;">PAID ✅</span></div>
    </div>

    <p class="text" style="font-size: 13px; color: #666;">
        This email serves as your official receipt.
    </p>
    `
  );

  await resend.emails.send({
    from: 'Finance <finance@aerojet-academy.com>',
    to: email,
    subject: `Payment Receipt - ${feeDescription}`,
    html
  });
};

export const sendVerificationEmail = async (email: string, name: string, token: string) => {
  const verifyUrl = `${DOMAIN}/verify-email?token=${token}`;

  const html = wrapEmail(
    "Verify Your Email",
    `
    <p class="text">Dear ${name},</p>
    <p class="text">Please verify your email address to activate your Aerojet Academy account.</p>
    
    <div class="btn-container">
      <a href="${verifyUrl}" class="btn">Verify Email Address</a>
    </div>
    
    <p class="text" style="font-size: 13px; color: #666;">
      If you did not create an account, please ignore this email.
    </p>
    `
  );

  await resend.emails.send({
    from: 'Aerojet Academy <onboarding@resend.dev>', // Update domain
    to: email,
    subject: 'Verify your email address',
    html
  });
};

export const sendApplicationReceivedEmail = async (email: string, name: string, code: string) => {
  const uploadUrl = `${DOMAIN}/upload-proof?code=${code}&email=${encodeURIComponent(email)}`;

  const html = wrapEmail(
    "Application Received",
    `
    <p class="text">Dear ${name},</p>
    <p class="text">Thank you for starting your application to Aerojet Academy.</p>
    
    <div class="info-box" style="border-left-color: #3b82f6;">
      <div class="info-row"><strong>Your Registration Code:</strong></div>
      <div class="info-row" style="margin-top:5px;">
        <span style="font-family: monospace; font-size: 20px; letter-spacing: 2px; color: #002a5c; font-weight:bold; background: #e0f2fe; padding: 4px 12px; border-radius: 4px;">${code}</span>
      </div>
    </div>

    <p class="text"><strong>Step 1: Make Payment</strong></p>
    <p class="text">Please pay the registration fee of <strong>GHS 350.00</strong> to:</p>
    
    <div class="info-box">
      <div class="info-row"><strong>Bank:</strong> FNB Bank</div>
      <div class="info-row"><strong>Account No:</strong> 1020003980687</div>
      <div class="info-row"><strong>Branch:</strong> 330102</div>
      <div class="info-row"><strong>Reference:</strong> ${code}</div>
    </div>

    <p class="text"><strong>Step 2: Upload Proof</strong></p>
    <p class="text">After payment, use the link below to upload your receipt.</p>
    
    <div class="btn-container">
      <a href="${uploadUrl}" class="btn">Upload Payment Proof</a>
    </div>
    
    <p class="text" style="font-size: 13px; color: #666;">
      Note: Your account will only be created after your payment is verified.
    </p>
    `
  );

  await resend.emails.send({
    from: 'Admissions <admissions@aerojet-academy.com>',
    to: email,
    subject: 'Aerojet Academy - Application Received',
    html
  });
};

export const sendAdmissionApprovalEmail = async (email: string, name: string, password: string) => {
  const html = wrapEmail(
    "Congratulations! Admission Approved",
    `
    <p class="text">Dear ${name},</p>
    <p class="text">We are pleased to inform you that your application payment has been verified and your admission process is moving forward!</p>
    
    <p class="text">You can now access the student portal to view courses, schedules, and more.</p>
    
    <div class="info-box" style="border-left-color: #22c55e;">
      <div class="info-row"><strong>Your Login Credentials:</strong></div>
      <div class="info-row" style="margin-top:10px;">
        <strong>Email:</strong><br/>
        <span style="font-size: 15px; color: #002a5c; font-weight:bold;">${email}</span>
      </div>
      <div class="info-row" style="margin-top:5px;">
        <strong>Temporary Password:</strong><br/>
        <span style="font-family: monospace; font-size: 16px; letter-spacing: 1px; color: #000; background: #fff3cd; padding: 4px 8px; border-radius: 4px;">${password}</span>
      </div>
    </div>

    <div class="btn-container">
      <a href="${DOMAIN}/portal/login" class="btn">Login to Portal</a>
    </div>

    <p class="text"><em>Please change your password after logging in for the first time.</em></p>
    `
  );

  await resend.emails.send({
    from: 'Admissions <admissions@aerojet-academy.com>',
    to: email,
    subject: 'Admission Approved - Welcome to Aerojet Academy',
    html
  });
};

export const sendProofReceivedEmail = async (email: string, name: string, code: string) => {
  const html = wrapEmail(
    "Payment Proof Received",
    `
    <p class="text">Dear ${name},</p>
    <p class="text">We have received your payment proof for application <strong>${code}</strong>.</p>
    
    <div class="info-box">
      <div class="info-row"><strong>Status:</strong> <span style="color:#d97706; font-weight:bold;">Under Review ⏳</span></div>
      <div class="info-row" style="margin-top:5px;">
        Our admissions team will verify your payment shortly.
      </div>
    </div>

    <p class="text">Once verified, you will receive another email with your <strong>Student Portal</strong> login credentials.</p>
    
    <p class="text" style="font-size: 13px; color: #666;">
      Thank you for your patience.
    </p>
    `
  );

  await resend.emails.send({
    from: 'Admissions <admissions@aerojet-academy.com>',
    to: email,
    subject: 'Payment Proof Received - Aerojet Academy',
    html
  });
};
