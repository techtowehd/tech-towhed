"use strict";
/** Public contact form → stored as an inquiry for the admin dashboard. */
const express = require("express");
const rateLimit = require("express-rate-limit");
const { db } = require("../db");

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many messages. Please try again later." },
});

function isEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

router.post("/", contactLimiter, (req, res) => {
  const { name, email, service, budget, message, website } = req.body || {};
  // Honeypot: bots fill this hidden field; humans never see it.
  if (website) return res.json({ ok: true });
  if (!name || String(name).trim().length < 2) return res.status(400).json({ error: "Please enter your name." });
  if (!isEmail(email)) return res.status(400).json({ error: "Please enter a valid email address." });
  if (!message || String(message).trim().length < 10)
    return res.status(400).json({ error: "Please write a message of at least 10 characters." });
  if (String(name).length > 120 || String(message).length > 5000)
    return res.status(400).json({ error: "Input is too long." });

  db.prepare(
    "INSERT INTO inquiries (name, email, service, budget, message) VALUES (?, ?, ?, ?, ?)"
  ).run(
    String(name).trim().slice(0, 120),
    String(email).trim().slice(0, 160),
    String(service || "").slice(0, 120),
    String(budget || "").slice(0, 120),
    String(message).trim().slice(0, 5000)
  );
  res.json({ ok: true, message: "Thanks — your message has been received. I'll get back to you soon." });
});

module.exports = router;
