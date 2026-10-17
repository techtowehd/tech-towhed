"use strict";
/**
 * Protected admin API: full CRUD for all site content, settings,
 * inquiries, media uploads, and account management.
 * Every route here sits behind requireAuth (wired in index.js).
 */
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const { db, allSettings, setSetting, uniqueSlug } = require("../db");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "..", "public", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safe || "file"}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|gif|webp|svg\+xml)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files (PNG, JPG, GIF, WebP, SVG) are allowed."));
  },
});

// ---------- helpers ----------
function toBool(v) {
  return v === true || v === 1 || v === "1" || v === "true" ? 1 : 0;
}
function str(v, max = 2000) {
  return String(v ?? "").slice(0, max);
}
function featuresToJson(v) {
  let arr = [];
  if (Array.isArray(v)) arr = v;
  else if (typeof v === "string") arr = v.split("\n").map((s) => s.trim()).filter(Boolean);
  return JSON.stringify(arr.map((s) => String(s).slice(0, 200)).slice(0, 30));
}
function parseFeatures(row) {
  try {
    const f = JSON.parse(row.features || "[]");
    return Array.isArray(f) ? f : [];
  } catch {
    return [];
  }
}
function now() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

// Generic CRUD factory for simple content tables.
function crud(table, fields, opts = {}) {
  const base = express.Router();

  base.get("/", (req, res) => {
    const rows = db
      .prepare(`SELECT * FROM ${table} ORDER BY sort_order ASC, id ASC`)
      .all()
      .map((r) => (fields.includes("features") ? { ...r, features: parseFeatures(r) } : r));
    res.json({ items: rows });
  });

  base.get("/:id", (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: "Not found." });
    res.json({ item: fields.includes("features") ? { ...row, features: parseFeatures(row) } : row });
  });

  base.post("/", (req, res) => {
    const b = req.body || {};
    if (!b.title || !String(b.title).trim())
      return res.status(400).json({ error: "Title is required." });
    const slug = uniqueSlug(table, b.slug || b.title);
    const cols = ["title", "slug"];
    const vals = [str(b.title, 160), slug];
    for (const f of fields) {
      cols.push(f);
      if (f === "features") vals.push(featuresToJson(b.features));
      else if (f === "is_visible" || f === "is_sample") vals.push(toBool(b[f] ?? (f === "is_visible" ? 1 : 0)));
      else if (f === "sort_order" || f === "rating") vals.push(Number(b[f]) || 0);
      else vals.push(str(b[f]));
    }
    const placeholders = cols.map(() => "?").join(", ");
    const info = db
      .prepare(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`)
      .run(...vals);
    res.status(201).json({ ok: true, id: Number(info.lastInsertRowid) });
  });

  base.put("/:id", (req, res) => {
    const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Not found." });
    const b = req.body || {};
    const sets = [];
    const vals = [];
    if (b.title !== undefined) {
      if (!String(b.title).trim()) return res.status(400).json({ error: "Title is required." });
      sets.push("title = ?");
      vals.push(str(b.title, 160));
      sets.push("slug = ?");
      vals.push(uniqueSlug(table, b.slug || b.title, existing.id));
    }
    for (const f of fields) {
      if (b[f] === undefined) continue;
      sets.push(`${f} = ?`);
      if (f === "features") vals.push(featuresToJson(b.features));
      else if (f === "is_visible" || f === "is_sample") vals.push(toBool(b[f]));
      else if (f === "sort_order" || f === "rating") vals.push(Number(b[f]) || 0);
      else vals.push(str(b[f]));
    }
    if (opts.touchUpdated) {
      sets.push("updated_at = ?");
      vals.push(now());
    }
    if (!sets.length) return res.json({ ok: true });
    vals.push(req.params.id);
    db.prepare(`UPDATE ${table} SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
    res.json({ ok: true });
  });

  base.delete("/:id", (req, res) => {
    const info = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    if (!info.changes) return res.status(404).json({ error: "Not found." });
    res.json({ ok: true });
  });

  return base;
}

router.use("/services", crud("services",
  ["description", "icon", "features", "price_label", "cta_label", "sort_order", "is_visible"],
  { touchUpdated: true }));
