/**
 * Email Service — Nodemailer via Name.com SMTP
 *
 * Credentials:
 *   SMTP_HOST  (default: mail.name.com)
 *   SMTP_PORT  (default: 465)
 *   SMTP_USER  your full email address  e.g. noreply@novaura.life
 *   SMTP_PASS  your email account password
 *   SMTP_FROM  display from label (default: same as SMTP_USER)
 *
 * Set for local dev in  functions/.env
 * Set for production via:  firebase functions:secrets:set SMTP_PASS
 *   or:  firebase functions:config:set smtp.pass="..."  (legacy)
 */

import * as nodemailer from 'nodemailer';

function createTransporter(): nodemailer.Transporter {
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.name.com',
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM = `"NovAura" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@novaura.life'}>`;

// ─── Templates ──────────────────────────────────────────────────────────────

function welcomeTemplate(displayName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Welcome to NovAura</title>
</head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a14;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
        style="background:#12121f;border-radius:12px;overflow:hidden;border:1px solid #2a2a4a;max-width:560px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#6d28d9,#3b82f6);padding:32px 40px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:3px;font-weight:700;">NOVAURA</h1>
            <p style="color:rgba(255,255,255,0.6);margin:8px 0 0;font-size:12px;letter-spacing:2px;">THE FUTURE OPERATING SYSTEM</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <h2 style="color:#e2e8f0;margin:0 0 16px;font-size:22px;font-weight:600;">Welcome aboard, ${displayName}! 🌌</h2>
            <p style="color:#94a3b8;line-height:1.8;margin:0 0 20px;font-size:14px;">
              You're now part of the NovAura network — a full operating system in your browser.
              Your personalized AI workspace, creative tools, and community are all ready for you.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:24px 0;width:100%;">
              <tr>
                <td style="background:#1a1a2e;border-radius:8px;padding:18px 20px;border-left:3px solid #6d28d9;">
                  <p style="color:#c4b5fd;margin:0 0 10px;font-size:13px;font-weight:600;">✦ Your NovAura space includes:</p>
                  <p style="color:#94a3b8;margin:0;font-size:13px;line-height:2;">
                    Cybeni IDE &nbsp;·&nbsp; AI Assistant &nbsp;·&nbsp; Art Studio<br>
                    Music Composer &nbsp;·&nbsp; Games Arena &nbsp;·&nbsp; Social Network<br>
                    Avatar Builder &nbsp;·&nbsp; Literature IDE &nbsp;·&nbsp; and much more
                  </p>
                </td>
              </tr>
            </table>
            <p style="color:#94a3b8;line-height:1.8;margin:0 0 28px;font-size:14px;">
              Dive in and explore. Everything is just a click away from your desktop.
            </p>
            <a href="https://novaura.life"
              style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#6d28d9,#3b82f6);color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.5px;">
              Open NovAura →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #1e1e2e;">
            <p style="color:#475569;font-size:11px;margin:0;line-height:1.6;">
              You're receiving this because you created a NovAura account.<br>
              © 2026 NovAura Systems · <a href="https://novaura.life" style="color:#6d28d9;text-decoration:none;">novaura.life</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function passwordResetTemplate(displayName: string, resetLink: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Reset Your NovAura Password</title>
</head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a14;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
        style="background:#12121f;border-radius:12px;overflow:hidden;border:1px solid #2a2a4a;max-width:560px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#dc2626,#9333ea);padding:32px 40px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:3px;font-weight:700;">NOVAURA</h1>
            <p style="color:rgba(255,255,255,0.6);margin:8px 0 0;font-size:12px;letter-spacing:2px;">PASSWORD RESET REQUEST</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <h2 style="color:#e2e8f0;margin:0 0 16px;font-size:20px;font-weight:600;">Reset your password, ${displayName}</h2>
            <p style="color:#94a3b8;line-height:1.8;margin:0 0 24px;font-size:14px;">
              We received a request to reset your NovAura password.
              Click the button below to choose a new one. This link expires in <strong style="color:#e2e8f0;">1 hour</strong>.
            </p>
            <a href="${resetLink}"
              style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#dc2626,#9333ea);color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
              Reset Password →
            </a>
            <p style="color:#475569;font-size:12px;margin:28px 0 0;line-height:1.7;">
              If you didn't request this, you can safely ignore this email — your password will not change.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #1e1e2e;">
            <p style="color:#475569;font-size:11px;margin:0;line-height:1.6;">
              © 2026 NovAura Systems · <a href="https://novaura.life" style="color:#9333ea;text-decoration:none;">novaura.life</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(email: string, displayName: string): Promise<void> {
  const t = createTransporter();
  await t.sendMail({
    from: FROM,
    to: email,
    subject: 'Welcome to NovAura 🌌',
    html: welcomeTemplate(displayName),
  });
}

export async function sendPasswordResetEmail(
  email: string,
  displayName: string,
  resetLink: string
): Promise<void> {
  const t = createTransporter();
  await t.sendMail({
    from: FROM,
    to: email,
    subject: 'Reset Your NovAura Password',
    html: passwordResetTemplate(displayName, resetLink),
  });
}

export async function sendTestEmail(to: string): Promise<void> {
  const t = createTransporter();
  await t.sendMail({
    from: FROM,
    to,
    subject: 'NovAura SMTP Test ✓',
    html: `<div style="background:#0a0a14;color:#e2e8f0;padding:32px;font-family:sans-serif;border-radius:12px;border:1px solid #2a2a4a;">
      <h2 style="color:#c4b5fd;margin:0 0 12px;">✓ SMTP Working</h2>
      <p style="margin:0;color:#94a3b8;">Name.com SMTP is configured correctly for NovAura.</p>
    </div>`,
  });
}
