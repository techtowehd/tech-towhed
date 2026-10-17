"use strict";
/** Session auth: login / logout / me. Login is rate-limited in index.js. */
const express = require("express");
const { db } = require("../db");
const { signToken, requireAuth, verifyPassword, cookieOptions, COOKIE_NAME } = require("../auth");

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Username and password are required." });
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(String(username).trim());
  // Constant-time-ish: always compare to avoid user enumeration timing leaks.
  const hash = user ? user.password_hash : "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvali";
  const ok = user && verifyPassword(String(password), hash);
  if (!ok) return res.status(401).json({ error: "Invalid username or password." });
  const token = signToken(user);
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.json({ ok: true, user: { id: user.id, username: user.username } });
});

router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
