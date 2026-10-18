function initAdminReservationsPage() {
  const tableBody = document.getElementById("reservationTableBody");
  const emptyRow = document.getElementById("reservationEmptyStateRow");
  const searchInput = document.getElementById("reservationSearchInput");
  const statusFilter = document.getElementById("reservationStatusFilter");
  const roomFilter = document.getElementById("reservationRoomTypeFilter");
  const dateFilter = document.getElementById("reservationDateFilter");
  const dateFrom = document.getElementById("reservationDateFrom");
  const dateTo = document.getElementById("reservationDateTo");
  const exportBtn = document.getElementById("reservationExportBtn");
  const exportPdfBtn = document.getElementById("reservationExportPdfBtn");
  const exportStatus = document.getElementById("reservationExportStatus");
  const quoteFilter = document.getElementById("quotationStatusFilter");
  const resultCountBadge = document.getElementById("reservationResultCount");

  if (!tableBody || !emptyRow || !searchInput || !statusFilter || !roomFilter || !dateFilter) return;

  let activeQuoteReservationId = "";

  const isFullAdmin = typeof isFullAdminSession === "function" ? isFullAdminSession(typeof getCustomerSession === "function" ? getCustomerSession() : null) : true;

  const fmt = (raw) => {
    if (!raw) return "—";
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? String(raw) : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const fmtMoneyRaw = (amount, currency = "PHP") => {
    const cat = window.CVRBookingCatalog;
    return cat ? cat.formatMoney(amount, currency) : String(amount);
  };

  const fmtMoney = (amount, currency = "PHP") => {
    if (!isFullAdmin) return "—";
    return fmtMoneyRaw(amount, currency);
  };

  const unitInputHtml = (unitPrice) => {
    const raw = Number(unitPrice) || 0;
    if (!isFullAdmin) {
      return `<input type="text" class="form-control form-control-sm admin-quote-unit" value="—" readonly data-real-unit="${raw}">`;
    }
    return `<input type="number" min="0" step="0.01" class="form-control form-control-sm admin-quote-unit" value="${raw}">`;
  };

  const chipClass = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("pending payment")) return "chip-yellow";
    if (s.includes("waiting") || s.includes("verification")) return "chip-blue";
    if (s.includes("approv") || s.includes("paid") || s.includes("verified")) return "chip-green";
    if (s.includes("reject")) return "chip-red";
    return "chip-yellow";
  };

  const initialsOf = (name) => {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    return ((parts[0][0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  };

  const roomIcon = (r) => (r.bookingType === "event" ? "bi-stars" : "bi-door-open");

  const quoteChipClass = (status) => {
    const map = {
      "Pending Admin Review": "chip-yellow",
      Approved: "chip-blue",
      Revised: "chip-blue",
      "Accepted by Client": "chip-green",
    };
    return map[status] || "chip-yellow";
  };

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const ensureQuote = (record) => {
    if (typeof window.ensureReservationQuotation === "function") {
      window.ensureReservationQuotation(record);
    } else if (window.CVRQuotation?.buildQuotationFromReservation) {
      record.quotation = window.CVRQuotation.buildQuotationFromReservation(record);
      window.CVRQuotation.applyQuotationToReservation(record, record.quotation);
    }
    return record.quotation;
  };

  const populateRoomFilter = (records) => {
    const names = new Set();
    records.forEach((r) => {
      const n = (r.roomName || r.eventType || "").trim();
      if (n) names.add(n);
    });
    const current = roomFilter.value;
    roomFilter.innerHTML = `<option value="all">All Rooms</option>`;
    [...names].sort((a, b) => a.localeCompare(b)).forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      roomFilter.appendChild(opt);
    });
    if ([...names].includes(current)) roomFilter.value = current;
  };

  const renderTable = () => {
    const records = typeof window.getStoredReservations === "function" ? window.getStoredReservations() : [];
    populateRoomFilter(records);

    const dataRows = tableBody.querySelectorAll("tr[data-id]");
    dataRows.forEach((tr) => {
      if (tr.id !== "reservationEmptyStateRow") tr.remove();
    });

    if (!records.length) {
      emptyRow.classList.remove("d-none");
      return;
    }
    emptyRow.classList.add("d-none");

    records.forEach((r) => {
      ensureQuote(r);
      const checkInIso = r.checkIn || r.checkInDate || r.preferredDate || "";
      const quoteStatus = r.quotation?.status || "—";
      const tr = document.createElement("tr");
      tr.dataset.id = r.id || "";
      tr.dataset.status = r.paymentStatus || "";
      tr.dataset.quoteStatus = quoteStatus;
      tr.dataset.room = r.roomName || r.eventType || "";
      tr.dataset.checkinIso = checkInIso ? String(checkInIso).slice(0, 10) : "";
      const pay = r.paymentStatus || "";

      tr.dataset.exportGuest = r.customerName || "";
      tr.dataset.exportCheckin = fmt(r.checkIn || r.preferredDate);
      tr.dataset.exportCheckout = fmt(r.checkOut || r.preferredDate);
      tr.dataset.exportGuests = String(r.guests || r.guestsLabel || "");
      tr.dataset.exportAmount = isFullAdmin ? String(r.totalAmount || "") : "—";
      const guestName = r.customerName || "Guest";
      tr.innerHTML = `
        <td><span class="reservation-id-chip">${escapeHtml(r.id || "")}</span></td>
        <td>
          <div class="d-flex align-items-center gap-2">
            ${r.guestAvatarUrl
              ? `<img class="reservation-avatar reservation-avatar--img" src="${escapeHtml(r.guestAvatarUrl)}" alt="" loading="lazy" data-initials="${escapeHtml(initialsOf(guestName))}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'reservation-avatar',textContent:this.dataset.initials}))">`
              : `<div class="reservation-avatar" aria-hidden="true">${escapeHtml(initialsOf(guestName))}</div>`}
            <div>
              <div class="fw-semibold text-brand">${escapeHtml(guestName)}</div>
              <div class="small text-muted-brand">${escapeHtml(String(r.guests || r.guestsLabel || "1"))} guest${(Number(r.guests) || 1) === 1 ? "" : "s"}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <i class="bi ${roomIcon(r)} text-muted-brand"></i>
            <span>${escapeHtml(r.roomName || r.eventType || "—")}</span>
          </div>
        </td>
        <td>
          <div class="reservation-date-range">
            <span>${escapeHtml(fmt(r.checkIn || r.preferredDate))}</span>
            <i class="bi bi-arrow-right small text-muted-brand"></i>
            <span>${escapeHtml(fmt(r.checkOut || r.preferredDate))}</span>
          </div>
          ${r.durationLabel ? `<div class="small text-muted-brand">${escapeHtml(r.durationLabel)}${r.checkInLabel ? ` · ${escapeHtml(r.checkInLabel)}–${escapeHtml(r.checkOutLabel || "")}` : ""}</div>` : ""}
          ${r.penaltyAmount > 0 ? `<div class="small text-danger"><i class="bi bi-alarm"></i> Overtime ${escapeHtml(String(r.overtimeHours || 0))}h · ${escapeHtml(fmtMoneyRaw(r.penaltyAmount, r.currency || "PHP"))} penalty</div>` : ""}
        </td>
        <td class="fw-semibold text-brand admin-only-action">${escapeHtml(String(r.totalAmount || ""))}</td>
        <td>
          <span class="status-chip ${chipClass(pay)}"><i class="bi bi-circle-fill"></i>${escapeHtml(pay)}</span>
          ${r.reservationStatus ? `<div class="small text-muted-brand mt-1">${escapeHtml(r.reservationStatus)}</div>` : ""}
          ${r.downpaymentForfeited ? `<div class="small text-danger mt-1"><i class="bi bi-cash-coin"></i> Downpayment forfeited (non-refundable)</div>` : ""}
        </td>
        <td><span class="status-chip ${quoteChipClass(quoteStatus)}"><i class="bi bi-circle-fill"></i>${escapeHtml(quoteStatus)}</span></td>
        <td class="text-end">
          <div class="d-inline-flex gap-1 reservation-actions">
            <button type="button" class="btn btn-sm btn-icon reservation-action-btn" data-action="quote" title="Quotation" aria-label="Quotation"><i class="bi bi-receipt"></i></button>
            <button type="button" class="btn btn-sm btn-icon reservation-action-btn" data-action="view" title="View details" aria-label="View details"><i class="bi bi-eye"></i></button>
            <button type="button" class="btn btn-sm btn-icon btn-icon-danger reservation-action-btn" data-action="delete" title="Delete" aria-label="Delete"><i class="bi bi-trash3"></i></button>
          </div>
        </td>`;
      tableBody.insertBefore(tr, emptyRow);
    });

    applyFilters();
  };

  const getDataRows = () => Array.from(tableBody.querySelectorAll("tr[data-id]")).filter((tr) => tr.id !== "reservationEmptyStateRow");

  const applyFilters = () => {
    const search = searchInput.value.trim().toLowerCase();
    const status = statusFilter.value;
    const room = roomFilter.value;
    const date = dateFilter.value;
    const from = dateFrom?.value || "";
    const to = dateTo?.value || "";
    const quote = quoteFilter?.value || "all";

    let visibleCount = 0;

    getDataRows().forEach((row) => {
      const rowText = row.textContent?.toLowerCase() || "";
      const rowStatus = row.dataset.status || "";
      const rowQuoteStatus = row.dataset.quoteStatus || "";
      const rowRoom = row.dataset.room || "";
      const rowDate = row.dataset.checkinIso || "";

      const searchMatch = !search || rowText.includes(search);
      const statusMatch = status === "all" || rowStatus === status;
      const quoteMatch = quote === "all" || rowQuoteStatus === quote;
      const roomMatch = room === "all" || rowRoom === room;
      const dateMatch = !date || rowDate === date;
      const fromOk = !from || !rowDate || rowDate >= from;
      const toOk = !to || !rowDate || rowDate <= to;

      const isVisible = searchMatch && statusMatch && quoteMatch && roomMatch && dateMatch && fromOk && toOk;
      row.classList.toggle("d-none", !isVisible);
      if (isVisible) visibleCount += 1;
    });

    emptyRow.classList.toggle("d-none", visibleCount > 0 || getDataRows().length === 0);
    if (resultCountBadge) {
      resultCountBadge.textContent = `${visibleCount} reservation${visibleCount === 1 ? "" : "s"}`;
    }
  };

  const getRecordById = (id) => {
    const all = typeof window.getStoredReservations === "function" ? window.getStoredReservations() : [];
    return all.find((x) => x.id === id) || null;
  };

  const saveRecord = (record) => {
    const all = window.getStoredReservations();
    const idx = all.findIndex((x) => x.id === record.id);
    if (idx < 0) return;
    all[idx] = record;
    window.saveStoredReservations(all);
    if (typeof window.syncReservationToServer === "function") window.syncReservationToServer(record, true);
    document.dispatchEvent(new CustomEvent("cvr-reservations-synced"));
    renderTable();
  };

  const refreshFromServer = async () => {

    if (typeof window.cvrSyncReservationsFromServer !== "function") return;
    await window.cvrSyncReservationsFromServer();
    renderTable();
  };

  const renderAdminDetailHtml = (r) => {
    ensureQuote(r);
    const rows = [
      ["ID", r.id],
      ["Guest", r.customerName],
      ["Email", r.email],
      ["Phone", r.phone],
      ["Type", r.bookingType === "event" ? "Event" : "Room"],
      ["Package / room", r.roomName || r.packageOption],
      ["Duration", r.durationLabel || "—"],
      ["Check-in / event", r.checkIn || r.preferredDate],
      ["Check-in time (strict)", r.checkInLabel || "—"],
      ["Check-out", r.checkOut],
      ["Check-out time (strict)", r.checkOutLabel || "—"],
      ["Checked out at", r.checkedOutAt ? new Date(r.checkedOutAt).toLocaleString() : "—"],
      ["Overtime", r.overtimeHours > 0 ? `${r.overtimeHours} hour${r.overtimeHours !== 1 ? "s" : ""}` : "None"],
      ["Overtime penalty", r.penaltyAmount > 0 ? fmtMoneyRaw(r.penaltyAmount, r.currency || "PHP") : "—"],
      ["Guests", r.guests],
      ["Motif / theme", r.motif?.label ? `${r.motif.label} (${r.motif.colors || ""})` : "—"],
      ["Special requests", r.specialRequests || r.eventNotes || "—"],
      ["Quotation status", r.quotation?.status],
      ...(isFullAdmin ? [["Quotation total", r.totalAmount]] : []),
      ["Payment status", r.paymentStatus],
      ["Reservation status", r.reservationStatus],
      ...(String(r.reservationStatus || "").toLowerCase().includes("cancel")
        ? [
            ["Cancelled at", r.cancelledAt ? new Date(r.cancelledAt).toLocaleString() : "—"],
            ["Cancellation reason", r.cancellationReason || "—"],
            ["Downpayment forfeited", r.downpaymentForfeited ? "Yes — non-refundable per policy" : "No downpayment was submitted"],
          ]
        : []),
    ];
    return `<dl class="row small mb-0">${rows.map(([k, v]) => `<dt class="col-sm-4 text-muted-brand">${escapeHtml(k)}</dt><dd class="col-sm-8">${escapeHtml(String(v ?? "—"))}</dd>`).join("")}</dl>`;
  };

  const renderQuoteEditorHtml = (r) => {
    ensureQuote(r);
    const q = r.quotation;
    const linesHtml = (q.lines || [])
      .map(
        (line) => `
        <tr data-line-id="${escapeHtml(line.id)}" data-type="${escapeHtml(line.type || "custom")}" data-source="${escapeHtml(line.source || "")}" data-catalog-id="${escapeHtml(line.catalogId || "")}" data-description="${escapeHtml(line.description || "")}">
          <td><span class="badge text-bg-light border">${escapeHtml(line.type)}</span></td>
          <td>
            <input type="text" class="form-control form-control-sm admin-quote-label" value="${escapeHtml(line.label)}">
            ${line.description ? `<small class="text-muted-brand d-block mt-1">${escapeHtml(line.description)}</small>` : ""}
          </td>
          <td><input type="number" min="0" step="0.01" class="form-control form-control-sm admin-quote-qty" value="${line.qty ?? 1}"></td>
          <td>${unitInputHtml(line.unitPrice ?? line.amount ?? 0)}</td>
          <td class="admin-quote-amount fw-semibold">${fmtMoney(line.amount ?? 0, q.currency)}</td>
          <td class="text-center">
            <input type="checkbox" class="form-check-input admin-quote-approved" ${line.approved !== false ? "checked" : ""}>
          </td>
          <td>
            ${line.type === "custom" ? `<button type="button" class="btn btn-sm btn-outline-danger admin-quote-remove-line">Remove</button>` : ""}
          </td>
        </tr>`
      )
      .join("");

    return `
      <div class="mb-3">
        <div class="d-flex flex-wrap justify-content-between gap-2 align-items-center">
          <div>
            <h6 class="text-brand mb-1">${escapeHtml(r.id)} · ${escapeHtml(r.customerName || "")}</h6>
            <p class="small text-muted-brand mb-0">${escapeHtml(r.roomName || r.packageOption || "")}</p>
          </div>
          <span class="status-chip ${quoteChipClass(q.status)}">${escapeHtml(q.status)}</span>
        </div>
      </div>
      <div class="table-responsive mb-3">
        <table class="table table-sm align-middle" id="adminQuotationLinesTable">
          <thead>
            <tr class="small text-muted-brand">
              <th>Type</th><th>Description</th><th>Qty</th><th>Unit</th><th>Amount</th><th>Approved</th><th></th>
            </tr>
          </thead>
          <tbody>${linesHtml}</tbody>
        </table>
      </div>
      <div class="row g-3 mb-3">
        <div class="col-md-4">
          <label class="form-label small">Add custom service</label>
          <input type="text" class="form-control form-control-sm" id="adminQuoteCustomLabel" placeholder="e.g. Extra floral arrangement">
        </div>
        <div class="col-md-3">
          <label class="form-label small">Price (PHP)</label>
          <input type="number" min="0" step="0.01" class="form-control form-control-sm" id="adminQuoteCustomPrice" placeholder="0.00">
        </div>
        <div class="col-md-5 d-flex align-items-end">
          <button type="button" class="btn btn-sm btn-outline-primary" id="adminQuoteAddCustomBtn">Add line item</button>
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label small" for="adminQuoteNotes">Admin notes to client</label>
        <textarea class="form-control form-control-sm" id="adminQuoteNotes" rows="2">${escapeHtml(q.adminNotes || "")}</textarea>
      </div>
      <div class="soft-card p-3 bg-light">
        <div class="d-flex justify-content-between small mb-1"><span>Package subtotal</span><strong id="adminQuotePackageTotal">${fmtMoney(q.subtotalPackage, q.currency)}</strong></div>
        <div class="d-flex justify-content-between small mb-1"><span>Add-ons</span><strong id="adminQuoteAddonTotal">${fmtMoney(q.subtotalAddOns, q.currency)}</strong></div>
        <div class="d-flex justify-content-between small mb-1"><span>Special / custom</span><strong id="adminQuoteSpecialTotal">${fmtMoney(q.subtotalSpecial, q.currency)}</strong></div>
        <hr class="my-2">
        <div class="d-flex justify-content-between"><span class="fw-bold text-brand">Quotation total</span><strong class="text-brand" id="adminQuoteGrandTotal">${isFullAdmin ? escapeHtml(r.totalAmount || fmtMoney(q.totalNumeric, q.currency)) : "—"}</strong></div>
        <div class="d-flex justify-content-between small mt-2 text-primary"><span>Downpayment due (${q.downpaymentPercent ?? 50}%)</span><strong id="adminQuoteDownpayment">${fmtMoney(q.downpaymentAmount ?? 0, q.currency)}</strong></div>
        <div class="d-flex justify-content-between small text-muted-brand"><span>Balance due</span><span id="adminQuoteBalance">${fmtMoney(q.balanceAmount ?? 0, q.currency)}</span></div>
      </div>
      <div id="adminQuoteMessage" class="small mt-2" aria-live="polite"></div>`;
  };

  const collectQuoteLinesFromEditor = () => {
    const rows = Array.from(document.querySelectorAll("#adminQuotationLinesTable tbody tr[data-line-id]"));
    const record = getRecordById(activeQuoteReservationId);
    return rows.map((row) => {
      const id = row.dataset.lineId;
      const existing = record?.quotation?.lines?.find((line) => line.id === id) || {};

      const type = row.dataset.type || existing.type || "custom";
      const source = row.dataset.source || existing.source || "";
      const catalogId = row.dataset.catalogId || existing.catalogId || "";
      const description = row.dataset.description || existing.description || "";
      const qty = Math.max(1, Number(row.querySelector(".admin-quote-qty")?.value) || 1);
      const unitInput = row.querySelector(".admin-quote-unit");
      const unitPrice = isFullAdmin
        ? Math.round((Number(unitInput?.value) || 0) * 100) / 100
        : Math.round((Number(unitInput?.dataset.realUnit) || existing.unitPrice || existing.amount || 0) * 100) / 100;
      const approved = row.querySelector(".admin-quote-approved")?.checked !== false;
      const label = row.querySelector(".admin-quote-label")?.value?.trim() || existing.label || "Line item";
      const amount = Math.round(qty * unitPrice * 100) / 100;
      const line = { ...existing, id, type, label, qty, unitPrice, amount, approved };
      if (source) line.source = source;
      if (catalogId) line.catalogId = catalogId;
      if (description) line.description = description;
      return line;
    });
  };

  const refreshQuoteEditorTotals = (record, lines) => {
    const totals = window.CVRQuotation.recalculateQuotationTotals(lines);
    const q = { ...record.quotation, lines, ...totals, totalAmount: fmtMoneyRaw(totals.totalNumeric, record.currency || "PHP") };
    document.getElementById("adminQuotePackageTotal").textContent = fmtMoney(q.subtotalPackage, q.currency);
    document.getElementById("adminQuoteAddonTotal").textContent = fmtMoney(q.subtotalAddOns, q.currency);
    document.getElementById("adminQuoteSpecialTotal").textContent = fmtMoney(q.subtotalSpecial, q.currency);
    document.getElementById("adminQuoteGrandTotal").textContent = q.totalAmount;
    const dp = window.CVRBookingCatalog.computeDownpayment(totals.totalNumeric);
    const dpEl = document.getElementById("adminQuoteDownpayment");
    const balEl = document.getElementById("adminQuoteBalance");
    if (dpEl) dpEl.textContent = fmtMoney(dp.downpayment, q.currency);
    if (balEl) balEl.textContent = fmtMoney(dp.balance, q.currency);
    document.querySelectorAll("#adminQuotationLinesTable tbody tr[data-line-id]").forEach((row, index) => {
      const line = lines[index];
      const amountCell = row.querySelector(".admin-quote-amount");
      if (amountCell && line) amountCell.textContent = fmtMoney(line.amount, q.currency);
    });
    return q;
  };

  const bindQuoteEditorEvents = (record) => {
    const body = document.getElementById("adminReservationDetailBody");
    if (!body) return;

    const recalc = () => {
      const lines = collectQuoteLinesFromEditor();
      refreshQuoteEditorTotals(record, lines);
    };

    body.querySelectorAll(".admin-quote-qty, .admin-quote-unit, .admin-quote-approved, .admin-quote-label").forEach((el) => {
      el.addEventListener("input", recalc);
      el.addEventListener("change", recalc);
    });

    body.querySelectorAll(".admin-quote-remove-line").forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.closest("tr")?.remove();
        recalc();
      });
    });

    document.getElementById("adminQuoteAddCustomBtn")?.addEventListener("click", () => {
      const label = document.getElementById("adminQuoteCustomLabel")?.value.trim();
      const price = Number(document.getElementById("adminQuoteCustomPrice")?.value) || 0;
      if (!label) return;
      const tbody = document.querySelector("#adminQuotationLinesTable tbody");
      const lineId = window.CVRQuotation.createQuotationLineId();
      const tr = document.createElement("tr");
      tr.dataset.lineId = lineId;
      tr.dataset.type = "custom";
      tr.dataset.source = "admin";
      tr.innerHTML = `
        <td><span class="badge text-bg-light border">custom</span></td>
        <td><input type="text" class="form-control form-control-sm admin-quote-label" value="${escapeHtml(label)}"></td>
        <td><input type="number" min="0" step="0.01" class="form-control form-control-sm admin-quote-qty" value="1"></td>
        <td>${unitInputHtml(price)}</td>
        <td class="admin-quote-amount fw-semibold">${fmtMoney(price, record.currency)}</td>
        <td class="text-center"><input type="checkbox" class="form-check-input admin-quote-approved" checked></td>
        <td><button type="button" class="btn btn-sm btn-outline-danger admin-quote-remove-line">Remove</button></td>`;
      tbody?.appendChild(tr);
      document.getElementById("adminQuoteCustomLabel").value = "";
      document.getElementById("adminQuoteCustomPrice").value = "";
      bindQuoteEditorEvents(record);
      recalc();
    });
  };

  const persistQuoteFromEditor = (record, approveForClient) => {
    const msg = document.getElementById("adminQuoteMessage");
    if (msg) msg.textContent = "";
    const lines = collectQuoteLinesFromEditor();
    const totals = window.CVRQuotation.recalculateQuotationTotals(lines);
    const adminNotes = document.getElementById("adminQuoteNotes")?.value.trim() || "";
    const previousStatus = record.quotation?.status;
    const quotation = {
      ...record.quotation,
      lines,
      ...totals,
      totalAmount: fmtMoneyRaw(totals.totalNumeric, record.currency || "PHP"),
      adminNotes,
      updatedAt: new Date().toISOString(),
      version: (record.quotation?.version || 1) + (approveForClient ? 1 : 0),
    };

    if (approveForClient) {
      quotation.status = "Approved";
      quotation.approvedAt = new Date().toISOString();
      quotation.acceptedAt = null;
      lines.forEach((line) => {
        if (line.type === "special") line.approved = true;
      });
    } else {
      quotation.status = "Pending Admin Review";
    }

    if (previousStatus === "Accepted by Client" && approveForClient) {
      quotation.status = "Revised";
    }

    const updated = window.CVRQuotation.applyQuotationToReservation({ ...record }, quotation);
    saveRecord(updated);

    if (approveForClient && window.pushCvrNotification) {
      window.pushCvrNotification(updated.email, {
        title: quotation.status === "Revised" ? "Quotation updated" : "Your quotation is ready",
        body: `A quotation for ${updated.roomName || updated.eventType || "your reservation"} (${updated.id}) is ready for your review.`,
        link: `quotation.html?res=${encodeURIComponent(updated.id)}`,
      });
    }

    return {
      record: updated,
      confirmationMessage: approveForClient
        ? "Quotation approved and sent to client for review."
        : "Quotation draft saved.",
    };
  };

  const openQuoteModal = (id, confirmationMessage) => {
    const r = getRecordById(id);
    const body = document.getElementById("adminReservationDetailBody");
    const modalEl = document.getElementById("adminReservationDetailModal");
    const saveBtn = document.getElementById("adminQuoteSaveBtn");
    const approveBtn = document.getElementById("adminQuoteApproveBtn");
    if (!r || !body || !modalEl) return;
    activeQuoteReservationId = id;
    body.innerHTML = renderQuoteEditorHtml(r);
    saveBtn?.classList.remove("d-none");
    approveBtn?.classList.remove("d-none");
    if (confirmationMessage) {
      const msg = document.getElementById("adminQuoteMessage");
      if (msg) {
        msg.className = "small mt-2 text-success";
        msg.textContent = confirmationMessage;
      }
    }
    bindQuoteEditorEvents(r);
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
    window.initResponsiveEnhancements?.();
  };

  tableBody.addEventListener("click", (e) => {
    const button = e.target.closest(".reservation-action-btn");
    if (!button) return;
    const row = button.closest("tr[data-id]");
    const id = row?.dataset.id || "";
    const action = button.dataset.action || "";

    if (action === "delete") {
      if (!id) return;

      (async () => {
        const { confirmed } = await window.cvrConfirmModal({
          title: "Delete reservation",
          message: `Reservation ${id} will be permanently deleted for every device and removed from the calendar. This cannot be undone.`,
          confirmText: "Delete reservation",
          icon: "bi-trash3",
        });
        if (!confirmed) return;
        const all = window.getStoredReservations();
        const next = all.filter((x) => x.id !== id);
        window.saveStoredReservations(next);
        if (typeof window.cvrApiPost === "function") {
          window.cvrApiPost("admin/reservations-delete", { id }).catch((err) => {
            console.warn("Server-side delete failed (removed locally only):", err);
          });
        }
        renderTable();
        window.cvrToast?.(`Reservation ${id} deleted.`, "success");
      })();
      return;
    }

    if (action === "view") {
      const r = getRecordById(id);
      const body = document.getElementById("adminReservationDetailBody");
      const modalEl = document.getElementById("adminReservationDetailModal");
      const saveBtn = document.getElementById("adminQuoteSaveBtn");
      const approveBtn = document.getElementById("adminQuoteApproveBtn");
      if (r && body && modalEl) {
        activeQuoteReservationId = "";
        body.innerHTML = renderAdminDetailHtml(r);
        saveBtn?.classList.add("d-none");
        approveBtn?.classList.add("d-none");
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
        window.initResponsiveEnhancements?.();
      }
      return;
    }

    if (action === "quote") {
      openQuoteModal(id);
    }
  });

  document.getElementById("adminQuoteSaveBtn")?.addEventListener("click", () => {
    const record = getRecordById(activeQuoteReservationId);
    if (!record) return;
    const { confirmationMessage } = persistQuoteFromEditor(record, false);
    openQuoteModal(activeQuoteReservationId, confirmationMessage);
  });

  document.getElementById("adminQuoteApproveBtn")?.addEventListener("click", () => {
    const record = getRecordById(activeQuoteReservationId);
    if (!record) return;
    const { confirmationMessage } = persistQuoteFromEditor(record, true);
    openQuoteModal(activeQuoteReservationId, confirmationMessage);
  });

  [searchInput, statusFilter, roomFilter, dateFilter, dateFrom, dateTo, quoteFilter].filter(Boolean).forEach((el) => {
    el.addEventListener("input", applyFilters);
    el.addEventListener("change", applyFilters);
  });

  document.addEventListener("cvr-reservations-synced", () => {
    renderTable();
  });

  exportBtn?.addEventListener("click", () => {
    if (!window.CVRAdminExport) {
      window.alert("Export module not loaded.");
      return;
    }
    window.CVRAdminExport.downloadReservationPageExport("docx", exportBtn, exportStatus);
  });

  exportPdfBtn?.addEventListener("click", () => {
    if (!window.CVRAdminExport) {
      window.alert("Export module not loaded.");
      return;
    }
    window.CVRAdminExport.downloadReservationPageExport("pdf", exportPdfBtn, exportStatus);
  });

  renderTable();
  refreshFromServer();
}
