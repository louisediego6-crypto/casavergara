

function initLandingReviews() {
  const grid = document.getElementById("reviewsGrid");
  if (!grid) return;

  const summaryBar = document.getElementById("reviewsSummaryBar");
  const emptyState = document.getElementById("reviewsEmptyState");
  const writeBtn = document.getElementById("writeReviewBtn");

  const modalEl = document.getElementById("writeReviewModal");
  const modal = modalEl && window.bootstrap ? new bootstrap.Modal(modalEl) : null;
  const alertBox = document.getElementById("reviewFormAlert");
  const starPicker = document.getElementById("reviewStarPicker");
  const ratingInput = document.getElementById("reviewFormRating");
  const commentInput = document.getElementById("reviewFormComment");
  const provinceSelect = document.getElementById("reviewFormProvince");
  const citySelect = document.getElementById("reviewFormCity");
  const saveBtn = document.getElementById("reviewSaveBtn");
  const deleteBtn = document.getElementById("reviewDeleteBtn");

  const typeGeneralRadio = document.getElementById("reviewTypeGeneral");
  const typeBookingRadio = document.getElementById("reviewTypeBooking");
  const staySelectWrap = document.getElementById("reviewStaySelectWrap");
  const staySelect = document.getElementById("reviewFormStaySelect");
  const staySelectHint = document.getElementById("reviewStaySelectHint");
  const noStaysHint = document.getElementById("reviewNoStaysHint");

  let myReviews = [];
  let myStays = [];
  let editingId = null;
  let pendingDeleteId = null;

  const PH = window.PH_LOCATIONS || {};
  if (provinceSelect) {
    Object.keys(PH)
      .sort((a, b) => a.localeCompare(b))
      .forEach((province) => {
        const opt = document.createElement("option");
        opt.value = province;
        opt.textContent = province;
        provinceSelect.appendChild(opt);
      });
  }

  const populateCities = (province, selectedCity) => {
    if (!citySelect) return;
    citySelect.innerHTML = '<option value="">City / municipality…</option>';
    const cities = PH[province] || [];
    citySelect.disabled = !cities.length;
    cities.forEach((city) => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      if (city === selectedCity) opt.selected = true;
      citySelect.appendChild(opt);
    });
  };

  provinceSelect?.addEventListener("change", () => populateCities(provinceSelect.value));

  const locationFromSelects = () => {
    const city = citySelect?.value || "";
    const province = provinceSelect?.value || "";
    if (city && province) return `${city}, ${province}`;
    return city || province || "";
  };

  const setSelectsFromLocation = (location) => {
    const [cityPart, provincePart] = String(location || "").split(",").map((s) => s.trim());
    if (provinceSelect) provinceSelect.value = PH[provincePart] ? provincePart : "";
    populateCities(provinceSelect?.value || "", cityPart);
  };

  const session = getCustomerSession();
  if (writeBtn) {
    if (isStaffSession(session)) {
      writeBtn.classList.add("d-none");
    } else {

      const reviewsSection = document.querySelector(".landing-testimonials-section") || grid.closest("section");
      if (reviewsSection && "IntersectionObserver" in window) {
        const revealReviewFab = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              writeBtn.classList.toggle("d-none", !entry.isIntersecting);
            });
          },
          { threshold: 0.2 }
        );
        revealReviewFab.observe(reviewsSection);
      } else {

        writeBtn.classList.remove("d-none");
      }
    }
  }

  const showAlert = (message) => {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
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

  const starsMarkup = (rating, cls = "") => {

    const full = Math.floor(rating);
    const fraction = rating - full;
    const hasHalf = fraction >= 0.25 && fraction < 0.75;
    const fullStars = fraction >= 0.75 ? full + 1 : full;
    let html = "";
    for (let i = 1; i <= 5; i++) {
      let icon = "bi-star";
      if (i <= fullStars) icon = "bi-star-fill";
      else if (i === fullStars + 1 && hasHalf) icon = "bi-star-half";
      html += `<i class="bi ${icon} ${cls}"></i>`;
    }
    return html;
  };

  const setPickerRating = (rating) => {
    if (ratingInput) ratingInput.value = String(rating);
    starPicker?.querySelectorAll("i").forEach((star) => {
      const val = Number(star.dataset.value);
      const full = val <= Math.floor(rating);
      const half = !full && val - 0.5 === rating;
      star.classList.toggle("is-filled", full || half);
      star.classList.toggle("bi-star-fill", full);
      star.classList.toggle("bi-star-half", half);
      star.classList.toggle("bi-star", !full && !half);
    });
  };

  starPicker?.querySelectorAll("i").forEach((star) => {
    star.addEventListener("click", (e) => {
      const val = Number(star.dataset.value);
      const rect = star.getBoundingClientRect();
      const isLeftHalf = e.clientX - rect.left < rect.width / 2;
      setPickerRating(isLeftHalf ? val - 0.5 : val);
    });
  });

  const renderSummary = (averageRating, totalReviews) => {
    if (!summaryBar) return;
    if (!totalReviews) {
      summaryBar.innerHTML = "";
      return;
    }
    summaryBar.innerHTML = `
      <span class="reviews-summary-score text-warning">${averageRating.toFixed(1)}</span>
      <span class="reviews-summary-stars text-warning">${starsMarkup(averageRating)}</span>
      <span class="text-white-50 small">Based on ${totalReviews} review${totalReviews === 1 ? "" : "s"}</span>
    `;
  };

  const initialsFor = (name) => {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "G";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const avatarMarkup = (r) => {
    if (r.avatarUrl) {
      return `<img class="review-card-avatar" src="${escapeHtml(r.avatarUrl)}" alt="" loading="lazy" />`;
    }
    return `<span class="review-card-avatar review-card-avatar--fallback">${escapeHtml(initialsFor(r.guestName))}</span>`;
  };

  const postedAtLabel = (createdAt) => {
    if (!createdAt) return "";
    const d = new Date(String(createdAt).replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const cardMarkup = (r, mine, posted) => `
    <div class="review-card-slide">
      <article class="testimonial-card review-card ${mine ? "is-own" : ""}">
        <div class="d-flex align-items-center gap-2 mb-2">
          <div class="d-flex gap-1 text-warning small">${starsMarkup(r.rating)}</div>
          ${r.reviewType === "booking"
            ? `<span class="status-chip chip-yellow small">${escapeHtml(r.bookingLabel || "A stay")}</span>`
            : ""}
        </div>
        <p class="testimonial-text mb-3">"${escapeHtml(r.comment)}"</p>
        <div class="review-card-meta">
          <div class="review-card-user">
            ${avatarMarkup(r)}
            <div>
              <div class="testimonial-author text-warning">${escapeHtml(r.guestName)}${mine ? " (You)" : ""}</div>
              <small class="text-white-50 d-block">${escapeHtml(r.location || "")}</small>
              ${posted ? `<small class="text-white-50 review-card-date">Posted ${escapeHtml(posted)}</small>` : ""}
            </div>
          </div>
          ${mine ? `<button type="button" class="review-card-delete" data-action="edit-mine" data-id="${r.id}">Edit</button>` : ""}
        </div>
      </article>
    </div>`;

  const viewport = document.getElementById("reviewsViewport");
  const carouselWrap = document.getElementById("reviewsCarousel");
  const prevBtn = document.getElementById("reviewsPrevBtn");
  const nextBtn = document.getElementById("reviewsNextBtn");
  const dotsWrap = document.getElementById("reviewsDots");
  const AUTOPLAY_MS = 6000;
  let carousel = null;
  let autoTimer = null;
  let resizeObserver = null;

  const stopAutoplay = () => {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  };

  const startAutoplay = () => {
    stopAutoplay();
    if (!carousel || carousel.pageCount() <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    autoTimer = setInterval(() => carousel.goTo(carousel.page + 1), AUTOPLAY_MS);
  };

  const naturalCardsPerView = () => {
    const w = window.innerWidth;
    if (w >= 1200) return 3;
    if (w >= 768) return 2;
    return 1;
  };

  const setupCarousel = (total) => {
    resizeObserver?.disconnect();
    stopAutoplay();

    grid.classList.toggle("is-single-review", total === 1);
    if (total <= 1) {
      prevBtn?.classList.add("d-none");
      nextBtn?.classList.add("d-none");
      dotsWrap?.classList.add("d-none");
      if (dotsWrap) dotsWrap.innerHTML = "";
      grid.style.transform = "";
      grid.style.setProperty("--cards-per-view", Math.max(1, total));
      carousel = null;
      return;
    }

    let page = 0;

    const cardsPerView = () => {
      const perView = Math.max(1, Math.min(naturalCardsPerView(), total));
      grid.style.setProperty("--cards-per-view", perView);
      return perView;
    };

    const pageCount = () => Math.max(1, Math.ceil(total / cardsPerView()));

    const startIndexForPage = (p) => {
      const perView = cardsPerView();
      const maxStart = Math.max(0, total - perView);
      return Math.min(p * perView, maxStart);
    };

    const renderDots = () => {
      if (!dotsWrap) return;
      const pages = pageCount();
      if (pages <= 1) {
        dotsWrap.classList.add("d-none");
        dotsWrap.innerHTML = "";
        return;
      }
      dotsWrap.classList.remove("d-none");
      dotsWrap.innerHTML = Array.from({ length: pages }, (_, i) => {
        return `<button type="button" class="reviews-dot ${i === page ? "is-active" : ""}" data-page="${i}" aria-label="Go to reviews page ${i + 1}" ${i === page ? 'aria-current="true"' : ""}></button>`;
      }).join("");
      dotsWrap.querySelectorAll("[data-page]").forEach((dot) => {
        dot.addEventListener("click", () => {
          carousel.goTo(Number(dot.dataset.page));
          startAutoplay();
        });
      });
    };

    const updateNav = () => {
      const pages = pageCount();
      const hideNav = pages <= 1;
      prevBtn?.classList.toggle("d-none", hideNav);
      nextBtn?.classList.toggle("d-none", hideNav);
      if (prevBtn) prevBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = false;
    };

    const goTo = (p) => {
      const pages = pageCount();
      page = ((p % pages) + pages) % pages;
      const startIdx = startIndexForPage(page);
      const target = grid.children[startIdx];
      const offset = target ? target.offsetLeft : 0;
      grid.style.transform = `translateX(-${offset}px)`;
      renderDots();
    };

    carousel = { get page() { return page; }, pageCount, goTo };

    updateNav();
    goTo(0);

    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(() => {
        updateNav();
        goTo(page);
      });
      resizeObserver.observe(viewport);
    } else {
      window.addEventListener("resize", () => {
        updateNav();
        goTo(page);
      });
    }
  };

  prevBtn?.addEventListener("click", () => {
    if (!carousel) return;
    carousel.goTo(carousel.page - 1);
    startAutoplay();
  });
  nextBtn?.addEventListener("click", () => {
    if (!carousel) return;
    carousel.goTo(carousel.page + 1);
    startAutoplay();
  });
  carouselWrap?.addEventListener("mouseenter", stopAutoplay);
  carouselWrap?.addEventListener("mouseleave", startAutoplay);
  carouselWrap?.addEventListener("focusin", stopAutoplay);
  carouselWrap?.addEventListener("focusout", startAutoplay);

  const renderReviews = (reviews) => {
    const mineIds = new Set(session ? myReviews.map((r) => r.id) : []);

    if (!reviews.length) {
      grid.innerHTML = "";
      grid.style.transform = "";
      emptyState?.classList.remove("d-none");
      setupCarousel(0);
      return;
    }
    emptyState?.classList.add("d-none");

    const shown = reviews.slice(0, 12);
    grid.innerHTML = shown
      .map((r) => cardMarkup(r, mineIds.has(r.id), postedAtLabel(r.createdAt)))
      .join("");

    grid.querySelectorAll('[data-action="edit-mine"]').forEach((btn) => {
      btn.addEventListener("click", () => openModalForEdit(Number(btn.dataset.id)));
    });

    setupCarousel(shown.length);
    startAutoplay();
  };

  const loadReviews = async () => {
    const { body } = await cvrApiGet("content/reviews");
    if (!body.success) return;
    renderSummary(body.data?.averageRating || 0, body.data?.totalReviews || 0);
    renderReviews(body.data?.reviews || []);
  };

  const loadMyReviews = async () => {
    const session = getCustomerSession();
    if (!session || isStaffSession(session)) {
      myReviews = [];
      return;
    }
    const { body } = await cvrApiGet("reviews/mine");
    myReviews = body.success ? body.data?.reviews || [] : [];
  };

  const loadMyStays = async () => {
    const session = getCustomerSession();
    if (!session || isStaffSession(session)) {
      myStays = [];
      return;
    }
    if (typeof window.refreshMyReservationsFromServer === "function") {
      await window.refreshMyReservationsFromServer();
    }
    const all = typeof window.getStoredReservations === "function" ? window.getStoredReservations() : [];
    myStays = all
      .filter((r) => r && r.bookingType === "room" && r.checkedOutAt)
      .sort((a, b) => new Date(b.checkedOutAt) - new Date(a.checkedOutAt));
  };

  const stayLabel = (stay) => {
    const dates = stay.checkIn && stay.checkOut
      ? `${formatDateReserved(stay.checkIn)} – ${formatDateReserved(stay.checkOut)}`
      : formatDateReserved(stay.checkOut || stay.checkIn || "");
    return `${stay.roomName || "Room stay"} (${dates})`;
  };

  const reviewForStay = (reservationId) => myReviews.find((r) => r.reservationId === reservationId);

  const populateStaySelect = (selectedId) => {
    if (!staySelect) return;
    staySelect.innerHTML = '<option value="">Choose a stay…</option>' + myStays
      .map((s) => {
        const already = reviewForStay(s.id);
        return `<option value="${escapeHtml(s.id)}" ${s.id === selectedId ? "selected" : ""}>${escapeHtml(stayLabel(s))}${already ? " (already reviewed)" : ""}</option>`;
      })
      .join("");
  };

  const updateStayHint = () => {
    if (!staySelectHint) return;
    const stay = myStays.find((s) => s.id === staySelect?.value);
    const already = stay ? reviewForStay(stay.id) : null;
    staySelectHint.textContent = already
      ? "You've already reviewed this stay — saving will update that review."
      : "";
  };

  const applyReviewTypeUI = () => {
    const isBooking = Boolean(typeBookingRadio?.checked);
    staySelectWrap?.classList.toggle("d-none", !isBooking);
    updateStayHint();
  };

  const refreshStayToggleState = () => {
    if (typeBookingRadio) typeBookingRadio.disabled = myStays.length === 0;
    noStaysHint?.classList.toggle("d-none", myStays.length > 0);
    if (!myStays.length && typeBookingRadio?.checked && typeGeneralRadio) {
      typeGeneralRadio.checked = true;
    }
    populateStaySelect(staySelect?.value);
    applyReviewTypeUI();
  };

  typeGeneralRadio?.addEventListener("change", applyReviewTypeUI);
  typeBookingRadio?.addEventListener("change", applyReviewTypeUI);
  staySelect?.addEventListener("change", () => {
    const stay = myStays.find((s) => s.id === staySelect.value);
    const already = stay ? reviewForStay(stay.id) : null;
    if (already) {
      setPickerRating(already.rating);
      if (commentInput) commentInput.value = already.comment;
      setSelectsFromLocation(already.location || "");
    }
    updateStayHint();
  });

  const openModalForNew = (reservationId) => {
    hideAlert();
    editingId = null;
    const modalTitle = document.getElementById("writeReviewModalLabel");
    if (modalTitle) modalTitle.textContent = "Write a Review";
    setPickerRating(0);
    if (commentInput) commentInput.value = "";
    setSelectsFromLocation("");
    deleteBtn?.classList.add("d-none");
    saveBtn.querySelector(".admin-btn-label").textContent = "Post Review";

    const stayMatch = reservationId && myStays.find((s) => s.id === reservationId);
    if (typeGeneralRadio) typeGeneralRadio.checked = !stayMatch;
    if (typeBookingRadio) typeBookingRadio.checked = Boolean(stayMatch);
    refreshStayToggleState();
    if (stayMatch && staySelect) {
      staySelect.value = stayMatch.id;
      const already = reviewForStay(stayMatch.id);
      if (already) {
        setPickerRating(already.rating);
        if (commentInput) commentInput.value = already.comment;
        setSelectsFromLocation(already.location || "");
      }
      updateStayHint();
    }
    modal?.show();
  };

  const openModalForEdit = (id) => {
    const review = myReviews.find((r) => r.id === id);
    if (!review) return;
    hideAlert();
    editingId = review.id;
    const modalTitle = document.getElementById("writeReviewModalLabel");
    if (modalTitle) modalTitle.textContent = "Edit Your Review";
    setPickerRating(review.rating);
    if (commentInput) commentInput.value = review.comment;
    setSelectsFromLocation(review.location || "");
    deleteBtn?.classList.remove("d-none");
    saveBtn.querySelector(".admin-btn-label").textContent = "Save Changes";

    const isBooking = review.reviewType === "booking";
    if (typeGeneralRadio) typeGeneralRadio.checked = !isBooking;
    if (typeBookingRadio) typeBookingRadio.checked = isBooking;
    refreshStayToggleState();
    if (isBooking && staySelect && review.reservationId) {
      staySelect.value = review.reservationId;
      updateStayHint();
    }
    modal?.show();
  };

  writeBtn?.addEventListener("click", async () => {
    const session = getCustomerSession();
    if (!session) {
      cvrToast("Please log in to write a review.", "info");
      window.location.href = pageUrl("login.html");
      return;
    }
    if (isStaffSession(session)) {
      cvrToast("Staff accounts can't post guest reviews.", "info");
      return;
    }
    await loadMyReviews();
    await loadMyStays();
    openModalForNew();
  });

  saveBtn?.addEventListener("click", async () => {
    hideAlert();
    const rating = Number(ratingInput?.value || 0);
    const comment = commentInput?.value.trim() || "";
    const location = locationFromSelects();
    const isBooking = Boolean(typeBookingRadio?.checked);
    const reservationId = isBooking ? (staySelect?.value || "") : "";

    if (!rating) {
      showAlert("Please choose a star rating.");
      return;
    }
    if (!comment) {
      showAlert("Please write a few words about your stay.");
      return;
    }
    if (isBooking && !reservationId) {
      showAlert("Please choose which stay this review is about.");
      return;
    }

    setSaving(true);
    const payload = { rating, comment, location };
    if (editingId) payload.id = editingId;
    if (reservationId) payload.reservationId = reservationId;
    const { body } = await cvrApiPost("reviews/submit", payload);
    setSaving(false);

    if (!body.success) {
      showAlert(body.message || "Could not save your review.");
      return;
    }
    modal?.hide();
    cvrToast(body.message || "Thank you for your review!", "success");
    await loadMyReviews();
    await loadReviews();
  });

  deleteBtn?.addEventListener("click", () => {
    pendingDeleteId = editingId;
    if (!pendingDeleteId) return;

    const deleteModalEl = document.getElementById("deleteReviewModal");
    if (!deleteModalEl || !window.bootstrap) {
      if (!window.confirm("Delete your review? This can't be undone.")) return;
      performDelete(pendingDeleteId);
      return;
    }
    modal?.hide();
    const deleteModal = bootstrap.Modal.getOrCreateInstance(deleteModalEl);
    const oldConfirmBtn = document.getElementById("deleteReviewConfirmBtn");

    const confirmBtn = oldConfirmBtn.cloneNode(true);
    oldConfirmBtn.replaceWith(confirmBtn);
    confirmBtn.addEventListener("click", async () => {
      confirmBtn.disabled = true;
      confirmBtn.querySelector(".admin-btn-label")?.classList.add("d-none");
      confirmBtn.querySelector(".spinner-border")?.classList.remove("d-none");
      await performDelete(pendingDeleteId);
      confirmBtn.disabled = false;
      confirmBtn.querySelector(".admin-btn-label")?.classList.remove("d-none");
      confirmBtn.querySelector(".spinner-border")?.classList.add("d-none");
      deleteModal.hide();
    });
    deleteModal.show();
  });

  const performDelete = async (id) => {
    const { body } = await cvrApiPost("reviews/delete", { id });
    if (!body.success) {
      cvrToast(body.message || "Could not delete your review.", "danger");
      return;
    }
    cvrToast("Your review has been removed.", "success");
    editingId = null;
    pendingDeleteId = null;
    await loadMyReviews();
    await loadReviews();
  };

  (async () => {
    await loadMyReviews();
    await loadReviews();

    const params = new URLSearchParams(window.location.search);
    const reviewReservationId = params.get("review");
    if (reviewReservationId && session && !isStaffSession(session)) {
      await loadMyStays();
      if (myStays.some((s) => s.id === reviewReservationId)) {
        document.querySelector(".landing-testimonials-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
        openModalForNew(reviewReservationId);
      }
      params.delete("review");
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
      window.history.replaceState({}, "", newUrl);
    }
  })();
}

window.initLandingReviews = initLandingReviews;
