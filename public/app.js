// ===== Business Architect — frontend app =====

const ICONS = ["◆", "◈", "●", "▲", "■", "✦", "➤", "◉"];

const LANGS = ["pl", "en"];
function getLang() {
  const saved = localStorage.getItem("ba_lang");
  return LANGS.includes(saved) ? saved : "pl";
}
function setLang(lang) {
  localStorage.setItem("ba_lang", lang);
}

async function fetchContent(lang) {
  const res = await fetch(`/api/content?lang=${encodeURIComponent(lang)}`);
  return res.json();
}

// Render (or re-render) all translatable content. Safe to call on every
// language switch — DOM nodes are reused, only their text/markup changes.
function renderContent(content) {
  const steps = [
    () => bindText(content),
    () => renderNav(content),
    () => renderEnablement(content.enablement),
    () => renderWorkshops(content.workshops),
    () => renderStats(content.stats),
    () => renderTsl(content.tsl),
    () => renderProcess(content.process),
    () => renderPeople(content.about.people),
    () => renderTestimonials(content.testimonials),
    () => renderFooterLinks(content.footer)
  ];
  for (const step of steps) {
    try {
      step();
    } catch (err) {
      console.error("Render error:", err);
    }
  }
}

async function boot() {
  let lang = getLang();
  let content;
  try {
    content = await fetchContent(lang);
  } catch (err) {
    console.error("Nie udało się pobrać treści / Failed to load content:", err);
    return;
  }

  renderContent(content);
  document.documentElement.lang = lang;

  // One-time interactions (don't re-bind on language change).
  try { initScrollReveal(); } catch (e) { console.error(e); }
  try { initProgressAndNav(); } catch (e) { console.error(e); }
  try { initContactForm(); } catch (e) { console.error(e); }
  try { initLangSwitcher(lang); } catch (e) { console.error(e); }

  revealFallback();
}

// Language switcher — two flag buttons; swaps content without a page reload.
function initLangSwitcher(current) {
  const box = document.getElementById("lang");
  if (!box) return;
  const buttons = Array.from(box.querySelectorAll(".lang__btn"));

  function mark(active) {
    buttons.forEach((b) =>
      b.classList.toggle("is-active", b.dataset.lang === active)
    );
  }
  mark(current);

  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const lang = btn.dataset.lang;
      if (lang === getLang()) return;
      setLang(lang);
      mark(lang);
      document.documentElement.lang = lang;
      try {
        const content = await fetchContent(lang);
        renderContent(content);
      } catch (err) {
        console.error("Language switch failed:", err);
      }
    });
  });
}

// If scroll-reveal never activates, show everything so the page is never blank.
// Skips elements already handled by the scroll-linked engine (.js-reveal).
function revealFallback() {
  setTimeout(() => {
    document
      .querySelectorAll(".reveal:not(.in):not(.js-reveal)")
      .forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add("in");
      });
  }, 400);
}

