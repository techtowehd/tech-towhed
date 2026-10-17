# Deploying Tech Towhed — go live with a custom domain

You have three good options. **Option A (Render)** is the easiest: free, and the included
`render.yaml` blueprint does almost everything for you.

---

## Option A — Render (recommended, free)

1. **Put the code on GitHub**
   - Create a free GitHub account (if you don't have one).
   - In `~/workspace/techtowhed`, run:
     ```bash
     git init && git add . && git commit -m "Tech Towhed v1"
     ```
   - Create a new empty repo on github.com, then:
     ```bash
     git remote add origin https://github.com/YOUR-USERNAME/tech-towhed.git
     git push -u origin main   # or master, match your branch name
     ```
   - Never commit your real `.env` — it's already in `.gitignore`.

2. **Create the Render service**
   - Sign up at render.com (free) → **New → Blueprint** → connect your GitHub repo.
   - Render reads `render.yaml` and creates the web service + a 1GB persistent disk
     (this is where your database and uploads live, so they survive restarts).
   - `JWT_SECRET` and `ADMIN_PASSWORD` are auto-generated. **Copy the generated
     `ADMIN_PASSWORD` from the Render dashboard** (Environment tab) — that's your first login.
   - Deploy. Your site will be live at `https://tech-towhed.onrender.com`.

3. **First login checklist** (at `https://YOUR-URL.onrender.com/admin`)
   - Log in with username `admin` + the generated password.
   - **Account → change your password immediately.**
   - Media Library → upload your profile photo; Site Content → paste its URL into "Profile photo".
   - Fill in contact email, WhatsApp, social links; delete/edit the sample projects.

4. **Custom domain** (e.g. `techtowhed.com`)
   - Buy the domain from Namecheap/Cloudflare (~$10–15/year).
   - In Render: service → **Settings → Custom Domains → Add** → enter your domain.
   - Render shows you DNS records to add. At your domain registrar, add:
     - `A` record for `@` → the IP Render gives you (root domain), **or**
     - `CNAME` for `www` → `tech-towhed.onrender.com` (simplest: use `www`).
   - Render provisions a free HTTPS certificate automatically (takes a few minutes).
   - Set env var `COOKIE_SECURE=true` in the Render dashboard and redeploy.

> Note: Render's free tier sleeps after inactivity — the first visit after a while
> takes ~30–60s to wake up. Paid ($7/mo) removes this.

---

## Option B — Railway (also easy, free credit)

1. Push the code to GitHub (same as above).
2. Sign up at railway.app → **New Project → Deploy from GitHub**.
3. Add variables: `JWT_SECRET` (long random string), `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `COOKIE_SECURE=true`.
4. Add a **Volume** mounted at `/app/data` (keeps the database between deploys).
5. Railway gives you a public URL; add your custom domain under **Settings → Domains**
   (add the CNAME they show at your registrar — free HTTPS included).

---

## Option C — Any VPS with Docker (most control)

```bash
# on the server
docker build -t techtowhed .
docker run -d --name techtowhed --restart always \
  -p 3000:3000 \
  -e JWT_SECRET="long-random-string" \
  -e ADMIN_USERNAME="admin" \
  -e ADMIN_PASSWORD="strong-password" \
  -e COOKIE_SECURE="true" \
  -v techtowhed-data:/app/data \
  techtowhed
```

Put it behind Caddy or Nginx for HTTPS, then point your domain's `A` record at the server IP.

---

## Environment variables

| Variable         | Required | Purpose                                              |
|------------------|----------|------------------------------------------------------|
| `PORT`           | No       | Port to listen on (default 3000; hosts set this)     |
| `JWT_SECRET`     | **Yes**  | Long random string signing admin sessions            |
| `ADMIN_USERNAME` | No       | First admin username (default `admin`)               |
| `ADMIN_PASSWORD` | **Yes**  | First admin password — change after first login      |
| `COOKIE_SECURE`  | Prod     | `true` when serving over HTTPS                       |

Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Backups

Your content lives in `data/techtowhed.db` (+ `public/uploads/`). Download a copy
monthly: on Render, use the **Shell** tab and `cat`/`download` the file, or add a
cron that copies it to external storage.
