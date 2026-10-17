/* Tech Towhed — public site logic */
"use strict";

/* ---------- tiny helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- icon library ---------- */
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  badge: '<path d="M12 2 4 6v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-4z"/><path d="m9 12 2 2 4-4"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>',
  rocket: '<path d="M12 2c4 2 6 6 6 10l3 3-4 1c-1 2-3 4-5 5-1-2-2-3-2-5l-3-1 2-3c0-4 1-8 3-10z"/><circle cx="12" cy="10" r="1.6"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2z"/>',
  spark: '<path d="M12 2v6m0 8v6M2 12h6m8 0h6M5 5l4 4m6 6 4 4M19 5l-4 4M9 15l-4 4"/>',
  check: '<path d="m4.5 12.5 5 5 10-11"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 6 9-6"/>',
  chat: '<path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z"/>',
  play: '<rect x="3" y="5" width="18" height="14" rx="4"/><path d="m10 9 5 3-5 3V9z"/>',
  brief: '<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="m5 19 5-5 3 3 3-3 3 3"/>',
};
const icon = (name, cls = "ic-purple") =>
  `<span class="ic ${cls}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.spark}</svg></span>`;
const IC_COLORS = ["ic-purple", "ic-cyan", "ic-green"];

/* ---------- theme ---------- */
(function theme() {
  const root = document.documentElement;
  const saved = localStorage.getItem("tt-theme");
  if (saved) root.setAttribute("data-theme", saved);
  const sync = () => {
    const dark = root.getAttribute("data-theme") !== "light";
    $("#iconMoon").style.display = dark ? "" : "none";
    $("#iconSun").style.display = dark ? "none" : "";
  };
  sync();
  $("#themeToggle").addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("tt-theme", next);
    sync();
  });
})();

/* ---------- header / nav ---------- */
const header = $("#siteHeader");
addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 24), { passive: true });

const mm = $("#mobileMenu");
$("#burger").addEventListener("click", () => mm.classList.add("open"));
$("#mmClose").addEventListener("click", () => mm.classList.remove("open"));
mm.addEventListener("click", (e) => { if (e.target === mm) mm.classList.remove("open"); });
$$(".mm-link", mm).forEach((a) => a.addEventListener("click", () => mm.classList.remove("open")));

// scroll-spy
const spySections = ["home", "about", "services", "portfolio", "cases", "testimonials", "contact"];
const navAs = $$("#navLinks a");
const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      navAs.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + id));
      $$(".mm-link", mm).forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + id));
    });
  },
  { rootMargin: "-40% 0px -55% 0px" }
);
spySections.forEach((id) => { const el = document.getElementById(id); if (el) spy.observe(el); });

// reveal on scroll
const revealer = new IntersectionObserver(
  (entries) => entries.forEach((en) => en.isIntersecting && en.target.classList.add("in")),
  { threshold: 0.12 }
);
$$(".reveal").forEach((el) => revealer.observe(el));

/* ---------- ambient particles ---------- */
(function particles() {
  const c = $("#bg-canvas"), ctx = c.getContext("2d");
  let W, H, pts = [];
  const resize = () => {
    W = c.width = innerWidth; H = c.height = innerHeight;
    pts = Array.from({ length: Math.min(70, W / 22) }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
      a: Math.random() * 0.5 + 0.15,
      hue: Math.random() > 0.5 ? "124,92,252" : "54,217,255",
    }));
  };
  resize(); addEventListener("resize", resize);
  (function tick() {
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7);
      ctx.fillStyle = `rgba(${p.hue},${p.a})`; ctx.fill();
    }
    requestAnimationFrame(tick);
  })();
})();

/* ---------- content rendering ---------- */
const emptyState = (title, sub) =>
  `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${ICONS.image}</svg><b>${esc(title)}</b><p>${esc(sub)}</p></div>`;

let ALL_PROJECTS = [];
let activeFilter = "All";

