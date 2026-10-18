function initBookingPage() {
  const bookingTypeSelect = document.getElementById("bookingType");
  const roomSection = document.getElementById("roomBookingSection");
  const eventSection = document.getElementById("eventBookingSection");
  const eventForm = document.getElementById("eventReservationForm");
  const feedback = document.getElementById("bookingFeedback");
  const cat = window.CVRBookingCatalog;

  if (!bookingTypeSelect || !roomSection || !eventSection || !feedback || !cat) return;

  const isStaffBrowsing = typeof isStaffSession === "function" && isStaffSession(getCustomerSession?.());
  const blockStaffBooking = () => {
    if (!isStaffBrowsing) return false;
    feedback.textContent = "Admin and event manager accounts can't create bookings here. Manage reservations from the admin dashboard instead.";
    feedback.classList.remove("d-none", "alert-success");
    feedback.classList.add("alert-danger");
    feedback.scrollIntoView({ behavior: "smooth", block: "center" });
    return true;
  };

  const escapeHtml = (s) => {
    const d = document.createElement("div");
    d.textContent = String(s ?? "");
    return d.innerHTML;
  };

  const showMessage = (message, isError = false) => {
    feedback.textContent = message;
    feedback.classList.remove("d-none", "alert-success", "alert-danger");
    feedback.classList.add(isError ? "alert-danger" : "alert-success");
    window.setTimeout(() => feedback.classList.add("d-none"), 5000);
  };

  const playSwitchAnim = (el) => {
    if (!el) return;
    el.classList.remove("cvr-filter-anim");

    void el.offsetWidth;
    el.classList.add("cvr-filter-anim");
  };

  const stayDurationWrap = document.getElementById("cvrStayDurationWrap");
  const roomTimingNote = document.getElementById("cvrRoomTimingNote");
  const filterRow = document.getElementById("bookingFilterRow");

  const toggleSections = () => {
    const isRoom = bookingTypeSelect.value === "room";
    roomSection.classList.toggle("d-none", !isRoom);
    eventSection.classList.toggle("d-none", isRoom);
    stayDurationWrap?.classList.toggle("d-none", !isRoom);
    document.getElementById("cvrCheckInTimeWrap")?.classList.toggle("d-none", !isRoom);
    if (!isRoom) document.getElementById("cvrRoomCheckOutTimeWrap")?.classList.add("d-none");
    roomTimingNote?.classList.toggle("d-none", !isRoom);

    filterRow?.classList.toggle("cvr-filter-event-mode", !isRoom);
    playSwitchAnim(filterRow);

    playSwitchAnim(isRoom ? roomSection : eventSection);
  };

  const setDefaultDates = () => {
    const checkIn = document.getElementById("checkInDate");
    if (!checkIn) return;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = (d) => d.toISOString().slice(0, 10);
    if (!checkIn.value) checkIn.value = iso(tomorrow);
    checkIn.min = iso(today);
  };

  const getSelectedDuration = () => document.getElementById("stayDuration")?.value || "24hr";

  const getRawExtendedNights = () => {
    const checkIn = document.getElementById("checkInDate")?.value || "";
    const checkOut = document.getElementById("checkOutDate")?.value || "";
    if (!checkIn || !checkOut) return 0;
    return cat.countNightsBetween ? cat.countNightsBetween(checkIn, checkOut) : 0;
  };
  const getSelectedNights = () => window.CVRDuration?.clampExtendedNights(getRawExtendedNights() || 2) ?? 2;

  const checkOutWrap = document.getElementById("cvrCheckOutWrap");
  const checkOutDateHidden = document.getElementById("checkOutDate");
  const checkInTimeWrap = document.getElementById("cvrCheckInTimeWrap");
  const roomCheckOutTimeWrap = document.getElementById("cvrRoomCheckOutTimeWrap");
  const extOpt = window.CVRDuration?.get("extended");
  const extMinNights = extOpt?.minNights ?? 2;
  const extMaxNights = extOpt?.maxNights ?? 14;

  const readTimeTriplet = (hourId, minuteId, meridiemId) => {
    const hour = document.getElementById(hourId)?.value ?? "";
    const minute = document.getElementById(minuteId)?.value ?? "";
    const meridiem = document.getElementById(meridiemId)?.value ?? "";
    const anyFilled = Boolean(hour || minute !== "" || meridiem);
    const allFilled = Boolean(hour && minute !== "" && meridiem);
    const parsed = allFilled ? window.CVRDuration?.parse12HourTime?.(hour, minute, meridiem) || null : null;
    const allowed = parsed ? Boolean(window.CVRDuration?.isCustomCheckInTimeAllowed?.(parsed)) : false;
    return {
      time: allowed ? parsed : null,
      incomplete: anyFilled && !allFilled,
      outOfRange: Boolean(parsed) && !allowed,
    };
  };

  const getCheckInTimeSelection = () => readTimeTriplet("cvrCheckInHour", "cvrCheckInMinute", "cvrCheckInMeridiem");

  const getCheckOutTimeSelection = () => readTimeTriplet("cvrCheckOutHour", "cvrCheckOutMinute", "cvrCheckOutMeridiem");

  const applyDefaultCheckInTimeForDuration = () => {
    ["cvrCheckInHour", "cvrCheckInMinute", "cvrCheckInMeridiem", "cvrCheckOutHour", "cvrCheckOutMinute", "cvrCheckOutMeridiem"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  };

  const syncCheckOutVisibility = () => {
    const isExtended = getSelectedDuration() === "extended";
    checkOutWrap?.classList.toggle("d-none", !isExtended);
    roomCheckOutTimeWrap?.classList.toggle("d-none", !isExtended);
    checkInTimeWrap?.classList.remove("d-none");
    applyDefaultCheckInTimeForDuration();
    playSwitchAnim(filterRow);
  };
  document.getElementById("stayDuration")?.addEventListener("change", () => {
    syncCheckOutVisibility();

    renderRoomCards();
  });

  checkOutDateHidden?.addEventListener("change", () => renderRoomCards());

  ["cvrCheckInHour", "cvrCheckInMinute", "cvrCheckInMeridiem"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", () => renderRoomCards());
  });
  syncCheckOutVisibility();

  const validateRoomBooking = (pkg, checkIn, durationKey, guestsNum, nights, checkInSelection, checkOutSelection) => {
    if (!checkIn) return "Please select your check-in date.";
    const today = new Date().toISOString().slice(0, 10);
    if (checkIn < today) return "Check-in date cannot be in the past.";
    if (!window.CVRDuration?.get(durationKey)) return "Please select a stay duration.";
    if (durationKey === "extended") {
      const checkOut = document.getElementById("checkOutDate")?.value || "";
      if (!checkOut) return "Please select your check-out date.";
      const rawNights = getRawExtendedNights();
      if (rawNights < extMinNights || rawNights > extMaxNights) {
        return `Multi-Day / Extended Stay must be between ${extMinNights} and ${extMaxNights} nights. Please choose a different check-out date.`;
      }
    }

    if (checkInSelection.incomplete) {
      return "Choose hour, minutes, and AM/PM for your arrival time, or clear all three to use the default.";
    }
    if (checkInSelection.outOfRange) {
      return "Please choose a valid arrival time.";
    }
    if (durationKey === "extended") {
      if (checkOutSelection.incomplete) {
        return "Choose hour, minutes, and AM/PM for your departure time, or clear all three to use the default.";
      }
      if (checkOutSelection.outOfRange) {
        return "Please choose a valid departure time.";
      }
    }
    if (guestsNum < pkg.capacity.min || guestsNum > pkg.capacity.max) {
      return `This package allows ${pkg.capacity.min}–${pkg.capacity.max} guests.`;
    }
    if (typeof window.roomStayOverlapsExisting === "function") {
      const win = window.CVRDuration.buildWindow(checkIn, durationKey, nights, checkInSelection.time, checkOutSelection.time);
      if (win && window.roomStayOverlapsExisting(pkg.id, pkg.title, win.checkInDateOnly, win.checkOutDateOnly, "", win.scheduledCheckIn, win.scheduledCheckOut)) {
        return "Sorry, that fixed time slot was just booked for this room. Please choose a different date or duration.";
      }
    }
    return "";
  };

  const bookRoom = (packageId) => {
    if (blockStaffBooking()) return;
    const pkg = cat.getRoomPackageById(packageId);
    if (!pkg) {
      showMessage("Package not found. Please refresh the page.", true);
      return;
    }
    const checkIn = document.getElementById("checkInDate")?.value || "";
    const durationKey = getSelectedDuration();
    const nights = durationKey === "extended" ? getSelectedNights() : 1;
    const checkInSelection = getCheckInTimeSelection();
    const checkOutSelection = durationKey === "extended" ? getCheckOutTimeSelection() : { time: null, incomplete: false, outOfRange: false };
    const guestsNum = Math.min(
      Math.max(pkg.capacity?.min ?? 1, 1),
      Math.max(pkg.capacity?.max ?? 1, 1)
    );

    const err = validateRoomBooking(pkg, checkIn, durationKey, guestsNum, nights, checkInSelection, checkOutSelection);
    if (err) {
      showMessage(err, true);
      return;
    }

    const win = window.CVRDuration.buildWindow(checkIn, durationKey, nights, checkInSelection.time, checkOutSelection.time);

    cat.setPendingReservation({
      bookingType: "room",
      packageId: pkg.id,
      durationKey,
      extendedNights: durationKey === "extended" ? nights : null,
      customCheckInTime: win.customCheckInTime,
      customCheckOutTime: win.customCheckOutTime,
      checkInDate: win.checkInDateOnly,
      checkOutDate: win.checkOutDateOnly,
      scheduledCheckIn: win.scheduledCheckIn,
      scheduledCheckOut: win.scheduledCheckOut,
      checkInLabel: win.checkInLabel,
      checkOutLabel: win.checkOutLabel,
      guests: guestsNum,
      createdAt: new Date().toISOString(),
    });
    window.location.href = "reservation-form.html";
  };
  window.cvrBookRoom = bookRoom;

  const renderRoomCards = () => {
    const grid = document.getElementById("roomPackagesGrid");
    if (!grid) return;
    const durationKey = getSelectedDuration();
    const rawNights = getRawExtendedNights();
    const extendedNightsValid = durationKey === "extended" && rawNights >= extMinNights && rawNights <= extMaxNights;
    const extendedNights = extendedNightsValid ? rawNights : extMinNights;

    const customArrival = getCheckInTimeSelection().time;
    const windowLabel = (key, fallback) => {
      if (!customArrival) return fallback;
      const w = window.CVRDuration?.buildWindow("2000-01-01", key, null, customArrival, null);
      return w && w.customCheckInTime ? `${w.checkInLabel}–${w.checkOutLabel}` : fallback;
    };
    const label3 = windowLabel("3hr", "8AM–11AM");
    const label12 = windowLabel("12hr", "8AM–8PM");
    const label24 = windowLabel("24hr", "2PM–2PM");
    grid.innerHTML = cat
      .getRoomPackages({ activeOnly: true })
      .map((pkg) => {
        const inc = pkg.inclusions.slice(0, 4).join(" · ");
        const more = pkg.inclusions.length > 4 ? " +" + (pkg.inclusions.length - 4) + " more" : "";
        const dur = window.CVRDuration;
        const rate3 = dur ? dur.roomRate(pkg.pricePerNight, "3hr") : 0;
        const rate12 = dur ? dur.roomRate(pkg.pricePerNight, "12hr") : 0;
        const rate24 = dur ? dur.roomRate(pkg.pricePerNight, "24hr") : 0;
        const rateExtended = dur ? dur.roomRate(pkg.pricePerNight, "extended", extendedNights) : 0;
        const extendedRateLine = extendedNightsValid
          ? `<div class="d-flex justify-content-between"><span>Multi-Day (${extendedNights} night${extendedNights !== 1 ? "s" : ""})</span><strong class="text-brand">${cat.formatMoney(rateExtended, pkg.currency)}</strong></div>`
          : `<div class="d-flex justify-content-between"><span>Multi-Day (${extMinNights}–${extMaxNights} nights)</span><span class="text-muted-brand fst-italic">Pick a check-out date above</span></div>`;
        return `
      <div class="col-12 col-md-6 col-lg-4" id="pkg-${pkg.id}">
        <div class="soft-card overflow-hidden h-100 booking-room-card d-flex flex-column">
          <div class="room-cover-wrap" data-package-id="${escapeHtml(pkg.id)}" role="button" tabindex="0" aria-label="View ${escapeHtml(pkg.title)} details and reviews">
            <img class="room-cover" src="${window.cvrResolvePackageImage ? cvrResolvePackageImage(pkg.image) : pkg.image}" alt="${escapeHtml(pkg.title)}">
            <div class="room-cover-overlay">
              <span class="room-cover-overlay-pill"><i class="bi bi-zoom-in me-1"></i>View details &amp; reviews</span>
            </div>
          </div>
          <div class="p-4 d-flex flex-column flex-grow-1">
            <h5 class="text-brand mb-1">${pkg.title}</h5>
            <p class="small text-muted-brand mb-2">${pkg.tagline}</p>
            <p class="small text-muted-brand mb-2">${pkg.description}</p>
            <ul class="small text-muted-brand ps-3 mb-2">
              <li>${pkg.areaSqm} m² · ${pkg.bed}</li>
              <li>Guests: ${pkg.capacity.min}–${pkg.capacity.max}</li>
            </ul>
            <p class="small mb-2"><span class="fw-semibold text-brand">Includes:</span> ${inc}${more}</p>
            <div class="cvr-duration-rates small mb-2 border-top pt-2">
              <div class="d-flex justify-content-between"><span>3-Hour Quick Stay (${label3})</span><strong class="text-brand">${cat.formatMoney(rate3, pkg.currency)}</strong></div>
              <div class="d-flex justify-content-between"><span>12-Hour Day Tour (${label12})</span><strong class="text-brand">${cat.formatMoney(rate12, pkg.currency)}</strong></div>
              <div class="d-flex justify-content-between"><span>24-Hour Overnight (${label24})</span><strong class="text-brand">${cat.formatMoney(rate24, pkg.currency)}</strong></div>
              ${extendedRateLine}
            </div>
            <p class="small text-muted-brand fst-italic mb-3">${pkg.availabilityNote} Arrival time is flexible and check-out follows exactly one full duration later, so you always get the complete 3, 12, or 24 hours; overtime is billed per hour past that check-out time.</p>
            <div class="d-flex ${isStaffBrowsing ? "justify-content-end" : "justify-content-end"} align-items-center mt-auto pt-2 border-top">
              ${isStaffBrowsing
                ? `<button type="button" class="btn btn-outline-primary room-view-btn" data-package-id="${pkg.id}">
                     <i class="bi bi-eye me-1"></i>View details
                   </button>`
                : `<button type="button" class="btn btn-brand booking-now-btn room-book-btn" data-package-id="${pkg.id}">
                     Book Now
                   </button>`}
            </div>
          </div>
        </div>
      </div>`;
      })
      .join("");

    grid.querySelectorAll(".room-cover-wrap").forEach((wrap) => {
      const open = () => window.cvrShowRoomDetails?.(wrap.dataset.packageId);
      wrap.addEventListener("click", open);
      wrap.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });

    grid.querySelectorAll(".room-view-btn").forEach((button) => {
      button.addEventListener("click", () => window.cvrShowRoomDetails?.(button.dataset.packageId));
    });

    grid.querySelectorAll(".room-book-btn").forEach((button) => {
      button.addEventListener("click", () => bookRoom(button.dataset.packageId));
    });

    const params = new URLSearchParams(window.location.search);
    const pre = params.get("package");
    if (pre) {
      const el = document.getElementById(`pkg-${pre}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  let eventPreferredCalendarReady = false;
  const ensureEventPreferredCalendar = () => {
    if (eventPreferredCalendarReady) return;
    if (typeof window.initEventPreferredDateCalendar === "function") {
      window.initEventPreferredDateCalendar();
      eventPreferredCalendarReady = true;
    }
  };

  const getSelectedEventDuration = () => document.getElementById("eventDuration")?.value || "12hr";

  const getSelectedEventNights = () => window.CVRDuration?.clampExtendedNights(document.getElementById("eventNights")?.value || 2) ?? 2;

  const getEventCheckInTimeSelection = () => readTimeTriplet("eventCheckInHour", "eventCheckInMinute", "eventCheckInMeridiem");
  const getEventCheckOutTimeSelection = () => readTimeTriplet("eventCheckOutHour", "eventCheckOutMinute", "eventCheckOutMeridiem");

  const syncEventDurationVisibility = () => {
    const isExtended = getSelectedEventDuration() === "extended";
    document.getElementById("eventNightsWrap")?.classList.toggle("d-none", !isExtended);
    document.getElementById("eventCheckOutTimeWrap")?.classList.toggle("d-none", !isExtended);
    playSwitchAnim(eventForm);
  };
  document.getElementById("eventDuration")?.addEventListener("change", syncEventDurationVisibility);
  syncEventDurationVisibility();

  bookingTypeSelect.addEventListener("change", () => {
    toggleSections();
    if (bookingTypeSelect.value === "event") ensureEventPreferredCalendar();
  });
  toggleSections();
  if (bookingTypeSelect.value === "event") ensureEventPreferredCalendar();
  setDefaultDates();
  renderRoomCards();

  const searchBtn = document.getElementById("bookingSearchBtn");
  searchBtn?.addEventListener("click", () => {
    toggleSections();
    const isRoom = bookingTypeSelect.value === "room";
    if (isRoom) {
      const checkIn = document.getElementById("checkInDate")?.value || "";
      if (!checkIn) {
        showMessage("Please select your arrival date.", true);
        return;
      }
      document.getElementById("roomPackagesGrid")?.scrollIntoView({ behavior: "smooth", block: "start" });
      showMessage(`Showing available room packages for a ${window.CVRDuration?.get(getSelectedDuration())?.label || "stay"} starting ${checkIn}.`);
      return;
    }
    document.getElementById("eventBookingSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
    ensureEventPreferredCalendar();
    showMessage("Complete the event form below to continue.");
  });

  if (eventForm) {

    const VENUE_PACKAGE_KEYS = [
      "Private Venue – Morning (8:00 AM–5:00 PM)",
      "Private Venue – Night (7:00 PM–5:00 AM)",
      "Private Venue – Whole Day (2 Sessions)",
      "Wedding Package",
      "Debut Package",
    ];
    const BIRTHDAY_PACKAGE_KEYS = ["Ayesha Package", "Anica Package", "Amarah Package", "Custom Package"];

    const getFixedSchedule = (key) => cat.getFixedEventSchedule?.(key) || null;

    const FIXED_DURATION_ONLY = {
      "Wedding Package": "24hr",
      "Debut Package": "24hr",
    };
    const getFixedDurationOnly = (key) => FIXED_DURATION_ONLY[key] || null;

    const eventTypeEl = document.getElementById("eventType");
    const venueGroupEl = document.getElementById("eventTypeVenueGroup");
    const birthdayWrapEl = document.getElementById("eventBirthdayPackageWrap");
    const birthdayEl = document.getElementById("eventBirthdayPackage");
    const otherSpecifyWrapEl = document.getElementById("eventOtherSpecifyWrap");
    const otherSpecifyEl = document.getElementById("eventOtherSpecify");
    const detailsEl = document.getElementById("eventPackageDetails");

    const NO_3HR_TYPES = new Set(["Reunion", "Team Building", "Others"]);
    const eventDuration3hrOptionEl = document.querySelector('#eventDuration option[value="3hr"]');

    const syncOtherSpecifyVisibility = () => {
      if (!otherSpecifyWrapEl) return;
      const isOthers = eventTypeEl?.value === "Others";
      otherSpecifyWrapEl.classList.toggle("d-none", !isOthers);
      if (!isOthers && otherSpecifyEl) otherSpecifyEl.value = "";
    };

    const syncDurationOptionsAvailability = () => {
      if (!eventDuration3hrOptionEl) return;
      const hide3hr = NO_3HR_TYPES.has(eventTypeEl?.value || "");
      eventDuration3hrOptionEl.disabled = hide3hr;
      eventDuration3hrOptionEl.hidden = hide3hr;
      const durationEl = document.getElementById("eventDuration");
      if (hide3hr && durationEl?.value === "3hr") durationEl.value = "12hr";
    };

    if (cat.getEventPackageKeys) {
      const activeKeys = new Set(cat.getEventPackageKeys({ activeOnly: true }));

      if (eventTypeEl && venueGroupEl) {
        const currentValue = eventTypeEl.value;
        venueGroupEl.innerHTML = VENUE_PACKAGE_KEYS.filter((k) => activeKeys.has(k))
          .map((key) => `<option value="${escapeHtml(key)}">${escapeHtml(key)}</option>`)
          .join("");
        if (currentValue) eventTypeEl.value = currentValue;
      }

      if (birthdayEl) {
        const currentValue = birthdayEl.value;
        birthdayEl.innerHTML =
          `<option value="">Select package</option>` +
          BIRTHDAY_PACKAGE_KEYS.filter((k) => activeKeys.has(k))
            .map((key) => `<option value="${escapeHtml(key)}">${escapeHtml(key)}</option>`)
            .join("");
        if (BIRTHDAY_PACKAGE_KEYS.includes(currentValue)) birthdayEl.value = currentValue;
      }
    }

    const getSelectedPackageKey = () => {
      const typeVal = eventTypeEl?.value || "";
      if (cat.getEventPackageCatalog(typeVal)) return typeVal;
      if (typeVal === "Birthday") return birthdayEl?.value || "";
      return "";
    };

    const syncBirthdayPackageVisibility = () => {
      if (!birthdayWrapEl) return;
      const isBirthday = eventTypeEl?.value === "Birthday";
      birthdayWrapEl.classList.toggle("d-none", !isBirthday);
      if (!isBirthday && birthdayEl) birthdayEl.value = "";
    };

    const durationWrapEl = document.getElementById("eventDurationWrap");
    const checkInTimeWrapEl = document.getElementById("eventCheckInTimeWrap");
    const fixedNoteEl = document.getElementById("eventFixedScheduleNote");
    const fixedNoteTextEl = document.getElementById("eventFixedScheduleText");

    const syncFixedScheduleVisibility = () => {
      const selectedKey = getSelectedPackageKey();
      const schedule = getFixedSchedule(selectedKey);
      const fixedDurationKey = getFixedDurationOnly(selectedKey);
      durationWrapEl?.classList.toggle("d-none", Boolean(schedule) || Boolean(fixedDurationKey));
      checkInTimeWrapEl?.classList.toggle("d-none", Boolean(schedule));
      fixedNoteEl?.classList.toggle("d-none", !schedule);
      if (schedule && fixedNoteTextEl) fixedNoteTextEl.textContent = schedule.label;
      if (schedule) {

        const durationEl = document.getElementById("eventDuration");
        if (durationEl) durationEl.value = schedule.durationKey;
        document.getElementById("eventNightsWrap")?.classList.add("d-none");
        document.getElementById("eventCheckOutTimeWrap")?.classList.add("d-none");
      } else if (fixedDurationKey) {
        const durationEl = document.getElementById("eventDuration");
        if (durationEl) durationEl.value = fixedDurationKey;
        document.getElementById("eventNightsWrap")?.classList.add("d-none");
        document.getElementById("eventCheckOutTimeWrap")?.classList.add("d-none");
      }
    };

    const renderPackageDetails = () => {
      if (!detailsEl) return;
      const key = getSelectedPackageKey();
      const pkg = cat.getEventPackageCatalog(key);
      const motifWrap = document.getElementById("eventMotifBookingWrap");
      const motifSelect = document.getElementById("eventMotifSelect");
      if (motifWrap && motifSelect && cat.getEventMotifs) {
        const motifs = cat.getEventMotifs(key);
        if (motifs.length) {
          motifWrap.classList.remove("d-none");
          motifSelect.innerHTML =
            `<option value="">Select on next step (or choose now)</option>` +
            motifs.map((m) => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.label)}</option>`).join("");
        } else {
          motifWrap.classList.add("d-none");
          motifSelect.innerHTML = "";
        }
      }
      if (!pkg) {
        detailsEl.classList.add("d-none");
        detailsEl.innerHTML = "";
        return;
      }

      const durationKey = document.getElementById("eventDuration")?.value || "12hr";
      const eventNights = durationKey === "extended" ? getSelectedEventNights() : null;
      const durationRate = pkg.flatRate
        ? Math.max(0, Number(pkg.price) || 0)
        : pkg.doubleRateOn24hr && durationKey === "24hr"
        ? Math.max(0, Number(pkg.price) || 0) * 2
        : window.CVRDuration
        ? window.CVRDuration.eventRate(pkg.price, durationKey, eventNights)
        : pkg.price;
      const guestCountVal = Number(document.getElementById("eventGuests")?.value) || 0;
      const paxSurcharge = cat.calculatePaxSurcharge ? cat.calculatePaxSurcharge(pkg, guestCountVal) : null;
      const totalWithSurcharge = durationRate + (paxSurcharge?.price || 0);
      const money = cat.formatMoney(totalWithSurcharge, "PHP");
      const paxLabel = pkg.isCustom
        ? `Flexible — up to ${pkg.pax} pax`
        : pkg.extraPaxRate && pkg.maxPax
        ? `Good for ${pkg.pax} pax (up to ${pkg.maxPax} pax, +₱${Number(pkg.extraPaxRate).toLocaleString()}/person past ${pkg.pax})`
        : `Good for ${pkg.pax} pax`;
      const priceLabel = pkg.flatRate
        ? "flat package price — same regardless of duration selected"
        : pkg.isCustom
        ? `starting price · ${window.CVRDuration?.get(durationKey)?.label || ""}${eventNights ? ` (${eventNights} nights)` : ""}`
        : `package price · ${window.CVRDuration?.get(durationKey)?.label || ""}${eventNights ? ` (${eventNights} nights)` : ""}`;
      const addOnCount = pkg.addOns?.length || 0;
      detailsEl.classList.remove("d-none");
      const photo = pkg.image
        ? `<img src="${escapeHtml(window.cvrResolvePackageImage ? cvrResolvePackageImage(pkg.image) : pkg.image)}" alt="${escapeHtml(key)}" class="w-100 rounded-3 mb-3" style="max-height:220px;object-fit:cover;">`
        : "";
      detailsEl.innerHTML = `
        <div class="soft-card p-3 border">
          ${photo}
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div>
              <h6 class="text-brand mb-1">${escapeHtml(key)}</h6>
              <div class="small text-muted-brand">${escapeHtml(paxLabel)}</div>
            </div>
            <div class="text-end">
              <div class="fw-semibold text-brand">${escapeHtml(money)}</div>
              <div class="small text-muted-brand">${escapeHtml(priceLabel)}</div>
              ${paxSurcharge ? `<div class="small text-primary mt-1">+ ${escapeHtml(cat.formatMoney(paxSurcharge.price, "PHP"))} for ${escapeHtml(String(guestCountVal))} guests</div>` : ""}
            </div>
          </div>
          <hr class="my-3">
          <ul class="small text-muted-brand mb-0 ps-3">
            ${(pkg.inclusions || []).map((it) => `<li>${escapeHtml(it)}</li>`).join("")}
          </ul>
          ${
            pkg.isCustom
              ? `<div class="small text-primary mt-3 mb-0"><i class="bi bi-stars me-1"></i>Mix and match — choose your own lighting, sound, motif, and decor add-ons on the next step (${addOnCount} options available).</div>`
              : ""
          }
        </div>
      `;
    };

    eventTypeEl?.addEventListener("change", () => {
      syncBirthdayPackageVisibility();
      syncOtherSpecifyVisibility();
      syncDurationOptionsAvailability();
      syncFixedScheduleVisibility();
      renderPackageDetails();
      playSwitchAnim(eventForm);
    });
    birthdayEl?.addEventListener("change", () => {
      syncFixedScheduleVisibility();
      renderPackageDetails();
      playSwitchAnim(eventForm);
    });
    document.getElementById("eventDuration")?.addEventListener("change", renderPackageDetails);
    document.getElementById("eventNights")?.addEventListener("change", renderPackageDetails);
    document.getElementById("eventNights")?.addEventListener("input", renderPackageDetails);
    document.getElementById("eventGuests")?.addEventListener("input", renderPackageDetails);
    syncBirthdayPackageVisibility();
    syncOtherSpecifyVisibility();
    syncDurationOptionsAvailability();
    syncFixedScheduleVisibility();
    renderPackageDetails();

    eventForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (blockStaffBooking()) return;

      const rawEventType = eventTypeEl?.value || "";
      const otherSpecifyVal = (otherSpecifyEl?.value || "").trim();
      const packageOption = getSelectedPackageKey();
      const fixedSchedule = getFixedSchedule(packageOption);
      const eventGuests = document.getElementById("eventGuests")?.value || "";
      const eventDateVal = document.getElementById("eventDate")?.value || "";
      const durationKey = fixedSchedule ? fixedSchedule.durationKey : document.getElementById("eventDuration")?.value || "12hr";
      const additionalNotes = document.getElementById("eventNotes")?.value || "";
      const isExtended = !fixedSchedule && durationKey === "extended";
      const eventNights = isExtended ? getSelectedEventNights() : null;
      const checkInSelection = fixedSchedule ? { time: fixedSchedule.checkInTime, incomplete: false, outOfRange: false } : getEventCheckInTimeSelection();
      const checkOutSelection = isExtended ? getEventCheckOutTimeSelection() : { time: null, incomplete: false, outOfRange: false };

      const eventType = rawEventType === "Others" && otherSpecifyVal ? `Others - ${otherSpecifyVal}` : rawEventType;

      if (!rawEventType) {
        showMessage("Please select an event type.", true);
        return;
      }
      if (rawEventType === "Others" && !otherSpecifyVal) {
        showMessage("Please specify your event type.", true);
        return;
      }
      if (!eventGuests || Number(eventGuests) < 1) {
        showMessage("Enter a valid number of guests.", true);
        return;
      }
      if (!eventDateVal) {
        showMessage("Please choose a preferred date.", true);
        return;
      }
      if (!window.CVRDuration?.get(durationKey)) {
        showMessage("Please select an event duration.", true);
        return;
      }
      if (isExtended) {
        const rawNights = Number(document.getElementById("eventNights")?.value);
        const extOpt = window.CVRDuration.get("extended");
        if (!Number.isFinite(rawNights) || rawNights < extOpt.minNights || rawNights > extOpt.maxNights) {
          showMessage(`Multi-Day / Extended Event must be between ${extOpt.minNights} and ${extOpt.maxNights} nights.`, true);
          return;
        }
      }

      if (!fixedSchedule && checkInSelection.incomplete) {
        showMessage("Choose hour, minutes, and AM/PM for your check-in time, or clear all three to use the default.", true);
        return;
      }
      if (!fixedSchedule && checkInSelection.outOfRange) {
        showMessage("Please choose a valid check-in time.", true);
        return;
      }
      if (isExtended && checkOutSelection.incomplete) {
        showMessage("Choose hour, minutes, and AM/PM for your check-out time, or clear all three to use the default.", true);
        return;
      }
      if (isExtended && checkOutSelection.outOfRange) {
        showMessage("Please choose a valid check-out time.", true);
        return;
      }

      const win = window.CVRDuration.buildWindow(eventDateVal, durationKey, eventNights, checkInSelection.time, checkOutSelection.time);
      if (!win) {
        showMessage("Please select a valid event date and duration.", true);
        return;
      }
      if (typeof window.cvrEventOverlapsExisting === "function" && window.cvrEventOverlapsExisting(win.scheduledCheckIn, win.scheduledCheckOut, "")) {
        showMessage("Sorry, that date range overlaps an existing event booking. Please choose a different date or duration.", true);
        return;
      }
      const totals = cat.calculateDurationEventTotal(eventDateVal, durationKey, packageOption, [], checkInSelection.time, eventNights, checkOutSelection.time, Number(eventGuests)) || cat.calculateEventTotal(packageOption, [], Number(eventGuests));
      const motifSelect = document.getElementById("eventMotifSelect");
      const motifId = motifSelect?.value || "";
      const motifs = cat.getEventMotifs ? cat.getEventMotifs(packageOption) : [];
      const motif = motifs.find((m) => m.id === motifId) || null;

      cat.setPendingReservation({
        bookingType: "event",
        eventType,
        eventGuests: Number(eventGuests),
        preferredDate: win.checkInDateOnly,
        durationKey,
        extendedNights: isExtended ? eventNights : null,
        scheduledCheckIn: win.scheduledCheckIn,
        scheduledCheckOut: win.scheduledCheckOut,
        checkInLabel: win.checkInLabel,
        checkOutLabel: win.checkOutLabel,
        checkOutDate: win.checkOutDateOnly,
        customCheckInTime: win.customCheckInTime,
        customCheckOutTime: win.customCheckOutTime,
        eventTime: win.checkInLabel,
        packageOption,
        additionalNotes,
        motif,
        ...totals,
        currency: "PHP",
        createdAt: new Date().toISOString(),
      });

      window.location.href = "reservation-form.html";
    });
  }
}
