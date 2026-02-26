/**
 * Demo service — business logic for demo/booking submissions.
 * Orchestrates repository, spam check, email notification, and socket emit.
 */
import * as demoRepository from "../repositories/demoRepository.js";
import * as statusHistoryRepository from "../repositories/statusHistoryRepository.js";
import { sendDemoNotification } from "./mailService.js";
import { emitNewDemo } from "./socketService.js";
import { logger } from "../utils/logger.js";

const DUPLICATE_WINDOW_SEC = 60;

/**
 * Submit a demo booking: spam check, persist (default status Pending), send admin notification, emit new_demo.
 */
export async function submitDemo(data) {
  const demo = {
    full_name: (data.full_name || "").trim(),
    email: (data.email || "").trim().toLowerCase(),
    company: data.company?.trim() || null,
    demo_date: data.demo_date instanceof Date ? data.demo_date : new Date(data.demo_date),
    service: data.service?.trim() || null,
    notes: data.notes?.trim() || null,
  };

  const isDuplicate = await demoRepository.hasRecentByEmail(demo.email, DUPLICATE_WINDOW_SEC);
  if (isDuplicate) {
    const err = new Error("Please wait a moment before submitting again.");
    err.statusCode = 429;
    throw err;
  }

  const created = await demoRepository.create(demo);
  logger.info("[Demo] Booking saved", { email: demo.email });

  await statusHistoryRepository.create({
    entity_type: "demo",
    entity_id: created.id,
    old_status: null,
    new_status: "Pending",
    updated_by: null,
  });

  emitNewDemo(created);

  const emailResult = await sendDemoNotification(demo);
  if (emailResult.sent) logger.info("[Demo] Notification email sent");
  else if (emailResult.error && emailResult.error !== "Mail not configured")
    logger.error("[Demo] Email failed", { error: emailResult.error });
}
