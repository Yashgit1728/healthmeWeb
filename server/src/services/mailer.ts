// server/src/services/mailer.ts
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { Resend } from 'resend';

type MailPayload = {
  to: string;
  name: string;
  resetUrl: string;
  minutes: number;
};

let smtpTransporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null = null;
let resendClient: Resend | null = null;
let usingEthereal = false;

/**
 * Initializes an email transport in this priority:
 * 1) RESEND (production-friendly)
 * 2) Custom SMTP via env (Mailtrap/Gmail/etc.)
 * 3) Ethereal (auto-created, dev-only)
 */
async function ensureTransport() {
  if (smtpTransporter || resendClient) return;

  const {
    RESEND_API_KEY,
    MAIL_HOST,
    MAIL_PORT,
    MAIL_USER,
    MAIL_PASS,
  } = process.env;

  // (1) Resend
  if (RESEND_API_KEY) {
    resendClient = new Resend(RESEND_API_KEY);
    return;
  }

  // (2) SMTP via env
  if (MAIL_HOST && MAIL_PORT && MAIL_USER && MAIL_PASS) {
    smtpTransporter = nodemailer.createTransport({
      host: MAIL_HOST,
      port: Number(MAIL_PORT),
      secure: Number(MAIL_PORT) === 465,
      auth: { user: MAIL_USER, pass: MAIL_PASS },
    });
    return;
  }

  // (3) Dev fallback: Ethereal (auto-create)
  const testAcc = await nodemailer.createTestAccount();
  smtpTransporter = nodemailer.createTransport({
    host: testAcc.smtp.host,
    port: testAcc.smtp.port,
    secure: testAcc.smtp.secure,
    auth: { user: testAcc.user, pass: testAcc.pass },
  });
  usingEthereal = true;
  console.warn(
    `[DEV] Using auto-created Ethereal account: ${testAcc.user} / ${testAcc.pass}`
  );
}

function fromAddress() {
  // Sensible default; override in .env for prod
  return process.env.MAIL_FROM || 'HealthMe <no-reply@healthme.local>';
}

export async function sendResetEmail({
  to,
  name,
  resetUrl,
  minutes,
}: MailPayload): Promise<{ previewUrl?: string }> {
  await ensureTransport();

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0;">
        <h1 style="margin:0;font-size:28px;">HealthMe</h1>
        <p style="margin:10px 0 0 0;opacity:0.9;">Password Reset Request</p>
      </div>
      <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px;">
        <h2 style="color:#333;margin-top:0;">Hi ${name || 'there'},</h2>
        <p style="color:#555;font-size:16px;">We received a request to reset your password for your HealthMe account.</p>
        <p style="color:#555;font-size:16px;">Click the button below to reset your password:</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="${resetUrl}" style="display:inline-block;background:#667eea;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">Reset Password</a>
        </div>
        <p style="color:#555;font-size:16px;">This link expires in <strong>${minutes} minutes</strong> for security reasons.</p>
        <p style="color:#555;font-size:16px;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
        <hr style="border:none;border-top:1px solid #ddd;margin:30px 0;">
        <p style="color:#777;font-size:14px;text-align:center;margin:0;">Best regards,<br>The HealthMe Team</p>
      </div>
    </div>
  `;

  // Resend path
  if (resendClient) {
    const { error } = await resendClient.emails.send({
      from: fromAddress(),
      to,
      subject: 'Reset your HealthMe password',
      html,
    });
    if (error) throw error;
    return {};
  }

  // SMTP/Ethereal path
  if (!smtpTransporter) {
    throw new Error('Email service failed to initialize');
  }

  const info = await smtpTransporter.sendMail({
    from: fromAddress(),
    to,
    subject: 'Reset your HealthMe password',
    html,
  });

  const previewUrl = usingEthereal ? nodemailer.getTestMessageUrl(info) || undefined : undefined;
  return { previewUrl };
}
