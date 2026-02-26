/**
 * Contact service — business logic for contact submissions.
 * Orchestrates repository, spam check, email notification, and socket emit.
 */
import * as contactRepository from "../repositories/contactRepository.js";
import * as statusHistoryRepository from "../repositories/statusHistoryRepository.js";
import { sendContactNotification } from "./mailService.js";
import { emitNewContact } from "./socketService.js";
import { logger } from "../utils/logger.js";

const DUPLICATE_WINDOW_SEC = 60;

/**
 * Submit a contact form: spam check, persist (default status Pending), send admin notification, emit new_contact.
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

  const created = await contactRepository.create(contact);
  logger.info("[Contact] Submission saved", { email: contact.email });

  await statusHistoryRepository.create({
    entity_type: "contact",
    entity_id: created.id,
    old_status: null,
    new_status: "Pending",
    updated_by: null,
  });

  emitNewContact(created);

  const isRender = process.env.RENDER === "true";
  if (isRender) {
    const emailResult = await sendContactNotification(contact);
    if (emailResult.sent) logger.info("[Contact] Notification email sent");
    else if (emailResult.error && emailResult.error !== "Mail not configured")
      logger.error("[Contact] Email failed", { error: emailResult.error });
  } else {
    setImmediate(() => {
      sendContactNotification(contact)
        .then((r) => {
          if (r.sent) logger.info("[Contact] Notification email sent");
          else if (r.error && r.error !== "Mail not configured") logger.error("[Contact] Email failed", { error: r.error });
        })
        .catch((err) => logger.error("[Contact] Notification error", { error: err.message }));
    });
  }
}
