

function initAdminFaqsPage() {

  const tableBody = document.getElementById("faqTableBody");
  if (!tableBody) return;

  const emptyRow = document.getElementById("faqEmptyRow");
  const searchInput = document.getElementById("faqSearchInput");
  const categoryFilter = document.getElementById("faqCategoryFilter");
  const resultCount = document.getElementById("faqResultCount");
  const alertBox = document.getElementById("faqAlert");
  const addBtn = document.getElementById("faqAddBtn");

  const tableView = document.getElementById("faqTableView");
  const cardsView = document.getElementById("faqCardsView");
  const cardsWrap = document.getElementById("faqCardsWrap");
  const cardsEmpty = document.getElementById("faqCardsEmpty");
  const viewBtns = Array.from(document.querySelectorAll("[data-view]"));
  const roleNote = document.getElementById("faqRoleNote");

  const isAdmin = isFullAdminSession(getCustomerSession());
  const canEdit = isStaffSession(getCustomerSession());
  let currentView = "table";

  if (roleNote) {
    roleNote.textContent = isAdmin
      ? "Admin view: you can add, edit, hide and delete FAQs, and switch to Preview to see them the way guests do."
      : "Staff view: you can add, edit and show/hide FAQs. Deleting an FAQ permanently is admin-only. Switch to Preview to read the FAQs the way guests do.";
    roleNote.classList.remove("d-none", "alert-info", "alert-secondary");
    roleNote.classList.add(isAdmin ? "alert-info" : "alert-secondary");
  }

  const modalEl = document.getElementById("faqModal");
  const modal = modalEl && window.bootstrap ? new bootstrap.Modal(modalEl) : null;
  const modalTitle = document.getElementById("faqModalLabel");
  const form = document.getElementById("faqForm");
  const formId = document.getElementById("faqFormId");
  const formQuestion = document.getElementById("faqFormQuestion");
  const formCategory = document.getElementById("faqFormCategory");
  const formAnswer = document.getElementById("faqFormAnswer");
  const formSortOrder = document.getElementById("faqFormSortOrder");
  const formActive = document.getElementById("faqFormActive");
  const saveBtn = document.getElementById("faqSaveBtn");
  const categoryOptions = document.getElementById("faqCategoryOptions");

  let latestFaqs = [];

  const showAlert = (message, kind) => {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none", "alert-success", "alert-danger");
    alertBox.classList.add(kind === "success" ? "alert-success" : "alert-danger");
  };
  const hideAlert = () => {
    if (!alertBox) return;
    alertBox.classList.add("d-none");
    alertBox.textContent = "";
  };

  const setSaving = (saving) => {
    if (!saveBtn) return;
    saveBtn.disabled = saving;
    saveBtn.querySelector(".admin-btn-label")?.classList.toggle("d-none", saving);
    saveBtn.querySelector(".spinner-border")?.classList.toggle("d-none", !saving);
  };

  const refreshCategoryUI = () => {
    const cats = Array.from(new Set(latestFaqs.map((f) => f.category || "General"))).sort((a, b) =>
      a.localeCompare(b)
    );

    if (categoryFilter) {
      const current = categoryFilter.value || "all";
      categoryFilter.innerHTML =
        `<option value="all">All categories</option>` +
        cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
      categoryFilter.value = cats.includes(current) ? current : "all";
    }
    if (categoryOptions) {
      categoryOptions.innerHTML = cats.map((c) => `<option value="${escapeHtml(c)}"></option>`).join("");
    }
  };

  const statusBadge = (isActive) =>
    isActive
      ? `<span class="badge text-bg-success">Visible</span>`
      : `<span class="badge text-bg-light border">Hidden</span>`;

  const renderCards = (filtered) => {
    if (!cardsWrap) return;

    if (!filtered.length) {
      cardsWrap.innerHTML = "";
      cardsEmpty?.classList.remove("d-none");
      return;
    }
    cardsEmpty?.classList.add("d-none");

    const groups = new Map();
    filtered.forEach((f) => {
      const cat = f.category || "General";
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(f);
    });

    cardsWrap.innerHTML = Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, items], gi) => {
        const sorted = items.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        const panels = sorted
          .map((f) => {
            const collapseId = `faqPreview-${gi}-${f.id}`;
            const actions = canEdit
              ? `<div class="d-flex gap-2 mt-3 flex-wrap">
                   <button type="button" class="btn btn-sm btn-outline-secondary faq-action-btn" data-action="edit" data-id="${f.id}">Edit</button>
                   <button type="button" class="btn btn-sm btn-outline-secondary faq-action-btn" data-action="toggle" data-id="${f.id}">${f.isActive ? "Hide from guests" : "Show to guests"}</button>
                 </div>`
              : "";
            return `
              <div class="accordion-item ${f.isActive ? "" : "opacity-75"}">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}">
                    <span class="flex-grow-1 pe-3">${escapeHtml(f.question)}</span>
                    ${f.isActive ? "" : '<span class="badge text-bg-light border me-2">Hidden</span>'}
                  </button>
                </h2>
                <div id="${collapseId}" class="accordion-collapse collapse" data-bs-parent="#faqPreviewGroup${gi}">
                  <div class="accordion-body">
                    <p class="mb-0" style="white-space:pre-wrap;">${escapeHtml(f.answer)}</p>
                    ${actions}
                  </div>
                </div>
              </div>`;
          })
          .join("");

        return `
          <div class="soft-card p-3 mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
              <h2 class="h6 text-brand mb-0"><i class="bi bi-folder2-open me-2"></i>${escapeHtml(category)}</h2>
              <span class="badge text-bg-light border">${sorted.length} question${sorted.length === 1 ? "" : "s"}</span>
            </div>
            <div class="accordion" id="faqPreviewGroup${gi}">${panels}</div>
          </div>`;
      })
      .join("");
  };

  const switchView = (view) => {
    currentView = view === "cards" ? "cards" : "table";
    tableView?.classList.toggle("d-none", currentView !== "table");
    cardsView?.classList.toggle("d-none", currentView !== "cards");
    viewBtns.forEach((b) => b.classList.toggle("active", b.dataset.view === currentView));
    try {
      localStorage.setItem("cvrAdminFaqView", currentView);
    } catch {}
  };

  const applyFiltersAndRender = () => {
    const q = (searchInput?.value || "").trim().toLowerCase();
    const category = categoryFilter?.value || "all";

    const filtered = latestFaqs.filter((f) => {
      if (category !== "all" && (f.category || "General") !== category) return false;
      if (q) {
        const hay = `${f.question} ${f.answer}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (resultCount) resultCount.textContent = String(filtered.length);

    renderCards(filtered);

    if (!filtered.length) {
      tableBody.innerHTML = "";
      emptyRow?.classList.remove("d-none");
      return;
    }
    emptyRow?.classList.add("d-none");

    tableBody.innerHTML = filtered
      .map(
        (f) => `
        <tr data-id="${f.id}">
          <td data-label="Question">
            <div class="fw-semibold">${escapeHtml(f.question)}</div>
            <div class="small text-muted-brand text-truncate" style="max-width: 420px;">${escapeHtml(f.answer)}</div>
          </td>
          <td data-label="Category"><span class="badge text-bg-light border">${escapeHtml(f.category || "General")}</span></td>
          <td data-label="Order" class="small text-muted-brand">${f.sortOrder}</td>
          <td data-label="Status">${statusBadge(f.isActive)}</td>
          <td data-label="Actions" class="text-end">
            <div class="d-flex gap-2 justify-content-end flex-nowrap faq-row-actions">
              <button type="button" class="btn btn-sm btn-outline-secondary faq-action-btn" data-action="view" data-id="${f.id}" title="View"><i class="bi bi-eye"></i></button>
              <button type="button" class="btn btn-sm btn-outline-secondary faq-action-btn" data-action="toggle" data-id="${f.id}">
                ${f.isActive ? "Hide" : "Show"}
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary faq-action-btn" data-action="edit" data-id="${f.id}">Edit</button>
              <button type="button" class="btn btn-sm btn-outline-danger faq-action-btn admin-only-action" data-action="delete" data-id="${f.id}">Delete</button>
            </div>
          </td>
        </tr>`
      )
      .join("");
  };

  const loadFaqs = async () => {
    const { body } = await cvrApiGet("admin/faqs-list");
    if (!body.success) {
      showAlert(body.message || "Could not load FAQs.");
      return;
    }
    latestFaqs = body.data.faqs || [];
    refreshCategoryUI();
    applyFiltersAndRender();
  };

  const openAddModal = () => {
    hideAlert();
    if (modalTitle) modalTitle.textContent = "Add FAQ";
    form?.reset();
    if (formId) formId.value = "0";
    if (formSortOrder) formSortOrder.value = "0";
    if (formActive) formActive.checked = true;
    modal?.show();
  };

  const formFields = [formQuestion, formCategory, formAnswer, formSortOrder, formActive];
  const setFormReadOnly = (readOnly) => {
    formFields.forEach((el) => {
      if (!el) return;
      if (el.tagName === "SELECT" || el.type === "checkbox") el.disabled = readOnly;
      else el.readOnly = readOnly;
    });
    saveBtn?.classList.toggle("d-none", readOnly);
  };

  const openEditModal = (faq, readOnly = false) => {
    hideAlert();
    if (modalTitle) modalTitle.textContent = readOnly ? "View FAQ" : "Edit FAQ";
    if (formId) formId.value = String(faq.id);
    if (formQuestion) formQuestion.value = faq.question;
    if (formCategory) formCategory.value = faq.category || "";
    if (formAnswer) formAnswer.value = faq.answer;
    if (formSortOrder) formSortOrder.value = String(faq.sortOrder ?? 0);
    if (formActive) formActive.checked = !!faq.isActive;
    setFormReadOnly(readOnly);
    modal?.show();
  };

  modalEl?.addEventListener("hidden.bs.modal", () => setFormReadOnly(false));

  viewBtns.forEach((b) => b.addEventListener("click", () => switchView(b.dataset.view)));
  try {
    switchView(localStorage.getItem("cvrAdminFaqView") || "table");
  } catch {
    switchView("table");
  }

  addBtn?.addEventListener("click", openAddModal);
  searchInput?.addEventListener("input", applyFiltersAndRender);
  categoryFilter?.addEventListener("change", applyFiltersAndRender);

  const handleRowAction = async (e) => {
    const btn = e.target.closest(".faq-action-btn");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    const faq = latestFaqs.find((f) => f.id === id);
    if (!faq) return;
    hideAlert();

    if (action === "view") {
      openEditModal(faq, true);
      return;
    }

    if (action === "edit") {
      openEditModal(faq);
      return;
    }

    if (action === "delete") {
      if (!window.confirm(`Permanently delete "${faq.question}"? This cannot be undone.`)) return;
      const { body } = await cvrApiPost("admin/faqs-delete", { id });
      if (!body.success) {
        showAlert(body.message || "Could not delete this FAQ.");
        return;
      }
      showAlert("FAQ deleted.", "success");
      loadFaqs();
      return;
    }

    if (action === "toggle") {
      const { body } = await cvrApiPost("admin/faqs-save", {
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        sortOrder: faq.sortOrder,
        isActive: !faq.isActive,
      });
      if (!body.success) {
        showAlert(body.message || "Could not update this FAQ.");
        return;
      }
      loadFaqs();
    }
  };

  tableBody.addEventListener("click", handleRowAction);
  cardsWrap?.addEventListener("click", handleRowAction);

  saveBtn?.addEventListener("click", async () => {
    hideAlert();
    const question = formQuestion?.value.trim() || "";
    const answer = formAnswer?.value.trim() || "";
    if (!question) {
      showAlert("Question is required.");
      return;
    }
    if (!answer) {
      showAlert("Answer is required.");
      return;
    }

    setSaving(true);
    const { body } = await cvrApiPost("admin/faqs-save", {
      id: Number(formId?.value || 0),
      question,
      answer,
      category: formCategory?.value.trim() || "General",
      sortOrder: Number(formSortOrder?.value || 0),
      isActive: !!formActive?.checked,
    });
    setSaving(false);

    if (!body.success) {
      showAlert(body.message || "Could not save this FAQ.");
      return;
    }
    modal?.hide();
    showAlert("FAQ saved.", "success");
    loadFaqs();
  });

  loadFaqs();
}

window.initAdminFaqsPage = initAdminFaqsPage;
