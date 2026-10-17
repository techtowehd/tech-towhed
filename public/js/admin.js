/* Tech Towhed — admin dashboard logic */
"use strict";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- API ---------- */
async function api(path, opts = {}) {
  const r = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (r.status === 401) { showLogin(); throw new Error("Session expired."); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Request failed.");
  return d;
}
async function apiUpload(file) {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/admin/media", { method: "POST", body: fd });
  if (r.status === 401) { showLogin(); throw new Error("Session expired."); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Upload failed.");
  return d;
}

/* ---------- toast / modal ---------- */
let toastT;
function toast(msg, isErr = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.toggle("err", isErr);
  t.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("show"), 2800);
}
function openModal(title, bodyHTML) {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = bodyHTML;
  $("#modalBackdrop").style.display = "grid";
}
function closeModal() { $("#modalBackdrop").style.display = "none"; $("#modalBody").innerHTML = ""; }
$("#modalClose").addEventListener("click", closeModal);
$("#modalBackdrop").addEventListener("click", (e) => { if (e.target.id === "modalBackdrop") closeModal(); });
addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

/* ---------- auth views ---------- */
function showLogin() {
  $("#loginView").style.display = "grid";
  $("#appView").style.display = "none";
}
function showApp(user) {
  $("#loginView").style.display = "none";
  $("#appView").style.display = "flex";
  $("#userChip").textContent = "👤 " + user.username;
  if (!location.hash) location.hash = "#/overview";
  else route();
}
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#loginBtn"), msg = $("#loginMsg");
  msg.className = "form-msg"; msg.textContent = "";
  btn.disabled = true;
  try {
    const d = await api("/api/auth/login", { method: "POST", body: Object.fromEntries(new FormData(e.target).entries()) });
    toast("Welcome back!");
    showApp(d.user);
  } catch (err) { msg.classList.add("err"); msg.textContent = err.message; }
  finally { btn.disabled = false; }
});
$("#logoutBtn").addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  location.hash = "";
  showLogin();
});
$("#sideToggle").addEventListener("click", () => document.body.classList.toggle("nav-open"));

