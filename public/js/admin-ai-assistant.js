

function initAdminAiAssistantPage() {
  const tableBody = document.getElementById("faqTableBody");
  if (!tableBody) return;

  const emptyRow = document.getElementById("faqEmptyRow");
  const searchInput = document.getElementById("faqSearchInput");
  const categoryFilter = document.getElementById("faqCategoryFilter");
  const resultCount = document.getElementById("faqResultCount");
  const alertBox = document.getElementById("faqAlert");
  const addBtn = document.getElementById("faqAddBtn");

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

  const assistantForm = document.getElementById("assistantSettingsForm");
  const assistantNameInput = document.getElementById("assistantName");
  const assistantTaglineInput = document.getElementById("assistantTagline");
  const assistantGreetingInput = document.getElementById("assistantGreeting");
  const assistantPersonaInput = document.getElementById("assistantPersona");
  const assistantAlertBox = document.getElementById("assistantSettingsAlert");
  const assistantSaveBtn = document.getElementById("assistantSettingsSaveBtn");

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

  const openEditModal = (faq) => {
    hideAlert();
    if (modalTitle) modalTitle.textContent = "Edit FAQ";
    if (formId) formId.value = String(faq.id);
    if (formQuestion) formQuestion.value = faq.question;
    if (formCategory) formCategory.value = faq.category || "";
    if (formAnswer) formAnswer.value = faq.answer;
    if (formSortOrder) formSortOrder.value = String(faq.sortOrder ?? 0);
    if (formActive) formActive.checked = !!faq.isActive;
    modal?.show();
  };

  addBtn?.addEventListener("click", openAddModal);
  searchInput?.addEventListener("input", applyFiltersAndRender);
  categoryFilter?.addEventListener("change", applyFiltersAndRender);

  tableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest(".faq-action-btn");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    const faq = latestFaqs.find((f) => f.id === id);
    if (!faq) return;
    hideAlert();

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
  });

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

  const showAssistantAlert = (message, kind) => {
    if (!assistantAlertBox) return;
    assistantAlertBox.textContent = message;
    assistantAlertBox.classList.remove("d-none", "alert-success", "alert-danger");
    assistantAlertBox.classList.add(kind === "success" ? "alert-success" : "alert-danger");
  };
  const hideAssistantAlert = () => {
    if (!assistantAlertBox) return;
    assistantAlertBox.classList.add("d-none");
    assistantAlertBox.textContent = "";
  };
  const setAssistantSaving = (saving) => {
    if (!assistantSaveBtn) return;
    assistantSaveBtn.disabled = saving;
    assistantSaveBtn.querySelector(".admin-btn-label")?.classList.toggle("d-none", saving);
    assistantSaveBtn.querySelector(".spinner-border")?.classList.toggle("d-none", !saving);
  };

  const isFullAdmin = !document.body.classList.contains("cvr-admin-staff");

  const loadAssistantSettings = async () => {
    if (!isFullAdmin || !assistantForm) return;
    const { body } = await cvrApiGet("admin/ai-settings-get");
    if (!body.success) {
      showAssistantAlert(body.message || "Could not load assistant settings.");
      return;
    }
    const s = body.data.settings;
    if (assistantNameInput) assistantNameInput.value = s.displayName || "";
    if (assistantTaglineInput) assistantTaglineInput.value = s.tagline || "";
    if (assistantGreetingInput) assistantGreetingInput.value = s.greeting || "";
    if (assistantPersonaInput) assistantPersonaInput.value = s.personaInstructions || "";
  };

  assistantForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAssistantAlert();

    const displayName = assistantNameInput?.value.trim() || "";
    const greeting = assistantGreetingInput?.value.trim() || "";
    if (!displayName) {
      showAssistantAlert("Assistant name is required.");
      return;
    }
    if (!greeting) {
      showAssistantAlert("Greeting message is required.");
      return;
    }

    setAssistantSaving(true);
    const { body } = await cvrApiPost("admin/ai-settings-save", {
      displayName,
      tagline: assistantTaglineInput?.value.trim() || "",
      greeting,
      personaInstructions: assistantPersonaInput?.value.trim() || "",
    });
    setAssistantSaving(false);

    if (!body.success) {
      showAssistantAlert(body.message || "Could not save assistant settings.");
      return;
    }
    showAssistantAlert("Assistant settings saved. Guests will see the update next time they open the FAQs page.", "success");
  });

  loadAssistantSettings();
  loadFaqs();
}

window.initAdminAiAssistantPage = initAdminAiAssistantPage;