function renderSettings(s) {
  $("#brandName").textContent = s.brand_name || "Tech Towhed";
  $("#brandTagline").textContent = s.brand_tagline || "Digital Marketing";
  $("#footBrand").textContent = s.brand_name || "Tech Towhed";
  $("#heroBadge").textContent = s.hero_badge || "Digital Marketing Specialist";
  const title = (s.hero_title || "").split("\n");
  $("#heroTitle").innerHTML = esc(title[0] || "") + (title[1] ? `<br><span class="grad-text">${esc(title.slice(1).join(" "))}</span>` : "");
  $("#heroSub").textContent = s.hero_sub || "";
  $("#heroCta1").childNodes[0].textContent = (s.hero_primary_cta || "Let's Grow Together") + " ";
  $("#heroCta2").textContent = s.hero_secondary_cta || "Explore My Work";
  $("#heroTrust").textContent = s.hero_trust || "";
  $("#aboutTitle").textContent = s.about_title || "";
  $("#aboutBio").textContent = s.about_bio || "";
  $("#aboutPhilosophy").textContent = s.about_philosophy || "";
  $("#aboutMission").textContent = s.about_mission || "";
  $("#footNote").textContent = s.footer_note || "";
  if (s.about_image) {
    $("#aboutPhotoPlaceholder").style.display = "none";
    let img = $("#aboutPhotoImg");
    if (!img) { img = document.createElement("img"); img.id = "aboutPhotoImg"; img.alt = "Portrait"; $("#aboutPhoto").prepend(img); }
    img.src = s.about_image;
  }
  // stats (only render values that exist — never invent)
  const stats = [
    [s.stats_projects, "Projects"],
    [s.stats_clients, "Happy clients"],
    [s.stats_niches, "Niches served"],
    [s.years_experience, "Years experience"],
  ].filter(([v]) => v && String(v).trim());
  $("#statsRow").innerHTML = stats.map(([v, l]) => `<div class="stat-pill"><b>${esc(v)}</b><small>${esc(l)}</small></div>`).join("");
  // contact info
  const rows = [];
  if (s.contact_email) rows.push(`<a class="info-row" href="mailto:${esc(s.contact_email)}"><span class="ic ic-purple"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${ICONS.mail}</svg></span><span><b>Email</b><small>${esc(s.contact_email)}</small></span></a>`);
  if (s.contact_whatsapp) {
    const wa = String(s.contact_whatsapp).replace(/[^0-9+]/g, "");
    rows.push(`<a class="info-row" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener"><span class="ic ic-green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${ICONS.chat}</svg></span><span><b>WhatsApp</b><small>${esc(s.contact_whatsapp)}</small></span></a>`);
  }
  $("#contactInfo").innerHTML = rows.join("") || `<p style="color:var(--text-3)">Contact details coming soon — use the form and I'll reply promptly.</p>`;
  const socials = [
    [s.social_facebook, "Facebook", '<path d="M14 8h3V5h-3a4 4 0 0 0-4 4v2H7v3h3v7h3v-7h3l1-3h-4V9a1 1 0 0 1 1-1z"/>'],
    [s.social_youtube, "YouTube", '<rect x="3" y="5" width="18" height="14" rx="4"/><path d="m10 9 5 3-5 3V9z"/>'],
    [s.social_linkedin, "LinkedIn", '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 11v5M8 8v.01M12 16v-3a2 2 0 0 1 4 0v3"/>'],
    [s.social_instagram, "Instagram", '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>'],
    [s.social_x, "X", '<path d="M4 4l16 16M20 4 4 20"/>'],
  ].filter(([url]) => url && String(url).trim());
  $("#socials").innerHTML = socials.map(([url, label, path]) =>
    `<a class="icon-btn" href="${esc(url)}" target="_blank" rel="noopener" aria-label="${esc(label)}" title="${esc(label)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${path}</svg></a>`).join("");
}

function renderServices(services) {
  const grid = $("#servicesGrid");
  if (!services.length) { grid.innerHTML = emptyState("Services coming soon", "Check back shortly for the full service list."); return; }
  grid.innerHTML = services.map((s, i) => `
    <article class="card reveal in">
      ${icon(s.icon || "spark", IC_COLORS[i % 3])}
      <h3>${esc(s.title)}</h3>
      <p class="desc">${esc(s.description)}</p>
      <ul class="feat-list">${(s.features || []).map((f) => `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${ICONS.check}</svg>${esc(f)}</li>`).join("")}</ul>
      ${s.price_label ? `<div class="price">${esc(s.price_label)} <span>/ starting</span></div>` : ""}
      <a class="btn btn-glass" href="#contact" data-service="${esc(s.title)}">${esc(s.cta_label || "Get This Service")}</a>
    </article>`).join("");
  // pre-select service in contact form
  $$("#servicesGrid [data-service]").forEach((a) => a.addEventListener("click", () => {
    const sel = $("#cfService");
    [...sel.options].forEach((o) => { if (o.text === a.dataset.service) sel.value = o.value; });
  }));
  const sel = $("#cfService");
  sel.innerHTML = `<option value="">Select a service…</option>` + services.map((s) => `<option>${esc(s.title)}</option>`).join("");
}

