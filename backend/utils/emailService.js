const nodemailer = require('nodemailer');

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

async function sendPasswordResetEmail({ to, resetLink, firstName = 'there' }) {
  const transporter = createTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'no-reply@nohunger.org';

  if (!transporter) {
    console.warn('[email] SMTP credentials not configured. Password reset link was not emailed.');
    return { sent: false, reason: 'smtp_not_configured' };
  }

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject: 'Reset your No Hunger account password',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
          <h2 style="color: #166534;">Password reset requested</h2>
          <p>Hello ${firstName},</p>
          <p>We received a request to reset your password for the No Hunger volunteer portal.</p>
          <p><a href="${resetLink}" style="display: inline-block; padding: 10px 16px; background: #166534; color: white; text-decoration: none; border-radius: 6px;">Reset my password</a></p>
          <p>If you did not request this, you can safely ignore this email.</p>
          <p>This link expires in 1 hour.</p>
        </div>
      `,
    });

    return { sent: true };
  } catch (error) {
    console.error('[email] Failed to send password reset email:', error.message);
    return { sent: false, reason: error.message };
  }
}

module.exports = {
  sendPasswordResetEmail,
};