/* ---------- navigation ---------- */
const NAV = [
  { id: "overview", label: "Overview", icon: '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>' },
  { id: "content", label: "Site Content", icon: '<path d="M4 6h16M4 12h16M4 18h10"/>' },
  { id: "services", label: "Services", icon: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/>' },
  { id: "portfolio", label: "Portfolio", icon: '<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>' },
  { id: "cases", label: "Case Studies", icon: '<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>' },
  { id: "testimonials", label: "Testimonials", icon: '<path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z"/>' },
  { id: "inquiries", label: "Inquiries", icon: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 6 9-6"/>', badge: "unread" },
  { id: "media", label: "Media Library", icon: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="m5 19 5-5 3 3 3-3 3 3"/>' },
  { id: "account", label: "Account", icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>' },
];
const TITLES = { overview: "Overview", content: "Site Content", services: "Services", portfolio: "Portfolio Projects", cases: "Case Studies", testimonials: "Testimonials", inquiries: "Inquiries", media: "Media Library", account: "Account" };

function renderNav(badges = {}) {
  $("#sideNav").innerHTML = NAV.map((n) => `
    <a class="side-item" href="#/${n.id}" data-nav="${n.id}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${n.icon}</svg>
      ${n.label}${badges[n.badge] ? `<span class="count">${badges[n.badge]}</span>` : ""}
    </a>`).join("");
}
function route() {
  const id = (location.hash.replace("#/", "") || "overview").split("?")[0];
  const page = NAV.some((n) => n.id === id) ? id : "overview";
  $("#pageTitle").textContent = TITLES[page];
  $$("#sideNav .side-item").forEach((a) => a.classList.toggle("active", a.dataset.nav === page));
  document.body.classList.remove("nav-open");
  PAGES[page]();
}
addEventListener("hashchange", route);

/* ---------- form builder ---------- */
function fieldHTML(f, val) {
  const v = esc(val ?? f.default ?? "");
  const label = `<label>${esc(f.label)}${f.hint ? ` <small style="color:var(--text-3);font-weight:400">— ${esc(f.hint)}</small>` : ""}</label>`;
  switch (f.type) {
    case "textarea": return `<div class="field ${f.full ? "full" : ""}">${label}<textarea name="${f.key}" rows="${f.rows || 4}" placeholder="${esc(f.placeholder || "")}">${v}</textarea></div>`;
    case "number": return `<div class="field">${label}<input name="${f.key}" type="number" value="${v}" min="${f.min ?? ""}" max="${f.max ?? ""}"></div>`;
    case "checkbox": return `<label class="check-row"><input name="${f.key}" type="checkbox" ${val ? "checked" : ""}> ${esc(f.label)}</label>`;
    case "select": return `<div class="field">${label}<select name="${f.key}">${f.options.map((o) => `<option value="${esc(o)}" ${String(val) === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></div>`;
    case "image": return `<div class="field ${f.full ? "full" : ""}">${label}<div class="img-input-wrap"><input name="${f.key}" type="text" value="${v}" placeholder="/uploads/…"><button type="button" class="mini-btn" data-browse="${f.key}">Browse</button></div>${v ? `<img class="img-preview" src="${v}" alt="">` : ""}</div>`;
    default: return `<div class="field ${f.full ? "full" : ""}">${label}<input name="${f.key}" type="text" value="${v}" placeholder="${esc(f.placeholder || "")}"></div>`;
  }
}
function formHTML(fields, item = {}) {
  const rows = [];
  let cur = [];
  for (const f of fields) {
    if (f.type === "checkbox") { rows.push(`<div class="form-row">${cur.map((x) => x).join("")}</div>`); cur = []; rows.push(fieldHTML(f, item[f.key])); continue; }
    if (f.full || f.type === "textarea" || f.type === "image") {
      if (cur.length) { rows.push(`<div class="form-row">${cur.join("")}</div>`); cur = []; }
      rows.push(fieldHTML(f, item[f.key]));
    } else { cur.push(fieldHTML(f, item[f.key])); if (cur.length === 2) { rows.push(`<div class="form-row">${cur.join("")}</div>`); cur = []; } }
  }
  if (cur.length) rows.push(`<div class="form-row">${cur.join("")}</div>`);
  return rows.join("");
}
function readForm(form, fields) {
  const fd = new FormData(form);
  const out = {};
  for (const f of fields) {
    if (f.type === "checkbox") out[f.key] = form.querySelector(`[name="${f.key}"]`).checked;
    else if (f.type === "number") out[f.key] = Number(fd.get(f.key)) || 0;
    else if (f.key === "features" && typeof fd.get(f.key) === "string") out[f.key] = String(fd.get(f.key)).split("\n").map((s) => s.trim()).filter(Boolean);
    else out[f.key] = String(fd.get(f.key) ?? "");
  }
  return out;
}
// media picker for image fields
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-browse]");
  if (!b) return;
  const key = b.dataset.browse;
  const d = await api("/api/admin/media");
  const items = d.items || [];
  openModal("Choose image", items.length
    ? `<div class="media-grid">${items.map((m) => `<div class="media-item picking"><img src="/uploads/${esc(m.filename)}" loading="lazy"><div class="meta">${esc(m.original_name)}</div><button class="pick" data-pick="/uploads/${esc(m.filename)}">Use this</button></div>`).join("")}</div>`
    : `<p style="color:var(--text-3)">No uploads yet. Upload images from the Media Library first.</p>`);
  $$("#modalBody [data-pick]").forEach((p) => p.addEventListener("click", () => {
    const input = document.querySelector(`#modalBody ~ * [name="${key}"], input[name="${key}"]`);
    const target = document.querySelector(`input[name="${key}"]`);
    if (target) { target.value = p.dataset.pick; toast("Image selected — save the form to apply."); }
    closeModal();
  }));
});

/* ---------- generic entity manager ---------- */
const CATEGORIES = ["YouTube SEO", "YouTube Monetization", "Facebook Ads", "Google Ads", "Digital Marketing", "YouTube Channel Growth"];
const ENTITIES = {
  services: {
    endpoint: "services", singular: "Service",
    fields: [
      { key: "title", label: "Title", full: true },
      { key: "description", label: "Description", type: "textarea", full: true, rows: 3 },
      { key: "icon", label: "Icon", type: "select", options: ["search", "badge", "target", "chart", "rocket", "compass", "spark"] },
      { key: "price_label", label: "Starting price", hint: "optional, e.g. From $299/mo" },
      { key: "cta_label", label: "Button label", default: "Get This Service" },
      { key: "features", label: "Key deliverables", type: "textarea", full: true, rows: 5, hint: "one per line" },
      { key: "sort_order", label: "Sort order", type: "number" },
      { key: "is_visible", label: "Visible on website", type: "checkbox" },
    ],
    columns: [
      { key: "title", label: "Title" },
      { key: "price_label", label: "Price" },
      { key: "is_visible", label: "Status", render: (v) => v ? '<span class="pill on">Visible</span>' : '<span class="pill off">Hidden</span>' },
    ],
  },
  portfolio: {
    endpoint: "projects", singular: "Project",
    fields: [
      { key: "title", label: "Project title", full: true },
      { key: "category", label: "Category", type: "select", options: CATEGORIES },
      { key: "client", label: "Client / brand" },
      { key: "project_date", label: "Date", placeholder: "e.g. 2026" },
      { key: "project_url", label: "Project URL", full: true, placeholder: "https://…" },
      { key: "thumbnail", label: "Thumbnail", type: "image", full: true },
      { key: "description", label: "Description", type: "textarea", full: true, rows: 3 },
      { key: "results", label: "Results / outcome", type: "textarea", full: true, rows: 2, hint: "only real, verifiable outcomes" },
      { key: "sort_order", label: "Sort order", type: "number" },
      { key: "is_visible", label: "Visible on website", type: "checkbox" },
      { key: "is_sample", label: "Sample project (hidden from public site)", type: "checkbox" },
    ],
    columns: [
      { key: "thumbnail", label: "", render: (v, r) => v ? `<img class="thumb-sm" src="${esc(v)}" alt="">` : `<span class="thumb-sm" style="display:grid;place-items:center;color:var(--text-3)">—</span>` },
      { key: "title", label: "Title", render: (v, r) => `${esc(v)}${r.is_sample ? ' <span class="pill sample">Sample</span>' : ""}` },
      { key: "category", label: "Category" },
      { key: "is_visible", label: "Status", render: (v) => v ? '<span class="pill on">Visible</span>' : '<span class="pill off">Hidden</span>' },
    ],
  },
  cases: {
    endpoint: "case-studies", singular: "Case Study",
    fields: [
      { key: "title", label: "Title", full: true },
      { key: "category", label: "Category", type: "select", options: CATEGORIES },
      { key: "client", label: "Client / brand" },
      { key: "image", label: "Cover image", type: "image", full: true },
      { key: "summary", label: "Summary", type: "textarea", full: true, rows: 2 },
      { key: "challenge", label: "The challenge", type: "textarea", full: true, rows: 3 },
      { key: "approach", label: "The approach", type: "textarea", full: true, rows: 3 },
      { key: "outcome", label: "The outcome", type: "textarea", full: true, rows: 3, hint: "only real, verifiable outcomes" },
      { key: "sort_order", label: "Sort order", type: "number" },
      { key: "is_visible", label: "Visible on website", type: "checkbox" },
    ],
    columns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "is_visible", label: "Status", render: (v) => v ? '<span class="pill on">Visible</span>' : '<span class="pill off">Hidden</span>' },
    ],
  },
  testimonials: {
    endpoint: "testimonials", singular: "Testimonial",
    fields: [
      { key: "name", label: "Client name", full: true },
      { key: "role", label: "Role" },
      { key: "company", label: "Company" },
      { key: "avatar", label: "Avatar image", type: "image", full: true },
      { key: "quote", label: "Testimonial", type: "textarea", full: true, rows: 4, hint: "use only genuine client words" },
      { key: "rating", label: "Rating (1–5)", type: "number", min: 1, max: 5 },
      { key: "sort_order", label: "Sort order", type: "number" },
      { key: "is_visible", label: "Visible on website", type: "checkbox" },
    ],
    columns: [
      { key: "name", label: "Name" },
      { key: "company", label: "Company" },
      { key: "rating", label: "Rating", render: (v) => "★".repeat(Math.max(1, Math.min(5, v || 5))) },
      { key: "is_visible", label: "Status", render: (v) => v ? '<span class="pill on">Visible</span>' : '<span class="pill off">Hidden</span>' },
    ],
  },
};