// Resolve "a.b.c" against an object
function get(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

function bindText(content) {
  document.querySelectorAll("[data-bind]").forEach((el) => {
    const val = get(content, el.getAttribute("data-bind"));
    if (val != null) el.textContent = val;
  });
}

function renderNav({ nav }) {
  const box = document.getElementById("navLinks");
  box.innerHTML = nav.links
    .map((l) => `<a href="${l.href}">${l.label}</a>`)
    .join("");
}

function card(icon, title, text) {
  return `<div class="card reveal">
    <div class="card__icon">${icon}</div>
    <h3>${title}</h3>
    <p>${text}</p>
  </div>`;
}

function renderEnablement(en) {
  document.getElementById("enablementCards").innerHTML = en.cards
    .map((c, i) => {
      const html = card(ICONS[i % ICONS.length], c.title, c.text);
      return html.replace("reveal", `reveal d${i + 1}`);
    })
    .join("");
}

function renderWorkshops(w) {
  const o = w.offer;
  document.getElementById("offer").innerHTML = `
    <h3>${o.name}</h3>
    <div class="offer__price"><strong>${o.price}</strong><span class="offer__note">${o.priceNote}</span></div>
    <p class="offer__duration">${o.duration}</p>
    <div class="offer__features">
      ${o.features.map((f, i) => `<span class="chip"><span class="chip__num">${i + 1}</span>${f}</span>`).join("")}
    </div>`;

  const org = w.org;
  document.getElementById("org").innerHTML = `
    <h3 class="org__title">${org.title}</h3>
    <div class="org__list">
      ${org.steps
        .map(
          (s, i) => `<div class="org__step">
            <div class="org__dot">${i + 1}</div>
            <div><strong>${s.label}</strong><span>${s.note}</span></div>
          </div>`
        )
        .join("")}
    </div>`;
}

function renderStats(stats) {
  document.getElementById("statsGrid").innerHTML = stats
    .map(
      (s, i) => `<div class="stat reveal d${i + 1}">
        <div class="stat__value" data-count="${s.value}">${s.value}</div>
        <div class="stat__label">${s.label}</div>
        ${s.note ? `<div class="stat__note">${s.note}</div>` : ""}
      </div>`
    )
    .join("");
}

function renderTsl(tsl) {
  document.getElementById("tslPhases").innerHTML = tsl.phases
    .map((p) => `<span class="phase">${p}</span>`)
    .join("");
}

function renderProcess(p) {
  document.getElementById("processCards").innerHTML = p.items
    .map((it, i) => {
      const html = card(ICONS[(i + 2) % ICONS.length], it.title, it.text);
      return html.replace("reveal", `reveal d${(i % 3) + 1}`);
    })
    .join("");
}

function renderPeople(people) {
  document.getElementById("people").innerHTML = people
    .map((p) => {
      const initials = p.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
      return `<div class="person">
        <div class="person__avatar">${initials}</div>
        <strong>${p.name}</strong>
      </div>`;
    })
    .join("");
}

function renderTestimonials(t) {
  document.getElementById("testimonialsGrid").innerHTML = t.items
    .map(
      (it, i) => `<div class="card testimonial reveal d${i + 1}">
        <div class="quote">"</div>
        <p>${it.quote}</p>
      </div>`
    )
    .join("");
}

function renderFooterLinks(footer) {
  const links = footer.links.map((l) => {
    // Support both plain strings and { label, href } objects.
    const label = typeof l === "string" ? l : l.label;
    const href = typeof l === "string" ? "#" : l.href || "#";
    return { label, href };
  });

  document.getElementById("footerLinks").innerHTML = links
    .map((l) => `<a href="${l.href}">${l.label}</a>`)
    .join("");

  // Prominent bottom bar link — reuse the privacy-policy entry so it also
  // translates and points to the correct language version.
  const policy =
    links.find((l) => /polityka|privacy/i.test(l.href)) ||
    links[links.length - 1];
  const bottom = document.getElementById("footerPolicy");
  if (bottom && policy) {
    bottom.textContent = policy.label;
    bottom.href = policy.href;
  }
}

// ===== Scroll-linked reveal — progress driven by each element's Y position =====
// Each .reveal element fades/slides in based on where it sits in the viewport.
// The closer its top is to the "activation line", the further it has "flowed" in.
function initScrollReveal() {
  const items = Array.from(document.querySelectorAll(".reveal"));
  if (!items.length) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    items.forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
      if (el.querySelector("[data-count]")) animateCount(el);
    });
    return;
  }

  // Mark elements as JS-driven and classify each one so it gets the right
  // "flow in" treatment: hero (intro), stats (pop), or the default card flow.
  items.forEach((el) => {
    el.classList.add("js-reveal");

    // Horizontal drift direction for alternating card entrances.
    let dir = 0;
    if (el.classList.contains("d1")) dir = -1;
    else if (el.classList.contains("d2")) dir = 0;
    else if (el.classList.contains("d3")) dir = 1;
    else if (el.classList.contains("d4")) dir = -1;
    else if (el.classList.contains("d5")) dir = 1;
    el._revDir = dir;

    // Element kind — drives a dedicated animation profile.
    if (el.closest("#hero")) el._kind = "hero";
    else if (el.closest("#stats")) el._kind = "stat";
    else el._kind = "flow";
  });

  // Hero intro is time-based (plays once on load), then scroll takes over
  // for a parallax exit. Track whether the intro has finished.
  const heroEls = items.filter((el) => el._kind === "hero");
  let heroIntroDone = heroEls.length === 0;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  // easeOutQuart — snappy start, soft settle.
  const ease = (t) => 1 - Math.pow(1 - t, 4);
  // easeOutBack — overshoots slightly then settles, gives a punchy "pop".
  const easeBack = (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };

  // ===== Global "flow" intensity — stronger than before =====
  const MAX_SHIFT_Y = 140;  // px — vertical rise
  const MAX_SHIFT_X = 64;   // px — sideways drift for card grids
  const MAX_SCALE = 0.14;   // starts at 0.86 scale
  const MAX_BLUR = 10;      // px — de-focus while entering
  const MAX_ROT = 4;        // deg — tilt that straightens out

  let ticking = false;

  function applyFlow(el, p) {
    const eased = ease(p);
    const inv = 1 - eased;
    const shiftY = inv * MAX_SHIFT_Y;
    const shiftX = inv * MAX_SHIFT_X * (el._revDir || 0);
    const scale = 1 - MAX_SCALE * inv;
    const rot = MAX_ROT * inv * (el._revDir || 0.4);

    el.style.opacity = eased.toFixed(3);
    el.style.transform =
      `translate3d(${shiftX.toFixed(1)}px, ${shiftY.toFixed(1)}px, 0) ` +
      `scale(${scale.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`;

    if (el._revDir !== 0) {
      const blur = MAX_BLUR * inv;
      el.style.filter = blur > 0.15 ? `blur(${blur.toFixed(1)}px)` : "none";
    }
  }

  // HERO (scroll phase): once the intro has played, scroll drives a parallax
  // exit — the hero lifts and fades as you scroll down past it.
  function applyHero(el, p) {
    if (!heroIntroDone) return; // intro animation owns the hero until it ends
    const eased = ease(p);
    const inv = 1 - eased;
    const shiftY = inv * -60;            // drifts UP as you scroll past (parallax)
    const op = clamp(0.25 + eased * 0.75, 0, 1);
    el.style.opacity = op.toFixed(3);
    el.style.transform = `translate3d(0, ${shiftY.toFixed(1)}px, 0) scale(1)`;
    el.style.filter = "none";
  }

  // HERO intro — dramatic, time-based entrance on page load:
  // zoom-in from 1.2x + strong lift + cinematic blur that resolves,
  // staggered across the hero's child elements.
  function playHeroIntro() {
    if (!heroEls.length) return;
    const DUR = 1100;
    heroEls.forEach((el, i) => {
      const delay = 120 * i;
      const start = performance.now() + delay;
      function frame(now) {
        const t = clamp((now - start) / DUR, 0, 1);
        const e = ease(t);
        const inv = 1 - e;
        const shiftY = inv * 70;
        const scale = 1 + 0.2 * inv;      // zoom IN -> settle
        const blur = 16 * inv;
        el.style.opacity = e.toFixed(3);
        el.style.transform = `translate3d(0, ${shiftY.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        el.style.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : "none";
        if (t < 1) {
          requestAnimationFrame(frame);
        } else if (i === heroEls.length - 1) {
          heroIntroDone = true; // hand control to the scroll-driven parallax
        }
      }
      requestAnimationFrame(frame);
    });
  }

  // STATS: punchy pop — overshoot scale + bounce-up, synced with the count-up.
  function applyStat(el, p) {
    const eased = easeBack(clamp(p, 0, 1));
    const inv = 1 - ease(p);
    const shiftY = inv * 100;
    // easeBack can exceed 1 near the end -> gives a slight overshoot pop.
    const scale = 0.7 + 0.3 * eased;     // 0.7 -> ~1.03 -> 1
    const op = clamp(ease(p) * 1.1, 0, 1);
    el.style.opacity = op.toFixed(3);
    el.style.transform = `translate3d(0, ${shiftY.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
    el.style.filter = "none";
  }

  function update() {
    ticking = false;
    const vh = window.innerHeight;
    const startLine = vh * 1.05; // top position where progress = 0
    const endLine = vh * 0.30;   // top position where progress = 1

    for (const el of items) {
      const rect = el.getBoundingClientRect();
      const top = rect.top;

      let p = (startLine - top) / (startLine - endLine);
      p = clamp(p, 0, 1);

      if (el._kind === "hero") applyHero(el, p);
      else if (el._kind === "stat") applyStat(el, p);
      else applyFlow(el, p);

      if (p > 0.6 && el.querySelector("[data-count]")) animateCount(el);
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  // Prime non-hero elements immediately (so nothing flashes), then play the
  // hero intro, then let scroll drive everything.
  update();
  playHeroIntro();
  window.addEventListener("load", update);
  setTimeout(update, 300);
}

// Count-up animation for numeric stats (e.g. 67%)
function animateCount(scope) {
  const el = scope.querySelector("[data-count]");
  if (!el || el.dataset.done) return;
  const raw = el.dataset.count;
  const num = parseFloat(raw.replace(",", "."));
  if (isNaN(num)) return;
  el.dataset.done = "1";
  const suffix = raw.replace(/[0-9.,]/g, "");
  const decimals = raw.includes(",") ? (raw.split(",")[1] || "").replace(/\D/g, "").length : 0;
  const dur = 1200;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = (num * eased).toFixed(decimals).replace(".", ",");
    el.textContent = val + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ===== Progress bar + sticky nav state =====
function initProgressAndNav() {
  const progress = document.getElementById("progress");
  const nav = document.getElementById("nav");
  function onScroll() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const pct = h > 0 ? (window.scrollY / h) * 100 : 0;
    progress.style.width = pct + "%";
    nav.classList.toggle("scrolled", window.scrollY > 20);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const burger = document.getElementById("burger");
  const links = document.getElementById("navLinks");
  burger.addEventListener("click", () => links.classList.toggle("open"));
  links.addEventListener("click", (e) => {
    if (e.target.tagName === "A") links.classList.remove("open");
  });
}

// ===== Contact form -> backend =====
function initContactForm() {
  const form = document.getElementById("contactForm");
  const statusEl = document.getElementById("formStatus");
  const btn = document.getElementById("submitBtn");
  const originalLabel = btn.textContent;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusEl.className = "form__status";
    statusEl.textContent = "";

    const payload = {
      name: form.name.value,
      email: form.email.value,
      company: form.company.value,
      message: form.message.value
    };

    btn.disabled = true;
    btn.textContent = "Wysyłanie...";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        statusEl.className = "form__status ok";
        statusEl.textContent = data.message;
        form.reset();
      } else {
        statusEl.className = "form__status err";
        statusEl.textContent = data.error || "Coś poszło nie tak.";
      }
    } catch {
      statusEl.className = "form__status err";
      statusEl.textContent = "Brak połączenia z serwerem.";
    } finally {
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  });
}

boot();
