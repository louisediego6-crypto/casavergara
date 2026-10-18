

function initAdminSitePhotosPage() {
  const loading = document.getElementById("siteContentLoading");
  const groupsHolder = document.getElementById("siteContentGroups");
  const pageAlert = document.getElementById("siteContentAlert");
  const template = document.getElementById("siteImageCardTemplate");

  if (!groupsHolder || !template) return;

  const showPageAlert = (message, type = "danger") => {
    if (!pageAlert) return;
    pageAlert.textContent = message;
    pageAlert.className = `alert small mb-4 alert-${type}`;
  };

  const showCardAlert = (card, message, type = "danger") => {
    const el = card.querySelector('[data-role="alert"]');
    if (!el) return;
    el.textContent = message;
    el.className = `alert small py-2 mb-0 alert-${type}`;
  };
  const hideCardAlert = (card) => {
    card.querySelector('[data-role="alert"]')?.classList.add("d-none");
  };

  const setBusy = (card, busy) => {
    const btn = card.querySelector('[data-role="upload-btn"]');
    if (!btn) return;
    btn.disabled = busy;
    card.querySelector('[data-role="reset-btn"]').disabled = busy || card.dataset.isCustom !== "true";
    btn.querySelector(".spinner-border")?.classList.toggle("d-none", !busy);
  };

  const applySlotState = (card, { imageUrl, isCustom }) => {
    const thumb = card.querySelector('[data-role="thumb"]');
    const badge = card.querySelector('[data-role="badge"]');
    const resetBtn = card.querySelector('[data-role="reset-btn"]');
    if (thumb) thumb.src = imageUrl || "";
    if (badge) badge.classList.toggle("d-none", !isCustom);
    card.dataset.isCustom = isCustom ? "true" : "false";
    if (resetBtn) resetBtn.disabled = !isCustom;
  };

  const buildCard = (slot) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector('[data-role="label"]').textContent = slot.label;
    node.querySelector('[data-role="page"]').textContent = slot.page.replace(/^pages\//, "");
    const thumb = node.querySelector('[data-role="thumb"]');
    thumb.alt = slot.label;
    const card = node.querySelector(".site-image-card");
    card.dataset.slotKey = slot.slotKey;
    applySlotState(card, slot);

    const fileInput = node.querySelector('[data-role="file"]');
    const uploadBtn = node.querySelector('[data-role="upload-btn"]');
    const resetBtn = node.querySelector('[data-role="reset-btn"]');

    uploadBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      fileInput.value = "";
      if (!file) return;

      hideCardAlert(card);
      if (file.size > 5 * 1024 * 1024) {
        showCardAlert(card, "File must be smaller than 5 MB.");
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      const previousSrc = thumb.src;
      thumb.src = previewUrl;

      setBusy(card, true);
      const form = new FormData();
      form.append("slot", slot.slotKey);
      form.append("photo", file);
      const { ok, body } = await cvrApiPostForm("admin/site-image-upload", form);
      setBusy(card, false);
      URL.revokeObjectURL(previewUrl);

      if (!ok || !body?.success) {
        thumb.src = previousSrc;
        showCardAlert(card, body?.message || "Could not upload this photo. Please try again.");
        return;
      }
      applySlotState(card, { imageUrl: body.data.imageUrl, isCustom: true });
      showCardAlert(card, "Photo updated. It's live on the site now.", "success");
    });

    resetBtn.addEventListener("click", async () => {
      hideCardAlert(card);
      setBusy(card, true);
      const { ok, body } = await cvrApiPost("admin/site-image-reset", { slot: slot.slotKey });
      setBusy(card, false);
      if (!ok || !body?.success) {
        showCardAlert(card, body?.message || "Could not reset this photo. Please try again.");
        return;
      }
      applySlotState(card, { imageUrl: body.data.imageUrl, isCustom: false });
      showCardAlert(card, "Reverted to the default photo.", "success");
    });

    return node;
  };

  const load = async () => {
    const { ok, status, body } = await cvrApiGet("admin/site-images-list");
    loading?.classList.add("d-none");

    if (!ok || !body?.success) {
      if (body?.data?.suspended || status === 401 || status === 403) {
        window.location.href = "../login.html";
        return;
      }
      showPageAlert(body?.message || "Could not load site photos. Please refresh the page.");
      return;
    }

    const slots = body.data.slots || [];
    const byGroup = new Map();
    slots.forEach((slot) => {
      if (!byGroup.has(slot.group)) byGroup.set(slot.group, []);
      byGroup.get(slot.group).push(slot);
    });

    groupsHolder.innerHTML = "";
    byGroup.forEach((groupSlots, groupName) => {
      const section = document.createElement("section");
      section.className = "mb-5";
      const heading = document.createElement("h5");
      heading.className = "text-brand mb-3";
      heading.textContent = groupName;
      const row = document.createElement("div");
      row.className = "row g-4";
      groupSlots.forEach((slot) => row.appendChild(buildCard(slot)));
      section.appendChild(heading);
      section.appendChild(row);
      groupsHolder.appendChild(section);
    });

    groupsHolder.classList.remove("d-none");
  };

  load();
}

