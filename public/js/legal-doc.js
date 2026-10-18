

(function () {
  const TYPE_LABELS = {
    room: "Room Booking Terms",
    event: "Event Booking Terms",
    general: "General Terms",
    privacy: "Privacy Policy",
  };

  function fmtDate(raw) {
    if (!raw) return "";
    const d = new Date(String(raw).replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  }

  function sectionsHtml(sections) {
    return sections
      .map((s, i) => `
        <div class="cvr-legal-section">
          <span class="cvr-legal-index">${i + 1}</span>
          <div>
            ${s.title ? `<h2 class="h5 fw-bold mb-2">${escapeHtml(s.title)}</h2>` : ""}
            <p class="text-muted-brand mb-0" style="white-space: pre-line;">${escapeHtml(s.body)}</p>
          </div>
        </div>
      `)
      .join("");
  }

  let loadSeq = 0;

  async function loadLegalDoc(type, containerId, titleOverride, options) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const pageMode = !!(options && options.page);
    const seq = ++loadSeq;

    if (pageMode) {
      teardownPage();
      container.setAttribute("aria-busy", "true");
      container.innerHTML = `<div class="legal-skel" aria-hidden="true"><i class="t"></i><i class="w1"></i><i class="w2"></i><i class="w3"></i><i class="w1"></i><i class="w2"></i><i class="w3"></i></div><span class="visually-hidden" role="status">Loading current document\u2026</span>`;
    } else {
      container.innerHTML = `<div class="text-center py-5 text-muted"><div class="spinner-border text-secondary" role="status"></div><p class="mt-3 mb-0">Loading current document\u2026</p></div>`;
    }

    const { ok, body } = await cvrApiGet(`content/terms?type=${encodeURIComponent(type)}`);
    if (pageMode && seq !== loadSeq) return; // a newer tab click already took over

    if (!ok || !body?.success) {
      container.removeAttribute("aria-busy");
      container.innerHTML = pageMode
        ? `<div class="legal-error" role="alert">We couldn't load this document right now. Please refresh, or <a href="contact.html">contact us</a> if the issue continues.</div>`
        : `<div class="alert alert-warning">We couldn't load this document right now. Please refresh, or contact us if the issue continues.</div>`;
      return;
    }

    const data = body.data;
    const title = titleOverride || TYPE_LABELS[data.bookingType] || "Terms";

    if (pageMode) {
      renderPage(container, data, title);
      return;
    }

    container.innerHTML = `
      <div class="cvr-legal-card">
        <div class="cvr-legal-head">
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge cvr-legal-badge">Version ${escapeHtml(data.version)}</span>
            <span class="badge cvr-legal-badge cvr-legal-badge-muted">Effective ${escapeHtml(fmtDate(data.effectiveDate))}</span>
          </div>
          <div class="cvr-legal-title">${escapeHtml(title)}</div>
          <p class="text-muted-brand mb-0">Please review the sections below carefully.</p>
        </div>
        <div class="cvr-legal-body">
          ${sectionsHtml(data.sections)}
        </div>
      </div>
    `;
  }


  /* ------------------------------------------------------------------------
     Page mode (privacy.html / terms.html): contents list, reading progress,
     numbered sections. Modals keep using the compact card above.
     ---------------------------------------------------------------------- */
  let pageCleanup = null;

  function teardownPage() {
    if (pageCleanup) pageCleanup();
    pageCleanup = null;
  }

  function readMinutes(sections) {
    const words = sections.reduce(
      (n, s) => n + String(s.title || "").split(/\s+/).length + String(s.body || "").split(/\s+/).length,
      0
    );
    return Math.max(1, Math.round(words / 200));
  }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function renderPage(container, data, title) {
    const sections = Array.isArray(data.sections) ? data.sections : [];
    container.removeAttribute("aria-busy");

    if (!sections.length) {
      container.innerHTML = `<div class="legal-empty">This document has no content yet. Please check back soon.</div>`;
      return;
    }

    const mins = readMinutes(sections);
    const tocHtml = sections
      .map((s, i) => `<li><a href="#legal-sec-${i + 1}" data-sec="legal-sec-${i + 1}"><span class="n">${i + 1}</span><span>${escapeHtml(s.title || "Section " + (i + 1))}</span></a></li>`)
      .join("");

    const secHtml = sections
      .map((s, i) => `
        <section class="legal-sec" id="legal-sec-${i + 1}" style="--i:${Math.min(i, 8)}"${s.title ? ` aria-labelledby="legal-sec-${i + 1}-h"` : ""}>
          <span class="legal-sec-n" aria-hidden="true">${i + 1}</span>
          <div>
            ${s.title ? `<h2 id="legal-sec-${i + 1}-h">${escapeHtml(s.title)}</h2>` : ""}
            <p>${escapeHtml(s.body)}</p>
          </div>
        </section>`)
      .join("");

    container.innerHTML = `
      <div class="legal-layout">
        <nav class="legal-toc" aria-label="On this page">
          <p class="legal-toc-title">On this page</p>
          <ol class="legal-toc-list">${tocHtml}</ol>
        </nav>
        <article class="legal-doc is-entering">
          <header class="legal-doc-head">
            <div class="legal-chips">
              <span class="legal-chip"><i class="bi bi-patch-check" aria-hidden="true"></i>Version ${escapeHtml(data.version)}</span>
              ${data.effectiveDate ? `<span class="legal-chip is-gold"><i class="bi bi-calendar-check" aria-hidden="true"></i>Effective ${escapeHtml(fmtDate(data.effectiveDate))}</span>` : ""}
              <span class="legal-chip"><i class="bi bi-clock" aria-hidden="true"></i>${mins} min read</span>
            </div>
            <h2 class="legal-doc-title">${escapeHtml(title)}</h2>
            <p class="legal-doc-sub">${sections.length} section${sections.length === 1 ? "" : "s"}. Please review them carefully.</p>
          </header>
          ${secHtml}
          <footer class="legal-doc-foot">
            <p>Questions about this document?<small>Our team is happy to explain anything that is unclear.</small></p>
            <div class="legal-foot-actions">
              <a class="btn btn-brand" href="contact.html">Contact us</a>
              <button type="button" class="legal-top-btn" data-legal-top><i class="bi bi-arrow-up" aria-hidden="true"></i>Back to top</button>
            </div>
          </footer>
        </article>
      </div>`;

    wirePage(container);
  }

  function wirePage(container) {
    const toc = container.querySelector(".legal-toc");
    const list = container.querySelector(".legal-toc-list");
    const doc = container.querySelector(".legal-doc");
    const links = Array.from(container.querySelectorAll(".legal-toc-list a"));
    const secs = Array.from(container.querySelectorAll(".legal-sec"));
    if (!toc || !doc || !secs.length) return;

    // progress bar (one per page, reused across tab switches)
    let bar = document.getElementById("legalProgress");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "legalProgress";
      bar.className = "legal-progress";
      bar.setAttribute("aria-hidden", "true");
      bar.innerHTML = "<span></span>";
      document.body.appendChild(bar);
    }
    const barFill = bar.firstElementChild;

    const header = document.querySelector(".site-header");
    let ticking = false;
    let activeId = null;

    function headerBottom() {
      if (!header) return 0;
      return Math.max(0, header.getBoundingClientRect().bottom);
    }

    function setActive(id) {
      if (id === activeId) return;
      activeId = id;
      links.forEach((a) => {
        const on = a.getAttribute("data-sec") === id;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
        // keep the active chip visible in the horizontal strip (phones / tablets)
        if (on && list.scrollWidth > list.clientWidth + 2) {
          list.scrollTo({
            left: a.parentElement.offsetLeft - (list.clientWidth - a.offsetWidth) / 2,
            behavior: prefersReducedMotion() ? "auto" : "smooth",
          });
        }
      });
    }

    function update() {
      ticking = false;
      const hb = headerBottom();
      document.documentElement.style.setProperty("--legal-top", `${Math.round(hb + 12)}px`);
      bar.style.setProperty("--legal-bar-top", `${Math.round(hb)}px`);

      const rect = doc.getBoundingClientRect();
      const viewable = window.innerHeight - hb;
      const max = rect.height - viewable;
      const p = max > 0 ? Math.min(1, Math.max(0, (hb - rect.top) / max)) : 0;
      barFill.style.transform = `scaleX(${p})`;
      bar.classList.toggle("is-on", rect.top < hb && rect.bottom > hb);

      // active section = last one whose top has passed the reading line
      const stripH = toc.offsetHeight && window.innerWidth < 992 ? toc.offsetHeight : 0;
      const line = hb + stripH + 40;
      let current = secs[0].id;
      for (const s of secs) {
        if (s.getBoundingClientRect().top - line <= 0) current = s.id;
        else break;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = secs[secs.length - 1].id;
      }
      setActive(current);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    function goTo(id, pushHash) {
      const target = document.getElementById(id);
      if (!target) return;
      target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      if (pushHash && history.replaceState) history.replaceState(null, "", `#${id}`);
      target.classList.remove("is-flash");
      void target.offsetWidth;
      target.classList.add("is-flash");
    }

    function onClick(e) {
      const a = e.target.closest(".legal-toc-list a");
      if (a) {
        e.preventDefault();
        goTo(a.getAttribute("data-sec"), true);
        return;
      }
      if (e.target.closest("[data-legal-top]")) {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }
    }

    container.addEventListener("click", onClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    pageCleanup = () => {
      container.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      bar.classList.remove("is-on");
    };

    update();

    // deep link such as terms.html#legal-sec-3
    const hash = decodeURIComponent((location.hash || "").slice(1));
    if (hash && document.getElementById(hash) && /^legal-sec-\d+$/.test(hash)) {
      setTimeout(() => goTo(hash, false), 80);
    }
  }

  function initLegalModals() {
    document.querySelectorAll("[data-cvr-legal-modal]").forEach((modal) => {
      const type = modal.getAttribute("data-cvr-legal-modal");
      const container = modal.querySelector("[data-cvr-legal-body]");
      if (!type || !container) return;
      if (!container.id) container.id = `cvrLegalModalBody-${type}-${Math.random().toString(36).slice(2, 8)}`;

      modal.addEventListener("show.bs.modal", () => {
        if (modal.dataset.cvrLoaded === "1") return;
        modal.dataset.cvrLoaded = "1";
        loadLegalDoc(type, container.id).then(() => {
          container.querySelector(".cvr-legal-card")?.classList.add("cvr-legal-compact");
        });
      });
    });
  }

  window.cvrLoadLegalDoc = loadLegalDoc;
  window.cvrInitLegalModals = initLegalModals;
})();
