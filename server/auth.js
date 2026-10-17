"use strict";
/**
 * JWT authentication: httpOnly cookie sessions for the admin dashboard.
 */
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { db } = require("./db");

const COOKIE_NAME = "tt_token";
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-me-in-production";
const JWT_TTL = "12h";

if (!process.env.JWT_SECRET) {
  console.warn("[auth] WARNING: JWT_SECRET is not set — using an insecure dev default. Set JWT_SECRET in production.");
}

function signToken(user) {
  return jwt.sign({ uid: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_TTL });
}

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Not authenticated." });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare("SELECT id, username, created_at FROM users WHERE id = ?").get(payload.uid);
    if (!user) return res.status(401).json({ error: "Session invalid." });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
}

function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: String(process.env.COOKIE_SECURE || "false").toLowerCase() === "true",
    maxAge: 12 * 60 * 60 * 1000,
    path: "/",
  };
}

module.exports = { COOKIE_NAME, signToken, requireAuth, verifyPassword, cookieOptions };