function entityPage(key) {
  const cfg = ENTITIES[key];
  return async () => {
    const el = $("#pageContent");
    el.innerHTML = `<div class="skel" style="min-height:300px"></div>`;
    let items = [];
    try { items = (await api(`/api/admin/${cfg.endpoint}`)).items || []; }
    catch (err) { el.innerHTML = `<div class="card"><p style="color:#f87171">${esc(err.message)}</p></div>`; return; }

    el.innerHTML = `
      <div class="panel-head">
        <div><h3>${cfg.singular}s <span style="color:var(--text-3);font-weight:500">(${items.length})</span></h3>
        <p>Changes go live on the website immediately.</p></div>
        <button class="btn btn-primary" id="addBtn" style="padding:11px 22px">+ Add ${cfg.singular}</button>
      </div>
      <div class="card" style="padding:8px 10px;overflow-x:auto">
        ${items.length ? `<table class="data"><thead><tr>${cfg.columns.map((c) => `<th>${c.label}</th>`).join("")}<th style="text-align:right">Actions</th></tr></thead>
        <tbody>${items.map((it) => `<tr>${cfg.columns.map((c) => `<td>${c.render ? c.render(it[c.key], it) : esc(it[c.key])}</td>`).join("")}
          <td><div class="row-actions"><button class="mini-btn" data-edit="${it.id}">Edit</button><button class="mini-btn danger" data-del="${it.id}">Delete</button></div></td></tr>`).join("")}</tbody></table>`
        : `<div class="empty" style="border:none;background:none"><b>No ${cfg.singular.toLowerCase()}s yet</b><p>Click “Add ${cfg.singular}” to create the first one.</p></div>`}
      </div>`;

    const reload = () => entityPage(key)();
    $("#addBtn").addEventListener("click", () => editModal(key, null, reload));
    $$("[data-edit]", el).forEach((b) => b.addEventListener("click", () => {
      const item = items.find((i) => i.id == b.dataset.edit);
      editModal(key, item, reload);
    }));
    $$("[data-del]", el).forEach((b) => b.addEventListener("click", async () => {
      const item = items.find((i) => i.id == b.dataset.del);
      if (!confirm(`Delete “${item.title || item.name}”? This cannot be undone.`)) return;
      try { await api(`/api/admin/${cfg.endpoint}/${item.id}`, { method: "DELETE" }); toast("Deleted."); reload(); }
      catch (err) { toast(err.message, true); }
    }));
  };
}

