"use strict";
/**
 * SQLite database layer (built-in node:sqlite — zero native dependencies).
 * Auto-creates schema, seeds the admin user + default content on first boot.
 */
const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");
const bcrypt = require("bcryptjs");

const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, "techtowhed.db"));
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'spark',
  features TEXT NOT NULL DEFAULT '[]',
  price_label TEXT NOT NULL DEFAULT '',
  cta_label TEXT NOT NULL DEFAULT 'Get This Service',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'Digital Marketing',
  client TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  results TEXT NOT NULL DEFAULT '',
  thumbnail TEXT NOT NULL DEFAULT '',
  project_url TEXT NOT NULL DEFAULT '',
  project_date TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  is_sample INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  avatar TEXT NOT NULL DEFAULT '',
  quote TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 5,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS case_studies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'Digital Marketing',
  client TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  challenge TEXT NOT NULL DEFAULT '',
  approach TEXT NOT NULL DEFAULT '',
  outcome TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  service TEXT NOT NULL DEFAULT '',
  budget TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL DEFAULT '',
  mime TEXT NOT NULL DEFAULT '',
  size INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
db.exec(SCHEMA);

function getSetting(key, fallback = "") {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? row.value : fallback;
}
function setSetting(key, value) {
  db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(key, String(value ?? ""));
}
function allSettings() {
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

// ---------- Seed: admin user ----------
(function seedAdmin() {
  const count = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
  if (count > 0) return;
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "changeme123";
  const hash = bcrypt.hashSync(password, 12);
  db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(username, hash);
  console.log(`[db] Seeded admin user "${username}". Change the password after first login.`);
})();

// ---------- Seed: default settings (honest placeholders — no invented stats) ----------
const DEFAULT_SETTINGS = {
  brand_name: "Tech Towhed",
  brand_tagline: "Digital Marketing & YouTube Growth",
  hero_badge: "Digital Marketing Specialist",
  hero_title: "Grow Your Digital Presence.\nTurn Attention Into Results.",
  hero_sub:
    "I help creators, businesses, and brands grow through strategic YouTube SEO, monetization optimization, Facebook Ads, and Google Ads campaigns.",
  hero_primary_cta: "Let's Grow Together",
  hero_secondary_cta: "Explore My Work",
  hero_trust: "Strategy-driven marketing. Data-informed decisions. Sustainable growth.",
  about_title: "Meet the Mind Behind Tech Towhed",
  about_bio:
    "I'm Towhed, a digital marketing specialist focused on YouTube growth and paid advertising. I work with creators and businesses who want sustainable, data-informed growth — not shortcuts.",
  about_philosophy:
    "Every channel and every campaign is different. I start with research, build a clear strategy, and optimize based on what the data actually says.",
  about_mission: "To help creators and brands turn attention into measurable, sustainable results.",
  about_image: "",
  years_experience: "",
  contact_email: "",
  contact_whatsapp: "",
  social_facebook: "",
  social_youtube: "",
  social_linkedin: "",
  social_instagram: "",
  social_x: "",
  footer_note: "© Tech Towhed. Built with strategy, data, and care.",
  stats_projects: "",
  stats_clients: "",
  stats_niches: "",
};
(function seedSettings() {
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
    if (getSetting(k, null) === null) setSetting(k, v);
  }
})();

