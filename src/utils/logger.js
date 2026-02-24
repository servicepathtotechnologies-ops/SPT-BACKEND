/**
 * Simple logger — env-aware (no stack in production), consistent prefix.
 * Use instead of console.log/error in services and middleware.
 */
import config from "../config/index.js";

const { isProduction } = config;

const log = (level, ...args) => {
  const prefix = `[${level.toUpperCase()}]`;
  if (level === "error" && !isProduction && args[0]?.stack) {
    console.error(prefix, ...args);
  } else if (level === "error") {
    console.error(prefix, ...args.map((a) => (a instanceof Error ? a.message : a)));
  } else {
    console[level === "warn" ? "warn" : "log"](prefix, ...args);
  }
};

export const logger = {
  info: (...args) => log("info", ...args),
  warn: (...args) => log("warn", ...args),
  error: (...args) => log("error", ...args),
};
