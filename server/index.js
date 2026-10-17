"use strict";
require("dotenv").config();

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const { requireAuth } = require("./auth");
const publicRoutes = require("./routes/public");
const authRoutes = require("./routes/auth");
const contactRoutes = require("./routes/contact");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // theme vars set via inline style attr
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Stricter rate limit on login attempts.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

app.use("/api", publicRoutes);
app.use("/api/auth", loginLimiter, authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", requireAuth, adminRoutes);

app.get("/api/*", (req, res) => res.status(404).json({ error: "Not found." }));

// Static frontend
const PUBLIC_DIR = path.join(__dirname, "..", "public");
app.use(express.static(PUBLIC_DIR, { extensions: ["html"] }));

// Friendly URLs
app.get("/admin", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "admin.html")));

app.listen(PORT, () => {
  console.log(`[tech-towhed] Listening on http://localhost:${PORT}`);
  console.log(`[tech-towhed] Admin dashboard: http://localhost:${PORT}/admin`);
});
