

const ADMIN_CALENDAR_STORAGE_KEY = "cv_bookings_v1";
const CVR_RESERVATIONS_STORAGE_KEY = "cvrReservations";

function initAdminCalendarPage() {
  const calendarReadOnly = !!window.__CVR_CALENDAR_READONLY__;
  const grid = document.getElementById("calendarGrid");
  const monthLabel = document.getElementById("calendarMonthLabel");
  const prevBtn = document.getElementById("calendarPrevBtn");
  const nextBtn = document.getElementById("calendarNextBtn");
  const todayBtn = document.getElementById("bookingCalTodayBtn");
  const addTopBtn = document.getElementById("calendarAddBookingBtn");
  const typeFilter = document.getElementById("calendarBookingTypeFilter");
  const paymentFilter = document.getElementById("calendarPaymentFilter");
  const statusFilter = document.getElementById("calendarStatusFilter");
  const spaceFilter = document.getElementById("calendarSpaceFilter");
  const viewDefault = document.getElementById("bookingCalViewDefault");
  const viewHeatmap = document.getElementById("bookingCalViewHeatmap");
  const refreshBtn = document.getElementById("bookingCalRefreshBtn");
  const exportBtn = document.getElementById("bookingCalExportBtn");
  const miniGrid = document.getElementById("bookingCalMiniGrid");
  const miniMonthLabel = document.getElementById("bookingCalMiniMonthLabel");
  const miniPrev = document.getElementById("bookingCalMiniPrev");
  const miniNext = document.getElementById("bookingCalMiniNext");

  const modalEl = document.getElementById("calendarBookingModal");
  const dateText = document.getElementById("calendarSelectedDateText");
  const listWrap = document.getElementById("calendarBookingList");
  const showAddFormBtn = document.getElementById("calendarShowAddFormBtn");
  const formWrap = document.getElementById("calendarBookingFormWrap");
  const formTitle = document.getElementById("calendarFormTitle");
  const bookingForm = document.getElementById("calendarBookingForm");
  const cancelFormBtn = document.getElementById("calendarCancelFormBtn");
  const editIdInput = document.getElementById("calendarEditBookingId");
  const formType = document.getElementById("calendarFormType");
  const formTitleInput = document.getElementById("calendarFormTitleInput");
  const formDate = document.getElementById("calendarFormDate");
  const formEndDate = document.getElementById("calendarFormEndDate");
  const formGuests = document.getElementById("calendarFormGuests");
  const formStatus = document.getElementById("calendarFormStatus");
  const formPayment = document.getElementById("calendarFormPaymentStatus");
  const formNotes = document.getElementById("calendarFormNotes");

  if (
    !grid ||
    !monthLabel ||
    !prevBtn ||
    !nextBtn ||
    !typeFilter ||
    !paymentFilter ||
    !modalEl ||
    !dateText ||
    !listWrap ||
    !showAddFormBtn ||
    !formWrap ||
    !formTitle ||
    !bookingForm ||
    !cancelFormBtn ||
    !editIdInput ||
    !formType ||
    !formTitleInput ||
    !formDate ||
    !formEndDate ||
    !formGuests ||
    !formStatus ||
    !formPayment ||
    !formNotes
  ) {
    return;
  }

  const modal = window.bootstrap ? window.bootstrap.Modal.getOrCreateInstance(modalEl) : null;
  const state = {
    currentMonth: new Date(),
    selectedDateISO: null,
    viewMode: "default",
    miniMonth: new Date(),
  };

  state.currentMonth.setDate(1);
  state.miniMonth = new Date(state.currentMonth);

  const toISODate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const parseISODate = (iso) => {
    const [y, m, d] = String(iso || "").split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  const formatReadableDate = (iso) => {
    const date = parseISODate(iso);
    if (!date) return iso || "-";
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const toMonthTitle = (date) => date.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const loadCvrReservations = () => {
    if (typeof window.getStoredReservations === "function") {
      try {
        return window.getStoredReservations();
      } catch {
        return [];
      }
    }
    try {
      const raw = localStorage.getItem(CVR_RESERVATIONS_STORAGE_KEY);
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const loadManualCalendarBookings = () => {
    if (Array.isArray(window.__CVR_CALENDAR_BOOKINGS__)) {
      return window.__CVR_CALENDAR_BOOKINGS__;
    }
    try {
      const raw = localStorage.getItem(ADMIN_CALENDAR_STORAGE_KEY);
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveManualBookings = (bookings) => {
    if (calendarReadOnly) return;
    localStorage.setItem(ADMIN_CALENDAR_STORAGE_KEY, JSON.stringify(bookings));
  };

  const paymentIsPaid = (b) => /paid|approv|verified/i.test(String(b?.paymentStatus || ""));

  const simplifyReservationStatus = (r) => {
    const rs = String(r.reservationStatus || r.status || "").toLowerCase();
    const ps = String(r.paymentStatus || "").toLowerCase();
    if (rs.includes("cancel")) return "Cancelled";
    if (rs.includes("confirm") || paymentIsPaid(r) || ps.includes("approv")) return "Confirmed";
    return "Pending";
  };

  const normalizeCvrReservation = (r) => {
    const bookingType = r.bookingType === "event" ? "event" : "room";
    const startDate = toISODate(
      bookingType === "room" ? r.checkIn || r.checkInDate : r.preferredDate || r.checkIn || r.checkInDate
    );
    const endDate = toISODate(
      bookingType === "room"
        ? r.checkOut || r.checkOutDate || r.checkIn
        : r.checkOut || r.checkOutDate || r.preferredDate || r.checkIn || r.checkInDate
    );
    const title = bookingType === "room" ? r.roomName || "Room stay" : r.eventType || "Event";
    const status = simplifyReservationStatus(r);
    const paymentStatus = paymentIsPaid(r) ? "Paid" : "Pending";
    return {
      ...r,
      source: "cvr",
      bookingType,
      startDate,
      endDate: endDate || startDate,
      title,
      guestName: r.customerName || "Guest",
      status,
      paymentStatus,
      spaceKey: (r.roomName || r.eventType || title || "").trim(),
    };
  };

  const normalizeManualBooking = (booking) => {
    const bookingType = booking.bookingType === "event" ? "event" : "room";
    const startDate = toISODate(
      bookingType === "room"
        ? booking.checkInDate || booking.preferredDate
        : booking.preferredDate || booking.checkInDate
    );
    const endDate = toISODate(booking.checkOutDate || booking.preferredDate || booking.checkInDate);
    const title = bookingType === "room" ? booking.roomName || "Room" : booking.eventType || "Event";
    const status = booking.status || "Pending";
    const paymentStatus = booking.paymentStatus || "Pending";
    return {
      ...booking,
      source: "manual",
      bookingType,
      startDate,
      endDate: endDate || startDate,
      title,
      guestName: booking.guestName || booking.customerName || "Guest",
      status,
      paymentStatus,
      spaceKey: (booking.roomName || booking.eventType || title || "").trim(),
    };
  };

  const loadMergedBookings = () => {
    const manual = loadManualCalendarBookings().map(normalizeManualBooking);
    const cvr = loadCvrReservations().map(normalizeCvrReservation);
    const seen = new Set();
    const out = [];
    for (const b of [...cvr, ...manual]) {
      if (b.id && seen.has(b.id)) continue;
      if (b.id) seen.add(b.id);
      out.push(b);
    }
    return out;
  };

  const populateSpaceFilter = (bookings) => {
    if (!spaceFilter) return;
    const spaces = new Set();
    bookings.forEach((b) => {
      const s = (b.spaceKey || b.roomName || b.title || "").trim();
      if (s) spaces.add(s);
    });
    const current = spaceFilter.value;
    spaceFilter.innerHTML = `<option value="all">All spaces</option>`;
    [...spaces].sort((a, b) => a.localeCompare(b)).forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      spaceFilter.appendChild(opt);
    });
    if ([...spaces].includes(current)) spaceFilter.value = current;
  };

  const getFilteredBookings = () => {
    const typeValue = typeFilter.value;
    const paymentValue = paymentFilter.value;
    const statusValue = statusFilter?.value || "all";
    const spaceValue = spaceFilter?.value || "all";
    return loadMergedBookings().filter((item) => {
      const typeOk = typeValue === "all" || item.bookingType === typeValue;
      const payOk =
        paymentValue === "all" ||
        (paymentValue === "Paid" ? item.paymentStatus === "Paid" : item.paymentStatus === "Pending");
      const statusOk = statusValue === "all" || String(item.status) === statusValue;
      const spaceOk =
        spaceValue === "all" ||
        String(item.spaceKey || item.roomName || item.title || "")
          .trim()
          .toLowerCase() === spaceValue.trim().toLowerCase();
      return typeOk && payOk && statusOk && spaceOk;
    });
  };

  const datesBetween = (startIso, endIso) => {
    const out = [];
    const start = parseISODate(startIso);
    const end = parseISODate(endIso);
    if (!start) return out;
    const safeEnd = end && end >= start ? end : start;
    const cursor = new Date(start);
    while (cursor <= safeEnd) {
      out.push(toISODate(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  };

  const isOnDate = (booking, isoDate) => {
    if (!booking.startDate) return false;
    return datesBetween(booking.startDate, booking.endDate).includes(isoDate);
  };

  const getBookingsForDate = (isoDate) => getFilteredBookings().filter((item) => isOnDate(item, isoDate));

  const rangesOverlapStrings = (aStart, aEnd, bStart, bEnd) => {
    if (!aStart || !bStart) return false;
    const ae = aEnd || aStart;
    const be = bEnd || bStart;
    return aStart <= be && bStart <= ae;
  };

  const isCancelledBooking = (b) => String(b.status || "").toLowerCase() === "cancelled";

  const buildConflictIdSet = (bookings) => {
    const set = new Set();
    const rooms = bookings.filter((b) => b.bookingType === "room" && !isCancelledBooking(b));
    for (let i = 0; i < rooms.length; i += 1) {
      for (let j = i + 1; j < rooms.length; j += 1) {
        const a = rooms[i];
        const b = rooms[j];
        const sa = String(a.spaceKey || a.roomName || a.title || "")
          .trim()
          .toLowerCase();
        const sb = String(b.spaceKey || b.roomName || b.title || "")
          .trim()
          .toLowerCase();
        if (!sa || sa !== sb) continue;
        if (!rangesOverlapStrings(a.startDate, a.endDate, b.startDate, b.endDate)) continue;
        if (a.id) set.add(a.id);
        if (b.id) set.add(b.id);
      }
    }
    return set;
  };

  const getStatusMeta = (booking, isoDate) => {
    if (booking.bookingType === "room" && booking.startDate === isoDate) {
      return { label: "Check-in", tone: "checkin" };
    }
    if (booking.bookingType === "room" && booking.endDate === isoDate && booking.endDate !== booking.startDate) {
      return { label: "Check-out", tone: "checkout" };
    }
    const st = String(booking.status || "Pending");
    if (/cancel/i.test(st)) return { label: st, tone: "cancelled" };
    if (/confirm|approv|paid|verified/i.test(st)) return { label: st, tone: "confirmed" };
    return { label: st, tone: "pending" };
  };

  const hideForm = () => {
    formWrap.classList.add("d-none");
    bookingForm.reset();
    editIdInput.value = "";
  };

  const showForm = (mode = "add", booking = null) => {
    formWrap.classList.remove("d-none");
    if (mode === "edit" && booking) {
      formTitle.textContent = booking.source === "cvr" ? "View manual copy (CVR)" : "Edit booking";
      editIdInput.value = booking.id || "";
      formType.value = booking.bookingType || "room";
      formTitleInput.value = booking.title || "";
      formDate.value = booking.startDate || state.selectedDateISO || "";
      formEndDate.value = booking.bookingType === "room" ? booking.endDate || "" : "";
      formGuests.value = booking.guests || booking.eventGuests || 2;
      formStatus.value = booking.status || "Pending";
      formPayment.value = booking.paymentStatus || "Pending";
      formNotes.value = booking.additionalNotes || "";
      if (booking.source === "cvr") {
        formTitle.textContent = "Guest reservation (read-only here)";
        formWrap.querySelectorAll("input, select, textarea").forEach((el) => {
          if (el.type === "hidden") return;
          if (el.id === "calendarEditBookingId") return;
          el.setAttribute("disabled", "disabled");
        });
        formWrap.querySelector('button[type="submit"]')?.setAttribute("disabled", "disabled");
      } else {
        formWrap.querySelectorAll("input, select, textarea").forEach((el) => {
          el.removeAttribute("disabled");
        });
        formWrap.querySelector('button[type="submit"]')?.removeAttribute("disabled");
      }
      return;
    }

    formTitle.textContent = "Add booking";
    editIdInput.value = "";
    formType.value = "room";
    formTitleInput.value = "";
    formDate.value = state.selectedDateISO || "";
    formEndDate.value = "";
    formGuests.value = "2";
    formStatus.value = "Pending";
    formPayment.value = "Pending";
    formNotes.value = "";
    formWrap.querySelectorAll("input, select, textarea").forEach((el) => {
      el.removeAttribute("disabled");
    });
    formWrap.querySelector('button[type="submit"]')?.removeAttribute("disabled");
  };

  const renderDateModalList = () => {
    const selectedIso = state.selectedDateISO;
    if (!selectedIso) return;

    const bookings = getBookingsForDate(selectedIso);
    const conflictIds = buildConflictIdSet(loadMergedBookings());
    const holiday = typeof window.getPHHoliday === "function" ? window.getPHHoliday(selectedIso) : null;
    dateText.textContent = formatReadableDate(selectedIso);

    const holidayBanner = holiday
      ? `<div class="booking-cal-holiday-banner booking-cal-holiday-banner--${holiday.type}">
           <i class="bi bi-flag-fill me-1"></i>${escapeCalHtml(holiday.name)}
           <span class="booking-cal-holiday-banner-type">${escapeCalHtml(holiday.typeLabel)}</span>
         </div>`
      : "";

    if (!bookings.length) {
      listWrap.innerHTML = `${holidayBanner}<div class="booking-cal-empty-day">No bookings on this date. Add one or pick another day.</div>`;
      return;
    }

    listWrap.innerHTML = holidayBanner + bookings
      .map((item) => {
        const meta = getStatusMeta(item, selectedIso);
        const conflict = item.id && conflictIds.has(item.id);
        const typeLabel = item.bookingType === "event" ? "Event" : "Room";
        const src = item.source === "cvr" ? "Guest reservation" : "Manual calendar";
        return `
        <div class="booking-cal-modal-card" data-booking-id="${item.id || ""}">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
            <div class="min-w-0">
              <div class="booking-cal-modal-name text-truncate">${escapeCalHtml(item.guestName || "Guest")}</div>
              <div class="booking-cal-modal-roomline text-truncate">${escapeCalHtml(item.title)}</div>
              <div class="booking-cal-modal-meta">${typeLabel} · ${src}</div>
            </div>
            <div class="d-flex flex-column align-items-end gap-1">
              <span class="booking-cal-pill booking-cal-pill--${meta.tone}">${escapeCalHtml(meta.label)}</span>
              <span class="booking-cal-pill booking-cal-pill--pay-${item.paymentStatus === "Paid" ? "yes" : "no"}">${escapeCalHtml(item.paymentStatus)}</span>
              ${conflict ? `<span class="booking-cal-pill booking-cal-pill--conflict">Overlap</span>` : ""}
            </div>
          </div>
          <div class="small text-muted-brand mb-2">
            ${formatReadableDate(item.startDate)}
            ${item.endDate && item.endDate !== item.startDate ? ` → ${formatReadableDate(item.endDate)}` : ""}
            ${item.durationLabel ? `<br>${escapeCalHtml(item.durationLabel)}${item.checkInLabel ? ` · ${escapeCalHtml(item.checkInLabel)} – ${escapeCalHtml(item.checkOutLabel || "")} (strict)` : ""}` : ""}
            ${item.penaltyAmount > 0 ? `<br><span class="text-danger"><i class="bi bi-alarm"></i> Overtime ${escapeCalHtml(String(item.overtimeHours || 0))}h penalty applied</span>` : ""}
          </div>
          <div class="d-flex gap-2 flex-wrap">
            ${
              item.source === "cvr"
                ? `<a class="btn btn-sm btn-outline-primary" href="reservations.html?highlight=${encodeURIComponent(item.id)}">Open in Reservations</a>`
                : `<button type="button" class="btn btn-sm btn-outline-primary calendar-edit-btn" data-id="${item.id}">Edit</button>
                   <button type="button" class="btn btn-sm btn-outline-danger calendar-delete-btn" data-id="${item.id}">Delete</button>`
            }
          </div>
        </div>
      `;
      })
      .join("");

    listWrap.querySelectorAll(".calendar-edit-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;
        if (!id) return;
        if (calendarReadOnly) {
          const base = (window.__CVR_ADMIN_BASE__ || "").replace(/\/$/, "");
          window.location.href = `${base}/reservations.html?highlight=${encodeURIComponent(id)}`;
          return;
        }
        const booking = getFilteredBookings().find((item) => item.id === id);
        if (!booking) return;
        showForm("edit", booking);
      });
    });

    listWrap.querySelectorAll(".calendar-delete-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;
        if (!id) return;
        if (!window.confirm("Delete this manual booking?")) return;
        if (calendarReadOnly) {
          window.alert("Use Reservations to manage guest bookings.");
          return;
        }
        const next = loadManualCalendarBookings().filter((item) => item.id !== id);
        saveManualBookings(next);
        renderCalendar();
        renderMiniCalendar();
        renderDateModalList();
      });
    });
  };

  const openDateModal = (isoDate, showAdd = false) => {
    state.selectedDateISO = isoDate;
    renderDateModalList();
    if (showAdd) showForm("add");
    else hideForm();
    if (modal) modal.show();
  };

  const escapeCalHtml = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const maxBookingsInMonthCells = (monthStart, bookings) => {
    const firstCell = new Date(monthStart);
    firstCell.setDate(1 - monthStart.getDay());
    let max = 0;
    for (let i = 0; i < 42; i += 1) {
      const cellDate = new Date(firstCell);
      cellDate.setDate(firstCell.getDate() + i);
      const iso = toISODate(cellDate);
      const n = bookings.filter((b) => isOnDate(b, iso)).length;
      if (n > max) max = n;
    }
    return max || 1;
  };

  const renderCalendar = () => {
    populateSpaceFilter(loadMergedBookings());
    const monthStart = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth(), 1);
    const firstCell = new Date(monthStart);
    firstCell.setDate(1 - monthStart.getDay());

    monthLabel.textContent = toMonthTitle(monthStart);
    grid.innerHTML = "";

    const allBookings = getFilteredBookings();
    const conflictIds = buildConflictIdSet(loadMergedBookings());
    const todayIso = toISODate(new Date());
    const heatmap = state.viewMode === "heatmap";
    const maxCount = heatmap ? maxBookingsInMonthCells(monthStart, allBookings) : 1;

    for (let i = 0; i < 42; i += 1) {
      const cellDate = new Date(firstCell);
      cellDate.setDate(firstCell.getDate() + i);
      const iso = toISODate(cellDate);
      const inCurrentMonth = cellDate.getMonth() === monthStart.getMonth();

      const dayBookings = allBookings.filter((item) => isOnDate(item, iso));
      const show = dayBookings.slice(0, 4);
      const more = dayBookings.length - show.length;
      const holiday = typeof window.getPHHoliday === "function" ? window.getPHHoliday(iso) : null;

      let heatStyle = "";
      if (heatmap && inCurrentMonth) {
        const t = dayBookings.length / maxCount;
        const alpha = 0.06 + t * 0.38;
        heatStyle = `style="background:rgba(50,139,195,${alpha});"`;
      }

      const cell = document.createElement("div");
      cell.className = "booking-cal-cell-wrap";
      cell.innerHTML = `
        <button type="button" class="booking-cal-cell ${inCurrentMonth ? "" : "booking-cal-cell--faded"} ${iso === todayIso ? "booking-cal-cell--today" : ""} ${heatmap && inCurrentMonth ? "booking-cal-cell--heat" : ""} ${holiday ? "booking-cal-cell--holiday" : ""}" data-date="${iso}" ${heatmap && inCurrentMonth ? heatStyle : ""} ${holiday ? `title="${escapeCalHtml(holiday.name)} (${escapeCalHtml(holiday.typeLabel)})"` : ""}>
          <span class="booking-cal-cell-num">${cellDate.getDate()}</span>
          ${holiday ? `<span class="booking-cal-cell-holiday booking-cal-cell-holiday--${holiday.type}">${escapeCalHtml(holiday.name)}</span>` : ""}
          <div class="booking-cal-cell-events">
            ${show
              .map((item) => {
                const meta = getStatusMeta(item, iso);
                const conflict = item.id && conflictIds.has(item.id);
                return `
                <div class="booking-cal-event ${conflict ? "booking-cal-event--conflict" : ""}">
                  <span class="booking-cal-event-dot booking-cal-event-dot--${meta.tone}"></span>
                  <span class="booking-cal-event-text">
                    <span class="booking-cal-event-name">${escapeCalHtml(item.guestName || "Guest")}</span>
                    <span class="booking-cal-event-sub">${escapeCalHtml(item.bookingType === "event" ? "Event" : "Room")} · ${escapeCalHtml(meta.label)}</span>
                  </span>
                </div>`;
              })
              .join("")}
            ${more > 0 ? `<div class="booking-cal-more">+${more} more</div>` : ""}
          </div>
        </button>
      `;

      cell.querySelector(".booking-cal-cell")?.addEventListener("click", () => openDateModal(iso));
      grid.appendChild(cell);
    }

    state.miniMonth = new Date(state.currentMonth);
    renderMiniCalendar();
  };

  const renderMiniCalendar = () => {
    if (!miniGrid || !miniMonthLabel) return;
    const m = state.miniMonth;
    m.setDate(1);
    miniMonthLabel.textContent = m.toLocaleDateString(undefined, { month: "short", year: "numeric" });
    const start = new Date(m);
    start.setDate(1 - start.getDay());
    miniGrid.innerHTML = "";
    const mainMonth = state.currentMonth.getMonth();
    const mainYear = state.currentMonth.getFullYear();
    const todayIso = toISODate(new Date());

    for (let i = 0; i < 42; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = toISODate(d);
      const inMini = d.getMonth() === m.getMonth();
      const isSel = iso === state.selectedDateISO;
      const isMain = d.getMonth() === mainMonth && d.getFullYear() === mainYear;
      const holiday = typeof window.getPHHoliday === "function" ? window.getPHHoliday(iso) : null;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = [
        "booking-cal-mini-day",
        inMini ? "" : "booking-cal-mini-day--muted",
        iso === todayIso ? "booking-cal-mini-day--today" : "",
        isSel ? "booking-cal-mini-day--selected" : "",
        isMain ? "booking-cal-mini-day--in-main" : "",
        holiday ? "booking-cal-mini-day--holiday" : "",
      ]
        .filter(Boolean)
        .join(" ");
      btn.textContent = String(d.getDate());
      btn.setAttribute("aria-label", holiday ? `${formatReadableDate(iso)} — ${holiday.name}` : formatReadableDate(iso));
      if (holiday) btn.title = `${holiday.name} (${holiday.typeLabel})`;
      btn.addEventListener("click", () => {
        state.currentMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        state.miniMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        state.selectedDateISO = iso;
        renderCalendar();
      });
      miniGrid.appendChild(btn);
    }
  };

  prevBtn.addEventListener("click", () => {
    state.currentMonth.setMonth(state.currentMonth.getMonth() - 1);
    renderCalendar();
  });

  nextBtn.addEventListener("click", () => {
    state.currentMonth.setMonth(state.currentMonth.getMonth() + 1);
    renderCalendar();
  });

  todayBtn?.addEventListener("click", () => {
    const n = new Date();
    state.currentMonth = new Date(n.getFullYear(), n.getMonth(), 1);
    state.miniMonth = new Date(state.currentMonth);
    state.selectedDateISO = toISODate(n);
    renderCalendar();
    openDateModal(state.selectedDateISO, false);
  });

  miniPrev?.addEventListener("click", () => {
    state.miniMonth.setMonth(state.miniMonth.getMonth() - 1);
    renderMiniCalendar();
  });

  miniNext?.addEventListener("click", () => {
    state.miniMonth.setMonth(state.miniMonth.getMonth() + 1);
    renderMiniCalendar();
  });

  [typeFilter, paymentFilter, statusFilter, spaceFilter].filter(Boolean).forEach((select) => {
    select.addEventListener("change", () => {
      renderCalendar();
      if (state.selectedDateISO) renderDateModalList();
    });
  });

  viewDefault?.addEventListener("change", () => {
    if (viewDefault.checked) {
      state.viewMode = "default";
      renderCalendar();
    }
  });
  viewHeatmap?.addEventListener("change", () => {
    if (viewHeatmap.checked) {
      state.viewMode = "heatmap";
      renderCalendar();
    }
  });

  refreshBtn?.addEventListener("click", () => {
    renderCalendar();
    if (state.selectedDateISO) renderDateModalList();
  });

  exportBtn?.addEventListener("click", () => {
    const data = getFilteredBookings();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `casa-vergara-calendar-export-${toISODate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  addTopBtn?.addEventListener("click", () => {
    if (calendarReadOnly) {
      const base = (window.__CVR_ADMIN_BASE__ || "").replace(/\/$/, "");
      window.location.href = `${base}/reservations.html`;
      return;
    }
    const selected = state.selectedDateISO || toISODate(new Date());
    openDateModal(selected, true);
  });

  showAddFormBtn.addEventListener("click", () => {
    if (calendarReadOnly) {
      const base = (window.__CVR_ADMIN_BASE__ || "").replace(/\/$/, "");
      window.location.href = `${base}/reservations.html`;
      return;
    }
    showForm("add");
  });
  cancelFormBtn.addEventListener("click", hideForm);

  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (calendarReadOnly) {
      window.alert("Calendar is read-only. Use Reservations to edit guest bookings.");
      return;
    }

    const id = editIdInput.value || `BK-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
    const type = formType.value === "event" ? "event" : "room";
    const baseDate = toISODate(formDate.value);
    const endDate = toISODate(formEndDate.value) || baseDate;
    const title = formTitleInput.value.trim();
    if (!baseDate || !title) return;

    const existingBooking = getFilteredBookings().find((b) => b.id === id);
    if (existingBooking?.source === "cvr") {
      window.alert("Guest reservations cannot be edited from the calendar. Use Reservations.");
      return;
    }

    const next = loadManualCalendarBookings();
    const idx = next.findIndex((item) => item.id === id);
    const existing = idx >= 0 ? next[idx] : {};

    const record = {
      ...existing,
      id,
      bookingType: type,
      status: formStatus.value || "Pending",
      paymentStatus: formPayment.value || "Pending",
      guests: String(formGuests.value || "2"),
      additionalNotes: formNotes.value.trim(),
      guestName: existing.guestName || "Guest",
      createdAt: existing.createdAt || new Date().toISOString(),
    };

    if (type === "room") {
      record.roomName = title;
      record.checkInDate = baseDate;
      record.checkOutDate = endDate;
      record.eventType = existing.eventType || "";
      record.preferredDate = "";
    } else {
      record.eventType = title;
      record.preferredDate = baseDate;
      record.roomName = existing.roomName || "";
      record.checkInDate = "";
      record.checkOutDate = "";
      record.eventGuests = String(formGuests.value || "2");
    }

    if (idx >= 0) next[idx] = record;
    else next.unshift(record);

    saveManualBookings(next);
    hideForm();
    renderCalendar();
    renderDateModalList();
  });

  renderCalendar();
}
