function initAdminPackagesPage() {
  const cat = window.CVRBookingCatalog;
  const eventBody = document.getElementById("adminEventPackagesBody");
  const roomBody = document.getElementById("adminRoomPackagesBody");
  const alertEl = document.getElementById("adminPackagesAlert");
  if (!cat || !eventBody || !roomBody) return;

  let serverMode = false;
  const serverRooms = new Map();
  const serverEvents = new Map();

  const roomRowToPkgShape = (row) => ({
    id: row.slug,
    title: row.title,
    tagline: row.tagline || "",
    description: row.description || "",
    pricePerNight: row.pricePerNight,
    currency: "PHP",
    capacity: { min: row.capacityMin, max: row.capacityMax },
    areaSqm: row.areaSqm,
    bed: row.bed || "",
    isActive: row.isActive,
    inclusions: row.inclusions || [],
    addOns: row.addOns || [],
    image: row.image,
    standardCheckIn: row.standardCheckIn,
    standardCheckOut: row.standardCheckOut,
    availabilityNote: row.availabilityNote || "",
  });

  const eventRowToPkgShape = (row) => ({
    price: row.price,
    pax: row.includedPax,
    isActive: row.isActive,
    isCustom: row.isCustom,
    image: row.image || "",
    inclusions: row.inclusions || [],
    motifs: row.motifs || [],
    addOns: row.addOns || [],
  });

  const adminGetRoomPackages = () =>
    serverMode ? Array.from(serverRooms.values()).map(roomRowToPkgShape) : cat.getRoomPackages();
  const adminGetRoomPackageById = (id) => {
    if (!serverMode) return cat.getRoomPackageById(id);
    const row = serverRooms.get(id);
    return row ? roomRowToPkgShape(row) : null;
  };
  const adminGetRoomAddOns = (id) => adminGetRoomPackageById(id)?.addOns || (serverMode ? [] : cat.getPackageAddOns("room", id));
  const adminGetEventPackageKeys = () => (serverMode ? Array.from(serverEvents.keys()) : cat.getEventPackageKeys());
  const adminGetEventPackageCatalog = (key) => {
    if (!serverMode) return cat.getEventPackageCatalog(key);
    const row = serverEvents.get(key);
    return row ? eventRowToPkgShape(row) : null;
  };
  const adminIsEventPackageActive = (key) => (serverMode ? Boolean(serverEvents.get(key)?.isActive) : cat.isEventPackageActive(key));

  const loadFromServer = async () => {
    try {
      const { body } = await cvrApiGet("admin/packages-list");
      if (!body?.success || !body?.data) return false;
      serverRooms.clear();
      serverEvents.clear();
      (body.data.rooms || []).forEach((r) => serverRooms.set(r.slug, r));
      (body.data.events || []).forEach((e) => serverEvents.set(e.name, e));
      serverMode = true;
      return true;
    } catch {
      return false;
    }
  };

  const escapeHtml = (s) => {
    const d = document.createElement("div");
    d.textContent = String(s ?? "");
    return d.innerHTML;
  };

  const showAlert = (message, isError = false) => {
    if (alertEl) {
      alertEl.textContent = message;
      alertEl.className = `alert small ${isError ? "alert-danger" : "alert-success"}`;
      window.setTimeout(() => alertEl.classList.add("d-none"), 4000);
    }
    window.cvrToast?.(message, isError ? "danger" : "success");
  };

  const showFormAlert = (el, message) => {
    if (el) {
      el.textContent = message;
      el.classList.remove("d-none");
    }
    window.cvrToast?.(message, "danger");
  };
  const hideFormAlert = (el) => {
    if (!el) return;
    el.classList.add("d-none");
    el.textContent = "";
  };

  const ADDON_CATEGORIES = [
    { value: "lights", label: "Lighting" },
    { value: "sound", label: "Sound" },
    { value: "extra", label: "Extras & Decor" },
    { value: "catering", label: "Catering" },
    { value: "other", label: "Other" },
  ];

  const linesToArray = (text) =>
    String(text || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

  const statusToggleHtml = (checked, dataAttrs) => `
    <div class="form-check form-switch d-flex justify-content-end align-items-center gap-2">
      <span class="small ${checked ? "text-success" : "text-muted-brand"}">${checked ? "Active" : "Inactive"}</span>
      <input class="form-check-input admin-package-toggle admin-only-action" type="checkbox" role="switch" ${checked ? "checked" : ""} ${dataAttrs}>
    </div>`;

  const actionButtonsHtml = (dataAttrs) => `
    <div class="d-flex justify-content-end gap-1">
      <button type="button" class="btn btn-sm btn-outline-secondary admin-package-view-btn" ${dataAttrs} title="View"><i class="bi bi-eye"></i></button>
      <button type="button" class="btn btn-sm btn-outline-secondary admin-package-edit-btn admin-only-action" ${dataAttrs} title="Edit"><i class="bi bi-pencil"></i></button>
      <button type="button" class="btn btn-sm btn-outline-danger admin-package-delete-btn admin-only-action" ${dataAttrs} title="Delete"><i class="bi bi-trash"></i></button>
    </div>`;

  const moveButtonsHtml = (isFirst, isLast, dataAttrs) => `
    <div class="d-flex flex-column gap-1 admin-only-action">
      <button type="button" class="btn btn-sm btn-outline-secondary admin-package-move-btn py-0 px-1" ${dataAttrs} data-dir="up" title="Move up" ${isFirst ? "disabled" : ""}><i class="bi bi-caret-up-fill"></i></button>
      <button type="button" class="btn btn-sm btn-outline-secondary admin-package-move-btn py-0 px-1" ${dataAttrs} data-dir="down" title="Move down" ${isLast ? "disabled" : ""}><i class="bi bi-caret-down-fill"></i></button>
    </div>`;

  const renderEventPackages = () => {
    const keys = adminGetEventPackageKeys();
    if (!keys.length) {
      eventBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted-brand small py-4">No event packages yet. Click "Add package" to create one.</td></tr>`;
      return;
    }
    eventBody.innerHTML = keys
      .map((key, index) => {
        const pkg = adminGetEventPackageCatalog(key);
        if (!pkg) return "";
        const isActive = adminIsEventPackageActive(key);
        const dataAttrs = `data-booking-type="event" data-package-key="${escapeHtml(key)}"`;
        return `
        <tr>
          <td>${moveButtonsHtml(index === 0, index === keys.length - 1, dataAttrs)}</td>
          <td class="fw-semibold text-brand">${thumbHtml(pkg.image, DEFAULT_EVENT_IMAGE, key)}${escapeHtml(key)}</td>
          <td>${escapeHtml(cat.formatMoney(pkg.price, "PHP"))} <span class="small text-muted-brand">starting</span></td>
          <td>${escapeHtml(String(pkg.pax || "—"))} pax</td>
          <td class="small text-muted-brand">${pkg.motifs?.length || 0} motifs</td>
          <td class="small text-muted-brand">${pkg.addOns?.length || 0} add-ons</td>
          <td class="text-end">${statusToggleHtml(isActive, dataAttrs)}</td>
          <td class="text-end">${actionButtonsHtml(dataAttrs)}</td>
        </tr>`;
      })
      .join("");
  };

  const renderRoomPackages = () => {
    const rooms = adminGetRoomPackages();
    if (!rooms.length) {
      roomBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted-brand small py-4">No room packages yet. Click "Add package" to create one.</td></tr>`;
      return;
    }
    roomBody.innerHTML = rooms
      .map((pkg, index) => {
        const addOns = adminGetRoomAddOns(pkg.id);
        const dataAttrs = `data-booking-type="room" data-package-key="${escapeHtml(pkg.id)}"`;
        return `
        <tr>
          <td>${moveButtonsHtml(index === 0, index === rooms.length - 1, dataAttrs)}</td>
          <td class="fw-semibold text-brand">${thumbHtml(pkg.image, DEFAULT_ROOM_IMAGE, pkg.title)}${escapeHtml(pkg.title)}</td>
          <td>${escapeHtml(cat.formatMoney(pkg.pricePerNight, pkg.currency))} <span class="small text-muted-brand">/night starting</span></td>
          <td>${pkg.capacity.min}–${pkg.capacity.max} guests</td>
          <td class="small text-muted-brand">${addOns.length} add-ons</td>
          <td class="text-end">${statusToggleHtml(pkg.isActive !== false, dataAttrs)}</td>
          <td class="text-end">${actionButtonsHtml(dataAttrs)}</td>
        </tr>`;
      })
      .join("");
  };

  const renderAll = () => {
    renderEventPackages();
    renderRoomPackages();
    bindToggles();
    bindRowActions();
    bindMoveButtons();
  };

  const reorderOnServer = async (bookingType, orderedIds) => {
    const { body } = await cvrApiPost("admin/packages-reorder", { type: bookingType, order: orderedIds });
    return Boolean(body?.success);
  };

  const setMoveButtonsDisabled = (disabled) => {
    document.querySelectorAll(".admin-package-move-btn").forEach((btn) => {
      btn.disabled = disabled;
    });
  };

  const moveRoomPackage = async (key, dir) => {
    const rooms = adminGetRoomPackages();
    const from = rooms.findIndex((p) => p.id === key);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= rooms.length) return;
    const reordered = rooms.map((p) => p.id);
    [reordered[from], reordered[to]] = [reordered[to], reordered[from]];

    if (!serverMode) {
      cat.setRoomPackageOrder(reordered);
      return renderAll();
    }

    setMoveButtonsDisabled(true);
    const ids = reordered.map((slug) => serverRooms.get(slug)?.id).filter((id) => id != null);
    const ok = ids.length === reordered.length && (await reorderOnServer("room", ids));
    setMoveButtonsDisabled(false);
    if (ok) {
      await loadFromServer();
      renderAll();
    } else {
      showAlert("Could not save the new order. Please try again.", true);
    }
  };

  const moveEventPackage = async (key, dir) => {
    const keys = adminGetEventPackageKeys();
    const from = keys.indexOf(key);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= keys.length) return;
    const reordered = [...keys];
    [reordered[from], reordered[to]] = [reordered[to], reordered[from]];

    if (!serverMode) {
      cat.setEventPackageOrder(reordered);
      return renderAll();
    }

    setMoveButtonsDisabled(true);
    const ids = reordered.map((name) => serverEvents.get(name)?.id).filter((id) => id != null);
    const ok = ids.length === reordered.length && (await reorderOnServer("event", ids));
    setMoveButtonsDisabled(false);
    if (ok) {
      await loadFromServer();
      renderAll();
    } else {
      showAlert("Could not save the new order. Please try again.", true);
    }
  };

  const bindMoveButtons = () => {
    document.querySelectorAll(".admin-package-move-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const bookingType = btn.dataset.bookingType;
        const key = btn.dataset.packageKey;
        const dir = btn.dataset.dir === "up" ? -1 : 1;
        if (bookingType === "event") moveEventPackage(key, dir);
        else moveRoomPackage(key, dir);
      });
    });
  };

  const bindToggles = () => {
    document.querySelectorAll(".admin-package-toggle").forEach((input) => {
      input.addEventListener("change", async () => {
        const bookingType = input.dataset.bookingType;
        const packageKey = input.dataset.packageKey;
        const nextActive = input.checked;
        const label = input.closest(".form-check")?.querySelector("span");
        const setLabel = (active) => {
          if (label) {
            label.textContent = active ? "Active" : "Inactive";
            label.className = `small ${active ? "text-success" : "text-muted-brand"}`;
          }
        };

        if (!serverMode) {
          cat.setPackageActive(bookingType, packageKey, nextActive);
          setLabel(nextActive);
          showAlert(`${packageKey} is now ${nextActive ? "active and bookable" : "inactive and hidden from customers"}.`);
          return;
        }

        input.disabled = true;
        const ok = bookingType === "event"
          ? await saveEventPackageToServer(serverEvents.get(packageKey), { isActive: nextActive })
          : await saveRoomPackageToServer(serverRooms.get(packageKey), { isActive: nextActive });
        input.disabled = false;

        if (ok) {
          await loadFromServer();
          setLabel(nextActive);
          showAlert(`${packageKey} is now ${nextActive ? "active and bookable" : "inactive and hidden from customers"}.`);
        } else {
          input.checked = !nextActive;
          showAlert(`Could not update ${packageKey}. Your change was not saved.`, true);
        }
      });
    });
  };

  const saveRoomPackageToServer = async (row, changes = {}) => {
    if (!row) return false;
    const merged = { ...row, ...changes };
    const { body } = await cvrApiPost("admin/packages-save", {
      type: "room",
      id: merged.id,
      slug: merged.slug,
      title: merged.title,
      tagline: merged.tagline,
      description: merged.description,
      pricePerNight: merged.pricePerNight,
      capacityMin: merged.capacityMin,
      capacityMax: merged.capacityMax,
      areaSqm: merged.areaSqm,
      bed: merged.bed,
      inclusions: merged.inclusions,
      addOns: merged.addOns,
      image: merged.image,
      standardCheckIn: merged.standardCheckIn,
      standardCheckOut: merged.standardCheckOut,
      availabilityNote: merged.availabilityNote,
      sortOrder: merged.sortOrder,
      isActive: merged.isActive,
    });
    return Boolean(body?.success);
  };

  const saveEventPackageToServer = async (row, changes = {}) => {
    if (!row) return false;
    const merged = { ...row, ...changes };
    const { body } = await cvrApiPost("admin/packages-save", {
      type: "event",
      id: merged.id,
      slug: merged.slug,
      name: merged.name,
      price: merged.price,
      includedPax: merged.includedPax,
      isCustom: merged.isCustom,
      image: merged.image,
      inclusions: merged.inclusions,
      motifs: merged.motifs,
      addOns: merged.addOns,
      sortOrder: merged.sortOrder,
      isActive: merged.isActive,
    });
    return Boolean(body?.success);
  };

  const addOnRowHtml = (containerPrefix, addOn = {}, withCategory) => {
    const rowId = `${containerPrefix}-row-${Math.random().toString(36).slice(2, 8)}`;
    const categorySelect = withCategory
      ? `<select class="form-select form-select-sm addon-row-category" style="max-width:160px;">
          ${ADDON_CATEGORIES.map((c) => `<option value="${c.value}" ${addOn.category === c.value ? "selected" : ""}>${c.label}</option>`).join("")}
        </select>`
      : "";
    return `
      <div class="d-flex flex-wrap gap-2 align-items-center border rounded-3 p-2 addon-row" id="${rowId}" data-addon-id="${escapeHtml(addOn.id || "")}">
        <input type="text" class="form-control form-control-sm addon-row-label flex-grow-1" style="min-width:180px;" placeholder="Option name (e.g. Basic LED uplighting)" value="${escapeHtml(addOn.label || "")}">
        ${categorySelect}
        <div class="input-group input-group-sm" style="max-width:140px;">
          <span class="input-group-text">₱</span>
          <input type="number" class="form-control addon-row-price" min="0" max="1000000" step="1" placeholder="1500" value="${addOn.price ?? ""}">
        </div>
        <button type="button" class="btn btn-sm btn-outline-danger addon-row-remove" title="Remove option"><i class="bi bi-x-lg"></i></button>
      </div>`;
  };

  const bindAddOnRowRemove = (container) => {
    container.querySelectorAll(".addon-row-remove").forEach((btn) => {
      btn.addEventListener("click", () => btn.closest(".addon-row")?.remove());
    });
  };

  const addAddOnRow = (container, addOn, withCategory) => {
    container.insertAdjacentHTML("beforeend", addOnRowHtml(container.id, addOn, withCategory));
    bindAddOnRowRemove(container);
  };

  const readAddOnRows = (container, idPrefix, withCategory) => {
    const rows = Array.from(container.querySelectorAll(".addon-row"));
    const items = [];
    for (const row of rows) {
      const label = row.querySelector(".addon-row-label")?.value.trim() || "";
      const priceRaw = row.querySelector(".addon-row-price")?.value;
      const price = Number(priceRaw);
      if (!label && (priceRaw === "" || priceRaw === undefined)) continue;
      if (!label) throw new Error("Every add-on option needs a name.");
      if (!Number.isFinite(price) || price < 0 || price > 1000000) {
        throw new Error(`"${label}" needs a realistic price between 0 and 1,000,000.`);
      }
      const existingId = row.dataset.addonId;
      const item = {
        id: existingId || cat.generateAddOnId(idPrefix, label),
        label,
        price: Math.round(price * 100) / 100,
      };
      if (withCategory) item.category = row.querySelector(".addon-row-category")?.value || "other";
      items.push(item);
    }
    return items;
  };

  const DEFAULT_ROOM_IMAGE = "../images/booking-photo-1.png";
  const DEFAULT_EVENT_IMAGE = "../images/booking-photo-3.png";

  const BLOCKED_PACKAGE_FILE_EXTENSIONS = new Set([
    "exe", "msi", "bat", "cmd", "com", "scr", "vbs", "vbe", "js", "jse", "wsf", "wsh",
    "ps1", "psm1", "sh", "bash", "php", "php3", "php4", "php5", "phtml", "cgi", "pl",
    "py", "jar", "apk", "app", "dmg", "html", "htm", "svg", "swf", "reg", "lnk", "hta",
  ]);
  const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"]);
  const fileExt = (name) => String(name || "").split(".").pop()?.toLowerCase() || "";

  const photoSrc = (path, fallback) => {
    const p = String(path || "").trim();
    if (!p) return fallback.replace("../images/", "../../images/");
    if (window.cvrResolvePackageImage) return window.cvrResolvePackageImage(p);
    return p;
  };

  const thumbHtml = (path, fallback, alt) =>
    `<img src="${escapeHtml(photoSrc(path, fallback))}" alt="${escapeHtml(alt)}" class="rounded-2 border me-2" style="width:52px;height:38px;object-fit:cover;vertical-align:middle;">`;

  const bindPhotoPicker = ({ fileInput, hiddenInput, preview, removeBtn, fallback, alertEl }) => {
    if (!fileInput || !hiddenInput) return;

    const sync = () => {
      const value = hiddenInput.value;
      if (preview) {

        const usableForPreview = !value || IMAGE_EXTENSIONS.has(fileExt(value));
        preview.src = usableForPreview ? photoSrc(value, fallback) : fallback.replace("../images/", "../../images/");
      }
      removeBtn?.classList.toggle("d-none", !value || value === fallback);
    };

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        fileInput.value = "";
        return showFormAlert(alertEl, "File must be smaller than 5 MB.");
      }
      if (BLOCKED_PACKAGE_FILE_EXTENSIONS.has(fileExt(file.name))) {
        fileInput.value = "";
        return showFormAlert(alertEl, "That file type isn't allowed for security reasons. Please upload it as a photo, PDF, or document file instead.");
      }
      hideFormAlert(alertEl);
      fileInput.disabled = true;
      try {
        const fd = new FormData();
        fd.append("photo", file);
        const { body } = await cvrApiPostForm("admin/package-photo", fd);
        if (!body?.success || !body?.data?.photoPath) {
          showFormAlert(alertEl, body?.message || "Could not upload that file. Please try again.");
        } else {
          hiddenInput.value = body.data.photoPath;
          sync();
          const isImage = IMAGE_EXTENSIONS.has(fileExt(body.data.photoPath));
          window.cvrToast?.(
            isImage
              ? "Photo uploaded. Click Save Package to apply it."
              : "File uploaded, but it won't preview as an image since it isn't a photo. Click Save Package to apply it.",
            "success"
          );
        }
      } catch {
        showFormAlert(alertEl, "Could not upload that file. Please check your connection and try again.");
      }
      fileInput.disabled = false;
      fileInput.value = "";
    });

    removeBtn?.addEventListener("click", () => {
      hiddenInput.value = fallback === DEFAULT_ROOM_IMAGE ? DEFAULT_ROOM_IMAGE : "";
      sync();
    });

    hiddenInput.addEventListener("cvr:sync", sync);
  };

  const setPhotoValue = (hiddenInput, value) => {
    if (!hiddenInput) return;
    hiddenInput.value = value || "";
    hiddenInput.dispatchEvent(new CustomEvent("cvr:sync"));
  };

  const epModalEl = document.getElementById("eventPackageModal");
  const epModal = epModalEl && window.bootstrap ? new bootstrap.Modal(epModalEl) : null;
  const epModalTitle = document.getElementById("eventPackageModalLabel");
  const epFormAlert = document.getElementById("eventPackageFormAlert");
  const epOriginalKey = document.getElementById("epFormOriginalKey");
  const epName = document.getElementById("epFormName");
  const epNameHint = document.getElementById("epFormNameHint");
  const epPrice = document.getElementById("epFormPrice");
  const epPax = document.getElementById("epFormPax");
  const epActive = document.getElementById("epFormActive");
  const epCustom = document.getElementById("epFormCustom");
  const epInclusions = document.getElementById("epFormInclusions");
  const epMotifs = document.getElementById("epFormMotifs");
  const epAddOnRows = document.getElementById("epAddOnRows");
  const epPhotoInput = document.getElementById("epFormPhoto");
  const epImage = document.getElementById("epFormImage");
  const epPhotoPreview = document.getElementById("epFormPhotoPreview");
  const epPhotoRemove = document.getElementById("epFormPhotoRemove");
  const epAddRowBtn = document.getElementById("epAddAddOnRowBtn");
  const epSaveBtn = document.getElementById("epSaveBtn");
  const addEventPackageBtn = document.getElementById("addEventPackageBtn");

  epAddRowBtn?.addEventListener("click", () => addAddOnRow(epAddOnRows, {}, true));

  bindPhotoPicker({
    fileInput: epPhotoInput,
    hiddenInput: epImage,
    preview: epPhotoPreview,
    removeBtn: epPhotoRemove,
    fallback: DEFAULT_EVENT_IMAGE,
    alertEl: epFormAlert,
  });

  const openEventPackageModal = (key = null) => {
    hideFormAlert(epFormAlert);
    epAddOnRows.innerHTML = "";
    if (key) {
      const pkg = adminGetEventPackageCatalog(key);
      if (!pkg) return;
      epModalTitle.textContent = `Edit ${key}`;
      epOriginalKey.value = key;
      epName.value = key;
      epName.disabled = true;
      epNameHint.classList.remove("d-none");
      epPrice.value = pkg.price ?? "";
      epPax.value = pkg.pax ?? "";
      epActive.checked = pkg.isActive !== false;
      epCustom.checked = Boolean(pkg.isCustom);
      epInclusions.value = (pkg.inclusions || []).join("\n");
      setPhotoValue(epImage, pkg.image || "");
      epMotifs.value = (pkg.motifs || [])
        .filter((m) => m.id !== "custom")
        .map((m) => `${m.label} | ${m.colors || ""}`)
        .join("\n");
      (pkg.addOns || []).forEach((a) => addAddOnRow(epAddOnRows, a, true));
    } else {
      epModalTitle.textContent = "Add Event Package";
      epOriginalKey.value = "";
      epName.value = "";
      epName.disabled = false;
      epNameHint.classList.add("d-none");
      epPrice.value = "";
      epPax.value = "";
      epActive.checked = true;
      epCustom.checked = false;
      epInclusions.value = "";
      epMotifs.value = "";
      setPhotoValue(epImage, "");
    }
    epModal?.show();
  };

  addEventPackageBtn?.addEventListener("click", () => openEventPackageModal(null));

  epSaveBtn?.addEventListener("click", async () => {
    hideFormAlert(epFormAlert);
    const originalKey = epOriginalKey.value || null;
    const name = epName.value.trim();
    const price = Number(epPrice.value);
    const pax = Number(epPax.value);

    if (!name) return showFormAlert(epFormAlert, "Package name is required.");
    const nameTaken = serverMode ? adminGetEventPackageKeys().includes(name) : cat.eventPackageKeyExists(name);
    if (!originalKey && nameTaken) {
      return showFormAlert(epFormAlert, "A package with this name already exists. Choose a different name.");
    }
    if (!Number.isFinite(price) || price <= 0 || price > 1000000) {
      return showFormAlert(epFormAlert, "Enter a realistic base price greater than 0 (up to ₱1,000,000).");
    }
    if (!Number.isFinite(pax) || pax < 1 || pax > 2000) {
      return showFormAlert(epFormAlert, "Enter a realistic guest count (1–2000 pax).");
    }

    let addOns;
    try {
      addOns = readAddOnRows(epAddOnRows, "ev", true);
    } catch (err) {
      return showFormAlert(epFormAlert, err.message);
    }

    const motifs = linesToArray(epMotifs.value).map((line) => {
      const [label, colors] = line.split("|").map((s) => (s || "").trim());
      return { id: `motif-${cat.generateAddOnId ? cat.generateAddOnId("m", label).slice(0, 24) : Math.random().toString(36).slice(2, 8)}`, label: label || line, colors: colors || "" };
    });
    motifs.push({ id: "custom", label: "Custom motif (describe below)", colors: "Your choice" });

    const data = {
      price: Math.round(price * 100) / 100,
      pax: Math.round(pax),
      isActive: epActive.checked,
      isCustom: epCustom.checked,
      image: epImage?.value || "",
      inclusions: linesToArray(epInclusions.value),
      motifs,
      addOns,
    };

    if (serverMode) {
      if (originalKey && !serverEvents.has(originalKey)) {
        return showFormAlert(epFormAlert, "This package no longer exists on the server — it may have been deleted elsewhere. Please close this form and refresh.");
      }
      epSaveBtn.disabled = true;
      const existingRow = originalKey ? serverEvents.get(originalKey) : { sortOrder: serverEvents.size };
      const ok = await saveEventPackageToServer(existingRow, {
        name,
        price: data.price,
        includedPax: data.pax,
        isActive: data.isActive,
        isCustom: data.isCustom,
        image: data.image,
        inclusions: data.inclusions,
        motifs: data.motifs,
        addOns: data.addOns,
      });
      epSaveBtn.disabled = false;
      if (!ok) return showFormAlert(epFormAlert, "Could not save this package to the server. Nothing was changed.");
      await loadFromServer();
      showAlert(`${name} was ${originalKey ? "updated" : "created"}.`);
      epModal?.hide();
      return renderAll();
    }

    try {
      if (originalKey) {
        cat.updateEventPackage(originalKey, data);
        cat.setPackageActive("event", originalKey, epActive.checked);
        showAlert(`${originalKey} was updated.`);
      } else {
        const key = cat.createEventPackage({ name, ...data });
        cat.setPackageActive("event", key, epActive.checked);
        showAlert(`${key} was created.`);
      }
    } catch (err) {
      return showFormAlert(epFormAlert, err.message || "Could not save this package.");
    }

    epModal?.hide();
    renderAll();
  });

  const rpModalEl = document.getElementById("roomPackageModal");
  const rpModal = rpModalEl && window.bootstrap ? new bootstrap.Modal(rpModalEl) : null;
  const rpModalTitle = document.getElementById("roomPackageModalLabel");
  const rpFormAlert = document.getElementById("roomPackageFormAlert");
  const rpId = document.getElementById("rpFormId");
  const rpTitle = document.getElementById("rpFormTitle");
  const rpPrice = document.getElementById("rpFormPrice");
  const rpTagline = document.getElementById("rpFormTagline");
  const rpCapMin = document.getElementById("rpFormCapMin");
  const rpCapMax = document.getElementById("rpFormCapMax");
  const rpDescription = document.getElementById("rpFormDescription");
  const rpArea = document.getElementById("rpFormArea");
  const rpBed = document.getElementById("rpFormBed");
  const rpActive = document.getElementById("rpFormActive");
  const rpInclusions = document.getElementById("rpFormInclusions");
  const rpAddOnRows = document.getElementById("rpAddOnRows");
  const rpPhotoInput = document.getElementById("rpFormPhoto");
  const rpImage = document.getElementById("rpFormImage");
  const rpPhotoPreview = document.getElementById("rpFormPhotoPreview");
  const rpPhotoRemove = document.getElementById("rpFormPhotoRemove");
  const rpAddRowBtn = document.getElementById("rpAddAddOnRowBtn");
  const rpSaveBtn = document.getElementById("rpSaveBtn");
  const addRoomPackageBtn = document.getElementById("addRoomPackageBtn");

  rpAddRowBtn?.addEventListener("click", () => addAddOnRow(rpAddOnRows, {}, false));

  bindPhotoPicker({
    fileInput: rpPhotoInput,
    hiddenInput: rpImage,
    preview: rpPhotoPreview,
    removeBtn: rpPhotoRemove,
    fallback: DEFAULT_ROOM_IMAGE,
    alertEl: rpFormAlert,
  });

  const openRoomPackageModal = (id = null) => {
    hideFormAlert(rpFormAlert);
    rpAddOnRows.innerHTML = "";
    if (id) {
      const pkg = adminGetRoomPackageById(id);
      if (!pkg) return;
      rpModalTitle.textContent = `Edit ${pkg.title}`;
      rpId.value = id;
      rpTitle.value = pkg.title || "";
      rpPrice.value = pkg.pricePerNight ?? "";
      rpTagline.value = pkg.tagline || "";
      rpCapMin.value = pkg.capacity?.min ?? "";
      rpCapMax.value = pkg.capacity?.max ?? "";
      rpDescription.value = pkg.description || "";
      rpArea.value = pkg.areaSqm ?? "";
      rpBed.value = pkg.bed || "";
      rpActive.checked = pkg.isActive !== false;
      rpInclusions.value = (pkg.inclusions || []).join("\n");
      setPhotoValue(rpImage, pkg.image || DEFAULT_ROOM_IMAGE);
      adminGetRoomAddOns(id).forEach((a) => addAddOnRow(rpAddOnRows, a, false));
    } else {
      rpModalTitle.textContent = "Add Room Package";
      rpId.value = "";
      rpTitle.value = "";
      rpPrice.value = "";
      rpTagline.value = "";
      rpCapMin.value = "";
      rpCapMax.value = "";
      rpDescription.value = "";
      rpArea.value = "";
      rpBed.value = "";
      rpActive.checked = true;
      rpInclusions.value = "";
      setPhotoValue(rpImage, DEFAULT_ROOM_IMAGE);
    }
    rpModal?.show();
  };

  addRoomPackageBtn?.addEventListener("click", () => openRoomPackageModal(null));

  rpSaveBtn?.addEventListener("click", async () => {
    hideFormAlert(rpFormAlert);
    const id = rpId.value || null;
    const title = rpTitle.value.trim();
    const price = Number(rpPrice.value);
    const capMin = Number(rpCapMin.value);
    const capMax = Number(rpCapMax.value);
    const area = rpArea.value ? Number(rpArea.value) : null;

    if (!title) return showFormAlert(rpFormAlert, "Room title is required.");
    if (!Number.isFinite(price) || price <= 0 || price > 1000000) {
      return showFormAlert(rpFormAlert, "Enter a realistic price per night greater than 0 (up to ₱1,000,000).");
    }
    if (!Number.isFinite(capMin) || !Number.isFinite(capMax) || capMin < 1 || capMax < capMin || capMax > 50) {
      return showFormAlert(rpFormAlert, "Enter a realistic guest capacity (min ≥ 1, max ≥ min, up to 50).");
    }

    let addOns;
    try {
      addOns = readAddOnRows(rpAddOnRows, "rm", false);
    } catch (err) {
      return showFormAlert(rpFormAlert, err.message);
    }

    const data = {
      title,
      pricePerNight: Math.round(price * 100) / 100,
      tagline: rpTagline.value.trim(),
      description: rpDescription.value.trim(),
      capacity: { min: Math.round(capMin), max: Math.round(capMax) },
      areaSqm: area,
      bed: rpBed.value.trim(),
      isActive: rpActive.checked,
      image: rpImage?.value || DEFAULT_ROOM_IMAGE,
      inclusions: linesToArray(rpInclusions.value),
      addOns,
    };

    if (serverMode) {
      if (id && !serverRooms.has(id)) {
        return showFormAlert(rpFormAlert, "This package no longer exists on the server — it may have been deleted elsewhere. Please close this form and refresh.");
      }
      rpSaveBtn.disabled = true;
      const existingRow = id ? serverRooms.get(id) : { sortOrder: serverRooms.size, image: "../images/booking-photo-1.png", standardCheckIn: "15:00", standardCheckOut: "Anytime (flexible)" };
      const ok = await saveRoomPackageToServer(existingRow, {
        title: data.title,
        pricePerNight: data.pricePerNight,
        tagline: data.tagline,
        description: data.description,
        capacityMin: data.capacity.min,
        capacityMax: data.capacity.max,
        areaSqm: data.areaSqm,
        bed: data.bed,
        isActive: data.isActive,
        image: data.image,
        inclusions: data.inclusions,
        addOns: data.addOns,
      });
      rpSaveBtn.disabled = false;
      if (!ok) return showFormAlert(rpFormAlert, "Could not save this package to the server. Nothing was changed.");
      await loadFromServer();
      showAlert(`${title} was ${id ? "updated" : "created"}.`);
      rpModal?.hide();
      return renderAll();
    }

    try {
      if (id) {
        cat.updateRoomPackage(id, data);
        cat.setPackageActive("room", id, rpActive.checked);
        showAlert(`${title} was updated.`);
      } else {
        const newId = cat.createRoomPackage(data);
        cat.setPackageActive("room", newId, rpActive.checked);
        showAlert(`${title} was created.`);
      }
    } catch (err) {
      return showFormAlert(rpFormAlert, err.message || "Could not save this package.");
    }

    rpModal?.hide();
    renderAll();
  });

  const deleteModalEl = document.getElementById("packageDeleteModal");
  const deleteModal = deleteModalEl && window.bootstrap ? new bootstrap.Modal(deleteModalEl) : null;
  const deleteNameEl = document.getElementById("packageDeleteName");
  const deleteConfirmBtn = document.getElementById("packageDeleteConfirmBtn");
  let pendingDelete = null;

  deleteConfirmBtn?.addEventListener("click", async () => {
    if (!pendingDelete) return;
    const { bookingType, key } = pendingDelete;

    if (serverMode) {
      const row = bookingType === "event" ? serverEvents.get(key) : serverRooms.get(key);
      if (!row) {
        deleteModal?.hide();
        pendingDelete = null;
        return showAlert("That package could not be found — it may have already been deleted.", true);
      }
      deleteConfirmBtn.disabled = true;
      const { body } = await cvrApiPost("admin/packages-delete", { type: bookingType, id: row.id });
      deleteConfirmBtn.disabled = false;
      deleteModal?.hide();
      if (!body?.success) {
        pendingDelete = null;
        return showAlert(body?.message || "Could not delete this package.", true);
      }
      await loadFromServer();
      showAlert("Package deleted.");
      pendingDelete = null;
      return renderAll();
    }

    if (bookingType === "event") {
      cat.deleteEventPackage(key);
    } else {
      cat.deleteRoomPackage(key);
    }
    deleteModal?.hide();
    showAlert(`Package deleted.`);
    pendingDelete = null;
    renderAll();
  });

  const pkgViewModalEl = document.getElementById("packageViewModal");
  const pkgViewModal = pkgViewModalEl && window.bootstrap ? new bootstrap.Modal(pkgViewModalEl) : null;
  const pkgViewImage = document.getElementById("pkgViewImage");
  const pkgViewTitle = document.getElementById("pkgViewTitle");
  const pkgViewStatus = document.getElementById("pkgViewStatus");
  const pkgViewTagline = document.getElementById("pkgViewTagline");
  const pkgViewPrice = document.getElementById("pkgViewPrice");
  const pkgViewCapacity = document.getElementById("pkgViewCapacity");
  const pkgViewDescription = document.getElementById("pkgViewDescription");
  const pkgViewInclusionsWrap = document.getElementById("pkgViewInclusionsWrap");
  const pkgViewInclusions = document.getElementById("pkgViewInclusions");
  const pkgViewMotifsWrap = document.getElementById("pkgViewMotifsWrap");
  const pkgViewMotifs = document.getElementById("pkgViewMotifs");
  const pkgViewAddOnsWrap = document.getElementById("pkgViewAddOnsWrap");
  const pkgViewAddOns = document.getElementById("pkgViewAddOns");

  const listOrNone = (el, items) => {
    if (!el) return;
    el.innerHTML = items.length
      ? items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")
      : `<li class="text-muted-brand">None listed.</li>`;
  };

  const openPackageViewModal = (bookingType, key) => {
    if (!pkgViewModalEl) return;

    if (bookingType === "event") {
      const pkg = adminGetEventPackageCatalog(key);
      if (!pkg) return;
      const isActive = adminIsEventPackageActive(key);
      pkgViewImage.src = photoSrc(pkg.image, DEFAULT_EVENT_IMAGE);
      pkgViewImage.alt = key;
      pkgViewTitle.textContent = key;
      pkgViewTagline.textContent = "";
      pkgViewTagline.classList.add("d-none");
      pkgViewPrice.textContent = `${cat.formatMoney(pkg.price, "PHP")} starting`;
      pkgViewCapacity.textContent = `${pkg.pax || "—"} pax included`;
      pkgViewDescription.textContent = "";
      pkgViewDescription.classList.add("d-none");
      pkgViewInclusionsWrap?.classList.remove("d-none");
      listOrNone(pkgViewInclusions, pkg.inclusions || []);
      pkgViewMotifsWrap?.classList.remove("d-none");
      listOrNone(pkgViewMotifs, pkg.motifs || []);
      pkgViewAddOnsWrap?.classList.toggle("d-none", !(pkg.addOns || []).length);
      listOrNone(pkgViewAddOns, (pkg.addOns || []).map((a) => `${a.label} — ${cat.formatMoney(a.price, "PHP")}`));
      pkgViewStatus.textContent = isActive ? "Active" : "Inactive";
      pkgViewStatus.className = `badge ${isActive ? "text-bg-success" : "text-bg-light border"}`;
    } else {
      const pkg = adminGetRoomPackageById(key);
      if (!pkg) return;
      const addOns = adminGetRoomAddOns(key);
      pkgViewImage.src = photoSrc(pkg.image, DEFAULT_ROOM_IMAGE);
      pkgViewImage.alt = pkg.title;
      pkgViewTitle.textContent = pkg.title;
      if (pkg.tagline) {
        pkgViewTagline.textContent = pkg.tagline;
        pkgViewTagline.classList.remove("d-none");
      } else {
        pkgViewTagline.classList.add("d-none");
      }
      pkgViewPrice.textContent = `${cat.formatMoney(pkg.pricePerNight, pkg.currency)} /night starting`;
      pkgViewCapacity.textContent = `${pkg.capacity.min}–${pkg.capacity.max} guests${pkg.areaSqm ? ` • ${pkg.areaSqm} sqm` : ""}${pkg.bed ? ` • ${pkg.bed}` : ""}`;
      if (pkg.description) {
        pkgViewDescription.textContent = pkg.description;
        pkgViewDescription.classList.remove("d-none");
      } else {
        pkgViewDescription.classList.add("d-none");
      }
      pkgViewInclusionsWrap?.classList.remove("d-none");
      listOrNone(pkgViewInclusions, pkg.inclusions || []);
      pkgViewMotifsWrap?.classList.add("d-none");
      pkgViewAddOnsWrap?.classList.toggle("d-none", !addOns.length);
      listOrNone(pkgViewAddOns, addOns.map((a) => `${a.label} — ${cat.formatMoney(a.price, "PHP")}`));
      const isActive = pkg.isActive !== false;
      pkgViewStatus.textContent = isActive ? "Active" : "Inactive";
      pkgViewStatus.className = `badge ${isActive ? "text-bg-success" : "text-bg-light border"}`;
    }

    pkgViewModal?.show();
  };

  const bindRowActions = () => {
    document.querySelectorAll(".admin-package-view-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        openPackageViewModal(btn.dataset.bookingType, btn.dataset.packageKey);
      });
    });
    document.querySelectorAll(".admin-package-edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const bookingType = btn.dataset.bookingType;
        const key = btn.dataset.packageKey;
        if (bookingType === "event") openEventPackageModal(key);
        else openRoomPackageModal(key);
      });
    });
    document.querySelectorAll(".admin-package-delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const bookingType = btn.dataset.bookingType;
        const key = btn.dataset.packageKey;
        pendingDelete = { bookingType, key };
        if (deleteNameEl) deleteNameEl.textContent = key;
        deleteModal?.show();
      });
    });
  };

  (async () => {
    const synced = await loadFromServer();
    if (!synced && alertEl) {

      alertEl.textContent = "Package changes are currently saved on this device only. Run database/migration_packages.sql to sync them everywhere.";
      alertEl.className = "alert small alert-warning";
    }
    renderAll();
  })();
}

window.initAdminPackagesPage = initAdminPackagesPage;
