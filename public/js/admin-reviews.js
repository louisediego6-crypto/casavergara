

function initAdminReviewsPage() {
  const tableBody = document.getElementById("reviewsTableBody");
  if (!tableBody) return;

  const emptyRow = document.getElementById("reviewsEmptyRow");
  const searchInput = document.getElementById("reviewsSearchInput");
  const statusFilter = document.getElementById("reviewsStatusFilter");
  const resultCount = document.getElementById("reviewsResultCount");
  const alertBox = document.getElementById("reviewsAlert");

  let latestReviews = [];

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

  const starsMarkup = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    let html = "";
    for (let i = 1; i <= 5; i++) {
      const icon = i <= fullStars ? "bi-star-fill text-warning"
        : i === fullStars + 1 && hasHalf ? "bi-star-half text-warning"
        : "bi-star text-muted-brand";
      html += `<i class="bi ${icon}"></i>`;
    }
    return html;
  };

  const statusBadge = (status) =>
    status === "visible"
      ? `<span class="badge text-bg-success">Visible</span>`
      : `<span class="badge text-bg-light border">Hidden</span>`;

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value.replace(" ", "T")).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const applyFiltersAndRender = () => {
    const q = (searchInput?.value || "").trim().toLowerCase();
    const status = statusFilter?.value || "all";

    const filtered = latestReviews.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (q) {
        const hay = `${r.guestName} ${r.guestEmail} ${r.comment} ${r.bookingLabel || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (resultCount) resultCount.textContent = String(filtered.length);

    if (!filtered.length) {
      tableBody.innerHTML = "";
      emptyRow?.classList.remove("d-none");
      return;
    }
    emptyRow?.classList.add("d-none");

    tableBody.innerHTML = filtered
      .map(
        (r) => `
        <tr data-id="${r.id}" class="review-row" style="cursor:pointer;" title="Click to read the full review">
          <td>
            <div class="fw-semibold">${escapeHtml(r.guestName)}</div>
            <div class="small text-muted-brand">${escapeHtml(r.guestEmail)}</div>
            ${r.location ? `<div class="small text-muted-brand">${escapeHtml(r.location)}</div>` : ""}
          </td>
          <td class="small">${r.reviewType === "booking"
            ? `<span class="status-chip chip-blue">${escapeHtml(r.bookingLabel || "Specific stay")}</span>`
            : `<span class="text-muted-brand">General</span>`}</td>
          <td class="text-nowrap small">${starsMarkup(r.rating)}</td>
          <td>
            <div class="small text-truncate" style="max-width: 360px;">${escapeHtml(r.comment)}</div>
          </td>
          <td class="small text-muted-brand text-nowrap">${formatDate(r.createdAt)}</td>
          <td>${statusBadge(r.status)}</td>
          <td class="text-end">
            <div class="d-flex gap-2 justify-content-end flex-nowrap">
              <button type="button" class="btn btn-sm btn-outline-secondary review-action-btn" data-action="view" data-id="${r.id}" title="View"><i class="bi bi-eye"></i></button>
              <button type="button" class="btn btn-sm btn-outline-secondary review-action-btn admin-only-action" data-action="toggle" data-id="${r.id}">
                ${r.status === "visible" ? "Hide" : "Show"}
              </button>
              <button type="button" class="btn btn-sm btn-outline-danger review-action-btn admin-only-action" data-action="delete" data-id="${r.id}">Delete</button>
            </div>
          </td>
        </tr>`
      )
      .join("");
  };

  const loadReviews = async () => {
    const { body } = await cvrApiGet("admin/reviews-list");
    if (!body.success) {
      showAlert(body.message || "Could not load reviews.");
      return;
    }
    latestReviews = body.data.reviews || [];
    applyFiltersAndRender();
  };

  searchInput?.addEventListener("input", applyFiltersAndRender);
  statusFilter?.addEventListener("change", applyFiltersAndRender);

  const viewModalEl = document.getElementById("reviewViewModal");
  const viewModal = viewModalEl ? new bootstrap.Modal(viewModalEl) : null;
  const viewToggleBtn = document.getElementById("reviewViewToggleBtn");
  const viewDeleteBtn = document.getElementById("reviewViewDeleteBtn");
  let viewingId = 0;

  const openViewModal = (r) => {
    if (!viewModalEl) return;
    viewingId = r.id;
    document.getElementById("reviewViewName").textContent = r.guestName || "";
    document.getElementById("reviewViewEmail").textContent = r.guestEmail || "";
    document.getElementById("reviewViewLocation").textContent = r.location || "";
    document.getElementById("reviewViewStars").innerHTML = starsMarkup(r.rating);
    const badge = document.getElementById("reviewViewStatus");
    badge.textContent = r.status === "visible" ? "Visible" : "Hidden";
    badge.className = `badge ${r.status === "visible" ? "text-bg-success" : "text-bg-light border"}`;
    document.getElementById("reviewViewDate").textContent = formatDate(r.createdAt);
    document.getElementById("reviewViewComment").textContent = r.comment || "";
    if (viewToggleBtn) {
      viewToggleBtn.innerHTML =
        r.status === "visible"
          ? `<i class="bi bi-eye-slash me-1"></i>Hide review`
          : `<i class="bi bi-eye me-1"></i>Show review`;
    }
    viewModal?.show();
  };

  const toggleReview = async (review) => {
    const nextStatus = review.status === "visible" ? "hidden" : "visible";
    const { body } = await cvrApiPost("admin/reviews-update", { id: review.id, status: nextStatus });
    if (!body.success) {
      showAlert(body.message || "Could not update this review.");
      return false;
    }
    loadReviews();
    return true;
  };

  const deleteReview = async (review) => {
    const ok = await cvrConfirmAction({
      title: "Delete this review?",
      message: `The review from ${review.guestName} will be permanently removed. This cannot be undone.`,
      confirmLabel: "Delete review",
      confirmClass: "btn-danger",
      icon: "bi-trash",
    });
    if (!ok) return false;
    const { body } = await cvrApiPost("admin/reviews-delete", { id: review.id });
    if (!body.success) {
      showAlert(body.message || "Could not delete this review.");
      return false;
    }
    showAlert("Review deleted.", "success");
    loadReviews();
    return true;
  };

  viewToggleBtn?.addEventListener("click", async () => {
    const review = latestReviews.find((r) => r.id === viewingId);
    if (!review) return;
    hideAlert();
    if (await toggleReview(review)) viewModal?.hide();
  });

  viewDeleteBtn?.addEventListener("click", async () => {
    const review = latestReviews.find((r) => r.id === viewingId);
    if (!review) return;
    hideAlert();
    if (await deleteReview(review)) viewModal?.hide();
  });

  tableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest(".review-action-btn");
    if (!btn) {
      const row = e.target.closest(".review-row");
      if (!row) return;
      const review = latestReviews.find((r) => r.id === Number(row.dataset.id));
      if (review) openViewModal(review);
      return;
    }
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    const review = latestReviews.find((r) => r.id === id);
    if (!review) return;
    hideAlert();

    if (action === "view") {
      openViewModal(review);
      return;
    }

    if (action === "delete") {
      await deleteReview(review);
      return;
    }

    if (action === "toggle") {
      await toggleReview(review);
    }
  });

  loadReviews();
}

window.initAdminReviewsPage = initAdminReviewsPage;
