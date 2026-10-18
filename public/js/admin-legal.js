

function initAdminLegalPage() {
  const tabs = document.getElementById("adminLegalTabs");
  if (!tabs) return;

  const titleEl = document.getElementById("adminLegalDocTitle");
  const versionInfoEl = document.getElementById("adminLegalCurrentVersion");
  const versionInput = document.getElementById("adminLegalVersion");
  const contentInput = document.getElementById("adminLegalContent");
  const saveBtn = document.getElementById("adminLegalSaveBtn");
  const previewBtn = document.getElementById("adminLegalPreviewBtn");
  const previewBox = document.getElementById("adminLegalPreview");
  const alertBox = document.getElementById("adminLegalAlert");

  const TITLES = {
    privacy: "Privacy Policy",
    room: "Terms & Conditions — Room Bookings",
    event: "Terms & Conditions — Event Bookings",
  };

  let activeType = "privacy";

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

  const bumpVersion = (v) => {
    const parts = String(v || "1.0").split(".").map((n) => parseInt(n, 10) || 0);
    parts[parts.length - 1] += 1;
    return parts.join(".");
  };

  const parseSections = (content) => {
    return content
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean)
      .map((block) => {
        const m = block.match(/^##\s*(.+?)\n([\s\S]*)$/);
        return m ? { title: m[1].trim(), body: m[2].trim() } : { title: "", body: block };
      });
  };

  const renderPreview = () => {
    const sections = parseSections(contentInput.value || "");
    if (!sections.length) {
      previewBox.innerHTML = `<p class="text-muted-brand small">Nothing to preview yet.</p>`;
      return;
    }
    previewBox.innerHTML = sections
      .map(
        (s, i) => `
        <div class="cvr-legal-section">
          <span class="cvr-legal-index">${i + 1}</span>
          <div>
            ${s.title ? `<h2 class="h6 fw-bold mb-2">${escapeHtml(s.title)}</h2>` : ""}
            <p class="text-muted-brand mb-0" style="white-space: pre-line;">${escapeHtml(s.body)}</p>
          </div>
        </div>`
      )
      .join("");
  };

  const loadType = async (type, { preserveAlert } = {}) => {
    activeType = type;
    if (!preserveAlert) hideAlert();
    if (titleEl) titleEl.textContent = TITLES[type] || type;
    if (versionInfoEl) versionInfoEl.textContent = "Loading…";
    if (contentInput) contentInput.value = "";
    previewBox.innerHTML = `<p class="text-muted-brand small">Click "Preview" to see how this will look on the website.</p>`;

    const { body } = await cvrApiGet(`admin/legal-get?type=${encodeURIComponent(type)}`);
    if (!body.success) {
      showAlert(body.message || "Could not load this document.");
      if (versionInfoEl) versionInfoEl.textContent = "";
      return;
    }
    contentInput.value = body.data.content || "";
    versionInput.value = bumpVersion(body.data.version);
    if (versionInfoEl) {
      versionInfoEl.textContent = body.data.exists
        ? `Currently live: v${body.data.version}`
        : "Not published yet";
    }
  };

  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-type]");
    if (!btn) return;
    tabs.querySelectorAll(".nav-link").forEach((el) => el.classList.remove("active"));
    btn.classList.add("active");
    loadType(btn.dataset.type);
  });

  previewBtn?.addEventListener("click", renderPreview);

  saveBtn?.addEventListener("click", async () => {
    hideAlert();
    const version = versionInput?.value.trim() || "";
    const content = contentInput?.value || "";
    if (!version) {
      showAlert("Please enter a version number.");
      return;
    }
    if (!content.trim()) {
      showAlert("Content cannot be empty.");
      return;
    }
    if (!(await cvrConfirmAction({
      title: `Publish version ${version}?`,
      message: `Publish version ${version} of ${TITLES[activeType]}? This immediately replaces what guests see on the site.`,
      confirmLabel: "Publish",
      confirmClass: "btn-brand",
      icon: "bi-upload",
    }))) {
      return;
    }
    saveBtn.disabled = true;
    const { body } = await cvrApiPost("admin/legal-save", {
      bookingType: activeType,
      version,
      content,
    });
    saveBtn.disabled = false;
    if (!body.success) {
      showAlert(body.message || "Could not publish this document.");
      return;
    }
    showAlert(`Published v${body.data.version}.`, "success");
    await loadType(activeType, { preserveAlert: true });
  });

  loadType(activeType);
}

window.initAdminLegalPage = initAdminLegalPage;
