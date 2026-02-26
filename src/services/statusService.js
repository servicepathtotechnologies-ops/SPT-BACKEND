/**
 * Status change service — log history and send thank-you email when Pending → Contacted.
 */
import * as statusHistoryRepository from "../repositories/statusHistoryRepository.js";
import { sendThankYouContacted } from "./emailService.js";
import { logger } from "../utils/logger.js";

/**
 * Called after a contact or demo status is updated in DB.
 * Logs to status_history and sends thank-you email when Pending → Contacted.
 * @param {'contact'|'demo'} entityType
 * @param {string} entityId
 * @param {string|null} oldStatus
 * @param {string} newStatus
 * @param {string|null} updatedBy — admin user id
 * @param {{ email?: string, full_name?: string }} entity — for email (contact/demo row)
 */
export async function afterStatusChange(entityType, entityId, oldStatus, newStatus, updatedBy, entity = {}) {
  await statusHistoryRepository.create({
    entity_type: entityType,
    entity_id: entityId,
    old_status: oldStatus,
    new_status: newStatus,
    updated_by: updatedBy,
  });

  if (oldStatus === "Pending" && newStatus === "Contacted" && entity.email) {
    const result = await sendThankYouContacted({
      email: entity.email,
      full_name: entity.full_name,
    });
    if (result.sent) {
      logger.info("[Status] Thank-you email sent to contact", { email: entity.email });
    } else if (result.error && result.error !== "Mail not configured") {
      logger.error("[Status] Thank-you email failed", { error: result.error });
    }
  }
}