function renderPortfolioFilters(categories) {
  const cats = ["All", ...categories];
  $("#filters").innerHTML = cats.map((c) =>
    `<button class="chip${c === activeFilter ? " active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
  $$("#filters .chip").forEach((ch) => ch.addEventListener("click", () => {
    activeFilter = ch.dataset.cat;
    $$("#filters .chip").forEach((x) => x.classList.toggle("active", x === ch));
    renderProjects();
  }));
}

function renderProjects() {
  const grid = $("#portfolioGrid");
  const list = activeFilter === "All" ? ALL_PROJECTS : ALL_PROJECTS.filter((p) => p.category === activeFilter);
  if (!list.length) {
    grid.innerHTML = emptyState("No projects here yet", activeFilter === "All" ? "New work is added regularly — check back soon." : `Nothing filed under “${activeFilter}” yet.`);
    return;
  }
  grid.innerHTML = list.map((p) => `
    <article class="card work-card">
      <div class="work-thumb">${p.thumbnail ? `<img src="${esc(p.thumbnail)}" alt="${esc(p.title)}" loading="lazy">` : ""}<span class="cat">${esc(p.category)}</span></div>
      <div class="work-body">
        <h3>${esc(p.title)}</h3>
        ${p.client ? `<span class="client">${esc(p.client)}${p.project_date ? " · " + esc(p.project_date) : ""}</span>` : ""}
        ${p.description ? `<p class="desc">${esc(p.description)}</p>` : ""}
        ${p.results ? `<div class="results"><b>Outcome:</b> ${esc(p.results)}</div>` : ""}
        ${p.project_url ? `<a href="${esc(p.project_url)}" target="_blank" rel="noopener" style="font-weight:600;color:var(--accent-2);font-size:.9rem">View project →</a>` : ""}
      </div>
    </article>`).join("");
}

function renderCases(cases) {
  const grid = $("#casesGrid");
  if (!cases.length) { grid.innerHTML = emptyState("Case studies in progress", "Detailed breakdowns of recent work will appear here."); return; }
  grid.innerHTML = cases.map((c) => `
    <article class="card case-card">
      <div class="case-media">${c.image ? `<img src="${esc(c.image)}" alt="${esc(c.title)}" loading="lazy">` : `<span style="color:var(--text-3);font-weight:600">${esc(c.category)}</span>`}</div>
      <div class="case-body">
        <h3>${esc(c.title)}</h3>
        ${c.client ? `<span class="client">${esc(c.client)}</span>` : ""}
        ${c.summary ? `<p style="color:var(--text-2);margin-bottom:16px">${esc(c.summary)}</p>` : ""}
        ${c.challenge ? `<div class="case-sec"><b>The challenge</b><p>${esc(c.challenge)}</p></div>` : ""}
        ${c.approach ? `<div class="case-sec"><b>The approach</b><p>${esc(c.approach)}</p></div>` : ""}
        ${c.outcome ? `<div class="case-sec"><b>The outcome</b><p>${esc(c.outcome)}</p></div>` : ""}
      </div>
    </article>`).join("");
}

let tstIdx = 0, tstTimer = null;
function renderTestimonials(ts) {
  const track = $("#tstTrack"), nav = $("#tstNav");
  if (!ts.length) {
    track.innerHTML = emptyState("Client stories coming soon", "Testimonials from recent collaborations will appear here.");
    nav.innerHTML = ""; return;
  }
  track.innerHTML = ts.map((t, i) => `
    <div class="tst-slide${i === 0 ? " active" : ""}">
      <div class="stars">${"★".repeat(Math.max(1, Math.min(5, t.rating || 5)))}${"☆".repeat(5 - Math.max(1, Math.min(5, t.rating || 5)))}</div>
      <p class="tst-quote">${esc(t.quote)}</p>
      <div class="tst-who">
        <span class="tst-avatar">${t.avatar ? `<img src="${esc(t.avatar)}" alt="${esc(t.name)}">` : esc(t.name.trim()[0] || "?").toUpperCase()}</span>
        <div><b>${esc(t.name)}</b><small>${esc([t.role, t.company].filter(Boolean).join(" · "))}</small></div>
      </div>
    </div>`).join("");
  nav.innerHTML = ts.map((_, i) => `<button class="tst-dot${i === 0 ? " active" : ""}" data-i="${i}" aria-label="Testimonial ${i + 1}"></button>`).join("");
  const go = (i) => {
    tstIdx = (i + ts.length) % ts.length;
    $$(".tst-slide", track).forEach((s, k) => s.classList.toggle("active", k === tstIdx));
    $$(".tst-dot", nav).forEach((d, k) => d.classList.toggle("active", k === tstIdx));
  };
  $$(".tst-dot", nav).forEach((d) => d.addEventListener("click", () => { go(+d.dataset.i); restart(); }));
  clearInterval(tstTimer);
  const restart = () => { clearInterval(tstTimer); tstTimer = setInterval(() => go(tstIdx + 1), 6000); };
  restart();
}

/* ---------- load ---------- */
(async function load() {
  try {
    const r = await fetch("/api/content");
    if (!r.ok) throw new Error("bad");
    const d = await r.json();
    renderSettings(d.settings || {});
    renderServices(d.services || []);
    ALL_PROJECTS = d.projects || [];
    renderPortfolioFilters(d.categories || []);
    renderProjects();
    renderCases(d.caseStudies || []);
    renderTestimonials(d.testimonials || []);
  } catch (e) {
    ["servicesGrid", "portfolioGrid"].forEach((id) => {
      document.getElementById(id).innerHTML = emptyState("Couldn't load content", "Please refresh the page. If this persists, the server may be starting up.");
    });
  }
})();

/* ---------- contact form ---------- */
$("#contactForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#cfSubmit"), msg = $("#cfMsg");
  msg.className = "form-msg"; msg.textContent = "";
  btn.disabled = true; btn.style.opacity = 0.7;
  const data = Object.fromEntries(new FormData(e.target).entries());
  try {
    const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Something went wrong.");
    msg.classList.add("ok"); msg.textContent = d.message || "Message sent!";
    e.target.reset();
  } catch (err) {
    msg.classList.add("err"); msg.textContent = err.message;
  } finally {
    btn.disabled = false; btn.style.opacity = 1;
  }
});