function initAdminSiteTextPage() {
  const loading = document.getElementById("siteTextLoading");
  const groupsHolder = document.getElementById("siteTextGroups");
  const pageAlert = document.getElementById("siteTextAlert");
  const template = document.getElementById("siteTextCardTemplate");

  if (!groupsHolder || !template) return;

  const showPageAlert = (message, type = "danger") => {
    if (!pageAlert) return;
    pageAlert.textContent = message;
    pageAlert.className = `alert small mb-4 alert-${type}`;
  };

  const showCardAlert = (card, message, type = "danger") => {
    const el = card.querySelector('[data-role="alert"]');
    if (!el) return;
    el.textContent = message;
    el.className = `alert small py-2 mb-0 alert-${type}`;
  };
  const hideCardAlert = (card) => {
    card.querySelector('[data-role="alert"]')?.classList.add("d-none");
  };

  const setBusy = (card, busy) => {
    const btn = card.querySelector('[data-role="save-btn"]');
    if (!btn) return;
    btn.disabled = busy;
    card.querySelector('[data-role="reset-btn"]').disabled = busy || card.dataset.isCustom !== "true";
    btn.querySelector(".spinner-border")?.classList.toggle("d-none", !busy);
  };

  const getInput = (card) =>
    card.dataset.type === "textarea"
      ? card.querySelector('[data-role="input-textarea"]')
      : card.querySelector('[data-role="input-text"]');

  const applyFieldState = (card, { value, isCustom }) => {
    const badge = card.querySelector('[data-role="badge"]');
    const resetBtn = card.querySelector('[data-role="reset-btn"]');
    getInput(card).value = value || "";
    if (badge) badge.classList.toggle("d-none", !isCustom);
    card.dataset.isCustom = isCustom ? "true" : "false";
    if (resetBtn) resetBtn.disabled = !isCustom;
  };

  const buildCard = (field) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector('[data-role="label"]').textContent = field.label;
    node.querySelector('[data-role="page"]').textContent = field.page.replace(/^pages\//, "").replace(/^components\//, "");
    const card = node.querySelector(".site-text-card");
    card.dataset.textKey = field.textKey;
    card.dataset.type = field.type;

    const textInput = node.querySelector('[data-role="input-text"]');
    const textareaInput = node.querySelector('[data-role="input-textarea"]');
    if (field.type === "textarea") {
      textInput.classList.add("d-none");
      textareaInput.classList.remove("d-none");
    } else {
      textareaInput.classList.add("d-none");
      textInput.classList.remove("d-none");
    }

    applyFieldState(card, field);

    const saveBtn = node.querySelector('[data-role="save-btn"]');
    const resetBtn = node.querySelector('[data-role="reset-btn"]');

    saveBtn.addEventListener("click", async () => {
      const value = getInput(card).value.trim();
      hideCardAlert(card);
      if (!value) {
        showCardAlert(card, "This field can't be left blank. Use Reset to restore the default wording.");
        return;
      }
      setBusy(card, true);
      const { ok, body } = await cvrApiPost("admin/site-text-save", { key: field.textKey, value });
      setBusy(card, false);
      if (!ok || !body?.success) {
        showCardAlert(card, body?.message || "Could not save this text. Please try again.");
        return;
      }
      applyFieldState(card, { value: body.data.value, isCustom: true });
      showCardAlert(card, "Saved. It's live on the site now.", "success");
    });

    resetBtn.addEventListener("click", async () => {
      hideCardAlert(card);
      setBusy(card, true);
      const { ok, body } = await cvrApiPost("admin/site-text-reset", { key: field.textKey });
      setBusy(card, false);
      if (!ok || !body?.success) {
        showCardAlert(card, body?.message || "Could not reset this field. Please try again.");
        return;
      }
      applyFieldState(card, { value: body.data.value, isCustom: false });
      showCardAlert(card, "Reverted to the default wording.", "success");
    });

    return node;
  };

  const load = async () => {
    const { ok, status, body } = await cvrApiGet("admin/site-text-list");
    loading?.classList.add("d-none");

    if (!ok || !body?.success) {
      if (body?.data?.suspended || status === 401 || status === 403) {
        window.location.href = "../login.html";
        return;
      }
      showPageAlert(body?.message || "Could not load page text. Please refresh the page.");
      return;
    }

    const fields = body.data.fields || [];
    const byGroup = new Map();
    fields.forEach((field) => {
      if (!byGroup.has(field.group)) byGroup.set(field.group, []);
      byGroup.get(field.group).push(field);
    });

    groupsHolder.innerHTML = "";
    byGroup.forEach((groupFields, groupName) => {
      const section = document.createElement("section");
      section.className = "mb-5";
      const heading = document.createElement("h5");
      heading.className = "text-brand mb-3";
      heading.textContent = groupName;
      const row = document.createElement("div");
      row.className = "row g-3";
      groupFields.forEach((field) => row.appendChild(buildCard(field)));
      section.appendChild(heading);
      section.appendChild(row);
      groupsHolder.appendChild(section);
    });

    groupsHolder.classList.remove("d-none");
  };

  load();
}
