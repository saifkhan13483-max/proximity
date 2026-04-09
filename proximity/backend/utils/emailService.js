const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: parseInt(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('[Email] Email not configured — skipping send. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in config.env.');
    return { skipped: true };
  }
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Proximity Credit Repair <noreply@proximity.com>',
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email] Failed to send:', err.message);
    return { success: false, error: err.message };
  }
};

const sendWelcomeEmail = async (user) => {
  const appUrl = process.env.APP_URL || 'http://localhost:5000';
  return sendEmail({
    to: user.email,
    subject: 'Welcome to Proximity — Your Credit Journey Starts Now',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0A; color: #ffffff; padding: 40px; border-radius: 16px;">
        <h1 style="color: #B8924A; font-size: 2rem; margin-bottom: 4px; letter-spacing: 0.05em;">PROXIMITY</h1>
        <p style="color: #9A9A9A; margin-bottom: 32px;">Credit Repair Platform</p>
        <h2 style="color: #ffffff; font-size: 1.5rem; margin-bottom: 12px;">Welcome, ${user.name}!</h2>
        <p style="color: #cccccc; line-height: 1.7; margin-bottom: 20px;">
          Your account has been created and you're officially on your way to better credit.
          Our team of experts is ready to help you dispute inaccurate items, monitor your progress,
          and rebuild the financial life you deserve.
        </p>
        <div style="background: #1A1A1A; border-left: 4px solid #B8924A; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <p style="color: #B8924A; font-weight: bold; margin-bottom: 8px;">Your Next Steps</p>
          <ol style="color: #cccccc; line-height: 2; margin: 0; padding-left: 20px;">
            <li>Log into your client dashboard</li>
            <li>Submit your first dispute</li>
            <li>Monitor your progress in real time</li>
          </ol>
        </div>
        <a href="${appUrl}/client/dashboard.html"
           style="display: inline-block; margin-top: 24px; background: #B8924A; color: #0A0A0A; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; letter-spacing: 0.04em;">
          Go to My Dashboard
        </a>
        <hr style="border: none; border-top: 1px solid #222; margin: 32px 0;">
        <p style="color: #666; font-size: 0.8rem; text-align: center;">
          © 2025 Proximity Credit Repair. All rights reserved.<br>
          <a href="${appUrl}/privacy.html" style="color: #B8924A;">Privacy Policy</a> &nbsp;|&nbsp;
          <a href="${appUrl}/terms.html" style="color: #B8924A;">Terms of Service</a>
        </p>
      </div>
    `
  });
};

const sendDisputeStatusEmail = async (user, dispute) => {
  const appUrl = process.env.APP_URL || 'http://localhost:5000';
  const statusMessages = {
    'Pending': 'Your dispute has been received and is queued for processing. We will begin working on it shortly.',
    'In Progress': 'Your dispute is actively being processed. We have prepared and sent dispute letters to the relevant credit bureaus. The bureau has up to 30 days to investigate.',
    'Resolved': 'Great news! Your dispute has been resolved. Please check your latest credit report for the update. If you have any questions, our team is here to help.'
  };
  return sendEmail({
    to: user.email,
    subject: `Dispute Update: ${dispute.accountName} — ${dispute.status}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0A; color: #ffffff; padding: 40px; border-radius: 16px;">
        <h1 style="color: #B8924A; font-size: 2rem; margin-bottom: 4px; letter-spacing: 0.05em;">PROXIMITY</h1>
        <p style="color: #9A9A9A; margin-bottom: 32px;">Credit Repair Platform</p>
        <h2 style="color: #ffffff; font-size: 1.5rem; margin-bottom: 8px;">Dispute Status Update</h2>
        <p style="color: #cccccc; margin-bottom: 24px;">Hi ${user.name}, here is the latest update on your dispute:</p>
        <div style="background: #1A1A1A; border-left: 4px solid #B8924A; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 6px 0;"><strong style="color: #B8924A;">Account:</strong> <span style="color: #ccc;">${dispute.accountName}</span></p>
          <p style="margin: 6px 0;"><strong style="color: #B8924A;">Bureau:</strong> <span style="color: #ccc;">${dispute.bureau}</span></p>
          <p style="margin: 6px 0;"><strong style="color: #B8924A;">New Status:</strong>
            <span style="color: ${dispute.status === 'Resolved' ? '#4ade80' : dispute.status === 'In Progress' ? '#60a5fa' : '#B8924A'}; font-weight: 600;">
              ${dispute.status}
            </span>
          </p>
          ${dispute.notes ? `<p style="margin: 12px 0 0;"><strong style="color: #B8924A;">Admin Notes:</strong> <span style="color: #ccc;">${dispute.notes}</span></p>` : ''}
        </div>
        <p style="color: #cccccc; line-height: 1.7;">${statusMessages[dispute.status] || 'Your dispute status has been updated.'}</p>
        <a href="${appUrl}/client/dashboard.html"
           style="display: inline-block; margin-top: 24px; background: #B8924A; color: #0A0A0A; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700;">
          View My Dashboard
        </a>
        <hr style="border: none; border-top: 1px solid #222; margin: 32px 0;">
        <p style="color: #666; font-size: 0.8rem; text-align: center;">© 2025 Proximity Credit Repair. All rights reserved.</p>
      </div>
    `
  });
};

const sendAdminContactAlert = async ({ name, email, phone, message }) => {
  const appUrl = process.env.APP_URL || 'http://localhost:5000';
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  if (!adminEmail) return { skipped: true };
  return sendEmail({
    to: adminEmail,
    subject: `New Contact Form Submission from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0A; color: #ffffff; padding: 40px; border-radius: 16px;">
        <h1 style="color: #B8924A; font-size: 2rem; margin-bottom: 4px;">PROXIMITY</h1>
        <p style="color: #9A9A9A; margin-bottom: 32px;">Admin Notification</p>
        <h2 style="color: #ffffff;">New Contact Message</h2>
        <div style="background: #1A1A1A; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 6px 0;"><strong style="color: #B8924A;">Name:</strong> <span style="color:#ccc">${name}</span></p>
          <p style="margin: 6px 0;"><strong style="color: #B8924A;">Email:</strong> <span style="color:#ccc">${email}</span></p>
          ${phone ? `<p style="margin: 6px 0;"><strong style="color: #B8924A;">Phone:</strong> <span style="color:#ccc">${phone}</span></p>` : ''}
          <p style="margin: 16px 0 0;"><strong style="color: #B8924A;">Message:</strong></p>
          <p style="color: #cccccc; line-height: 1.7; margin-top: 8px;">${message}</p>
        </div>
        <a href="${appUrl}/admin/dashboard.html"
           style="display: inline-block; margin-top: 16px; background: #B8924A; color: #0A0A0A; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700;">
          View in Admin Panel
        </a>
        <hr style="border: none; border-top: 1px solid #222; margin: 32px 0;">
        <p style="color: #666; font-size: 0.8rem; text-align: center;">© 2025 Proximity Credit Repair. Admin notification.</p>
      </div>
    `
  });
};

module.exports = { sendEmail, sendWelcomeEmail, sendDisputeStatusEmail, sendAdminContactAlert };
