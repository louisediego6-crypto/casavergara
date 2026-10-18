

function initAdminUsersPage() {
  const tableBody = document.getElementById("usersTableBody");
  if (!tableBody) return;

  const emptyRow = document.getElementById("usersEmptyRow");
  const searchInput = document.getElementById("usersSearchInput");
  const roleFilter = document.getElementById("usersRoleFilter");
  const statusFilter = document.getElementById("usersStatusFilter");
  const resultCount = document.getElementById("usersResultCount");
  const alertBox = document.getElementById("usersAlert");
  const liveIndicator = document.getElementById("usersLiveIndicator");
  const refreshBtn = document.getElementById("usersRefreshBtn");
  const addBtn = document.getElementById("usersAddBtn");

  const userModalEl = document.getElementById("userModal");
  const userModal = userModalEl && window.bootstrap ? new bootstrap.Modal(userModalEl) : null;
  const userModalTitle = document.getElementById("userModalLabel");
  const userForm = document.getElementById("userForm");
  const userFormAlert = document.getElementById("userFormAlert");
  const userFormId = document.getElementById("userFormId");
  const userFormFirstName = document.getElementById("userFormFirstName");
  const userFormLastName = document.getElementById("userFormLastName");
  const userFormEmail = document.getElementById("userFormEmail");
  const userFormPhone = document.getElementById("userFormPhone");
  const userFormRole = document.getElementById("userFormRole");
  const userFormStatus = document.getElementById("userFormStatus");
  const userFormPassword = document.getElementById("userFormPassword");
  const userFormPasswordHint = document.getElementById("userFormPasswordHint");
  const userSaveBtn = document.getElementById("userSaveBtn");

  const userDeleteModalEl = document.getElementById("userDeleteModal");
  const userDeleteModal = userDeleteModalEl && window.bootstrap ? new bootstrap.Modal(userDeleteModalEl) : null;
  const userDeleteName = document.getElementById("userDeleteName");
  const userDeleteConfirmBtn = document.getElementById("userDeleteConfirmBtn");
  let pendingDeleteId = null;

  const kpi = {
    total: document.getElementById("usersKpiTotal"),
    customers: document.getElementById("usersKpiCustomers"),
    admins: document.getElementById("usersKpiAdmins"),
    eventManagers: document.getElementById("usersKpiEventManagers"),
    active: document.getElementById("usersKpiActive"),
    suspended: document.getElementById("usersKpiSuspended"),
  };

  const POLL_MS = 8000;
  let pollTimer = null;
  let inFlight = false;

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

  const statusBadge = (status) =>
    status === "suspended"
      ? `<span class="badge text-bg-danger">Suspended</span>`
      : `<span class="badge text-bg-success">Active</span>`;

  const initialsOf = (u) => {
    const f = (u.firstName || "").trim();
    const l = (u.lastName || "").trim();
    return ((f[0] || "") + (l[0] || "")).toUpperCase() || "?";
  };

  const avatarMarkup = (u) => {
    if (u.avatarUrl) {
      return `<img src="${escapeHtml(u.avatarUrl)}" width="36" height="36" class="rounded-circle object-fit-cover" alt="" data-initials="${escapeHtml(initialsOf(u))}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'rounded-circle bg-brand text-white d-inline-flex align-items-center justify-content-center',style:'width:36px;height:36px;font-size:.8rem;',textContent:this.dataset.initials}))">`;
    }
    return `<div class="rounded-circle bg-brand text-white d-inline-flex align-items-center justify-content-center" style="width:36px;height:36px;font-size:.8rem;">${escapeHtml(initialsOf(u))}</div>`;
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  let latestUsers = [];
  let currentAdminEmail = getCustomerSession()?.email?.toLowerCase() || "";

  const applyFiltersAndRender = () => {
    const q = (searchInput?.value || "").trim().toLowerCase();
    const role = roleFilter?.value || "all";
    const status = statusFilter?.value || "all";

    const filtered = latestUsers.filter((u) => {
      if (role !== "all" && u.role !== role) return false;
      if (status !== "all" && u.status !== status) return false;
      if (q) {
        const hay = `${u.firstName} ${u.lastName} ${u.email} ${u.phone}`.toLowerCase();
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
      .map((u) => {
        const isSelf = u.email.toLowerCase() === currentAdminEmail;
        const editBtn = `<button type="button" class="btn btn-sm btn-outline-secondary user-action-btn" data-action="edit" data-id="${u.id}" title="Edit" aria-label="Edit ${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}"><i class="bi bi-pencil-square"></i></button>`;
        const suspendBtn = u.status === "suspended"
          ? `<button type="button" class="btn btn-sm btn-outline-success user-action-btn" data-action="activate" data-id="${u.id}" title="Activate" aria-label="Activate ${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}"><i class="bi bi-check-circle"></i></button>`
          : `<button type="button" class="btn btn-sm btn-outline-warning user-action-btn" data-action="suspend" data-id="${u.id}" title="${isSelf ? "You can't suspend your own account" : "Suspend"}" aria-label="Suspend ${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}" ${isSelf ? "disabled" : ""}><i class="bi bi-slash-circle"></i></button>`;
        const deleteBtn = `<button type="button" class="btn btn-sm btn-outline-danger user-action-btn" data-action="delete" data-id="${u.id}" title="Delete" aria-label="Delete ${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}" ${isSelf ? "disabled" : ""}><i class="bi bi-trash"></i></button>`;
        return `
        <tr data-id="${u.id}">
          <td>
            <div class="d-flex align-items-center gap-2">
              ${avatarMarkup(u)}
              <div>
                <div class="fw-semibold">${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}${isSelf ? ' <span class="badge text-bg-light border">You</span>' : ""}</div>
                <div class="small text-muted-brand">#${u.id}</div>
              </div>
            </div>
          </td>
          <td>
            <div>${escapeHtml(u.email)}</div>
            <div class="small text-muted-brand">${escapeHtml(u.phone || "—")}</div>
          </td>
          <td>
            <select class="form-select form-select-sm user-role-select" data-id="${u.id}" ${isSelf ? "disabled" : ""}>
              <option value="customer" ${u.role === "customer" ? "selected" : ""}>Customer</option>
              <option value="event_manager" ${u.role === "event_manager" ? "selected" : ""}>Event Manager</option>
              <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
            </select>
          </td>
          <td>${statusBadge(u.status)}</td>
          <td>${u.isVerified ? '<i class="bi bi-patch-check-fill text-success" title="Verified"></i>' : '<i class="bi bi-dash-circle text-muted-brand" title="Unverified"></i>'}</td>
          <td class="small text-muted-brand">${formatDate(u.createdAt)}</td>
          <td class="text-end user-actions-cell">
            <div class="d-flex gap-1 justify-content-end flex-nowrap">
              ${editBtn}
              ${suspendBtn}
              ${deleteBtn}
            </div>
          </td>
        </tr>`;
      })
      .join("");
  };

  const showFormAlert = (message) => {
    if (!userFormAlert) return;
    userFormAlert.textContent = message;
    userFormAlert.classList.remove("d-none");
    userFormAlert.classList.add("alert-danger");
  };
  const hideFormAlert = () => {
    if (!userFormAlert) return;
    userFormAlert.classList.add("d-none");
    userFormAlert.textContent = "";
  };

  const setSaving = (saving) => {
    if (!userSaveBtn) return;
    userSaveBtn.disabled = saving;
    userSaveBtn.querySelector(".admin-btn-label")?.classList.toggle("d-none", saving);
    userSaveBtn.querySelector(".spinner-border")?.classList.toggle("d-none", !saving);
  };

  const setDeleting = (deleting) => {
    if (!userDeleteConfirmBtn) return;
    userDeleteConfirmBtn.disabled = deleting;
    userDeleteConfirmBtn.querySelector(".admin-btn-label")?.classList.toggle("d-none", deleting);
    userDeleteConfirmBtn.querySelector(".spinner-border")?.classList.toggle("d-none", !deleting);
  };

  const openAddModal = () => {
    hideFormAlert();
    if (userModalTitle) userModalTitle.textContent = "Add User";
    userForm?.reset();
    if (userFormId) userFormId.value = "0";
    if (userFormRole) userFormRole.value = "customer";
    if (userFormStatus) userFormStatus.value = "active";
    if (userFormPassword) userFormPassword.required = true;
    if (userFormPasswordHint) userFormPasswordHint.textContent = "At least 6 characters.";
    userModal?.show();
  };

  const openEditModal = (user) => {
    hideFormAlert();
    if (userModalTitle) userModalTitle.textContent = "Edit User";
    if (userFormId) userFormId.value = String(user.id);
    if (userFormFirstName) userFormFirstName.value = user.firstName || "";
    if (userFormLastName) userFormLastName.value = user.lastName || "";
    if (userFormEmail) userFormEmail.value = user.email || "";
    if (userFormPhone) userFormPhone.value = user.phone || "";
    if (userFormRole) userFormRole.value = user.role || "customer";
    if (userFormStatus) userFormStatus.value = user.status || "active";
    if (userFormPassword) {
      userFormPassword.value = "";
      userFormPassword.required = false;
    }
    if (userFormPasswordHint) userFormPasswordHint.textContent = "Leave blank to keep the current password.";
    userModal?.show();
  };

  const openDeleteModal = (user) => {
    pendingDeleteId = user.id;
    if (userDeleteName) userDeleteName.textContent = `${user.firstName} ${user.lastName}`.trim() || `user #${user.id}`;
    userDeleteModal?.show();
  };
  const setKpis = (counts) => {
    if (!counts) return;
    if (kpi.total) kpi.total.textContent = counts.total;
    if (kpi.customers) kpi.customers.textContent = counts.customers;
    if (kpi.admins) kpi.admins.textContent = counts.admins;
    if (kpi.eventManagers) kpi.eventManagers.textContent = counts.eventManagers;
    if (kpi.active) kpi.active.textContent = counts.active;
    if (kpi.suspended) kpi.suspended.textContent = counts.suspended;
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    const q = (searchInput?.value || "").trim();
    const role = roleFilter?.value || "all";
    const status = statusFilter?.value || "all";
    if (q) params.set("search", q);
    if (role !== "all") params.set("role", role);
    if (status !== "all") params.set("status", status);
    return params.toString();
  };

  const loadUsers = async ({ silent } = {}) => {
    if (inFlight) return;
    inFlight = true;
    if (liveIndicator && !silent) {
      liveIndicator.innerHTML = '<i class="bi bi-arrow-repeat me-1"></i>Updating…';
    }
    const query = buildQuery();
    const { body } = await cvrApiGet(`admin/users-list${query ? `?${query}` : ""}`);
    inFlight = false;
    if (!body.success) {
      if (!silent) showAlert(body.message || "Could not load users.");
      if (liveIndicator) liveIndicator.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>Connection issue';
      return;
    }
    latestUsers = body.data.users || [];
    setKpis(body.data.counts);
    applyFiltersAndRender();
    if (liveIndicator) {
      const stamp = new Date().toLocaleTimeString();
      liveIndicator.innerHTML = `<i class="bi bi-check-circle me-1 text-success"></i>Live · updated ${stamp}`;
    }
  };

  const startPolling = () => {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => loadUsers({ silent: true }), POLL_MS);
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (pollTimer) clearInterval(pollTimer);
    } else {
      loadUsers({ silent: true });
      startPolling();
    }
  });

  searchInput?.addEventListener("input", applyFiltersAndRender);
  roleFilter?.addEventListener("change", () => loadUsers());
  statusFilter?.addEventListener("change", () => loadUsers());
  refreshBtn?.addEventListener("click", () => loadUsers());
  addBtn?.addEventListener("click", openAddModal);

  tableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest(".user-action-btn");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    hideAlert();

    if (action === "edit") {
      const user = latestUsers.find((u) => u.id === id);
      if (user) openEditModal(user);
      return;
    }

    if (action === "delete") {
      const user = latestUsers.find((u) => u.id === id);
      if (user) openDeleteModal(user);
      return;
    }

    if (action === "suspend" || action === "activate") {
      const { body } = await cvrApiPost("admin/users-update", { userId: id, action });
      if (!body.success) {
        showAlert(body.message || "Could not update this account.");
        return;
      }
      loadUsers();
    }
  });

  tableBody.addEventListener("change", async (e) => {
    const select = e.target.closest(".user-role-select");
    if (!select) return;
    hideAlert();
    const id = Number(select.dataset.id);
    const role = select.value;
    const { body } = await cvrApiPost("admin/users-update", { userId: id, action: "setRole", role });
    if (!body.success) {
      showAlert(body.message || "Could not change this account's role.");
      loadUsers();
      return;
    }
    showAlert("Role updated.", "success");
    loadUsers();
  });

  userDeleteConfirmBtn?.addEventListener("click", async () => {
    if (!pendingDeleteId) return;
    setDeleting(true);
    const { body } = await cvrApiPost("admin/users-delete", { userId: pendingDeleteId });
    setDeleting(false);
    if (!body.success) {
      userDeleteModal?.hide();
      showAlert(body.message || "Could not delete this account.");
      pendingDeleteId = null;
      return;
    }
    userDeleteModal?.hide();
    pendingDeleteId = null;
    showAlert("Account deleted.", "success");
    loadUsers();
  });

  userSaveBtn?.addEventListener("click", async () => {
    hideFormAlert();

    const id = Number(userFormId?.value || 0);
    const firstName = userFormFirstName?.value.trim() || "";
    const lastName = userFormLastName?.value.trim() || "";
    const email = userFormEmail?.value.trim() || "";
    const phone = userFormPhone?.value.trim() || "";
    const role = userFormRole?.value || "customer";
    const status = userFormStatus?.value || "active";
    const password = userFormPassword?.value || "";

    if (!firstName || !lastName) {
      showFormAlert("First and last name are required.");
      return;
    }
    if (!email) {
      showFormAlert("Email is required.");
      return;
    }
    if (!phone) {
      showFormAlert("Phone number is required.");
      return;
    }
    if (id === 0 && password.length < 6) {
      showFormAlert("Password must be at least 6 characters.");
      return;
    }
    if (password && password.length < 6) {
      showFormAlert("Password must be at least 6 characters.");
      return;
    }

    setSaving(true);
    const { body } = await cvrApiPost("admin/users-save", {
      id,
      firstName,
      lastName,
      email,
      phone,
      role,
      status,
      password,
    });
    setSaving(false);

    if (!body.success) {
      showFormAlert(body.message || "Could not save this account.");
      return;
    }
    userModal?.hide();
    showAlert(id ? "Account updated." : "Account created.", "success");
    loadUsers();
  });

  loadUsers();
  startPolling();
}

window.initAdminUsersPage = initAdminUsersPage;
