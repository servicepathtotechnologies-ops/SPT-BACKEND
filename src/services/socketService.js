/**
 * Socket.io service — real-time events for admin CRM.
 * Emit new_contact, new_demo, contact_status_updated, demo_status_updated.
 */
import { Server } from "socket.io";
import config from "../config/index.js";
import { logger } from "../utils/logger.js";

let io = null;

/**
 * Initialize Socket.io on the HTTP server. Call from server.js.
 * @param {import("http").Server} httpServer
 */
export function init(httpServer) {
  if (io) return io;

  const allowedOrigins = config.cors.allowedOrigins.length
    ? config.cors.allowedOrigins
    : ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"];

  io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return cb(null, true);
        cb(null, false);
      },
      methods: ["GET", "POST"],
    },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    logger.info("[Socket] Admin client connected", socket.id);
    socket.on("disconnect", () => {
      logger.info("[Socket] Admin client disconnected", socket.id);
    });
  });

  logger.info("[Socket] Server initialized");
  return io;
}

/**
 * @returns {Server | null}
 */
export function getIO() {
  return io;
}

/**
 * Emit new contact to all connected admin clients.
 * @param {object} contact — full contact row from DB
 */
export function emitNewContact(contact) {
  if (io) io.emit("new_contact", contact);
}

/**
 * Emit new demo to all connected admin clients.
 * @param {object} demo — full demo row from DB
 */
export function emitNewDemo(demo) {
  if (io) io.emit("new_demo", demo);
}

/**
 * Emit contact status updated (for live UI update).
 * @param {object} contact — updated contact row
 */
export function emitContactStatusUpdated(contact) {
  if (io) io.emit("contact_status_updated", contact);
}

/**
 * Emit demo status updated.
 * @param {object} demo — updated demo row
 */
export function emitDemoStatusUpdated(demo) {
  if (io) io.emit("demo_status_updated", demo);
}