function editModal(key, item, onSave) {
  const cfg = ENTITIES[key];
  const data = item ? { ...item, features: Array.isArray(item.features) ? item.features.join("\n") : item.features } : { is_visible: 1, cta_label: "Get This Service", rating: 5 };
  openModal(item ? `Edit ${cfg.singular}` : `Add ${cfg.singular}`,
    `<form id="entityForm">${formHTML(cfg.fields, data)}
     <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px">
       <button type="button" class="btn btn-glass" id="cancelBtn">Cancel</button>
       <button type="submit" class="btn btn-primary">${item ? "Save changes" : "Create"}</button>
     </div></form>`);
  $("#cancelBtn").addEventListener("click", closeModal);
  $("#entityForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = readForm(e.target, cfg.fields);
    try {
      if (item) await api(`/api/admin/${cfg.endpoint}/${item.id}`, { method: "PUT", body: payload });
      else await api(`/api/admin/${cfg.endpoint}`, { method: "POST", body: payload });
      closeModal(); toast(item ? "Saved." : "Created."); onSave();
    } catch (err) { toast(err.message, true); }
  });
}

/* ---------- pages ---------- */
const SETTING_GROUPS = [
  { title: "Brand", fields: ["brand_name", "brand_tagline", "footer_note"] },
  { title: "Hero section", fields: ["hero_badge", "hero_title", "hero_sub", "hero_primary_cta", "hero_secondary_cta", "hero_trust"] },
  { title: "About section", fields: ["about_title", "about_bio", "about_philosophy", "about_mission", "about_image", "years_experience"] },
  { title: "Statistics", hint: "Leave blank to hide. Only enter real numbers.", fields: ["stats_projects", "stats_clients", "stats_niches"] },
  { title: "Contact", fields: ["contact_email", "contact_whatsapp"] },
  { title: "Social links", fields: ["social_facebook", "social_youtube", "social_linkedin", "social_instagram", "social_x"] },
];
const SETTING_LABELS = {
  brand_name: "Brand name", brand_tagline: "Tagline", footer_note: "Footer note",
  hero_badge: "Badge text", hero_title: "Headline (line break = new line)", hero_sub: "Supporting text",
  hero_primary_cta: "Primary button", hero_secondary_cta: "Secondary button", hero_trust: "Trust microcopy",
  about_title: "Section heading", about_bio: "Biography", about_philosophy: "Work philosophy",
  about_mission: "Mission", about_image: "Profile photo", years_experience: "Years of experience",
  stats_projects: "Projects completed", stats_clients: "Happy clients", stats_niches: "Niches served",
  contact_email: "Contact email", contact_whatsapp: "WhatsApp number",
  social_facebook: "Facebook URL", social_youtube: "YouTube URL", social_linkedin: "LinkedIn URL",
  social_instagram: "Instagram URL", social_x: "X (Twitter) URL",
};

