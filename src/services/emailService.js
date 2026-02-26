/**
 * Email service — client-facing emails (e.g. thank-you when marked as Contacted).
 * Uses Nodemailer and env MAIL_*.
 */
import nodemailer from "nodemailer";

function createTransporter() {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === "true",
    auth: { user, pass },
  });
}

/**
 * Send "Thank you for contacting us" when status changes to Contacted.
 * Subject: Thank you for contacting us
 * Body: Thank you for your response. Our team will contact you soon.
 * @param {{ email: string, full_name: string }}
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function sendThankYouContacted({ email, full_name }) {
  const transporter = createTransporter();
  if (!transporter) {
    return { sent: false, error: "Mail not configured" };
  }

  const fromAddress = process.env.MAIL_FROM || process.env.MAIL_USER;
  const fromName = process.env.MAIL_FROM_NAME || "Service Path Technologies";

  const to = email;
  const subject = "Thank you for contacting us";
  const text = `Hello ${full_name || "there"},\n\nThank you for your response. Our team will contact you soon.\n\nBest regards,\nService Path Technologies`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f1f5f9;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
    <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">Thank you for contacting us</h1>
    <p style="margin:0;line-height:1.6;color:#475569;">Hello ${(full_name || "there").replace(/</g, "&lt;")},</p>
    <p style="margin:16px 0 0;line-height:1.6;color:#475569;">Thank you for your response. Our team will contact you soon.</p>
    <p style="margin:24px 0 0;color:#64748b;font-size:14px;">Best regards,<br/>Service Path Technologies</p>
  </div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error("[EmailService] sendThankYouContacted failed:", err.message);
    return { sent: false, error: err.message };
  }
}
