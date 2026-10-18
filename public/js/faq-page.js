

(function () {
  const state = {
    faqs: [],
    category: "All",
    search: "",
    openId: null,

    isStaff: false,
  };

  function filtered() {
    const q = state.search.trim().toLowerCase();
    return state.faqs.filter((f) => {
      const inCat = state.category === "All" || (f.category || "General") === state.category;
      const inText = !q || `${f.question} ${f.answer}`.toLowerCase().includes(q);
      return inCat && inText;
    });
  }

  function renderCategories() {
    const el = document.getElementById("faqCategories");
    if (!el) return;
    const cats = ["All", ...Array.from(new Set(state.faqs.map((f) => f.category || "General")))];
    el.innerHTML = cats
      .map(
        (c) =>
          `<button type="button" class="faq-category-pill ${c === state.category ? "active" : ""}" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`
      )
      .join("");
  }

  function renderList() {
    const el = document.getElementById("faqList");
    const countEl = document.getElementById("faqCount");
    if (!el) return;

    const items = filtered();
    if (countEl) {
      countEl.textContent = state.faqs.length
        ? `${items.length} of ${state.faqs.length} questions`
        : "";
    }

    if (!state.faqs.length) {
      el.innerHTML = `<div class="soft-card p-4 text-center text-muted-brand">No published questions yet. Please contact the front desk.</div>`;
      return;
    }
    if (!items.length) {
      el.innerHTML = `<div class="soft-card p-4 text-center text-muted-brand">No questions matched your search. Try a different term or contact the front desk.</div>`;
      return;
    }

    el.innerHTML = items
      .map((f) => {
        const open = String(state.openId) === String(f.id);

        const hidden = f.isActive === false;
        return `<div class="faq-item ${open ? "open" : ""} ${hidden ? "faq-item--hidden-preview" : ""}">
          <button type="button" class="faq-item-q" data-faq-toggle="${f.id}" aria-expanded="${open}">
            <span class="faq-item-cat">${escapeHtml(f.category || "General")}</span>
            <span class="faq-item-text">${escapeHtml(f.question)}</span>
            ${hidden ? '<span class="badge text-bg-light border faq-item-hidden-badge">Hidden from guests</span>' : ""}
            <i class="bi bi-chevron-down faq-item-chev"></i>
          </button>
          <div class="faq-item-a"><p class="mb-0">${escapeHtml(f.answer)}</p></div>
        </div>`;
      })
      .join("");
  }

  function renderStaffBanner() {
    const el = document.getElementById("faqStaffBanner");
    if (!el) return;
    if (!state.isStaff) {
      el.classList.add("d-none");
      el.innerHTML = "";
      return;
    }
    el.classList.remove("d-none");
    el.classList.add("d-flex");
    el.innerHTML = `
      <span><i class="bi bi-eye me-2"></i>Staff view: hidden FAQs are shown here (greyed out) so you can preview them. Guests only ever see published questions.</span>
      <a href="admin/site-content.html?tab=faqs" class="btn btn-sm btn-outline-primary flex-shrink-0"><i class="bi bi-pencil-square me-1"></i>Manage FAQs</a>
    `;
  }

  async function loadFaqs() {
    try {
      const { ok, body } = await cvrApiGet("content/faqs");
      state.faqs = ok && body?.success && Array.isArray(body.data?.faqs) ? body.data.faqs : [];
      state.isStaff = !!(ok && body?.success && body.data?.isStaff);
    } catch {
      state.faqs = [];
      state.isStaff = false;
    }
    renderStaffBanner();
    renderCategories();
    renderList();
  }

  window.initCVRFaqPage = function initCVRFaqPage() {
    loadFaqs();

    document.getElementById("faqSearch")?.addEventListener("input", (e) => {
      state.search = e.target.value;
      renderList();
    });

    document.getElementById("faqCategories")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-category]");
      if (!btn) return;
      state.category = btn.dataset.category;
      renderCategories();
      renderList();
    });

    document.getElementById("faqList")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-faq-toggle]");
      if (!btn) return;
      const id = btn.dataset.faqToggle;
      state.openId = String(state.openId) === String(id) ? null : id;
      renderList();
    });
  };
})();
