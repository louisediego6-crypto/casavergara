

function initAdminTeamPage() {
  const tableBody = document.getElementById("teamTableBody");
  if (!tableBody) return;

  const emptyRow = document.getElementById("teamEmptyRow");
  const alertBox = document.getElementById("teamAlert");
  const addBtn = document.getElementById("teamAddBtn");

  const modalEl = document.getElementById("teamEditModal");
  const modal = modalEl ? new bootstrap.Modal(modalEl) : null;
  const modalLabel = document.getElementById("teamEditModalLabel");
  const editAlert = document.getElementById("teamEditAlert");
  const fId = document.getElementById("teamEditId");
  const fName = document.getElementById("teamEditName");
  const fRole = document.getElementById("teamEditRole");
  const fEmail = document.getElementById("teamEditEmail");
  const fPhoto = document.getElementById("teamEditPhoto");
  const fPhotoFile = document.getElementById("teamEditPhotoFile");
  const photoPreview = document.getElementById("teamEditPhotoPreview");
  const photoClear = document.getElementById("teamEditPhotoClear");
  const photoEmpty = document.getElementById("teamEditPhotoEmpty");
  const fBio = document.getElementById("teamEditBio");
  const fFacts = document.getElementById("teamEditFacts");
  const fOrder = document.getElementById("teamEditOrder");
  const fVisible = document.getElementById("teamEditVisible");
  const saveBtn = document.getElementById("teamEditSaveBtn");

  let members = [];

  const showAlert = (message, kind) => {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none", "alert-success", "alert-danger");
    alertBox.classList.add(kind === "success" ? "alert-success" : "alert-danger");
  };
  const hideAlert = () => alertBox?.classList.add("d-none");
  const showEditError = (message) => {
    if (!editAlert) return;
    editAlert.textContent = message;
    editAlert.classList.remove("d-none");
  };
  const hideEditError = () => editAlert?.classList.add("d-none");

  const render = () => {
    if (!members.length) {
      tableBody.innerHTML = "";
      emptyRow?.classList.remove("d-none");
      return;
    }
    emptyRow?.classList.add("d-none");
    tableBody.innerHTML = members
      .map(
        (m) => `
        <tr data-id="${m.id}">
          <td>
            ${
              m.photo
                ? `<img src="${escapeHtml(m.photo)}" alt="${escapeHtml(m.name)}" class="rounded-circle" style="width:48px;height:48px;object-fit:cover;">`
                : `<span class="badge text-bg-light border"><i class="bi bi-person"></i></span>`
            }
          </td>
          <td>
            <div class="fw-semibold">${escapeHtml(m.name)}</div>
            <div class="small text-muted-brand">${escapeHtml(m.role)}</div>
          </td>
          <td class="small">${m.email ? escapeHtml(m.email) : `<span class="text-muted-brand fst-italic">Not set</span>`}</td>
          <td><div class="small text-truncate" style="max-width:320px;">${escapeHtml(m.bio || "")}</div></td>
          <td class="small text-muted-brand">${m.sortOrder}</td>
          <td>${
            m.visible
              ? `<span class="badge text-bg-success">Visible</span>`
              : `<span class="badge text-bg-secondary">Hidden</span>`
          }</td>
          <td class="text-end">
            <button type="button" class="btn btn-sm btn-outline-secondary team-view-btn" data-id="${m.id}" title="View profile"><i class="bi bi-eye"></i></button>
            <button type="button" class="btn btn-sm btn-outline-primary team-edit-btn" data-id="${m.id}"><i class="bi bi-pencil"></i></button>
            <button type="button" class="btn btn-sm btn-outline-secondary team-toggle-btn" data-id="${m.id}" title="${m.visible ? "Hide" : "Show"} on About page"><i class="bi ${m.visible ? "bi-eye-slash" : "bi-eye"}"></i></button>
            <button type="button" class="btn btn-sm btn-outline-danger team-delete-btn" data-id="${m.id}"><i class="bi bi-trash"></i></button>
          </td>
        </tr>`
      )
      .join("");
  };

  const load = async () => {
    const { body } = await cvrApiGet("admin/team-list");
    if (!body.success) {
      showAlert(body.message || "Could not load team profiles.");
      return;
    }
    hideAlert();
    members = body.data.members || [];
    render();
  };

  const syncPhotoPreview = () => {
    const val = (fPhoto?.value || "").trim();
    if (!photoPreview) return;
    if (val) {
      photoPreview.src = val;
      photoPreview.classList.remove("d-none");
      photoEmpty?.classList.add("d-none");
      photoClear?.classList.remove("d-none");
    } else {
      photoPreview.src = "";
      photoPreview.classList.add("d-none");
      photoEmpty?.classList.remove("d-none");
      photoClear?.classList.add("d-none");
    }
  };

  fPhoto?.addEventListener("input", syncPhotoPreview);

  photoClear?.addEventListener("click", () => {
    if (fPhoto) fPhoto.value = "";
    if (fPhotoFile) fPhotoFile.value = "";
    syncPhotoPreview();
  });

  fPhotoFile?.addEventListener("change", async () => {
    const file = fPhotoFile.files?.[0];
    if (!file) return;
    hideEditError();
    if (file.size > 3 * 1024 * 1024) {
      showEditError("Photo must be smaller than 3 MB.");
      fPhotoFile.value = "";
      return;
    }
    fPhotoFile.disabled = true;
    try {
      const data = new FormData();
      data.append("photo", file);
      const { body } = await cvrApiPostForm("admin/team-photo", data);
      if (!body.success) {
        showEditError(body.message || "Could not upload the photo.");
        fPhotoFile.value = "";
        return;
      }
      if (fPhoto) fPhoto.value = body.data.photoUrl || body.data.photoPath || "";
      syncPhotoPreview();
      cvrToast("Photo uploaded. Save the profile to publish it.", "success");
    } catch {
      showEditError("Could not upload the photo. Please check your connection.");
    } finally {
      fPhotoFile.disabled = false;
    }
  });

  const openModal = (m) => {
    hideEditError();
    fId.value = String(m?.id || 0);
    fName.value = m?.name || "";
    fRole.value = m?.role || "";
    if (fEmail) fEmail.value = m?.email || "";
    fPhoto.value = m?.photo || "";
    if (fPhotoFile) fPhotoFile.value = "";
    syncPhotoPreview();
    fBio.value = m?.bio || "";
    fFacts.value = m?.facts || "";
    fOrder.value = String(m?.sortOrder ?? 0);
    fVisible.checked = m ? !!m.visible : true;
    if (modalLabel) modalLabel.textContent = m ? "Edit team profile" : "Add team member";
    modal?.show();
    setTimeout(() => fName?.focus(), 300);
  };

  addBtn?.addEventListener("click", () => openModal(null));

  const save = async (payload) => {
    const { body } = await cvrApiPost("admin/team-save", payload);
    return body;
  };

  saveBtn?.addEventListener("click", async () => {
    hideEditError();
    const payload = {
      id: Number(fId.value) || 0,
      name: fName.value.trim(),
      role: fRole.value.trim(),
      email: (fEmail?.value || "").trim(),
      photo: fPhoto.value.trim(),
      bio: fBio.value.trim(),
      facts: fFacts.value,
      sortOrder: Number(fOrder.value) || 0,
      visible: fVisible.checked,
    };
    if (!payload.name || !payload.role) {
      showEditError("Name and role are both required.");
      return;
    }
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      showEditError('Please enter a valid email address for "Get in touch" (or leave it blank).');
      return;
    }

    const label = saveBtn.querySelector(".admin-btn-label");
    const spinner = saveBtn.querySelector(".spinner-border");
    saveBtn.disabled = true;
    label?.classList.add("d-none");
    spinner?.classList.remove("d-none");
    try {
      const body = await save(payload);
      if (!body.success) {
        showEditError(body.message || "Could not save the profile.");
        return;
      }
      modal?.hide();
      cvrToast("Team profile saved. The About Us page is updated.", "success");
      load();
    } catch {
      showEditError("Could not save the profile. Please check your connection.");
    } finally {
      saveBtn.disabled = false;
      label?.classList.remove("d-none");
      spinner?.classList.add("d-none");
    }
  });

  const viewModalEl = document.getElementById("teamViewModal");
  const viewModal = viewModalEl ? new bootstrap.Modal(viewModalEl) : null;
  const viewEditBtn = document.getElementById("teamViewEditBtn");
  let viewingId = 0;

  const openViewModal = (m) => {
    if (!viewModalEl) return;
    viewingId = m.id;
    const photo = document.getElementById("teamViewPhoto");
    photo.src = m.photo || "";
    photo.alt = m.name || "";
    document.getElementById("teamViewRole").textContent = m.role || "";
    document.getElementById("teamViewName").textContent = m.name || "";
    const badge = document.getElementById("teamViewVisible");
    badge.textContent = m.visible ? "Visible on About Us" : "Hidden";
    badge.className = `badge mb-3 ${m.visible ? "text-bg-success" : "text-bg-secondary"}`;
    const emailEl = document.getElementById("teamViewEmail");
    if (emailEl) {
      emailEl.innerHTML = m.email
        ? `<i class="bi bi-envelope me-1"></i>${escapeHtml(m.email)}`
        : `<span class="fst-italic">No email set — "Get in touch" will link to the Contact page instead.</span>`;
    }
    document.getElementById("teamViewBio").textContent = m.bio || "No bio yet.";
    const facts = Array.isArray(m.facts)
      ? m.facts
      : String(m.facts || "")
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean);
    document.getElementById("teamViewFacts").innerHTML = facts
      .map((f) => `<li class="mb-1"><i class="bi bi-check2 text-primary me-2"></i>${escapeHtml(f)}</li>`)
      .join("");
    viewModal?.show();
  };

  viewEditBtn?.addEventListener("click", () => {
    const m = members.find((row) => row.id === viewingId);
    viewModal?.hide();
    if (m) openModal(m);
  });

  tableBody.addEventListener("click", async (e) => {
    const viewBtn = e.target.closest(".team-view-btn");
    if (viewBtn) {
      const m = members.find((row) => row.id === Number(viewBtn.dataset.id));
      if (m) openViewModal(m);
      return;
    }

    const editBtn = e.target.closest(".team-edit-btn");
    if (editBtn) {
      const m = members.find((row) => row.id === Number(editBtn.dataset.id));
      if (m) openModal(m);
      return;
    }

    const toggleBtn = e.target.closest(".team-toggle-btn");
    if (toggleBtn) {
      const m = members.find((row) => row.id === Number(toggleBtn.dataset.id));
      if (!m) return;
      toggleBtn.disabled = true;
      const body = await save({ ...m, visible: !m.visible });
      toggleBtn.disabled = false;
      if (!body.success) {
        showAlert(body.message || "Could not update visibility.");
        return;
      }
      cvrToast(m.visible ? "Profile hidden from the About page." : "Profile is now visible.", "success");
      load();
      return;
    }

    const deleteBtn = e.target.closest(".team-delete-btn");
    if (deleteBtn) {
      const m = members.find((row) => row.id === Number(deleteBtn.dataset.id));
      if (!m) return;
      const ok = await cvrConfirmAction({
        title: "Remove team profile?",
        message: `${m.name} will be removed from the About Us team section. This cannot be undone.`,
        confirmLabel: "Remove profile",
        confirmClass: "btn-danger",
        icon: "bi-trash",
      });
      if (!ok) return;
      const { body } = await cvrApiPost("admin/team-delete", { id: m.id });
      if (!body.success) {
        showAlert(body.message || "Could not remove the profile.");
        return;
      }
      cvrToast("Team profile removed.", "success");
      load();
    }
  });

  load();
}

window.initAdminTeamPage = initAdminTeamPage;
