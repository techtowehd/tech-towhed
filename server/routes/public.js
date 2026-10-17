"use strict";
/** Public, unauthenticated read API for the website frontend. */
const express = require("express");
const { db, allSettings } = require("../db");

const router = express.Router();

function parseFeatures(row) {
  try {
    const f = JSON.parse(row.features || "[]");
    return Array.isArray(f) ? f : [];
  } catch {
    return [];
  }
}

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "tech-towhed", time: new Date().toISOString() });
});

// One call that powers the whole public site.
router.get("/content", (req, res) => {
  const settings = allSettings();
  const services = db
    .prepare("SELECT id, title, slug, description, icon, features, price_label, cta_label, sort_order FROM services WHERE is_visible = 1 ORDER BY sort_order ASC, id ASC")
    .all()
    .map((s) => ({ ...s, features: parseFeatures(s) }));
  const projects = db
    .prepare("SELECT id, title, slug, category, client, description, results, thumbnail, project_url, project_date, sort_order FROM projects WHERE is_visible = 1 AND is_sample = 0 ORDER BY sort_order ASC, id ASC")
    .all();
  const testimonials = db
    .prepare("SELECT id, name, role, company, avatar, quote, rating, sort_order FROM testimonials WHERE is_visible = 1 ORDER BY sort_order ASC, id ASC")
    .all();
  const caseStudies = db
    .prepare("SELECT id, title, slug, category, client, summary, challenge, approach, outcome, image, sort_order FROM case_studies WHERE is_visible = 1 ORDER BY sort_order ASC, id ASC")
    .all();
  const categories = db
    .prepare("SELECT DISTINCT category FROM projects WHERE is_visible = 1 AND is_sample = 0 ORDER BY category ASC")
    .all()
    .map((r) => r.category);
  res.json({ settings, services, projects, testimonials, caseStudies, categories });
});

module.exports = router;
