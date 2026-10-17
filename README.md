# Tech Towhed — Portfolio & Agency Website

A premium, production-ready personal portfolio and digital marketing agency website with a **secure admin dashboard**, **persistent database**, and **full CRUD content management** — no page-builder, no monthly SaaS fees.

**Live pages:** public portfolio site · **`/admin`** — private dashboard (login required)

## ✨ What's included

**Public website** (Apple/visionOS-inspired, dark-first glassmorphism)
- Floating glass navbar with theme toggle (dark/light), mobile menu, scroll-spy
- Animated hero with growth-dashboard visual, floating service cards, ambient particles
- About, Services (6, fully editable), filterable Portfolio, Case Studies, Testimonials carousel, Contact form, footer
- All text, images, prices, and visibility toggles editable from the admin panel — no code changes needed
- Skeleton loaders, custom empty states, honest placeholders (no invented stats anywhere)

**Admin dashboard** (`/admin`)
- Secure login (bcrypt-hashed passwords, JWT httpOnly cookie sessions, rate-limited)
- Overview with counts + unread inquiry badge
- Site Content editor (brand, hero, about, stats, contact, socials)
- Full CRUD: Services, Portfolio projects, Case Studies, Testimonials
- Inquiries inbox (contact-form messages, mark read/delete)
- Media Library (image uploads → instant URLs for content)
- Account: change password

**Backend**
- Node.js + Express, SQLite (built-in `node:sqlite` — zero native dependencies)
- REST API: public content + contact endpoints, protected admin endpoints
- Security: helmet headers + CSP, rate limiting, honeypot anti-spam, input validation

## 🚀 Quick start (local)

```bash
cd techtowhed
npm install
cp .env.example .env   # then edit: JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD
npm start
```

- Website: http://localhost:3000
- Admin: http://localhost:3000/admin (log in, then **change your password** immediately)

First boot seeds the database (`data/techtowhed.db`) with the admin user, 6 services, and site defaults. Two clearly-labeled **sample projects** exist in the admin (hidden from the public site) — edit or delete them.

## 📁 Project structure

```
techtowhed/
├── server/
│   ├── index.js          # Express app, security middleware, static serving
│   ├── db.js             # SQLite schema, seeds, settings helpers
│   ├── auth.js           # JWT session helpers
│   └── routes/
│       ├── public.js     # GET /api/health, /api/content
│       ├── auth.js       # login / logout / me
│       ├── contact.js    # contact form → inquiries
│       └── admin.js      # protected CRUD, settings, media, account
├── public/
│   ├── index.html        # public website
│   ├── admin.html        # dashboard shell
│   ├── css/style.css     # design system
│   ├── css/admin.css     # dashboard styles
│   ├── js/main.js        # public site logic
│   ├── js/admin.js       # dashboard logic
│   └── uploads/          # user-uploaded images (gitignored)
├── data/                 # SQLite database (gitignored, created on boot)
├── Dockerfile            # production container
├── render.yaml           # one-click Render blueprint (free tier)
├── DEPLOY.md             # step-by-step deployment + custom domain guide
└── .env.example
```

## 🔐 Security notes

- Change `ADMIN_USERNAME`/`ADMIN_PASSWORD` and set a long random `JWT_SECRET` before deploying.
- In production behind HTTPS, set `COOKIE_SECURE=true`.
- `/admin` sends `noindex` and the API is same-origin; keep the server behind HTTPS.
- Back up `data/techtowhed.db` regularly (Render disk persists it; download copies periodically).

## 🛠 Tech stack

Vanilla HTML/CSS/JS frontend (no build step) · Node 24 · Express · SQLite · JWT · bcrypt · multer · helmet