const PAGES = {
  overview: async () => {
    const el = $("#pageContent");
    el.innerHTML = `<div class="skel" style="min-height:200px"></div>`;
    try {
      const d = await api("/api/admin/overview");
      renderNav({ unread: d.counts.unread });
      el.innerHTML = `
        <div class="stat-cards">
          ${[["Services", d.counts.services], ["Projects", d.counts.projects], ["Case studies", d.counts.caseStudies], ["Testimonials", d.counts.testimonials], ["Inquiries", d.counts.inquiries], ["Unread", d.counts.unread]].map(([l, v]) => `<div class="card stat-card"><b>${v}</b><small>${l}</small></div>`).join("")}
        </div>
        <div class="panel-head"><div><h3>Recent inquiries</h3><p>Latest messages from your contact form.</p></div><a class="mini-btn" href="#/inquiries">View all</a></div>
        <div class="card" style="padding:20px">${d.recentInquiries.length ? d.recentInquiries.map((q) => `
          <div class="inq ${q.is_read ? "" : "unread"}"><div class="inq-head"><b>${esc(q.name)}</b><span class="pill ${q.is_read ? "off" : "on"}">${q.is_read ? "Read" : "New"}</span><time>${esc(q.created_at)}</time></div>
          <div style="color:var(--text-3);font-size:.85rem">${esc(q.email)}${q.service ? " · " + esc(q.service) : ""}</div><p class="msg">${esc(q.message.slice(0, 220))}${q.message.length > 220 ? "…" : ""}</p></div>`).join("")
        : `<p style="color:var(--text-3)">No inquiries yet. Messages from the contact form will appear here.</p>`}</div>`;
    } catch (err) { el.innerHTML = `<div class="card"><p style="color:#f87171">${esc(err.message)}</p></div>`; }
  },

  content: async () => {
    const el = $("#pageContent");
    el.innerHTML = `<div class="skel" style="min-height:300px"></div>`;
    try {
      const { settings } = await api("/api/admin/settings");
      el.innerHTML = `<form id="settingsForm">${SETTING_GROUPS.map((g) => `
        <div class="card panel"><div class="settings-group" style="margin:0">
          <h4>${g.title}</h4>${g.hint ? `<p style="color:var(--text-3);font-size:.85rem;margin:-8px 0 14px">${g.hint}</p>` : ""}
          ${g.fields.map((k) => {
            const isLong = /bio|philosophy|mission|sub|trust|note/.test(k);
            const isImage = k === "about_image";
            const label = `<label>${SETTING_LABELS[k] || k}</label>`;
            if (isImage) return `<div class="field" style="margin-bottom:14px">${label}<div class="img-input-wrap"><input name="${k}" type="text" value="${esc(settings[k] || "")}"><button type="button" class="mini-btn" data-browse="${k}">Browse</button></div></div>`;
            return `<div class="field" style="margin-bottom:14px">${label}${isLong ? `<textarea name="${k}" rows="3">${esc(settings[k] || "")}</textarea>` : `<input name="${k}" type="text" value="${esc(settings[k] || "")}">`}</div>`;
          }).join("")}
        </div></div>`).join("")}
        <div style="position:sticky;bottom:20px;display:flex;justify-content:flex-end"><button class="btn btn-primary" type="submit">Save all changes</button></div></form>`;
      $("#settingsForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          await api("/api/admin/settings", { method: "PUT", body: Object.fromEntries(new FormData(e.target).entries()) });
          toast("Site content updated — live on the website now.");
        } catch (err) { toast(err.message, true); }
      });
    } catch (err) { el.innerHTML = `<div class="card"><p style="color:#f87171">${esc(err.message)}</p></div>`; }
  },

  services: entityPage("services"),
  portfolio: entityPage("portfolio"),
  cases: entityPage("cases"),
  testimonials: entityPage("testimonials"),

  inquiries: async () => {
    const el = $("#pageContent");
    el.innerHTML = `<div class="skel" style="min-height:300px"></div>`;
    const load = async () => {
      try {
        const d = await api("/api/admin/inquiries");
        renderNav({ unread: d.unread });
        el.innerHTML = `
          <div class="panel-head"><div><h3>Inquiries <span style="color:var(--text-3);font-weight:500">(${d.items.length})</span></h3><p>Messages submitted through the contact form.</p></div></div>
          ${d.items.length ? d.items.map((q) => `
            <div class="inq ${q.is_read ? "" : "unread"}">
              <div class="inq-head"><b>${esc(q.name)}</b><span class="pill ${q.is_read ? "off" : "on"}">${q.is_read ? "Read" : "New"}</span><time>${esc(q.created_at)}</time></div>
              <div style="color:var(--text-3);font-size:.85rem"><a href="mailto:${esc(q.email)}" style="color:var(--accent-2)">${esc(q.email)}</a>${q.service ? " · " + esc(q.service) : ""}${q.budget ? " · Budget: " + esc(q.budget) : ""}</div>
              <p class="msg">${esc(q.message)}</p>
              <div class="row-actions" style="justify-content:flex-start">
                ${q.is_read ? "" : `<button class="mini-btn" data-read="${q.id}">Mark as read</button>`}
                <button class="mini-btn danger" data-del="${q.id}">Delete</button>
              </div>
            </div>`).join("")
          : `<div class="card"><div class="empty" style="border:none;background:none"><b>No inquiries yet</b><p>Messages from the contact form will appear here.</p></div></div>`}`;
        $$("[data-read]", el).forEach((b) => b.addEventListener("click", async () => {
          await api(`/api/admin/inquiries/${b.dataset.read}`, { method: "PATCH", body: { is_read: true } }); load();
        }));
        $$("[data-del]", el).forEach((b) => b.addEventListener("click", async () => {
          if (!confirm("Delete this inquiry?")) return;
          await api(`/api/admin/inquiries/${b.dataset.del}`, { method: "DELETE" }); toast("Deleted."); load();
        }));
      } catch (err) { el.innerHTML = `<div class="card"><p style="color:#f87171">${esc(err.message)}</p></div>`; }
    };
    load();
  },

  media: async () => {
    const el = $("#pageContent");
    el.innerHTML = `<div class="skel" style="min-height:200px"></div>`;
    const load = async () => {
      try {
        const d = await api("/api/admin/media");
        el.innerHTML = `
          <div class="panel-head"><div><h3>Media Library</h3><p>Upload images, then use their URLs in content. Max 5MB per image.</p></div></div>
          <div class="upload-zone" id="uploadZone">📤 Click or drop an image here to upload<input type="file" id="fileInput" accept="image/*" hidden></div>
          <div class="media-grid">${(d.items || []).map((m) => `
            <div class="media-item"><img src="/uploads/${esc(m.filename)}" loading="lazy" alt="">
              <div class="meta">${esc(m.original_name)}</div>
              <button class="del" data-del="${m.id}" title="Delete">✕</button>
              <button class="pick" data-copy="/uploads/${esc(m.filename)}" style="display:block;position:static;margin:6px;width:calc(100% - 12px)">Copy URL</button>
            </div>`).join("") || `<div class="empty" style="grid-column:1/-1"><b>No uploads yet</b><p>Upload your profile photo, project thumbnails, and case images here.</p></div>`}</div>`;
        const zone = $("#uploadZone"), fi = $("#fileInput");
        zone.addEventListener("click", () => fi.click());
        ["dragover", "drop"].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); if (ev === "drop" && e.dataTransfer.files[0]) doUpload(e.dataTransfer.files[0]); }));
        fi.addEventListener("change", () => fi.files[0] && doUpload(fi.files[0]));
        async function doUpload(file) {
          try { const r = await apiUpload(file); toast("Uploaded: " + r.url); load(); }
          catch (err) { toast(err.message, true); }
        }
        $$("[data-copy]", el).forEach((b) => b.addEventListener("click", async () => {
          try { await navigator.clipboard.writeText(location.origin + b.dataset.copy); toast("URL copied."); }
          catch { toast(b.dataset.copy); }
        }));
        $$("[data-del]", el).forEach((b) => b.addEventListener("click", async () => {
          if (!confirm("Delete this image? Pages using it will show a broken image.")) return;
          await api(`/api/admin/media/${b.dataset.del}`, { method: "DELETE" }); toast("Deleted."); load();
        }));
      } catch (err) { el.innerHTML = `<div class="card"><p style="color:#f87171">${esc(err.message)}</p></div>`; }
    };
    load();
  },

  account: async () => {
    const el = $("#pageContent");
    el.innerHTML = `
      <div class="card panel" style="max-width:520px"><div class="panel-head"><div><h3>Change password</h3><p>Use a strong, unique password.</p></div></div>
        <form id="pwForm">
          <div class="field"><label>Current password</label><input name="currentPassword" type="password" required autocomplete="current-password"></div>
          <div class="field"><label>New password (min 8 characters)</label><input name="newPassword" type="password" required minlength="8" autocomplete="new-password"></div>
          <button class="btn btn-primary" type="submit">Update password</button>
          <div class="form-msg" id="pwMsg"></div>
        </form></div>
      <div class="card panel" style="max-width:520px"><div class="panel-head"><div><h3>Security notes</h3></div></div>
        <ul style="color:var(--text-2);font-size:.92rem;display:grid;gap:8px;list-style:none">
          <li>🔒 Sessions expire after 12 hours.</li>
          <li>🛡️ Login attempts are rate-limited.</li>
          <li>🚫 The admin panel is never indexed by search engines.</li>
        </ul></div>`;
    $("#pwForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = $("#pwMsg"); msg.className = "form-msg"; msg.textContent = "";
      try {
        const d = await api("/api/admin/account/password", { method: "PUT", body: Object.fromEntries(new FormData(e.target).entries()) });
        msg.classList.add("ok"); msg.textContent = d.message; e.target.reset();
      } catch (err) { msg.classList.add("err"); msg.textContent = err.message; }
    });
  },
};

/* ---------- boot ---------- */
renderNav();
(async function boot() {
  try {
    const d = await api("/api/auth/me");
    renderNav();
    showApp(d.user);
    // refresh unread badge
    try { const o = await api("/api/admin/overview"); renderNav({ unread: o.counts.unread }); } catch {}
  } catch { showLogin(); }
})();