// ---------- Seed: default services (from the brand spec) ----------
const DEFAULT_SERVICES = [
  {
    title: "YouTube SEO",
    slug: "youtube-seo",
    description:
      "Optimize videos and channels through keyword research, metadata optimization, content positioning, and discoverability improvements.",
    icon: "search",
    features: ["Keyword research", "Video title optimization", "Description optimization", "Tag and metadata strategy", "Competitor research", "Content optimization recommendations"],
    price_label: "",
  },
  {
    title: "YouTube Monetization Assistance",
    slug: "youtube-monetization",
    description:
      "Help eligible creators understand monetization requirements and improve channel readiness through policy-aware optimization.",
    icon: "badge",
    features: ["Monetization eligibility review", "Channel audit", "Content policy guidance", "Monetization readiness checklist", "Content strategy recommendations"],
    price_label: "",
  },
  {
    title: "Facebook Ads",
    slug: "facebook-ads",
    description: "Create and optimize targeted advertising campaigns designed around business objectives.",
    icon: "target",
    features: ["Campaign strategy", "Audience research", "Campaign setup", "Creative testing", "Conversion tracking guidance", "Performance optimization"],
    price_label: "",
  },
  {
    title: "Google Ads",
    slug: "google-ads",
    description: "Develop search and other suitable Google advertising campaigns aligned with business goals.",
    icon: "chart",
    features: ["Keyword planning", "Search campaign setup", "Ad copy optimization", "Conversion tracking guidance", "Budget optimization", "Campaign reporting"],
    price_label: "",
  },
  {
    title: "YouTube Channel Growth",
    slug: "youtube-growth",
    description: "A complete growth system for channels: audits, strategy, and ongoing optimization.",
    icon: "rocket",
    features: ["Channel audits", "Audience research", "Content strategy", "CTR improvement recommendations", "Audience retention analysis", "Growth opportunity identification"],
    price_label: "",
  },
  {
    title: "Digital Marketing Consulting",
    slug: "marketing-consulting",
    description: "Strategic guidance for your full marketing picture — from audit to growth plan.",
    icon: "compass",
    features: ["Marketing audits", "Competitor analysis", "Campaign strategy", "Marketing funnel recommendations", "Analytics review", "Growth planning"],
    price_label: "",
  },
];
(function seedServices() {
  const count = db.prepare("SELECT COUNT(*) AS c FROM services").get().c;
  if (count > 0) return;
  const stmt = db.prepare(
    "INSERT INTO services (title, slug, description, icon, features, price_label, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  DEFAULT_SERVICES.forEach((s, i) =>
    stmt.run(s.title, s.slug, s.description, s.icon, JSON.stringify(s.features), s.price_label, i)
  );
  console.log("[db] Seeded 6 default services.");
})();

// ---------- Seed: sample projects (hidden from public, visible in admin as editable samples) ----------
(function seedSamples() {
  const count = db.prepare("SELECT COUNT(*) AS c FROM projects").get().c;
  if (count > 0) return;
  const stmt = db.prepare(
    "INSERT INTO projects (title, slug, category, client, description, results, sort_order, is_sample) VALUES (?, ?, ?, ?, ?, ?, ?, 1)"
  );
  stmt.run(
    "Sample: Fitness Channel SEO Overhaul",
    "sample-fitness-seo",
    "YouTube SEO",
    "Sample Client",
    "A sample project showing how a portfolio card looks. Replace it with your own real work from the admin panel.",
    "Replace with real, verifiable outcomes.",
    0
  );
  stmt.run(
    "Sample: E-commerce Facebook Ads",
    "sample-ecom-fb-ads",
    "Facebook Ads",
    "Sample Client",
    "A sample project showing how a portfolio card looks. Replace it with your own real work from the admin panel.",
    "Replace with real, verifiable outcomes.",
    1
  );
  console.log("[db] Seeded 2 sample projects (hidden from public site).");
})();

function slugify(text) {
  return (
    String(text || "item")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "item"
  );
}
function uniqueSlug(table, base, excludeId) {
  let slug = slugify(base);
  let n = 2;
  while (true) {
    const row = excludeId
      ? db.prepare(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`).get(slug, excludeId)
      : db.prepare(`SELECT id FROM ${table} WHERE slug = ?`).get(slug);
    if (!row) return slug;
    slug = `${slugify(base)}-${n++}`;
  }
}

module.exports = { db, getSetting, setSetting, allSettings, slugify, uniqueSlug };
