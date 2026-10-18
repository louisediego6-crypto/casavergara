

(function () {
  const MS_DAY = 86400000;

  const ymd = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const esc = (s) => {
    const d = document.createElement("div");
    d.textContent = String(s ?? "");
    return d.innerHTML;
  };

  const readReservations = () => {
    try {
      const arr = JSON.parse(localStorage.getItem("cvrReservations") || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const readBlocked = () => {
    try {
      const arr = JSON.parse(localStorage.getItem("cvrBlockedDates") || "[]");
      return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  };

  const isCanceled = (r) => String(r.reservationStatus || "").toLowerCase().includes("cancel");

  const prettyDate = (value) => {
    if (!value) return "";
    const d = new Date(`${value}T12:00:00`);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  function takenDatesForRoom(packageId, roomTitle, days = 60) {
    const blocked = new Set(readBlocked());
    const taken = new Map();
    const reservations = readReservations().filter((r) => {
      if (isCanceled(r)) return false;
      if (r.bookingType && r.bookingType !== "room") return false;
      if (packageId && r.packageId) return r.packageId === packageId;
      if (roomTitle && r.roomName) return r.roomName === roomTitle;
      return false;
    });

    const start = new Date();
    for (let i = 0; i < days; i += 1) {
      const key = ymd(new Date(start.getTime() + i * MS_DAY));
      if (blocked.has(key)) {
        taken.set(key, "Blocked");
        continue;
      }
      const hit = reservations.find((r) => r.checkIn && r.checkOut && r.checkIn <= key && key < r.checkOut);
      if (hit) taken.set(key, "Booked");
    }
    return taken;
  }

  function upcomingEventDates(days = 90) {
    const today = ymd(new Date());
    const horizon = ymd(new Date(Date.now() + days * MS_DAY));
    const blocked = readBlocked().filter((d) => d >= today && d <= horizon);
    const events = readReservations()
      .filter((r) => !isCanceled(r) && r.bookingType === "event" && r.eventDate)
      .filter((r) => r.eventDate >= today && r.eventDate <= horizon)
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    return { blocked: blocked.sort(), events };
  }

  function availabilityChips(takenMap, days = 21) {
    const start = new Date();
    let out = "";
    for (let i = 0; i < days; i += 1) {
      const key = ymd(new Date(start.getTime() + i * MS_DAY));
      const reason = takenMap.get(key);
      const cls = reason === "Blocked" ? "text-bg-secondary" : reason ? "text-bg-danger" : "text-bg-success";
      const label = new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      out += `<span class="badge ${cls} fw-normal" title="${reason || "Available"}">${esc(label)}</span>`;
    }
    return `<div class="d-flex flex-wrap gap-1 staff-availability-chips">${out}</div>`;
  }

  function renderStaffAvailabilityPanel() {
    const mount = document.getElementById("staffAvailabilityPanel");
    const cat = window.CVRBookingCatalog;
    if (!mount || !cat) return;

    const { blocked, events } = upcomingEventDates();
    const packages = cat.getRoomPackages({ activeOnly: true });

    const eventRows = events.length
      ? events
          .map(
            (e) => `
              <tr>
                <td class="text-nowrap">${esc(prettyDate(e.eventDate))}</td>
                <td>${esc(e.eventType || "Event")}</td>
                <td class="small text-muted-brand">${esc(e.fullName || e.customerName || "—")}</td>
                <td><span class="badge text-bg-danger">Reserved</span></td>
              </tr>`
          )
          .join("")
      : `<tr><td colspan="4" class="text-center text-muted-brand py-3">No event bookings in the next 90 days — every date is open.</td></tr>`;

    const blockedRow = blocked.length
      ? `<p class="small text-muted-brand mb-0 mt-2"><i class="bi bi-slash-circle me-1"></i>Blocked days: ${blocked
          .map((d) => esc(prettyDate(d)))
          .join(", ")}</p>`
      : "";

    const roomRows = packages
      .map((pkg) => {
        const taken = takenDatesForRoom(pkg.id, pkg.title);
        const nextFree = (() => {
          for (let i = 0; i < 60; i += 1) {
            const key = ymd(new Date(Date.now() + i * MS_DAY));
            if (!taken.has(key)) return key;
          }
          return "";
        })();
        return `
          <div class="col-12">
            <div class="soft-card p-3 h-100">
              <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                <div>
                  <div class="fw-semibold text-brand">${esc(pkg.title)}</div>
                  <div class="small text-muted-brand">Next available: ${nextFree ? esc(prettyDate(nextFree)) : "Fully booked for 60 days"}</div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-primary staff-room-details-btn" data-package-id="${esc(pkg.id)}">
                  <i class="bi bi-eye me-1"></i>View details
                </button>
              </div>
              ${availabilityChips(taken)}
            </div>
          </div>`;
      })
      .join("");

    mount.innerHTML = `
      <div class="soft-card p-4 mb-4">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h4 class="text-brand mb-1"><i class="bi bi-calendar-check me-2"></i>Event availability</h4>
            <p class="small text-muted-brand mb-0">Dates already reserved for events over the next 90 days.</p>
          </div>
          <a href="admin/calendar.html" class="btn btn-sm btn-outline-secondary"><i class="bi bi-calendar3 me-1"></i>Open admin calendar</a>
        </div>
        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead><tr><th>Date</th><th>Event</th><th>Guest</th><th>Status</th></tr></thead>
            <tbody>${eventRows}</tbody>
          </table>
        </div>
        ${blockedRow}
      </div>

      <div class="soft-card p-4 mb-4">
        <div class="mb-3">
          <h4 class="text-brand mb-1"><i class="bi bi-door-open me-2"></i>Room availability</h4>
          <p class="small text-muted-brand mb-0">Next 3 weeks per room package.</p>
        </div>
        <div class="row g-3">${roomRows}</div>
        <div class="d-flex flex-wrap align-items-center gap-3 small text-muted-brand mt-3">
          <span class="d-inline-flex align-items-center gap-1"><span class="badge text-bg-success">&nbsp;</span> Available</span>
          <span class="d-inline-flex align-items-center gap-1"><span class="badge text-bg-danger">&nbsp;</span> Booked</span>
          <span class="d-inline-flex align-items-center gap-1"><span class="badge text-bg-secondary">&nbsp;</span> Blocked</span>
        </div>
      </div>
    `;

    mount.querySelectorAll(".staff-room-details-btn").forEach((btn) => {
      btn.addEventListener("click", () => window.cvrShowRoomDetails?.(btn.dataset.packageId));
    });
  }

  let reviewsCache = null;
  let reviewsPromise = null;

  const starsMarkup = (rating) => {
    const full = Math.floor(rating);
    const fraction = rating - full;
    const hasHalf = fraction >= 0.25 && fraction < 0.75;
    const fullStars = fraction >= 0.75 ? full + 1 : full;
    let html = "";
    for (let i = 1; i <= 5; i++) {
      let icon = "bi-star";
      if (i <= fullStars) icon = "bi-star-fill";
      else if (i === fullStars + 1 && hasHalf) icon = "bi-star-half";
      html += `<i class="bi ${icon}"></i>`;
    }
    return html;
  };

  const initialsFor = (name) => {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "G";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const reviewCardMarkup = (r, delay) => `
    <div class="room-review-card" style="animation-delay:${delay}ms">
      <div class="d-flex align-items-center gap-2 mb-2">
        ${r.avatarUrl
          ? `<img class="review-card-avatar" src="${esc(r.avatarUrl)}" alt="" loading="lazy">`
          : `<span class="review-card-avatar review-card-avatar--fallback-light">${esc(initialsFor(r.guestName))}</span>`}
        <div>
          <div class="fw-semibold text-brand small">${esc(r.guestName)}</div>
          <div class="small text-muted-brand">${esc(r.location || "")}</div>
        </div>
        <div class="text-warning ms-auto room-review-stars">${starsMarkup(r.rating)}</div>
      </div>
      <p class="small text-muted-brand mb-0">"${esc(r.comment)}"</p>
    </div>`;

  async function loadReviewsOnce() {
    if (reviewsCache) return reviewsCache;
    if (!reviewsPromise) {
      reviewsPromise = (async () => {
        try {
          const { body } = await cvrApiGet("content/reviews");
          reviewsCache = body?.success
            ? {
                reviews: body.data?.reviews || [],
                averageRating: body.data?.averageRating || 0,
                totalReviews: body.data?.totalReviews || 0,
              }
            : { reviews: [], averageRating: 0, totalReviews: 0 };
        } catch {
          reviewsCache = { reviews: [], averageRating: 0, totalReviews: 0 };
        }
        return reviewsCache;
      })();
    }
    return reviewsPromise;
  }

  function renderRoomDetailsReviews(modalEl, packageId) {
    const listEl = modalEl.querySelector("#roomDetailsReviews");
    const summaryEl = modalEl.querySelector("#roomDetailsReviewsSummary");
    if (!listEl) return;
    listEl.innerHTML = `<div class="text-muted-brand small"><span class="spinner-border spinner-border-sm me-2"></span>Loading reviews…</div>`;
    if (summaryEl) summaryEl.textContent = "";

    loadReviewsOnce().then(({ reviews }) => {

      const roomReviews = reviews.filter(
        (r) => r.reviewType === "booking" && r.packageId && r.packageId === packageId
      );
      const roomTotal = roomReviews.length;
      const roomAverage = roomTotal
        ? roomReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / roomTotal
        : 0;

      if (summaryEl) {
        summaryEl.innerHTML = roomTotal
          ? `<span class="text-warning fw-semibold">${roomAverage.toFixed(1)}</span> <span class="text-warning">${starsMarkup(roomAverage)}</span> <span>· ${roomTotal} review${roomTotal === 1 ? "" : "s"}</span>`
          : "";
      }
      if (!roomTotal) {
        listEl.innerHTML = `<p class="small text-muted-brand fst-italic mb-0">No guest reviews yet for this room — be the first to share your stay!</p>`;
        return;
      }
      listEl.innerHTML = roomReviews
        .slice(0, 6)
        .map((r, i) => reviewCardMarkup(r, i * 60))
        .join("");
    });
  }

  function showRoomDetails(packageId) {
    const cat = window.CVRBookingCatalog;
    const modalEl = document.getElementById("roomDetailsModal");
    const pkg = cat?.getRoomPackageById?.(packageId);
    if (!cat || !modalEl || !pkg) return;

    modalEl.querySelector("#roomDetailsTitle").textContent = pkg.title;
    const photoImg = modalEl.querySelector("#roomDetailsPhoto");
    photoImg.src = window.cvrResolvePackageImage ? cvrResolvePackageImage(pkg.image) : (pkg.image || "");
    photoImg.alt = pkg.title;

    photoImg.classList.remove("room-details-photo-anim");
    void photoImg.offsetWidth;
    photoImg.classList.add("room-details-photo-anim");

    modalEl.querySelector("#roomDetailsTagline").textContent = pkg.tagline || "";
    modalEl.querySelector("#roomDetailsDescription").textContent = pkg.description || "";
    modalEl.querySelector("#roomDetailsSpecs").innerHTML = [
      `${esc(pkg.areaSqm)} m² · ${esc(pkg.bed)}`,
      `Guests: ${esc(pkg.capacity?.min)}–${esc(pkg.capacity?.max)}`,
      `Check-in / out: ${esc(pkg.standardCheckIn)} / ${esc(pkg.standardCheckOut)}`,
      esc(pkg.availabilityNote || ""),
    ]
      .filter(Boolean)
      .map((line) => `<li>${line}</li>`)
      .join("");
    modalEl.querySelector("#roomDetailsInclusions").innerHTML = (pkg.inclusions || [])
      .map((i) => `<li>${esc(i)}</li>`)
      .join("");
    modalEl.querySelector("#roomDetailsAvailability").innerHTML = availabilityChips(
      takenDatesForRoom(pkg.id, pkg.title),
      28
    );

    renderRoomDetailsReviews(modalEl, pkg.id);

    const staff = typeof isStaffSession === "function" && isStaffSession(getCustomerSession?.());
    const calendarLink = modalEl.querySelector("#roomDetailsCalendarLink");
    const bookBtn = modalEl.querySelector("#roomDetailsBookBtn");
    calendarLink?.classList.toggle("d-none", !staff);
    bookBtn?.classList.toggle("d-none", staff);
    if (bookBtn) {
      bookBtn.onclick = () => {
        bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        window.cvrBookRoom?.(pkg.id);
      };
    }

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  function initStaffRoomsView() {
    const staff = typeof isStaffSession === "function" && isStaffSession(getCustomerSession?.());
    if (!staff) return false;

    document.body.classList.add("cvr-staff-rooms-view");
    document.querySelector(".booking-filter-card")?.classList.add("d-none");
    document.getElementById("eventBookingSection")?.classList.add("d-none");
    document.getElementById("staffRoomsIntro")?.classList.remove("d-none");
    document.getElementById("staffAvailabilityPanel")?.classList.remove("d-none");
    renderStaffAvailabilityPanel();
    return true;
  }

  window.cvrShowRoomDetails = showRoomDetails;
  window.initStaffRoomsView = initStaffRoomsView;
})();
