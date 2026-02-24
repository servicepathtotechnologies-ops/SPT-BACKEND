/**
 * One-time script to create the first admin user.
 * Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=yourpassword npm run create-admin
 * Do not commit credentials. Run once, then remove ADMIN_PASSWORD from .env.
 */
import "dotenv/config";
import * as adminRepository from "../src/repositories/adminRepository.js";
import { hashPassword } from "../src/services/authService.js";
import { pool } from "../src/config/db.js";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("Usage: ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=yourpassword npm run create-admin");
    process.exit(1);
  }

  try {
    const passwordHash = await hashPassword(password);
    const created = await adminRepository.create({ email, passwordHash });
    if (created) {
      console.log("Admin created:", created.email);
    } else {
      console.log("Admin already exists with this email. No change.");
    }
  } catch (err) {
    console.error("Error creating admin:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
