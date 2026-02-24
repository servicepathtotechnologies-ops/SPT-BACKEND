/**
 * Auth service — login and JWT generation.
 * Uses admin repository and config; no HTTP concerns.
 */
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as adminRepository from "../repositories/adminRepository.js";
import config from "../config/index.js";

const BCRYPT_ROUNDS = 12;

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, admin: { id: string, email: string } }>}
 * @throws if credentials invalid or JWT_SECRET missing (caller maps to 401/500)
 */
export async function login(email, password) {
  const secret = config.security.jwtSecret;
  if (!secret) {
    const err = new Error("Server configuration error.");
    err.statusCode = 500;
    throw err;
  }

  const admin = await adminRepository.findByEmail(email);
  if (!admin) {
    const err = new Error("Invalid email or password.");
    err.statusCode = 401;
    throw err;
  }

  const match = await bcrypt.compare(password, admin.password);
  if (!match) {
    const err = new Error("Invalid email or password.");
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign(
    { sub: admin.id, email: admin.email },
    secret,
    { expiresIn: config.security.jwtExpiresIn }
  );

  return {
    token,
    admin: { id: admin.id, email: admin.email },
  };
}

/**
 * For create-admin script.
 * @param {string} plainPassword
 * @returns {Promise<string>} bcrypt hash
 */
export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
}