router.use("/projects", crud("projects",
  ["category", "client", "description", "results", "thumbnail", "project_url", "project_date", "sort_order", "is_visible", "is_sample"],
  { touchUpdated: true }));
router.use("/testimonials", crud("testimonials",
  ["role", "company", "avatar", "quote", "rating", "sort_order", "is_visible"]));
router.use("/case-studies", crud("case_studies",
  ["category", "client", "summary", "challenge", "approach", "outcome", "image", "sort_order", "is_visible"],
  { touchUpdated: true }));

// ---------- settings ----------
router.get("/settings", (req, res) => {
  res.json({ settings: allSettings() });
});
router.put("/settings", (req, res) => {
  const b = req.body || {};
  if (typeof b !== "object" || Array.isArray(b))
    return res.status(400).json({ error: "Invalid settings payload." });
  const keys = Object.keys(b).slice(0, 100);
  for (const k of keys) {
    if (!/^[a-z0-9_]{1,60}$/.test(k)) continue;
    setSetting(k, str(b[k], 8000));
  }
  res.json({ ok: true, settings: allSettings() });
});

// ---------- inquiries ----------
router.get("/inquiries", (req, res) => {
  const items = db.prepare("SELECT * FROM inquiries ORDER BY id DESC LIMIT 500").all();
  const unread = db.prepare("SELECT COUNT(*) AS c FROM inquiries WHERE is_read = 0").get().c;
  res.json({ items, unread });
});
router.patch("/inquiries/:id", (req, res) => {
  const b = req.body || {};
  const sets = [];
  const vals = [];
  if (b.is_read !== undefined) { sets.push("is_read = ?"); vals.push(toBool(b.is_read)); }
  if (!sets.length) return res.json({ ok: true });
  vals.push(req.params.id);
  const info = db.prepare(`UPDATE inquiries SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  if (!info.changes) return res.status(404).json({ error: "Not found." });
  res.json({ ok: true });
});
router.delete("/inquiries/:id", (req, res) => {
  const info = db.prepare("DELETE FROM inquiries WHERE id = ?").run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: "Not found." });
  res.json({ ok: true });
});

// ---------- media ----------
router.get("/media", (req, res) => {
  res.json({ items: db.prepare("SELECT * FROM media ORDER BY id DESC LIMIT 200").all() });
});
router.post("/media", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  const info = db
    .prepare("INSERT INTO media (filename, original_name, mime, size) VALUES (?, ?, ?, ?)")
    .run(req.file.filename, req.file.originalname.slice(0, 160), req.file.mimetype, req.file.size);
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({ ok: true, id: Number(info.lastInsertRowid), url });
});
router.delete("/media/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM media WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found." });
  try { fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(row.filename))); } catch {}
  db.prepare("DELETE FROM media WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ---------- account ----------
router.put("/account/password", (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: "Current and new passwords are required." });
  if (String(newPassword).length < 8)
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  const bcryptjs = require("bcryptjs");
  if (!bcryptjs.compareSync(String(currentPassword), user.password_hash))
    return res.status(401).json({ error: "Current password is incorrect." });
  const hash = bcryptjs.hashSync(String(newPassword), 12);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, req.user.id);
  res.json({ ok: true, message: "Password updated." });
});

// ---------- overview ----------
router.get("/overview", (req, res) => {
  const q = (sql) => db.prepare(sql).get().c;
  res.json({
    counts: {
      services: q("SELECT COUNT(*) AS c FROM services"),
      projects: q("SELECT COUNT(*) AS c FROM projects WHERE is_sample = 0"),
      testimonials: q("SELECT COUNT(*) AS c FROM testimonials"),
      caseStudies: q("SELECT COUNT(*) AS c FROM case_studies"),
      inquiries: q("SELECT COUNT(*) AS c FROM inquiries"),
      unread: q("SELECT COUNT(*) AS c FROM inquiries WHERE is_read = 0"),
      media: q("SELECT COUNT(*) AS c FROM media"),
    },
    recentInquiries: db.prepare("SELECT * FROM inquiries ORDER BY id DESC LIMIT 5").all(),
  });
});

module.exports = router;
