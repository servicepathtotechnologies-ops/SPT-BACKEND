/**
 * Demo service — business logic for demo/booking submissions.
 * Orchestrates repository, spam check, and email notification.
 */
import * as demoRepository from "../repositories/demoRepository.js";
import { sendDemoNotification } from "./mailService.js";
import { logger } from "../utils/logger.js";

const DUPLICATE_WINDOW_SEC = 60;

/**
 * Submit a demo booking: spam check, persist, send email (non-blocking).
 * @param {{ full_name: string, email: string, company?: string | null, demo_date: Date, service?: string | null, notes?: string | null }} data
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

  await demoRepository.create(demo);
  logger.info("[Demo] Booking saved", { email: demo.email });

  const emailResult = await sendDemoNotification(demo);
  if (emailResult.sent) {
    logger.info("[Demo] Notification email sent");
  } else if (emailResult.error && emailResult.error !== "Mail not configured") {
    logger.error("[Demo] Email failed", { error: emailResult.error });
  } else if (emailResult.error === "Mail not configured") {
    logger.warn("[Demo] Mail not configured. Skipping email.");
  }
}
