/**
 * Contact service — business logic for contact submissions.
 * Orchestrates repository, spam check, and email notification.
 */
import * as contactRepository from "../repositories/contactRepository.js";
import { sendContactNotification } from "./mailService.js";
import { logger } from "../utils/logger.js";

const DUPLICATE_WINDOW_SEC = 60;

/**
 * Submit a contact form: spam check, persist, send email (non-blocking).
 * @param {{ full_name: string, email: string, phone?: string | null, company?: string | null, message: string }} data
 * @throws if duplicate within window (caller should respond 429)
 */
export async function submitContact(data) {
  const contact = {
    full_name: (data.full_name || "").trim(),
    email: (data.email || "").trim().toLowerCase(),
    phone: data.phone?.trim() || null,
    company: data.company?.trim() || null,
    message: (data.message || "").trim(),
  };

  const isDuplicate = await contactRepository.hasRecentByEmail(contact.email, DUPLICATE_WINDOW_SEC);
  if (isDuplicate) {
    const err = new Error("Please wait a moment before submitting again.");
    err.statusCode = 429;
    throw err;
  }

  await contactRepository.create(contact);
  logger.info("[Contact] Submission saved", { email: contact.email });

  // On Render, await email so it completes before the process can spin down (free tier).
  // Locally, send in background for a fast response.
  const isRender = process.env.RENDER === "true";

  if (isRender) {
    const emailResult = await sendContactNotification(contact);
    if (emailResult.sent) {
      logger.info("[Contact] Notification email sent");
    } else if (emailResult.error && emailResult.error !== "Mail not configured") {
      logger.error("[Contact] Email failed", { error: emailResult.error });
    } else if (emailResult.error === "Mail not configured") {
      logger.warn("[Contact] Mail not configured (MAIL_USER/MAIL_PASS). Skipping email.");
    }
  } else {
    setImmediate(() => {
      sendContactNotification(contact)
        .then((emailResult) => {
          if (emailResult.sent) {
            logger.info("[Contact] Notification email sent");
          } else if (emailResult.error && emailResult.error !== "Mail not configured") {
            logger.error("[Contact] Email failed", { error: emailResult.error });
          } else if (emailResult.error === "Mail not configured") {
            logger.warn("[Contact] Mail not configured (MAIL_USER/MAIL_PASS). Skipping email.");
          }
        })
        .catch((err) => logger.error("[Contact] Notification error", { error: err.message }));
    });
  }
}
