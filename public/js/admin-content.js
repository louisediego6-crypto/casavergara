

function initAdminContentPage() {
  const sectionsEl = document.getElementById("contentSections");
  if (!sectionsEl) return;

  const loadingEl = document.getElementById("contentLoading");
  const emptyEl = document.getElementById("contentEmpty");
  const alertBox = document.getElementById("contentAlert");

  const textTpl = document.getElementById("contentFieldTextTpl");
  const textareaTpl = document.getElementById("contentFieldTextareaTpl");
  const imageTpl = document.getElementById("contentFieldImageTpl");

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

  const setBtnBusy = (btn, busy) => {
    if (!btn) return;
    btn.disabled = busy;
    btn.querySelector(".admin-btn-label")?.classList.toggle("d-none", busy);
    btn.querySelector(".spinner-border")?.classList.toggle("d-none", !busy);
  };

  function buildTextField(item) {
    const isTextarea = item.type === "textarea";
    const node = (isTextarea ? textareaTpl : textTpl).content.cloneNode(true);
    const wrap = node.querySelector(".content-field");
    const label = node.querySelector(".content-field-label");
    const input = node.querySelector(".content-field-input");
    const saveBtn = node.querySelector(".content-field-save");

    label.textContent = item.label;
    label.setAttribute("for", `contentField_${item.key}`);
    input.id = `contentField_${item.key}`;
    input.value = item.textValue || "";

    let original = input.value;

    input.addEventListener("input", () => {
      saveBtn.disabled = input.value === original;
    });

    saveBtn.addEventListener("click", async () => {
      hideAlert();
      setBtnBusy(saveBtn, true);
      try {
        const { body } = await cvrApiPost("admin/content-save", {
          key: item.key,
          textValue: input.value,
        });
        if (!body.success) {
          showAlert(body.message || "Could not save that field.", "danger");
          setBtnBusy(saveBtn, false);
          saveBtn.disabled = false;
          return;
        }
        original = input.value;
        saveBtn.disabled = true;
        cvrToast(`"${item.label}" saved.`, "success");
      } catch {
        showAlert("Could not save that field. Please check your connection.", "danger");
        saveBtn.disabled = false;
      } finally {
        setBtnBusy(saveBtn, false);
        saveBtn.disabled = input.value === original;
      }
    });

    return wrap;
  }

  function buildImageField(item) {
    const node = imageTpl.content.cloneNode(true);
    const wrap = node.querySelector(".content-field");
    const label = node.querySelector(".content-field-label");
    const img = node.querySelector(".content-field-photo");
    const busyOverlay = node.querySelector(".content-field-photo-busy");
    const fileInput = node.querySelector(".content-field-file");

    label.textContent = item.label;
    img.alt = item.label;
    img.src = item.imageUrl || assetUrl("images/logo.png");

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      hideAlert();
      if (file.size > 5 * 1024 * 1024) {
        showAlert("Photo must be smaller than 5 MB.", "danger");
        fileInput.value = "";
        return;
      }
      busyOverlay.classList.remove("d-none");
      busyOverlay.classList.add("d-flex");
      fileInput.disabled = true;
      try {
        const formData = new FormData();
        formData.append("key", item.key);
        formData.append("photo", file);
        const { body } = await cvrApiPostForm("admin/content-photo", formData);
        if (!body.success) {
          showAlert(body.message || "Could not upload that photo.", "danger");
          return;
        }
        img.src = body.data.imageUrl;
        cvrToast(`"${item.label}" updated.`, "success");
      } catch {
        showAlert("Could not upload that photo. Please check your connection.", "danger");
      } finally {
        busyOverlay.classList.add("d-none");
        busyOverlay.classList.remove("d-flex");
        fileInput.disabled = false;
        fileInput.value = "";
      }
    });

    return wrap;
  }

  function render(items) {
    sectionsEl.innerHTML = "";

    const bySection = new Map();
    items.forEach((item) => {
      if (!bySection.has(item.section)) bySection.set(item.section, []);
      bySection.get(item.section).push(item);
    });

    bySection.forEach((fields, sectionName) => {
      const card = document.createElement("div");
      card.className = "soft-card p-4 mb-4";

      const heading = document.createElement("h5");
      heading.className = "text-brand mb-3";
      heading.textContent = sectionName;
      card.appendChild(heading);

      const row = document.createElement("div");
      row.className = "row g-4";

      fields.forEach((item) => {
        const fieldEl = item.type === "image" ? buildImageField(item) : buildTextField(item);
        row.appendChild(fieldEl);
      });

      card.appendChild(row);
      sectionsEl.appendChild(card);
    });
  }

  (async function load() {
    try {
      const { body } = await cvrApiGet("admin/content-list");
      loadingEl?.classList.add("d-none");
      if (!body.success) {
        showAlert(body.message || "Could not load site content.", "danger");
        return;
      }
      const items = body.data?.items || [];
      if (!items.length) {
        emptyEl?.classList.remove("d-none");
        return;
      }
      sectionsEl.classList.remove("d-none");
      render(items);
    } catch {
      loadingEl?.classList.add("d-none");
      showAlert("Could not load site content. Please check your connection.", "danger");
    }
  })();
}
