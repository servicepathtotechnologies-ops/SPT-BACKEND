/**
 * Reusable mail service — sends contact form notifications via Nodemailer.
 * Uses env vars for credentials. Fails silently so API is not broken if email fails.
 */
import nodemailer from "nodemailer";

/** Recipient for contact and demo notifications */
const NOTIFICATION_TO = "servicepathtotechnologies@gmail.com";

/**
 * Build HTML body for contact form notification.
 * @param {{ full_name: string, email: string, phone?: string | null, company?: string | null, message: string }} contact
 * @returns {string} HTML string
 */
function buildContactEmailHtml(contact) {
  const { full_name, email, phone, company, message } = contact;
  const optional = (label, value) =>
    value ? `<tr><td style="padding:8px 0;color:#64748b;">${label}</td><td style="padding:8px 0;">${escapeHtml(value)}</td></tr>` : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
</head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f1f5f9;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -2px rgba(0,0,0,0.1);">
    <div style="background:#0A0A0F;color:#fff;padding:20px 24px;">
      <h1 style="margin:0;font-size:20px;font-weight:600;">New Contact Form Submission</h1>
      <p style="margin:8px 0 0;font-size:14px;color:#94A3B8;">Service Path Technologies</p>
    </div>
    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#64748b;width:120px;">Name</td>
          <td style="padding:8px 0;font-weight:500;">${escapeHtml(full_name)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;">Email</td>
          <td style="padding:8px 0;"><a href="mailto:${escapeHtml(email)}" style="color:#6A5ACD;">${escapeHtml(email)}</a></td>
        </tr>
        ${optional("Phone", phone)}
        ${optional("Company", company)}
      </table>
      <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e2e8f0;">
        <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Message</p>
        <p style="margin:0;white-space:pre-wrap;line-height:1.6;">${escapeHtml(message)}</p>
      </div>
    </div>
    <div style="padding:12px 24px;background:#f8fafc;font-size:12px;color:#64748b;">
      Sent from your contact form API. Submission is also stored in the database.
    </div>
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(text) {
  if (text == null) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(text).replace(/[&<>"']/g, (c) => map[c]);
}

/**
 * Create transporter from env. Returns null if email is not configured (no throw).
 */
function createTransporter() {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  if (!user || !pass) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === "true",
    auth: { user, pass },
  });
}

/**
 * Send contact form notification to configured recipient.
 * Does not throw — logs errors so the API can still return success.
 * @param {{ full_name: string, email: string, phone?: string | null, company?: string | null, message: string }} contact
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function sendContactNotification(contact) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("Mail not configured (MAIL_USER/MAIL_PASS missing). Skipping contact notification.");
    return { sent: false, error: "Mail not configured" };
  }

  const fromAddress = process.env.MAIL_FROM || process.env.MAIL_USER;
  const fromName = process.env.MAIL_FROM_NAME || "Service Path Technologies (Contact Form)";

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: NOTIFICATION_TO,
      subject: `New contact: ${contact.full_name} (${contact.email})`,
      text: [
        `Name: ${contact.full_name}`,
        `Email: ${contact.email}`,
        contact.phone ? `Phone: ${contact.phone}` : "",
        contact.company ? `Company: ${contact.company}` : "",
        "",
        "Message:",
        contact.message,
      ]
        .filter(Boolean)
        .join("\n"),
      html: buildContactEmailHtml(contact),
    });
    return { sent: true };
  } catch (err) {
    console.error("Contact notification email failed:", err.message);
    return { sent: false, error: err.message };
  }
}

/** Demo notification recipient (same as contact) */
const DEMO_NOTIFICATION_TO = NOTIFICATION_TO;

/**
 * Build HTML for demo booking notification.
 * @param {{ full_name: string, email: string, company?: string | null, demo_date: Date, service?: string | null, notes?: string | null }} demo
 * @returns {string}
 */
function buildDemoEmailHtml(demo) {
  const optional = (label, value) =>
    value ? `<tr><td style="padding:8px 0;color:#64748b;">${label}</td><td style="padding:8px 0;">${escapeHtml(value)}</td></tr>` : "";
  const dateStr = demo.demo_date instanceof Date ? demo.demo_date.toLocaleString() : String(demo.demo_date);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Demo Booking</title>
</head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f1f5f9;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -2px rgba(0,0,0,0.1);">
    <div style="background:#0A0A0F;color:#fff;padding:20px 24px;">
      <h1 style="margin:0;font-size:20px;font-weight:600;">New Demo Booking</h1>
      <p style="margin:8px 0 0;font-size:14px;color:#94A3B8;">Service Path Technologies</p>
    </div>
    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#64748b;width:120px;">Name</td>
          <td style="padding:8px 0;font-weight:500;">${escapeHtml(demo.full_name)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;">Email</td>
          <td style="padding:8px 0;"><a href="mailto:${escapeHtml(demo.email)}" style="color:#6A5ACD;">${escapeHtml(demo.email)}</a></td>
        </tr>
        ${optional("Company", demo.company)}
        <tr>
          <td style="padding:8px 0;color:#64748b;">Demo date</td>
          <td style="padding:8px 0;">${escapeHtml(dateStr)}</td>
        </tr>
        ${optional("Service", demo.service)}
      </table>
      ${demo.notes ? `<div style="margin-top:20px;padding-top:20px;border-top:1px solid #e2e8f0;"><p style="margin:0 0 8px;color:#64748b;font-size:14px;">Notes</p><p style="margin:0;white-space:pre-wrap;line-height:1.6;">${escapeHtml(demo.notes)}</p></div>` : ""}
    </div>
    <div style="padding:12px 24px;background:#f8fafc;font-size:12px;color:#64748b;">
      Demo booking is stored in the database.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send demo booking notification to configured recipient.
 * @param {{ full_name: string, email: string, company?: string | null, demo_date: Date, service?: string | null, notes?: string | null }} demo
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function sendDemoNotification(demo) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("Mail not configured. Skipping demo notification.");
    return { sent: false, error: "Mail not configured" };
  }

  const fromAddress = process.env.MAIL_FROM || process.env.MAIL_USER;
  const fromName = process.env.MAIL_FROM_NAME || "Service Path Technologies (Book a Demo)";
  const dateStr = demo.demo_date instanceof Date ? demo.demo_date.toLocaleString() : String(demo.demo_date);

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: DEMO_NOTIFICATION_TO,
      subject: `Booked a demo: ${demo.full_name} — ${dateStr}`,
      text: [
        `Name: ${demo.full_name}`,
        `Email: ${demo.email}`,
        demo.company ? `Company: ${demo.company}` : "",
        `Demo date: ${dateStr}`,
        demo.service ? `Service: ${demo.service}` : "",
        demo.notes ? `Notes: ${demo.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      html: buildDemoEmailHtml(demo),
    });
    return { sent: true };
  } catch (err) {
    console.error("Demo notification email failed:", err.message);
    return { sent: false, error: err.message };
  }
}
