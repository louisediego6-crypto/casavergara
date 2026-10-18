function cvrApiBase() {
  const path = window.location.pathname;
  if (path.includes("/pages/admin/")) return "../../api";
  if (path.includes("/pages/")) return "../api";
  return "api";
}

async function cvrApiPost(endpoint, payload) {
  const res = await fetch(`${cvrApiBase()}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });
  let body;
  try {
    body = await res.json();
  } catch {
    body = { success: false, message: "Unexpected server response." };
  }
  return { ok: res.ok, status: res.status, body };
}

async function cvrApiGet(endpoint) {
  const res = await fetch(`${cvrApiBase()}/${endpoint}`, { credentials: "same-origin" });
  let body;
  try {
    body = await res.json();
  } catch {
    body = { success: false, message: "Unexpected server response." };
  }
  return { ok: res.ok, status: res.status, body };
}

async function cvrApiPostForm(endpoint, formData) {
  const res = await fetch(`${cvrApiBase()}/${endpoint}`, {
    method: "POST",
    credentials: "same-origin",
    body: formData,
  });
  let body;
  try {
    body = await res.json();
  } catch {
    body = { success: false, message: "Unexpected server response." };
  }
  return { ok: res.ok, status: res.status, body };
}

function cvrToast(message, type = "info") {
  let container = document.getElementById("cvrToastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "cvrToastContainer";
    container.className = "cvr-toast-container";
    document.body.appendChild(container);
  }

  const icons = {
    success: "bi-check-circle-fill",
    danger: "bi-exclamation-octagon-fill",
    warning: "bi-exclamation-triangle-fill",
    info: "bi-info-circle-fill",
  };

  const toastEl = document.createElement("div");
  toastEl.className = `notification-toast cvr-toast cvr-toast-${type}`;
  toastEl.setAttribute("role", "alert");
  toastEl.innerHTML = `
    <div class="notification-toast-content">
      <i class="bi ${icons[type] || icons.info} notification-toast-icon"></i>
      <div class="notification-toast-text">
        <p>${escapeHtml(message)}</p>
      </div>
      <button type="button" class="btn-close" aria-label="Close"></button>
    </div>`;
  container.appendChild(toastEl);

  requestAnimationFrame(() => requestAnimationFrame(() => toastEl.classList.add("show")));

  const remove = () => {
    toastEl.classList.remove("show");
    setTimeout(() => toastEl.remove(), 300);
  };
  toastEl.querySelector(".btn-close")?.addEventListener("click", remove);
  const autoDismiss = setTimeout(remove, 7000);
  toastEl.addEventListener("mouseenter", () => clearTimeout(autoDismiss));

  return toastEl;
}
window.cvrToast = cvrToast;

function openCvrNotificationModal(item, { onChanged } = {}) {
  let modalEl = document.getElementById("cvrNotifModal");
  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "cvrNotifModal";
    modalEl.className = "modal fade";
    modalEl.tabIndex = -1;
    modalEl.setAttribute("aria-hidden", "true");
    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2 min-w-0">
              <i class="bi fs-5 text-primary" id="cvrNotifModalIcon"></i>
              <span class="text-truncate" id="cvrNotifModalTitleText"></span>
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="d-flex align-items-center gap-2 mb-3">
              <span class="badge rounded-pill text-bg-danger d-none" id="cvrNotifModalNewBadge">New</span>
              <span class="small text-muted-brand" id="cvrNotifModalTime"></span>
            </div>
            <div class="cvr-notif-modal-body" id="cvrNotifModalBody"></div>
            <div class="notif-item-reply cvr-notif-modal-reply mt-3 d-none" id="cvrNotifModalReplyWrap">
              <div class="text-muted-brand text-uppercase mb-1" style="font-size:.7rem; letter-spacing:.04em;">Reply from Casa Vergara</div>
              <div id="cvrNotifModalReply"></div>
            </div>
          </div>
          <div class="modal-footer flex-wrap gap-2">
            <div class="d-flex gap-3 me-auto">
              <button type="button" class="btn btn-sm btn-link text-muted-brand text-decoration-none p-0" id="cvrNotifModalToggleReadBtn">
                <i class="bi me-1" id="cvrNotifModalToggleReadIcon"></i><span id="cvrNotifModalToggleReadLabel"></span>
              </button>
              <button type="button" class="btn btn-sm btn-link text-danger text-decoration-none p-0" id="cvrNotifModalDeleteBtn">
                <i class="bi bi-trash me-1"></i>Delete
              </button>
            </div>
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
            <a class="btn btn-brand d-none" id="cvrNotifModalLinkBtn" href="#">Go to page</a>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modalEl);
  }

  const kindIcon = item.kind === "reply" ? "bi-envelope-open" : "bi-journal-check";
  modalEl.querySelector("#cvrNotifModalIcon").className = `bi ${kindIcon} fs-5 text-primary`;
  modalEl.querySelector("#cvrNotifModalTitleText").textContent = item.title || "Notification";
  modalEl.querySelector("#cvrNotifModalTime").textContent = item.when ? cvrTimeAgo(item.when) : "";
  modalEl.querySelector("#cvrNotifModalNewBadge").classList.toggle("d-none", !!item.read);
  modalEl.querySelector("#cvrNotifModalBody").textContent = item.body || "";

  const replyWrap = modalEl.querySelector("#cvrNotifModalReplyWrap");
  if (item.extra) {
    replyWrap.classList.remove("d-none");
    modalEl.querySelector("#cvrNotifModalReply").textContent = item.extra;
  } else {
    replyWrap.classList.add("d-none");
  }

  const linkBtn = modalEl.querySelector("#cvrNotifModalLinkBtn");
  if (item.link) {
    linkBtn.href = item.link;
    linkBtn.classList.remove("d-none");
  } else {
    linkBtn.classList.add("d-none");
  }

  const toggleReadBtn = modalEl.querySelector("#cvrNotifModalToggleReadBtn");
  const newToggleReadBtn = toggleReadBtn.cloneNode(true);
  toggleReadBtn.replaceWith(newToggleReadBtn);
  const paintToggleReadBtn = () => {
    newToggleReadBtn.querySelector("#cvrNotifModalToggleReadIcon").className = `bi ${item.read ? "bi-envelope" : "bi-envelope-open"} me-1`;
    newToggleReadBtn.querySelector("#cvrNotifModalToggleReadLabel").textContent = item.read ? "Mark as unread" : "Mark as read";
  };
  paintToggleReadBtn();
  newToggleReadBtn.addEventListener("click", async () => {
    newToggleReadBtn.disabled = true;
    await cvrSetNotificationRead(item, !item.read);
    item.read = !item.read;
    modalEl.querySelector("#cvrNotifModalNewBadge").classList.toggle("d-none", !!item.read);
    paintToggleReadBtn();
    newToggleReadBtn.disabled = false;
    onChanged?.();
  });

  const deleteBtn = modalEl.querySelector("#cvrNotifModalDeleteBtn");
  const newDeleteBtn = deleteBtn.cloneNode(true);
  deleteBtn.replaceWith(newDeleteBtn);
  newDeleteBtn.addEventListener("click", async () => {
    newDeleteBtn.disabled = true;
    await cvrDeleteNotification(item);
    bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    cvrToast("Notification deleted.", "info");
    onChanged?.();
  });

  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}
window.openCvrNotificationModal = openCvrNotificationModal;

function createCvrPanelSwitcher(panels, onShown) {
  const FADE_MS = 220;

  return function show(which, opts) {
    const target = panels[which];
    if (!target) return;

    const current = Object.values(panels).find((el) => el && el !== target && !el.classList.contains("d-none"));

    const reveal = (animate) => {
      Object.values(panels).forEach((el) => el?.classList.toggle("d-none", el !== target));

      if (animate) {

        target.classList.add("cvr-auth-fade-enter");
        void target.offsetWidth;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => target.classList.remove("cvr-auth-fade-enter"));
        });
      }

      if (typeof onShown === "function") onShown(which, target);
    };

    if (current && !opts?.immediate) {
      current.classList.add("cvr-auth-fade-enter");
      window.setTimeout(() => reveal(true), FADE_MS);
    } else {
      reveal(false);
    }
  };
}
window.createCvrPanelSwitcher = createCvrPanelSwitcher;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getCustomerSession() {
  try {
    const raw = localStorage.getItem("cvrCustomerSession");
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === "object" && data.email ? data : null;
  } catch {
    return null;
  }
}

function isStaffSession(session) {
  const role = String(session?.role || "").toLowerCase();
  return role === "admin" || role === "event_manager";
}
window.isStaffSession = isStaffSession;

function isFullAdminSession(session) {
  return String(session?.role || "").toLowerCase() === "admin";
}
window.isFullAdminSession = isFullAdminSession;

const CVR_ADMIN_ONLY_SECTIONS = ["payments", "users", "settings"];

function setCustomerSession(profile) {
  if (!profile?.email) return;
  const { password: _pw, ...rest } = profile;
  localStorage.setItem("cvrCustomerSession", JSON.stringify(rest));
  rememberRecentAccount(rest);
}

function clearCustomerSession() {
  localStorage.removeItem("cvrCustomerSession");
}

const CVR_SAVED_LOGIN_EMAIL_KEY = "cvrSavedLoginEmail";

function cvrGetSavedLoginEmail() {
  try {
    return localStorage.getItem(CVR_SAVED_LOGIN_EMAIL_KEY) || "";
  } catch {
    return "";
  }
}

function cvrSaveLoginEmail(email) {
  try {
    if (email) localStorage.setItem(CVR_SAVED_LOGIN_EMAIL_KEY, email);
  } catch {

  }
}

function cvrClearSavedLoginEmail() {
  try {
    localStorage.removeItem(CVR_SAVED_LOGIN_EMAIL_KEY);
  } catch {

  }
}
window.cvrGetSavedLoginEmail = cvrGetSavedLoginEmail;
window.cvrSaveLoginEmail = cvrSaveLoginEmail;
window.cvrClearSavedLoginEmail = cvrClearSavedLoginEmail;

const CVR_RECENT_ACCOUNTS_KEY = "cvrRecentAccounts";
const CVR_RECENT_ACCOUNTS_MAX = 5;

function getRecentAccounts() {
  try {
    const raw = localStorage.getItem(CVR_RECENT_ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((a) => a && a.email) : [];
  } catch {
    return [];
  }
}

function rememberRecentAccount(profile) {
  if (!profile?.email) return;
  try {
    const list = getRecentAccounts().filter((a) => a.email !== profile.email);
    list.unshift({
      email: profile.email,
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      avatarUrl: profile.avatarUrl || "",
      role: profile.role || "",
    });
    localStorage.setItem(CVR_RECENT_ACCOUNTS_KEY, JSON.stringify(list.slice(0, CVR_RECENT_ACCOUNTS_MAX)));
  } catch {

  }
}

function removeRecentAccount(email) {
  try {
    const list = getRecentAccounts().filter((a) => a.email !== email);
    localStorage.setItem(CVR_RECENT_ACCOUNTS_KEY, JSON.stringify(list));
  } catch {

  }
}

function ensureCvrLogoutModal() {
  if (document.getElementById("cvrLogoutModal")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="modal fade" id="cvrLogoutModal" tabindex="-1" aria-labelledby="cvrLogoutModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content cvr-logout-modal-content">
          <div class="modal-body text-center pt-4 pb-3 px-4">
            <div class="cvr-logout-modal-icon mb-3"><i class="bi bi-box-arrow-right"></i></div>
            <h5 class="text-brand mb-2" id="cvrLogoutModalLabel">Log out of Casa Vergara?</h5>
            <p class="text-muted-brand small mb-0">You'll need to sign in again to access your account.</p>
          </div>
          <div class="modal-footer border-0 pt-0 pb-4 px-4 justify-content-center gap-2">
            <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger px-4" id="cvrLogoutConfirmBtn">
              <span class="cvr-logout-btn-label">Log out</span>
              <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap.firstElementChild);
}

function ensureCvrConfirmModal() {
  if (document.getElementById("cvrConfirmModal")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="modal fade" id="cvrConfirmModal" tabindex="-1" aria-labelledby="cvrConfirmModalTitle" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content cvr-logout-modal-content">
          <div class="modal-body text-center pt-4 pb-3 px-4">
            <div class="cvr-logout-modal-icon mb-3"><i class="bi" id="cvrConfirmModalIcon"></i></div>
            <h5 class="text-brand mb-2" id="cvrConfirmModalTitle"></h5>
            <p class="text-muted-brand small mb-0" id="cvrConfirmModalMessage"></p>
          </div>
          <div class="modal-footer border-0 pt-0 pb-4 px-4 justify-content-center gap-2">
            <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn px-4" id="cvrConfirmModalConfirmBtn"></button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap.firstElementChild);
}

function cvrConfirmAction({ title = "Are you sure?", message = "", confirmLabel = "Confirm", confirmClass = "btn-danger", icon = "bi-question-circle" } = {}) {
  return new Promise((resolve) => {
    if (!window.bootstrap?.Modal) {

      resolve(window.confirm(message || title));
      return;
    }

    ensureCvrConfirmModal();
    const modalEl = document.getElementById("cvrConfirmModal");
    modalEl.querySelector("#cvrConfirmModalIcon").className = `bi ${icon}`;
    modalEl.querySelector("#cvrConfirmModalTitle").textContent = title;
    modalEl.querySelector("#cvrConfirmModalMessage").textContent = message;

    const oldBtn = modalEl.querySelector("#cvrConfirmModalConfirmBtn");
    const btn = oldBtn.cloneNode(true);
    oldBtn.replaceWith(btn);
    btn.className = `btn px-4 ${confirmClass}`;
    btn.textContent = confirmLabel;

    let decided = false;
    btn.addEventListener("click", () => {
      decided = true;
      resolve(true);
      bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    });

    modalEl.addEventListener("hidden.bs.modal", () => {
      if (!decided) resolve(false);
    }, { once: true });

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  });
}
window.cvrConfirmAction = cvrConfirmAction;

function cvrConfirmLogout(redirectUrl) {
  ensureCvrLogoutModal();
  const modalEl = document.getElementById("cvrLogoutModal");
  const oldBtn = document.getElementById("cvrLogoutConfirmBtn");

  const btn = oldBtn.cloneNode(true);
  oldBtn.replaceWith(btn);

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.querySelector(".cvr-logout-btn-label")?.classList.add("d-none");
    btn.querySelector(".spinner-border")?.classList.remove("d-none");
    try { await cvrApiPost("auth/logout", {}); } catch {  }
    clearCustomerSession();
    window.location.href = redirectUrl;
  });

  if (window.bootstrap?.Modal) {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  } else {

    if (window.confirm("Log out of Casa Vergara?")) btn.click();
  }
}

function ensureCvrSwitchAccountModal() {
  if (document.getElementById("cvrSwitchAccountModal")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="modal fade" id="cvrSwitchAccountModal" tabindex="-1" aria-labelledby="cvrSwitchAccountModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content cvr-logout-modal-content">
          <div class="modal-header border-0 pb-0">
            <h5 class="text-brand mb-0" id="cvrSwitchAccountModalLabel"><i class="bi bi-arrow-left-right me-2"></i>Switch account</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body pt-2" id="cvrSwitchAccountBody"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap.firstElementChild);
}

let cvrSwitchPickerGen = 0;
async function renderCvrSwitchAccountPicker() {
  const body = document.getElementById("cvrSwitchAccountBody");
  if (!body) return;
  const current = getCustomerSession();
  const gen = ++cvrSwitchPickerGen;

  body.innerHTML = `<div class="text-center text-muted-brand small py-3"><span class="spinner-border spinner-border-sm me-2"></span>Loading accounts…</div>`;

  let saved = [];
  try {
    const { body: resp } = await cvrApiGet("auth/saved-accounts");
    if (resp.success && Array.isArray(resp.data?.accounts)) saved = resp.data.accounts;
  } catch {

  }

  if (gen !== cvrSwitchPickerGen) return;

  const savedEmails = new Set(saved.map((a) => a.email));
  const others = [
    ...saved.filter((a) => a.email !== current?.email).map((a) => ({ ...a, saved: true })),
    ...getRecentAccounts()
      .filter((a) => a.email !== current?.email && !savedEmails.has(a.email))
      .map((a) => ({ ...a, saved: false })),
  ];

  const rowHtml = (acc) => {
    const name = customerProfileDisplayName(acc);
    const initials = customerProfileInitials(acc);
    const avatar = customerAvatarSrc(acc)
      ? `<img class="cvr-switch-account-avatar" src="${customerAvatarSrc(acc)}" alt="" loading="lazy" onerror="cvrAvatarFallback(this)" />`
      : `<span class="cvr-switch-account-avatar cvr-switch-account-avatar--fallback">${escapeHtml(initials)}</span>`;
    return `
      <div class="cvr-switch-account-row" data-email="${escapeHtml(acc.email)}">
        <button type="button" class="cvr-switch-account-pick d-flex align-items-center gap-3 flex-grow-1 text-start">
          ${avatar}
          <span class="flex-grow-1 overflow-hidden">
            <span class="d-block fw-semibold text-brand text-truncate">${escapeHtml(name)}</span>
            <span class="d-block small text-muted-brand text-truncate">${acc.saved ? "Tap to switch" : escapeHtml(acc.email)}</span>
          </span>
          <i class="bi bi-chevron-right text-muted-brand small"></i>
        </button>
        <button type="button" class="btn btn-sm btn-link text-muted-brand cvr-switch-account-remove p-1" title="Remove from this list" aria-label="Remove ${escapeHtml(name)} from this list">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>`;
  };

  body.innerHTML = `
    <div class="cvr-switch-account-list mb-2">
      ${others.length ? others.map(rowHtml).join("") : `<p class="small text-muted-brand mb-3">No other accounts remembered on this browser yet.</p>`}
    </div>
    <button type="button" class="btn btn-outline-primary w-100" id="cvrSwitchAccountAddBtn"><i class="bi bi-person-plus me-2"></i>Add another account</button>
  `;

  body.querySelectorAll(".cvr-switch-account-remove").forEach((btn) => {
    btn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      const acc = others.find((a) => a.email === btn.closest(".cvr-switch-account-row")?.dataset.email);
      if (acc) renderCvrSwitchAccountRemoveStep(acc);
    });
  });

  body.querySelectorAll(".cvr-switch-account-pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      const acc = others.find((a) => a.email === btn.closest(".cvr-switch-account-row")?.dataset.email);
      if (!acc) return;
      if (acc.saved) cvrSwitchAccountSignInSaved(acc, btn);
      else renderCvrSwitchAccountPasswordStep(acc);
    });
  });

  document.getElementById("cvrSwitchAccountAddBtn")?.addEventListener("click", renderCvrSwitchAccountAddStep);
}

async function cvrSwitchAccountSignInSaved(acc, rowBtn) {
  const original = rowBtn ? rowBtn.innerHTML : "";
  if (rowBtn) {
    rowBtn.disabled = true;
    rowBtn.style.opacity = "0.6";
  }
  try {
    const { body } = await cvrApiPost("auth/remember-login", { email: acc.email });
    if (!body.success) {
      renderCvrSwitchAccountPasswordStep(acc);
      if (body.data?.needsPassword) {
        cvrToast(body.message || "Please enter your password to continue.", "info");
      } else {
        cvrToast(body.message || "Could not sign in. Please enter your password.", "danger");
      }
      return;
    }
    renderCvrSwitchAccountConfirmStep(body.data.user);
  } catch {
    cvrToast("Could not reach the server. Please try again.", "danger");
  } finally {
    if (rowBtn) {
      rowBtn.disabled = false;
      rowBtn.style.opacity = "";
      rowBtn.innerHTML = original;
    }
  }
}

function renderCvrSwitchAccountRemoveStep(acc) {
  const body = document.getElementById("cvrSwitchAccountBody");
  if (!body) return;
  const name = customerProfileDisplayName(acc);
  const initials = customerProfileInitials(acc);
  const avatar = customerAvatarSrc(acc)
    ? `<img class="cvr-switch-account-avatar" src="${customerAvatarSrc(acc)}" alt="" loading="lazy" onerror="cvrAvatarFallback(this)" />`
    : `<span class="cvr-switch-account-avatar cvr-switch-account-avatar--fallback">${escapeHtml(initials)}</span>`;

  body.innerHTML = `
    <div class="d-flex align-items-center gap-3 mb-3">
      ${avatar}
      <span class="flex-grow-1 overflow-hidden">
        <span class="d-block fw-semibold text-brand text-truncate">${escapeHtml(name)}</span>
        <span class="d-block small text-muted-brand text-truncate">${escapeHtml(acc.email)}</span>
      </span>
    </div>
    <p class="small text-muted-brand mb-3">Remove this account from the switcher on this browser? You can add it back anytime by signing in again.</p>
    <div class="d-flex gap-2">
      <button type="button" class="btn btn-outline-secondary flex-grow-1" id="cvrSwitchAccountRemoveCancelBtn">Cancel</button>
      <button type="button" class="btn btn-danger flex-grow-1" id="cvrSwitchAccountRemoveConfirmBtn">Remove</button>
    </div>
  `;

  document.getElementById("cvrSwitchAccountRemoveCancelBtn")?.addEventListener("click", renderCvrSwitchAccountPicker);
  document.getElementById("cvrSwitchAccountRemoveConfirmBtn")?.addEventListener("click", async () => {
    removeRecentAccount(acc.email);

    try {
      await cvrApiPost("auth/forget-account", { email: acc.email });
    } catch {

    }
    renderCvrSwitchAccountPicker();
  });
}

function renderCvrSwitchAccountAddStep(prefillEmail) {
  const body = document.getElementById("cvrSwitchAccountBody");
  if (!body) return;
  const current = getCustomerSession();

  const savedEmail = (typeof prefillEmail === "string" && prefillEmail) || cvrGetSavedLoginEmail();

  body.innerHTML = `
    <p class="text-muted-brand small mb-3">${current ? `Sign in with a different account. ${escapeHtml(customerProfileDisplayName(current))} will stay signed in until you confirm the switch.` : "Sign in to add another account."}</p>
    <div id="cvrSwitchAccountLoginAlert" class="alert alert-danger small d-none" role="alert"></div>
    <form id="cvrSwitchAccountLoginForm">
      <div class="mb-2">
        <label class="form-label small text-muted-brand mb-1" for="cvrSwitchAccountLoginEmail">Email address</label>
        <input type="email" class="form-control" id="cvrSwitchAccountLoginEmail" autocomplete="username" value="${escapeHtml(savedEmail)}" required ${savedEmail ? "" : "autofocus"}>
      </div>
      <div class="mb-2">
        <label class="form-label small text-muted-brand mb-1" for="cvrSwitchAccountLoginPassword">Password</label>
        <input type="password" class="form-control" id="cvrSwitchAccountLoginPassword" autocomplete="current-password" required ${savedEmail ? "autofocus" : ""}>
      </div>
      <div class="d-flex justify-content-between align-items-center mb-3 small">
        <label class="d-flex align-items-center gap-2 mb-0" for="cvrSwitchAccountLoginSave">
          <input type="checkbox" id="cvrSwitchAccountLoginSave" ${savedEmail ? "checked" : ""}>
          Save info
        </label>
        <button type="button" id="cvrSwitchAccountAddForgotBtn" class="btn btn-link p-0 text-decoration-none text-primary">Forgot password?</button>
      </div>
      <div class="d-flex gap-2 mb-3">
        <button type="button" class="btn btn-outline-secondary flex-grow-1" id="cvrSwitchAccountAddCancelBtn">Back</button>
        <button type="submit" class="btn btn-brand flex-grow-1" id="cvrSwitchAccountLoginSubmitBtn">
          <span class="cvr-switch-btn-label">Sign in</span>
          <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
        </button>
      </div>
      <p class="text-center small text-muted-brand mb-0">Don't have an account? <button type="button" class="btn btn-link p-0 align-baseline text-decoration-none" id="cvrSwitchAccountGoRegisterBtn">Register</button></p>
    </form>
  `;

  document.getElementById("cvrSwitchAccountAddCancelBtn")?.addEventListener("click", renderCvrSwitchAccountPicker);
  document.getElementById("cvrSwitchAccountGoRegisterBtn")?.addEventListener("click", renderCvrSwitchAccountRegisterStep);

  const openAddForgot = (email) =>
    renderCvrSwitchAccountForgotStep(
      { email: email || "" },
      {
        onExit: () => renderCvrSwitchAccountAddStep(email || ""),
        successMessage: "Your password has been reset. Sign in with your new password to continue.",
      }
    );
  document.getElementById("cvrSwitchAccountAddForgotBtn")?.addEventListener("click", () => {
    const email = document.getElementById("cvrSwitchAccountLoginEmail")?.value.trim() || "";
    openAddForgot(email);
  });

  const form = document.getElementById("cvrSwitchAccountLoginForm");
  const alertEl = document.getElementById("cvrSwitchAccountLoginAlert");
  const rememberBox = document.getElementById("cvrSwitchAccountLoginSave");
  const MAX_LOGIN_FAILS = 5;
  const showErr = (msg) => {
    if (!alertEl) return;
    alertEl.textContent = msg;
    alertEl.classList.remove("d-none");
  };

  form?.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    alertEl?.classList.add("d-none");
    if (alertEl) alertEl.innerHTML = "";
    const email = document.getElementById("cvrSwitchAccountLoginEmail")?.value.trim() || "";
    const password = document.getElementById("cvrSwitchAccountLoginPassword")?.value || "";
    if (!isValidEmail(email)) return showErr("Please enter a valid email address.");
    if (!password) return showErr("Please enter your password.");

    const submitBtn = document.getElementById("cvrSwitchAccountLoginSubmitBtn");
    submitBtn.disabled = true;
    submitBtn.querySelector(".cvr-switch-btn-label")?.classList.add("d-none");
    submitBtn.querySelector(".spinner-border")?.classList.remove("d-none");

    try {
      const { body } = await cvrApiPost("auth/login", { email, password });
      if (!body.success) {
        if (body.data?.suspended) {
          showErr(body.message || "This account has been suspended.");
          cvrToast(body.message || "This account has been suspended. Please contact Casa Vergara.", "danger");
        } else if (body.data?.unverified) {
          showErr(body.message || "Please verify your email address before signing in.");
          offerResendVerification(alertEl, email);
        } else {
          const fails = recordLoginFailure(email);
          showErr(body.message || "Invalid email or password.");
          if (body.data?.suggestReset || body.data?.lockedOut || fails >= MAX_LOGIN_FAILS) {
            offerForgotPassword(alertEl, email, () => openAddForgot(email));
          }
        }
        return;
      }

      clearLoginFailures(email);

      if (rememberBox?.checked) cvrSaveLoginEmail(email);
      else cvrClearSavedLoginEmail();

      renderCvrSwitchAccountConfirmStep(body.data.user);
    } catch {
      showErr("Could not reach the server. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.querySelector(".cvr-switch-btn-label")?.classList.remove("d-none");
      submitBtn.querySelector(".spinner-border")?.classList.add("d-none");
    }
  });
}

function renderCvrSwitchAccountRegisterStep() {
  const body = document.getElementById("cvrSwitchAccountBody");
  if (!body) return;

  body.innerHTML = `
    <p class="text-muted-brand small mb-3">Create a new Casa Vergara account. You'll need to verify your email before signing in.</p>
    <div id="cvrSwitchAccountRegisterAlert" class="alert alert-danger small d-none" role="alert"></div>
    <form id="cvrSwitchAccountRegisterForm">
      <div class="row g-2 mb-2">
        <div class="col-6">
          <label class="form-label small text-muted-brand mb-1" for="cvrSwitchRegFirstName">First name</label>
          <input type="text" class="form-control" id="cvrSwitchRegFirstName" required autofocus>
        </div>
        <div class="col-6">
          <label class="form-label small text-muted-brand mb-1" for="cvrSwitchRegLastName">Last name</label>
          <input type="text" class="form-control" id="cvrSwitchRegLastName" required>
        </div>
      </div>
      <div class="small mt-1 mb-2" id="cvrSwitchRegNameFeedback"></div>
      <div class="mb-2">
        <label class="form-label small text-muted-brand mb-1" for="cvrSwitchRegEmail">Email address</label>
        <input type="email" class="form-control" id="cvrSwitchRegEmail" autocomplete="username" required>
        <div class="small mt-1" id="cvrSwitchRegEmailFeedback"></div>
      </div>
      <div class="mb-2">
        <label class="form-label small text-muted-brand mb-1" for="cvrSwitchRegPhone">Contact number</label>
        <input type="tel" class="form-control" id="cvrSwitchRegPhone" required>
        <div class="small mt-1" id="cvrSwitchRegPhoneFeedback"></div>
      </div>
      <div class="row g-2 mb-2">
        <div class="col-6">
          <label class="form-label small text-muted-brand mb-1" for="cvrSwitchRegPassword">Password</label>
          <input type="password" class="form-control" id="cvrSwitchRegPassword" autocomplete="new-password" required>
        </div>
        <div class="col-6">
          <label class="form-label small text-muted-brand mb-1" for="cvrSwitchRegPasswordConfirm">Confirm</label>
          <input type="password" class="form-control" id="cvrSwitchRegPasswordConfirm" autocomplete="new-password" required>
        </div>
      </div>
      <div class="form-check mb-3">
        <input class="form-check-input" type="checkbox" id="cvrSwitchRegTerms">
        <label class="form-check-label small text-muted-brand" for="cvrSwitchRegTerms">
          I agree to the <a href="${pageUrl("terms.html")}" target="_blank" rel="noopener">Terms</a> and <a href="${pageUrl("privacy.html")}" target="_blank" rel="noopener">Privacy Policy</a>.
        </label>
      </div>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-outline-secondary flex-grow-1" id="cvrSwitchRegBackBtn">Back</button>
        <button type="submit" class="btn btn-brand flex-grow-1" id="cvrSwitchRegSubmitBtn">
          <span class="cvr-switch-btn-label">Create account</span>
          <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
        </button>
      </div>
    </form>
  `;

  document.getElementById("cvrSwitchRegBackBtn")?.addEventListener("click", renderCvrSwitchAccountAddStep);

  const emailInput = document.getElementById("cvrSwitchRegEmail");
  const emailFeedback = document.getElementById("cvrSwitchRegEmailFeedback");
  if (emailInput && emailFeedback) {
    let lastChecked = "";
    emailInput.addEventListener("blur", async () => {
      const value = emailInput.value.trim();
      if (!value || value === lastChecked) return;
      lastChecked = value;

      if (!isValidEmail(value)) {
        emailInput.classList.add("is-invalid");
        emailFeedback.className = "small mt-1 text-danger";
        emailFeedback.textContent = "Please enter a valid email address.";
        return;
      }

      emailFeedback.className = "small mt-1 text-muted-brand";
      emailFeedback.textContent = "Checking this email address...";

      const result = await verifyEmailExists(value);
      if (result.ok) {
        emailInput.classList.remove("is-invalid");
        emailInput.classList.add("is-valid");
        emailFeedback.className = "small mt-1 text-success";
        emailFeedback.textContent = result.verified
          ? "\u2713 This email account exists."
          : "This email looks valid. We will send a 6-digit code to confirm it.";
      } else {
        emailInput.classList.remove("is-valid");
        emailInput.classList.add("is-invalid");
        emailFeedback.className = "small mt-1 text-danger";
        emailFeedback.textContent = result.message;
      }
    });

    emailInput.addEventListener("input", () => {
      emailInput.classList.remove("is-valid", "is-invalid");
      emailFeedback.textContent = "";
    });
  }

  const phoneInput = document.getElementById("cvrSwitchRegPhone");
  const phoneFeedback = document.getElementById("cvrSwitchRegPhoneFeedback");
  if (phoneInput && phoneFeedback) {
    let lastCheckedPhone = "";
    phoneInput.addEventListener("blur", async () => {
      const value = phoneInput.value.trim();
      if (!value || value === lastCheckedPhone) return;
      lastCheckedPhone = value;

      if (!isValidPhone(value)) {
        phoneInput.classList.remove("is-valid");
        phoneInput.classList.add("is-invalid");
        phoneFeedback.className = "small mt-1 text-danger";
        phoneFeedback.textContent = "Please enter a valid contact number (8–15 digits).";
        return;
      }

      phoneFeedback.className = "small mt-1 text-muted-brand";
      phoneFeedback.textContent = "Checking this number...";

      const result = await checkPhoneAvailable(value, document.getElementById("cvrSwitchRegEmail")?.value.trim() || "");
      if (result.available) {
        phoneInput.classList.remove("is-invalid");
        phoneInput.classList.add("is-valid");
        phoneFeedback.className = "small mt-1 text-success";
        phoneFeedback.textContent = "This number is available.";
      } else {
        phoneInput.classList.remove("is-valid");
        phoneInput.classList.add("is-invalid");
        phoneFeedback.className = "small mt-1 text-danger";
        phoneFeedback.textContent = result.message;
      }
    });

    phoneInput.addEventListener("input", () => {
      phoneInput.classList.remove("is-valid", "is-invalid");
      phoneFeedback.textContent = "";
    });
  }

  const switchFirstNameInput = document.getElementById("cvrSwitchRegFirstName");
  const switchLastNameInput = document.getElementById("cvrSwitchRegLastName");
  const switchNameFeedback = document.getElementById("cvrSwitchRegNameFeedback");
  if (switchFirstNameInput && switchLastNameInput && switchNameFeedback) {
    let lastCheckedSwitchName = "";
    const checkSwitchName = async () => {
      const first = switchFirstNameInput.value.trim();
      const last = switchLastNameInput.value.trim();
      if (!first || !last) return;
      const key = `${first.toLowerCase()}|${last.toLowerCase()}`;
      if (key === lastCheckedSwitchName) return;
      lastCheckedSwitchName = key;

      switchNameFeedback.className = "small mt-1 text-muted-brand";
      switchNameFeedback.textContent = "Checking this name...";

      const result = await checkNameAvailable(first, last, document.getElementById("cvrSwitchRegEmail")?.value.trim() || "");
      if (result.available) {
        switchFirstNameInput.classList.remove("is-invalid");
        switchLastNameInput.classList.remove("is-invalid");
        switchFirstNameInput.classList.add("is-valid");
        switchLastNameInput.classList.add("is-valid");
        switchNameFeedback.className = "small mt-1 text-success";
        switchNameFeedback.textContent = "This name is available.";
      } else {
        switchFirstNameInput.classList.remove("is-valid");
        switchLastNameInput.classList.remove("is-valid");
        switchFirstNameInput.classList.add("is-invalid");
        switchLastNameInput.classList.add("is-invalid");
        switchNameFeedback.className = "small mt-1 text-danger";
        switchNameFeedback.textContent = result.message;
      }
    };
    switchFirstNameInput.addEventListener("blur", checkSwitchName);
    switchLastNameInput.addEventListener("blur", checkSwitchName);
    [switchFirstNameInput, switchLastNameInput].forEach((input) => {
      input.addEventListener("input", () => {
        input.classList.remove("is-valid", "is-invalid");
        switchNameFeedback.textContent = "";
        lastCheckedSwitchName = "";
      });
    });
  }

  const form = document.getElementById("cvrSwitchAccountRegisterForm");
  const alertEl = document.getElementById("cvrSwitchAccountRegisterAlert");
  const showErr = (msg) => {
    if (!alertEl) return;
    alertEl.textContent = msg;
    alertEl.classList.remove("d-none");
  };

  form?.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    alertEl?.classList.add("d-none");

    const firstName = document.getElementById("cvrSwitchRegFirstName")?.value.trim() || "";
    const lastName = document.getElementById("cvrSwitchRegLastName")?.value.trim() || "";
    const email = document.getElementById("cvrSwitchRegEmail")?.value.trim() || "";
    const phone = document.getElementById("cvrSwitchRegPhone")?.value.trim() || "";
    const password = document.getElementById("cvrSwitchRegPassword")?.value || "";
    const confirm = document.getElementById("cvrSwitchRegPasswordConfirm")?.value || "";
    const terms = document.getElementById("cvrSwitchRegTerms")?.checked;

    if (!terms) return showErr("Please agree to the Terms & Conditions and Privacy Policy.");
    if (!firstName || !lastName) return showErr("Please enter your first and last name.");
    if (!isValidEmail(email)) return showErr("Please enter a valid email address.");
    if (!isValidPhone(phone)) return showErr("Please enter a valid contact number (8–15 digits).");
    if (password.length < 6) return showErr("Password must be at least 6 characters.");
    if (password !== confirm) return showErr("Passwords do not match.");

    const submitBtn = document.getElementById("cvrSwitchRegSubmitBtn");
    submitBtn.disabled = true;
    submitBtn.querySelector(".cvr-switch-btn-label")?.classList.add("d-none");
    submitBtn.querySelector(".spinner-border")?.classList.remove("d-none");

    try {
      const { body } = await cvrApiPost("auth/register", {
        firstName, lastName, email, phone, password, passwordConfirm: confirm, terms,
      });
      if (!body.success) {
        showErr(body.message || "Registration failed. Please try again.");
        if (body.data?.phoneTaken) {
          const phoneField = document.getElementById("cvrSwitchRegPhone");
          const phoneFieldFeedback = document.getElementById("cvrSwitchRegPhoneFeedback");
          if (phoneField) {
            phoneField.classList.remove("is-valid");
            phoneField.classList.add("is-invalid");
            phoneField.focus();
          }
          if (phoneFieldFeedback) {
            phoneFieldFeedback.className = "small mt-1 text-danger";
            phoneFieldFeedback.textContent = body.message || "This phone number is already in use. Please try a different phone number.";
          }
        }
        if (body.data?.nameTaken) {
          const firstField = document.getElementById("cvrSwitchRegFirstName");
          const lastField = document.getElementById("cvrSwitchRegLastName");
          const nameFieldFeedback = document.getElementById("cvrSwitchRegNameFeedback");
          [firstField, lastField].forEach((field) => {
            if (!field) return;
            field.classList.remove("is-valid");
            field.classList.add("is-invalid");
          });
          firstField?.focus();
          if (nameFieldFeedback) {
            nameFieldFeedback.className = "small mt-1 text-danger";
            nameFieldFeedback.textContent = body.message || "An account already exists under this first and last name.";
          }
        }
        return;
      }
      renderCvrSwitchAccountRegisterDoneStep(email);
    } catch {
      showErr("Could not reach the server. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.querySelector(".cvr-switch-btn-label")?.classList.remove("d-none");
      submitBtn.querySelector(".spinner-border")?.classList.add("d-none");
    }
  });
}

function renderCvrSwitchAccountRegisterDoneStep(email) {
  const body = document.getElementById("cvrSwitchAccountBody");
  if (!body) return;
  body.innerHTML = `
    <div class="text-center py-2">
      <div class="cvr-logout-modal-icon mb-3" style="background:rgba(25,135,84,0.1);color:#198754;">
        <i class="bi bi-envelope-check"></i>
      </div>
      <h6 class="text-brand mb-1">Verify Your Account</h6>
      <p class="text-muted-brand small mb-3">We sent a 6-digit code to ${escapeHtml(email)}. Enter it below to activate the account.</p>
    </div>
    <div id="cvrSwitchRegVerifyAlert" class="alert d-none small" role="alert"></div>
    <form id="cvrSwitchRegVerifyForm">
      <div class="cvr-otp-boxes mb-3" id="cvrSwitchRegCodeBoxes">
        ${[0, 1, 2, 3, 4, 5]
          .map(
            (i) =>
              `<input type="text" inputmode="numeric" maxlength="1" class="form-control text-center cvr-otp-box" data-idx="${i}"${i === 0 ? ' autocomplete="one-time-code" autofocus' : ""} aria-label="Digit ${i + 1}">`
          )
          .join("")}
      </div>
      <button type="submit" class="btn btn-brand w-100" id="cvrSwitchRegVerifyBtn">Verify Account <i class="bi bi-check2 ms-1"></i></button>
      <div class="d-flex justify-content-between mt-3 small">
        <button type="button" class="btn btn-link p-0 text-decoration-none" id="cvrSwitchRegDoneBackBtn">Back to sign in</button>
        <button type="button" class="btn btn-link p-0 text-decoration-none" id="cvrSwitchRegResendBtn">Resend code</button>
      </div>
    </form>
  `;

  const boxes = Array.from(document.querySelectorAll("#cvrSwitchRegCodeBoxes input"));
  const alertEl = document.getElementById("cvrSwitchRegVerifyAlert");

  const readCode = () => boxes.map((b) => b.value).join("");
  const writeCode = (val) => {
    const digits = (val || "").replace(/\D/g, "").slice(0, 6).split("");
    boxes.forEach((b, i) => {
      b.value = digits[i] || "";
    });
  };
  const showMsg = (message, type) => {
    if (!alertEl) return;
    if (!message) return alertEl.classList.add("d-none");
    alertEl.textContent = message;
    alertEl.classList.remove("d-none", "alert-success", "alert-danger");
    alertEl.classList.add(type === "success" ? "alert-success" : "alert-danger");
  };

  boxes.forEach((box, idx) => {
    box.addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "").slice(0, 1);
      if (this.value && idx < boxes.length - 1) boxes[idx + 1].focus();
    });
    box.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && !this.value && idx > 0) boxes[idx - 1].focus();
    });
    box.addEventListener("focus", function () {
      this.select();
    });
    box.addEventListener("paste", function (e) {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData("text");
      writeCode(text);
      const filled = text.replace(/\D/g, "").slice(0, 6).length;
      boxes[Math.min(filled, boxes.length - 1)].focus();
    });
  });

  document.getElementById("cvrSwitchRegVerifyForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = readCode();
    if (code.length !== 6) return showMsg("Please enter all 6 digits of the code.", "danger");

    const btn = document.getElementById("cvrSwitchRegVerifyBtn");
    const original = btn ? btn.innerHTML : "";
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verifying…';
    }
    try {
      const { body: res } = await cvrApiPost("auth/verify-email-code", { email, code });
      if (res.success) {
        showMsg(res.message || "Email verified! You can now sign in.", "success");
        setTimeout(renderCvrSwitchAccountAddStep, 1200);
        return;
      }
      showMsg(res.message || "That code is incorrect. Please try again.", "danger");
      writeCode("");
      boxes[0]?.focus();
    } catch (err) {
      showMsg("Could not reach the server. Please try again.", "danger");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = original;
      }
    }
  });

  document.getElementById("cvrSwitchRegResendBtn")?.addEventListener("click", async () => {
    try {
      const { body: res } = await cvrApiPost("auth/resend-verification", { email });
      showMsg(res.message || "A new code has been sent.", res.success ? "success" : "danger");
      writeCode("");
      boxes[0]?.focus();
    } catch (err) {
      showMsg("Could not reach the server. Please try again.", "danger");
    }
  });

  document.getElementById("cvrSwitchRegDoneBackBtn")?.addEventListener("click", renderCvrSwitchAccountAddStep);
}

function renderCvrSwitchAccountPasswordStep(acc) {
  const body = document.getElementById("cvrSwitchAccountBody");
  if (!body) return;
  const name = customerProfileDisplayName(acc);
  const initials = customerProfileInitials(acc);
  const avatar = customerAvatarSrc(acc)
    ? `<img class="cvr-switch-account-avatar" src="${customerAvatarSrc(acc)}" alt="" loading="lazy" onerror="cvrAvatarFallback(this)" />`
    : `<span class="cvr-switch-account-avatar cvr-switch-account-avatar--fallback">${escapeHtml(initials)}</span>`;

  body.innerHTML = `
    <div class="d-flex align-items-center gap-3 mb-3">
      ${avatar}
      <span class="flex-grow-1 overflow-hidden">
        <span class="d-block fw-semibold text-brand text-truncate">${escapeHtml(name)}</span>
        <span class="d-block small text-muted-brand text-truncate">${escapeHtml(acc.email)}</span>
      </span>
    </div>
    <div id="cvrSwitchAccountAlert" class="alert alert-danger small d-none" role="alert"></div>
    <form id="cvrSwitchAccountForm">
      <label class="form-label small text-muted-brand mb-1" for="cvrSwitchAccountPassword">Enter password to switch</label>
      <input type="password" class="form-control mb-2" id="cvrSwitchAccountPassword" autocomplete="current-password" required autofocus>
      <div class="d-flex justify-content-between align-items-center mb-3 small">
        <label class="d-flex align-items-center gap-2 mb-0" for="cvrSwitchAccountRemember">
          <input type="checkbox" id="cvrSwitchAccountRemember">
          Remember password
        </label>
        <button type="button" id="cvrSwitchAccountForgotBtn" class="btn btn-link p-0 text-decoration-none text-primary">Forgot password?</button>
      </div>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-outline-secondary flex-grow-1" id="cvrSwitchAccountBackBtn">Back</button>
        <button type="submit" class="btn btn-brand flex-grow-1" id="cvrSwitchAccountConfirmBtn">
          <span class="cvr-switch-btn-label">Switch account</span>
          <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
        </button>
      </div>
    </form>
  `;

  document.getElementById("cvrSwitchAccountBackBtn")?.addEventListener("click", renderCvrSwitchAccountPicker);
  document.getElementById("cvrSwitchAccountForgotBtn")?.addEventListener("click", () => renderCvrSwitchAccountForgotStep(acc));

  const form = document.getElementById("cvrSwitchAccountForm");
  const alertEl = document.getElementById("cvrSwitchAccountAlert");
  const showErr = (msg) => {
    if (!alertEl) return;
    alertEl.textContent = msg;
    alertEl.classList.remove("d-none");
  };

  form?.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    alertEl?.classList.add("d-none");
    const password = document.getElementById("cvrSwitchAccountPassword")?.value || "";
    if (!password) return showErr("Please enter the password.");

    const confirmBtn = document.getElementById("cvrSwitchAccountConfirmBtn");
    confirmBtn.disabled = true;
    confirmBtn.querySelector(".cvr-switch-btn-label")?.classList.add("d-none");
    confirmBtn.querySelector(".spinner-border")?.classList.remove("d-none");

    try {

      const remember = !!document.getElementById("cvrSwitchAccountRemember")?.checked;
      const { body } = await cvrApiPost("auth/login", { email: acc.email, password, remember });
      if (!body.success) {
        showErr(body.message || "Incorrect password.");
        return;
      }
      renderCvrSwitchAccountConfirmStep(body.data.user);
    } catch {
      showErr("Could not reach the server. Please try again.");
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.querySelector(".cvr-switch-btn-label")?.classList.remove("d-none");
      confirmBtn.querySelector(".spinner-border")?.classList.add("d-none");
    }
  });
}

function renderCvrSwitchAccountForgotStep(acc, options) {
  const body = document.getElementById("cvrSwitchAccountBody");
  if (!body) return;

  const onExit = typeof options?.onExit === "function" ? options.onExit : () => renderCvrSwitchAccountPasswordStep(acc);
  const successMessage = options?.successMessage || "Your password has been reset. Enter it below to finish switching accounts.";

  const state = { email: acc?.email || "", code: "" };

  const setLoading = (btn, loading) => {
    btn.disabled = loading;
    btn.querySelector(".cvr-fp-btn-label")?.classList.toggle("d-none", loading);
    btn.querySelector(".spinner-border")?.classList.toggle("d-none", !loading);
  };

  const stepHeader = (title, onBack) => `
    <div class="d-flex align-items-center gap-2 mb-3">
      <button type="button" class="btn btn-sm btn-link text-muted-brand p-0" id="cvrFpBackBtn" aria-label="Back">
        <i class="bi bi-chevron-left fs-5"></i>
      </button>
      <h6 class="text-brand mb-0">${title}</h6>
    </div>
  `;

  function renderEmailStep() {
    body.innerHTML = `
      ${stepHeader("Reset password")}
      <div id="cvrFpAlert" class="alert alert-danger small d-none" role="alert"></div>
      <form id="cvrFpEmailForm">
        <label class="form-label small text-muted-brand mb-1" for="cvrFpEmail">Email address</label>
        <div class="input-group mb-3">
          <span class="input-group-text"><i class="bi bi-envelope"></i></span>
          <input type="email" class="form-control" id="cvrFpEmail" value="${escapeHtml(state.email)}" autocomplete="email" required autofocus>
        </div>
        <button type="submit" class="btn btn-brand w-100" id="cvrFpSendBtn">
          <span class="cvr-fp-btn-label">Send code</span>
          <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
        </button>
      </form>
    `;

    document.getElementById("cvrFpBackBtn")?.addEventListener("click", onExit);

    const form = document.getElementById("cvrFpEmailForm");
    const alertEl = document.getElementById("cvrFpAlert");
    const showErr = (msg) => {
      alertEl.textContent = msg;
      alertEl.classList.remove("d-none");
    };

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      alertEl.classList.add("d-none");
      const email = document.getElementById("cvrFpEmail").value.trim();
      if (!email) return;

      const btn = document.getElementById("cvrFpSendBtn");
      setLoading(btn, true);
      try {
        const { body: res } = await cvrApiPost("auth/forgot-password", { email });
        if (!res.success) {
          showErr(res.message || "Something went wrong. Please try again.");
          return;
        }
        state.email = email;
        cvrToast(res.message || "Code sent. Check your inbox.", "success");
        renderCodeStep();
      } catch {
        showErr("Could not reach the server. Please try again.");
      } finally {
        setLoading(btn, false);
      }
    });
  }

  function renderCodeStep() {
    body.innerHTML = `
      ${stepHeader("Enter verification code")}
      <p class="small text-muted-brand mb-3">We sent a 6-digit code to <strong>${escapeHtml(state.email)}</strong>.</p>
      <div id="cvrFpAlert" class="alert alert-danger small d-none" role="alert"></div>
      <form id="cvrFpCodeForm">
        <div class="mb-3">
          <div class="cvr-otp-boxes" id="cvrFpCodeBoxes">
            <input type="text" inputmode="numeric" maxlength="1" class="form-control text-center cvr-otp-box" data-idx="0" autocomplete="one-time-code" aria-label="Digit 1" autofocus>
            <input type="text" inputmode="numeric" maxlength="1" class="form-control text-center cvr-otp-box" data-idx="1" aria-label="Digit 2">
            <input type="text" inputmode="numeric" maxlength="1" class="form-control text-center cvr-otp-box" data-idx="2" aria-label="Digit 3">
            <input type="text" inputmode="numeric" maxlength="1" class="form-control text-center cvr-otp-box" data-idx="3" aria-label="Digit 4">
            <input type="text" inputmode="numeric" maxlength="1" class="form-control text-center cvr-otp-box" data-idx="4" aria-label="Digit 5">
            <input type="text" inputmode="numeric" maxlength="1" class="form-control text-center cvr-otp-box" data-idx="5" aria-label="Digit 6">
          </div>
          <input type="hidden" id="cvrFpCode" name="code" value="">
        </div>
        <button type="submit" class="btn btn-brand w-100 mb-2" id="cvrFpVerifyBtn">
          <span class="cvr-fp-btn-label">Verify code</span>
          <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
        </button>
        <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none" id="cvrFpResendBtn">Resend code</button>
      </form>
    `;

    document.getElementById("cvrFpBackBtn")?.addEventListener("click", renderEmailStep);

    (function wireCvrFpBoxes() {
      const boxes = Array.from(document.querySelectorAll("#cvrFpCodeBoxes input"));
      if (!boxes.length) return;
      const sync = () => {
        document.getElementById("cvrFpCode").value = boxes.map((b) => b.value).join("");
      };
      const write = (val) => {
        const digits = (val || "").replace(/\D/g, "").slice(0, 6).split("");
        boxes.forEach((b, i) => {
          b.value = digits[i] || "";
        });
        sync();
      };
      boxes.forEach((box, idx) => {
        box.addEventListener("input", function () {
          this.value = this.value.replace(/\D/g, "").slice(0, 1);
          sync();
          if (this.value && idx < boxes.length - 1) boxes[idx + 1].focus();
        });
        box.addEventListener("keydown", function (e) {
          if (e.key === "Backspace" && !this.value && idx > 0) boxes[idx - 1].focus();
        });
        box.addEventListener("paste", function (e) {
          e.preventDefault();
          const text = (e.clipboardData || window.clipboardData).getData("text");
          write(text);
          const filled = text.replace(/\D/g, "").slice(0, 6).length;
          boxes[Math.min(filled, boxes.length - 1)].focus();
        });
      });
    })();

    const form = document.getElementById("cvrFpCodeForm");
    const alertEl = document.getElementById("cvrFpAlert");
    const showErr = (msg) => {
      alertEl.textContent = msg;
      alertEl.classList.remove("d-none");
    };

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      alertEl.classList.add("d-none");
      const code = document.getElementById("cvrFpCode").value.trim();
      if (code.length !== 6) return showErr("Enter the 6-digit code from your email.");

      const btn = document.getElementById("cvrFpVerifyBtn");
      setLoading(btn, true);
      try {
        const { body: res } = await cvrApiPost("auth/verify-reset-code", { email: state.email, code });
        if (!res.success) {
          showErr(res.message || "That code is incorrect.");
          return;
        }
        state.code = code;
        renderNewPasswordStep();
      } catch {
        showErr("Could not reach the server. Please try again.");
      } finally {
        setLoading(btn, false);
      }
    });

    document.getElementById("cvrFpResendBtn")?.addEventListener("click", async () => {
      const btn = document.getElementById("cvrFpResendBtn");
      btn.disabled = true;
      try {
        const { body: res } = await cvrApiPost("auth/forgot-password", { email: state.email });
        cvrToast(res.success ? "A new code has been sent to your email." : (res.message || "Could not resend the code."), res.success ? "success" : "danger");
      } catch {
        cvrToast("Could not reach the server. Please try again.", "danger");
      } finally {
        btn.disabled = false;
      }
    });
  }

  function renderNewPasswordStep() {
    body.innerHTML = `
      ${stepHeader("Set a new password")}
      <div id="cvrFpAlert" class="alert alert-danger small d-none" role="alert"></div>
      <form id="cvrFpResetForm">
        <label class="form-label small text-muted-brand mb-1" for="cvrFpNewPassword">New password</label>
        <div class="input-group mb-3">
          <span class="input-group-text"><i class="bi bi-lock"></i></span>
          <input type="password" class="form-control" id="cvrFpNewPassword" autocomplete="new-password" placeholder="At least 6 characters" required autofocus>
        </div>
        <label class="form-label small text-muted-brand mb-1" for="cvrFpConfirmPassword">Confirm new password</label>
        <div class="input-group mb-3">
          <span class="input-group-text"><i class="bi bi-lock-fill"></i></span>
          <input type="password" class="form-control" id="cvrFpConfirmPassword" autocomplete="new-password" required>
        </div>
        <button type="submit" class="btn btn-brand w-100" id="cvrFpResetBtn">
          <span class="cvr-fp-btn-label">Reset password</span>
          <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
        </button>
      </form>
    `;

    document.getElementById("cvrFpBackBtn")?.remove();

    const form = document.getElementById("cvrFpResetForm");
    const alertEl = document.getElementById("cvrFpAlert");
    const showErr = (msg) => {
      alertEl.textContent = msg;
      alertEl.classList.remove("d-none");
    };

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      alertEl.classList.add("d-none");
      const newPassword = document.getElementById("cvrFpNewPassword").value;
      const confirmPassword = document.getElementById("cvrFpConfirmPassword").value;
      if (newPassword.length < 6) return showErr("New password must be at least 6 characters.");
      if (newPassword !== confirmPassword) return showErr("New password and confirmation do not match.");

      const btn = document.getElementById("cvrFpResetBtn");
      setLoading(btn, true);
      try {
        const { body: res } = await cvrApiPost("auth/reset-password", {
          email: state.email,
          code: state.code,
          newPassword,
          confirmPassword,
        });
        if (!res.success) {
          showErr(res.message || "Could not reset your password. Please try again.");
          return;
        }
        cvrToast("Password reset successfully!", "success");
        renderSuccessStep();
      } catch {
        showErr("Could not reach the server. Please try again.");
      } finally {
        setLoading(btn, false);
      }
    });
  }

  function renderSuccessStep() {
    body.innerHTML = `
      <div class="text-center py-2">
        <i class="bi bi-check-circle text-success" style="font-size:2.5rem;"></i>
        <p class="mt-3 mb-4 text-muted-brand small">${successMessage}</p>
        <button type="button" class="btn btn-brand w-100" id="cvrFpContinueBtn">Continue</button>
      </div>
    `;
    document.getElementById("cvrFpContinueBtn")?.addEventListener("click", onExit);
  }

  renderEmailStep();
}

function renderCvrSwitchAccountConfirmStep(user) {
  const body = document.getElementById("cvrSwitchAccountBody");
  if (!body) return;
  const name = customerProfileDisplayName(user);
  const initials = customerProfileInitials(user);
  const avatar = customerAvatarSrc(user)
    ? `<img class="cvr-switch-account-avatar cvr-switch-account-avatar--lg" src="${customerAvatarSrc(user)}" alt="" loading="lazy" onerror="cvrAvatarFallback(this)" />`
    : `<span class="cvr-switch-account-avatar cvr-switch-account-avatar--lg cvr-switch-account-avatar--fallback">${escapeHtml(initials)}</span>`;

  body.innerHTML = `
    <div class="text-center py-2">
      <div class="d-flex justify-content-center mb-3">${avatar}</div>
      <h6 class="text-brand mb-1">Switch to ${escapeHtml(name)}?</h6>
      <p class="text-muted-brand small mb-4">You'll be signed out of your current account and signed in as ${escapeHtml(name)} (${escapeHtml(user.email)}).</p>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-outline-secondary flex-grow-1" id="cvrSwitchAccountCancelBtn">Cancel</button>
        <button type="button" class="btn btn-brand flex-grow-1" id="cvrSwitchAccountFinalBtn">
          <span class="cvr-switch-btn-label">Yes, switch account</span>
          <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
        </button>
      </div>
    </div>
  `;

  document.getElementById("cvrSwitchAccountCancelBtn")?.addEventListener("click", renderCvrSwitchAccountPicker);

  document.getElementById("cvrSwitchAccountFinalBtn")?.addEventListener("click", () => {
    const finalBtn = document.getElementById("cvrSwitchAccountFinalBtn");
    finalBtn.disabled = true;
    finalBtn.querySelector(".cvr-switch-btn-label")?.classList.add("d-none");
    finalBtn.querySelector(".spinner-border")?.classList.remove("d-none");

    setCustomerSession(user);
    const role = String(user.role || "").toLowerCase();
    try {
      sessionStorage.setItem("cvrLoginToast", JSON.stringify({ name: user.firstName || "" }));
    } catch {}
    window.location.href = pageUrl(role === "admin" || role === "event_manager" ? "admin/dashboard.html" : "landing.html");
  });
}

function openCvrSwitchAccountModal() {
  ensureCvrSwitchAccountModal();

  const label = document.getElementById("cvrSwitchAccountModalLabel");
  if (label) label.innerHTML = '<i class="bi bi-arrow-left-right me-2"></i>Switch account';
  renderCvrSwitchAccountPicker();
  const modalEl = document.getElementById("cvrSwitchAccountModal");
  if (!modalEl) return;
  if (window.bootstrap?.Modal) {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
    return;
  }

  modalEl.classList.add("show", "cvr-modal-fallback");
  modalEl.style.display = "block";
  modalEl.removeAttribute("aria-hidden");
  document.body.classList.add("modal-open");
  if (!document.getElementById("cvrSwitchAccountBackdrop")) {
    const backdrop = document.createElement("div");
    backdrop.id = "cvrSwitchAccountBackdrop";
    backdrop.className = "modal-backdrop fade show";
    document.body.appendChild(backdrop);
  }
  const close = () => {
    modalEl.classList.remove("show", "cvr-modal-fallback");
    modalEl.style.display = "none";
    modalEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    document.getElementById("cvrSwitchAccountBackdrop")?.remove();
  };
  modalEl.querySelectorAll("[data-bs-dismiss='modal']").forEach((btn) => btn.addEventListener("click", close));
  document.getElementById("cvrSwitchAccountBackdrop")?.addEventListener("click", close);
}

function customerProfileDisplayName(profile) {
  if (!profile) return "Guest";
  const full = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
  return full || profile.email || "Guest";
}

function customerProfileInitials(profile) {
  const f = String(profile?.firstName || "").trim();
  const l = String(profile?.lastName || "").trim();
  if (f && l) return (f[0] + l[0]).toUpperCase();
  if (f.length >= 2) return f.slice(0, 2).toUpperCase();
  if (f) return f[0].toUpperCase();
  const local = String(profile?.email || "guest").split("@")[0];
  return local.slice(0, 2).toUpperCase() || "G";
}

// If a saved avatar URL no longer loads, hide the broken image instead of
// showing the browser's broken-picture icon.
function cvrAvatarFallback(img) {
  img.onerror = null;
  img.style.visibility = "hidden";
}

function customerAvatarSrc(profile) {
  if (typeof profile?.avatarUrl === "string" && profile.avatarUrl) return profile.avatarUrl;
  const p = profile?.profilePhoto;
  if (typeof p !== "string" || p.length < 30) return "";
  if (!/^data:image\/(jpeg|jpg|png|gif|webp);base64,/i.test(p)) return "";
  return p;
}

function resizeImageToDataUrl(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unsupported"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image"));
    };
    img.src = url;
  });
}

function applyCustomerAvatarElements(session) {
  const photo = customerAvatarSrc(session);
  const initials = customerProfileInitials(session);

  const dashImg = document.getElementById("dashProfileAvatarImg");
  const dashFallback = document.getElementById("dashProfileAvatar");
  if (dashImg && dashFallback) {
    if (photo) {
      dashImg.src = photo;
      dashImg.classList.remove("d-none");
      dashImg.alt = customerProfileDisplayName(session);
      dashFallback.classList.add("d-none");
    } else {
      dashImg.removeAttribute("src");
      dashImg.classList.add("d-none");
      dashFallback.classList.remove("d-none");
      dashFallback.textContent = initials;
    }
  }

  const prev = document.getElementById("settingsPhotoPreview");
  const prevPh = document.getElementById("settingsPhotoPlaceholder");
  if (prev && prevPh) {
    if (photo) {
      prev.src = photo;
      prev.classList.remove("d-none");
      prev.alt = "Profile preview";
      prevPh.classList.add("d-none");
    } else {
      prev.removeAttribute("src");
      prev.classList.add("d-none");
      prevPh.classList.remove("d-none");
    }
  }

  const rm = document.getElementById("removeCustomerPhotoBtn");
  if (rm) rm.classList.toggle("d-none", !photo);
}

function renderNavbar(active = "") {
  const smart = getSmartNavUrls();
  const links = [
    { id: "home", label: "Home", href: pageUrl("landing.html") },
    { id: "about", label: "About Us", href: pageUrl("about.html") },
    { id: "booking", label: "Booking", href: pageUrl("booking.html") },
    { id: "faq", label: "FAQs", href: pageUrl("faq.html") },
    { id: "contact", label: "Contacts", href: pageUrl("contact.html") },
  ];

  if (isStaffSession(getCustomerSession())) {
    const contactLink = links.find((l) => l.id === "contact");
    if (contactLink) {
      contactLink.href = pageUrl("contact-clients.html");
      contactLink.label = "Contact Clients";
    }
  }

  const nav = document.getElementById("site-navbar");
  if (!nav) return;

  const session = getCustomerSession();
  const displayName = customerProfileDisplayName(session);
  const initials = customerProfileInitials(session);
  const shortName = escapeHtml((session?.firstName || displayName).split(" ")[0] || displayName);
  const photo = customerAvatarSrc(session);
  const navAvatarMarkup = photo
    ? `<img class="nav-profile-avatar nav-profile-avatar--photo" src="${photo}" alt="" loading="lazy" />`
    : `<span class="nav-profile-avatar" aria-hidden="true">${escapeHtml(initials)}</span>`;

  const staff = isStaffSession(session);
  const isAdminRole = String(session?.role || "").toLowerCase() === "admin";
  const staffBadgeLabel = isAdminRole ? "Admin view" : "Staff view";
  const staffBadgeClass = isAdminRole ? "nav-staff-badge nav-staff-badge--admin" : "nav-staff-badge nav-staff-badge--staff";
  const staffBadgeIcon = isAdminRole ? "bi-shield-check" : "bi-eye";

  const notifBellMarkup = session && !staff
    ? `
        <div class="dropdown nav-notif-dropdown" id="navNotifDropdown">
          <button type="button" class="btn nav-bell-btn position-relative" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Notifications">
            <i class="bi bi-bell fs-5"></i>
            <span id="navBellCountBadge" class="badge rounded-pill text-bg-danger nav-bell-count d-none">0</span>
          </button>
          <div class="dropdown-menu dropdown-menu-end shadow border-0 p-0 nav-notif-menu">
            <div class="px-3 py-2 border-bottom border-light-subtle d-flex align-items-center justify-content-between">
              <span class="fw-semibold text-brand small">Notifications</span>
              <a href="${pageUrl("customer-dashboard.html")}#notifications" class="small text-decoration-none">See all</a>
            </div>
            <div id="navBellList" class="nav-notif-list">
              <div class="px-3 py-4 small text-muted-brand text-center">Loading…</div>
            </div>
          </div>
        </div>
      `
    : "";

  const authBlock = session
    ? staff
      ? `
          <div class="dropdown nav-profile-dropdown">
            <button type="button" class="btn nav-profile-btn d-flex align-items-center gap-2" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Account menu">
              ${navAvatarMarkup}
              <span class="nav-profile-name d-none d-md-inline text-start">${shortName}</span>
              <i class="bi bi-chevron-down small opacity-75" aria-hidden="true"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow border-0 py-2 nav-profile-menu">
              <li class="px-3 pb-2 mb-1 border-bottom border-light-subtle">
                <div class="small text-muted-brand text-uppercase" style="letter-spacing:.06em;">Signed in &middot; ${staffBadgeLabel}</div>
                <div class="fw-semibold text-brand text-truncate" style="max-width:14rem;">${escapeHtml(displayName)}</div>
                <div class="small text-muted-brand text-truncate" style="max-width:14rem;">${escapeHtml(session.email)}</div>
              </li>
              <li><a class="dropdown-item" href="${pageUrl("admin/dashboard.html")}"><i class="bi bi-bootstrap-fill me-2 text-primary"></i>${isAdminRole ? "Admin dashboard" : "Staff dashboard"}</a></li>
              <li><a class="dropdown-item" href="${pageUrl("admin/reservations.html")}"><i class="bi bi-journal-check me-2 text-primary"></i>Reservations</a></li>
              <li><a class="dropdown-item" href="${pageUrl("booking.html")}"><i class="bi bi-door-open me-2 text-primary"></i>Browse rooms &amp; events</a></li>
              <li><hr class="dropdown-divider my-2" /></li>
              <li><button type="button" class="dropdown-item" id="cvrNavSwitchAccountBtn"><i class="bi bi-arrow-left-right me-2 text-primary"></i>Switch account</button></li>
              <li><button type="button" class="dropdown-item text-danger" id="cvrNavLogoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Log out</button></li>
            </ul>
          </div>
          <span class="badge ${staffBadgeClass} px-3 py-2 d-none d-lg-inline-flex" title="Staff accounts oversee the site and can't create bookings"><i class="bi ${staffBadgeIcon} me-1"></i>${staffBadgeLabel}</span>
          ${notifBellMarkup}
        `

      : `
          <div class="dropdown nav-profile-dropdown">
            <button type="button" class="btn nav-profile-btn d-flex align-items-center gap-2" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Account menu">
              ${navAvatarMarkup}
              <span class="nav-profile-name d-none d-md-inline text-start">${shortName}</span>
              <i class="bi bi-chevron-down small opacity-75" aria-hidden="true"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow border-0 py-2 nav-profile-menu">
              <li class="px-3 pb-2 mb-1 border-bottom border-light-subtle">
                <div class="small text-muted-brand text-uppercase" style="letter-spacing:.06em;">Signed in</div>
                <div class="fw-semibold text-brand text-truncate" style="max-width:14rem;">${escapeHtml(displayName)}</div>
                <div class="small text-muted-brand text-truncate" style="max-width:14rem;">${escapeHtml(session.email)}</div>
              </li>
              <li><a class="dropdown-item" href="${pageUrl("customer-dashboard.html")}"><i class="bi bi-bootstrap-fill me-2 text-primary"></i>Dashboard</a></li>
              <li><a class="dropdown-item" href="${pageUrl("customer-settings.html")}"><i class="bi bi-gear me-2 text-primary"></i>Settings</a></li>
              <li><a class="dropdown-item" href="${smart.reservation}"><i class="bi bi-journal-check me-2 text-primary"></i>Reservation</a></li>
              <li><a class="dropdown-item" href="${pageUrl("booking.html")}"><i class="bi bi-door-open me-2 text-primary"></i>Booking</a></li>
              <li><a class="dropdown-item" href="${smart.payment}"><i class="bi bi-credit-card me-2 text-primary"></i>Payment</a></li>
              <li><a class="dropdown-item" href="${smart.status}"><i class="bi bi-activity me-2 text-primary"></i>Status</a></li>
              <li><hr class="dropdown-divider my-2" /></li>
              <li><button type="button" class="dropdown-item" id="cvrNavSwitchAccountBtn"><i class="bi bi-arrow-left-right me-2 text-primary"></i>Switch account</button></li>
              <li><button type="button" class="dropdown-item text-danger" id="cvrNavLogoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Log out</button></li>
            </ul>
          </div>
          <a class="btn btn-accent nav-book-btn px-4 d-none d-lg-inline-flex" href="${pageUrl("booking.html")}">Book now</a>
          ${notifBellMarkup}
        `
    : `
          <a href="${pageUrl("login.html")}" class="nav-auth-link d-none d-lg-inline-flex">Log in</a>
          <a class="btn btn-accent nav-book-btn px-4 d-none d-lg-inline-flex" href="${pageUrl("booking.html")}">Book now</a>
        `;

  const mobileActions = session
    ? staff
      ? `
          <span class="badge ${staffBadgeClass} w-100 justify-content-center py-2"><i class="bi ${staffBadgeIcon} me-1"></i>${staffBadgeLabel}</span>
        `
      : `
          <a class="btn btn-accent nav-book-btn w-100" href="${pageUrl("booking.html")}">Book now</a>
        `
    : `
          <a class="btn btn-outline-brand nav-auth-link-mobile w-100" href="${pageUrl("login.html")}">Log in</a>
          <a class="btn btn-accent nav-book-btn w-100" href="${pageUrl("booking.html")}">Book now</a>
        `;

  nav.innerHTML = `
    <header class="site-header" id="siteHeader">
    <nav class="navbar navbar-expand-lg site-navbar figma-navbar py-2" id="mainSiteNavbar">
      <div class="container nav-main-wrap">
        <a class="navbar-brand d-flex align-items-center gap-2 me-lg-4 figma-brand order-lg-1" href="${pageUrl("landing.html")}">
          <img src="${assetUrl("images/logo.png")}" alt="Casa Vergara" class="brand-logo figma-brand-logo rounded-3 border p-1 shadow-sm" />
          <span class="brand-text-wrap">
            <strong class="text-brand d-block brand-title figma-brand-title">Casa Vergara Resort</strong>
          </span>
        </a>
        <div class="d-flex align-items-center gap-2 gap-md-3 nav-auth-row order-lg-3 ms-auto ms-lg-0 justify-content-lg-end">
          ${authBlock}
        </div>
        <button class="navbar-toggler nav-toggler-clean order-lg-4 ms-2" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse order-lg-2" id="mainNav">
          <ul class="navbar-nav mx-auto mb-2 mb-lg-0 nav-links-row">
            ${links
              .map((l) => `<li class="nav-item"><a class="nav-link nav-link-luxury ${active === l.id ? "fw-semibold text-brand" : ""}" href="${l.href}"${l.attrs || ""}>${l.label}</a></li>`)
              .join("")}
          </ul>
          <div class="nav-mobile-actions d-lg-none">
            ${mobileActions}
          </div>
        </div>
      </div>
    </nav>
    </header>
    <div class="site-header-spacer" id="siteHeaderSpacer" aria-hidden="true"></div>
  `;

  nav.querySelector("#cvrNavLogoutBtn")?.addEventListener("click", () => {
    cvrConfirmLogout(pageUrl("login.html"));
  });
  nav.querySelector("#cvrNavSwitchAccountBtn")?.addEventListener("click", () => {
    openCvrSwitchAccountModal();
  });

  applySmartNavLinks(nav);
  initNavbarScrollEffect();
  initAutoCloseMobileNav();
  initMobileNavState();
  initHeaderOffset();

  if (session && !staff) {
    renderNavNotifBell();
    initGuestNotifToastPoll(session);
  }

  // Pull the latest saved name / email / role / photo once per page load, so edits made in
  // User Management show in the header without logging out and in again.
  if (session && !window.__cvrNavSessionRefreshed) {
    window.__cvrNavSessionRefreshed = true;
    cvrApiGet("auth/me")
      .then(({ body }) => {
        if (!body?.success || !body.data?.user) return;
        const fresh = body.data.user;
        const changed = ["firstName", "lastName", "email", "role", "avatarUrl"].some(
          (k) => String(fresh[k] ?? "") !== String(session[k] ?? "")
        );
        if (!changed) return;
        setCustomerSession({ ...session, ...fresh });
        renderNavbar(active);
      })
      .catch(() => {});
  }
}

let cvrGuestNotifSeenIds = null;

function cvrLoadSeenGuestNotifIds(email) {
  const key = `cvrGuestNotifSeenIds:${email}`;
  if (cvrGuestNotifSeenIds && cvrGuestNotifSeenIds.key === key) return cvrGuestNotifSeenIds.ids;
  let ids;
  try {
    ids = new Set(JSON.parse(sessionStorage.getItem(key) || "[]"));
  } catch {
    ids = new Set();
  }
  cvrGuestNotifSeenIds = { key, ids };
  return ids;
}
function cvrSaveSeenGuestNotifIds() {
  if (!cvrGuestNotifSeenIds) return;
  try {
    sessionStorage.setItem(cvrGuestNotifSeenIds.key, JSON.stringify(Array.from(cvrGuestNotifSeenIds.ids)));
  } catch {

  }
}

function initGuestNotifToastPoll(session) {
  if (window.__cvrGuestNotifPollBound) return;
  window.__cvrGuestNotifPollBound = true;

  const seenIds = cvrLoadSeenGuestNotifIds(session.email);
  const firstRun = seenIds.size === 0;
  let ranFirst = false;

  const poll = async () => {
    const current = getCustomerSession();
    if (!current || isStaffSession(current)) return;

    const items = await fetchMergedCvrNotifications(current);

    if (!(firstRun && !ranFirst)) {
      items
        .filter((i) => !i.read && !seenIds.has(i.id))
        .forEach((i) => queueCvrNotifPopup(i));
    }
    ranFirst = true;
    items.forEach((i) => seenIds.add(i.id));
    cvrSaveSeenGuestNotifIds();

    if (document.getElementById("navBellList")) renderNavNotifBell();
    if (document.getElementById("dashNotificationsList") && typeof refreshDashboardNotifications === "function") {
      refreshDashboardNotifications();
    }
  };

  poll();
  setInterval(() => {
    if (!document.hidden) poll();
  }, 45000);
}

let cvrNotifPopupQueue = [];
let cvrNotifPopupShowing = false;

function ensureCvrNotifPopupModal() {
  if (document.getElementById("cvrNotifPopupModal")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="modal fade" id="cvrNotifPopupModal" tabindex="-1" aria-labelledby="cvrNotifPopupModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content cvr-logout-modal-content">
          <div class="modal-header border-0 pb-0">
            <h5 class="text-brand mb-0" id="cvrNotifPopupModalLabel"><i class="bi bi-bell me-2"></i><span id="cvrNotifPopupModalTitleText">Notification</span></h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body pt-2">
            <p class="text-muted-brand mb-0" id="cvrNotifPopupModalBody"></p>
          </div>
          <div class="modal-footer border-0 pt-0 pb-4 px-4 justify-content-center">
            <button type="button" class="btn btn-brand px-4" id="cvrNotifPopupModalViewBtn">View</button>
            <button type="button" class="btn btn-outline-brand px-4" data-bs-dismiss="modal">Got it</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap.firstElementChild);
}

function queueCvrNotifPopup(item) {
  cvrNotifPopupQueue.push(item);
  if (!cvrNotifPopupShowing) showNextCvrNotifPopup();
}

function showNextCvrNotifPopup() {
  const item = cvrNotifPopupQueue.shift();
  if (!item) {
    cvrNotifPopupShowing = false;
    return;
  }
  cvrNotifPopupShowing = true;

  ensureCvrNotifPopupModal();
  const modalEl = document.getElementById("cvrNotifPopupModal");
  modalEl.querySelector("#cvrNotifPopupModalTitleText").textContent = item.title || "Notification";
  modalEl.querySelector("#cvrNotifPopupModalBody").textContent = item.body || "";

  const viewBtn = modalEl.querySelector("#cvrNotifPopupModalViewBtn");
  viewBtn.classList.toggle("d-none", !item.link);
  const newViewBtn = viewBtn.cloneNode(true);
  viewBtn.replaceWith(newViewBtn);
  if (item.link) {
    newViewBtn.addEventListener("click", () => {
      window.location.href = item.link;
    });
  }

  const onHidden = () => {
    modalEl.removeEventListener("hidden.bs.modal", onHidden);
    showNextCvrNotifPopup();
  };
  modalEl.addEventListener("hidden.bs.modal", onHidden);
  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

async function fetchMergedCvrNotifications(session) {
  let replyMessages = [];
  try {
    const { body } = await cvrApiGet("content/my-messages");
    if (body?.success) replyMessages = body.data?.messages || [];
  } catch {

  }

  let serverNotifs = [];
  try {
    const { body } = await cvrApiGet("content/my-notifications");
    if (body?.success) serverNotifs = body.data?.notifications || [];
  } catch {

  }

  const localNotifs = session ? getCvrNotificationsForEmail(session.email) : [];

  return [
    ...replyMessages.map((m) => ({
      kind: "reply",
      id: `reply-${m.id}`,
      rawId: m.id,
      title: m.subject || "Your message",
      body: m.message,
      extra: m.adminReply,
      link: "",
      when: m.repliedAt || m.createdAt,
      read: m.read,
    })),
    ...serverNotifs.map((n) => ({
      kind: "notification",
      id: `notification-${n.id}`,
      rawId: n.id,
      title: n.title,
      body: n.message,
      extra: "",
      link: n.link || "",
      when: n.createdAt,
      read: n.read,
    })),
    ...localNotifs.map((n) => ({
      kind: "update",
      id: n.id,
      rawId: n.id,
      title: n.title,
      body: n.body,
      extra: "",
      link: n.link,
      when: n.createdAt,
      read: n.read,
    })),
  ].sort((a, b) => new Date(b.when) - new Date(a.when));
}

async function cvrSetNotificationRead(item, read) {
  if (item.kind === "reply") {
    try {
      await cvrApiPost(read ? "content/messages-mark-read" : "content/messages-mark-unread", { id: item.rawId });
    } catch {

    }
  } else if (item.kind === "notification") {
    try {
      await cvrApiPost(read ? "content/notifications-mark-read" : "content/notifications-mark-unread", { id: item.rawId });
    } catch {

    }
  } else {
    if (read) markCvrNotificationRead(item.rawId);
    else markCvrNotificationUnread(item.rawId);
  }
}

async function cvrDeleteNotification(item) {
  if (item.kind === "reply") {
    try {
      await cvrApiPost("content/messages-delete", { id: item.rawId });
    } catch {

    }
  } else if (item.kind === "notification") {
    try {
      await cvrApiPost("content/notifications-delete", { id: item.rawId });
    } catch {

    }
  } else {
    deleteCvrNotification(item.rawId);
  }
}

function cvrTimeAgo(dateStr) {
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "";
  const diffMin = Math.round((Date.now() - then) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  return formatDateReserved(dateStr);
}

async function renderNavNotifBell() {
  const session = getCustomerSession();
  if (!session || isStaffSession(session)) return;

  const listEl = document.getElementById("navBellList");
  const countBadge = document.getElementById("navBellCountBadge");
  if (!listEl || !countBadge) return;

  const items = await fetchMergedCvrNotifications(session);
  const unread = items.filter((i) => !i.read);

  if (unread.length > 0) {
    countBadge.textContent = unread.length > 9 ? "9+" : String(unread.length);
    countBadge.classList.remove("d-none");
  } else {
    countBadge.classList.add("d-none");
  }

  const bellItems = items.slice(0, 8);
  listEl.innerHTML = bellItems.length
    ? bellItems
        .map((item, idx) => {
          const kindIcon = item.kind === "reply" ? "bi-envelope-open" : "bi-journal-check";
          return `
          <button type="button" class="nav-notif-item d-block w-100 text-start text-decoration-none ${item.read ? "" : "nav-notif-item--unread"}" data-notif-idx="${idx}">
            <div class="d-flex align-items-start gap-2">
              <i class="bi ${kindIcon} text-primary mt-1" aria-hidden="true"></i>
              <div class="min-w-0 flex-grow-1">
                <div class="small fw-semibold text-brand text-truncate">${escapeHtml(item.title)}</div>
                ${item.body ? `<div class="small text-muted-brand text-truncate">${escapeHtml(item.body)}</div>` : ""}
                <div class="small text-muted-brand mt-1">${cvrTimeAgo(item.when)}</div>
              </div>
              ${item.read ? "" : `<span class="nav-notif-dot flex-shrink-0 mt-1" aria-hidden="true"></span>`}
            </div>
          </button>`;
        })
        .join("")
    : `<div class="px-3 py-4 small text-muted-brand text-center">You're all caught up.</div>`;

  listEl.querySelectorAll(".nav-notif-item[data-notif-idx]").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = Number(el.dataset.notifIdx);
      if (bellItems[idx]) {
        openCvrNotificationModal(bellItems[idx], {
          onChanged: () => {
            renderNavNotifBell();
            if (document.getElementById("dashNotificationsList")) refreshDashboardNotifications();
          },
        });
      }
    });
  });

  const dropdownWrap = document.getElementById("navNotifDropdown");
  if (dropdownWrap && !dropdownWrap.dataset.notifBound) {
    dropdownWrap.dataset.notifBound = "1";
    dropdownWrap.addEventListener("shown.bs.dropdown", async () => {
      const current = await fetchMergedCvrNotifications(session);
      const unreadReplyIds = current.filter((i) => i.kind === "reply" && !i.read).map((i) => i.rawId);
      const unreadServerIds = current.filter((i) => i.kind === "notification" && !i.read).map((i) => i.rawId);
      const unreadLocalIds = current.filter((i) => i.kind === "update" && !i.read).map((i) => i.rawId);
      if (!unreadReplyIds.length && !unreadServerIds.length && !unreadLocalIds.length) return;

      unreadReplyIds.forEach((id) => {
        cvrApiPost("content/messages-mark-read", { id }).catch(() => {});
      });
      unreadServerIds.forEach((id) => {
        cvrApiPost("content/notifications-mark-read", { id }).catch(() => {});
      });
      unreadLocalIds.forEach((id) => markCvrNotificationRead(id));

      countBadge.classList.add("d-none");
      listEl.querySelectorAll(".nav-notif-item--unread").forEach((el) => {
        el.classList.remove("nav-notif-item--unread");
        el.querySelector(".nav-notif-dot")?.remove();
      });
    });
  }
}

const CVR_LEGAL_SEEN_KEY = "cvrSeenLegalVersions";
let cvrLegalNoticeChecked = false;

function ensureCvrLegalUpdateModal() {
  if (document.getElementById("cvrLegalUpdateModal")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="modal fade" id="cvrLegalUpdateModal" tabindex="-1" aria-labelledby="cvrLegalUpdateModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content cvr-logout-modal-content">
          <div class="modal-header border-0 pb-0">
            <h5 class="text-brand mb-0" id="cvrLegalUpdateModalLabel"><i class="bi bi-file-earmark-text me-2"></i>We've updated our policies</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body pt-2">
            <p class="text-muted-brand small mb-3">The following documents changed since you last visited. Please take a moment to review them.</p>
            <ul class="list-unstyled mb-0" id="cvrLegalUpdateList"></ul>
          </div>
          <div class="modal-footer border-0 pt-0 pb-4 px-4 justify-content-center">
            <button type="button" class="btn btn-brand px-4" data-bs-dismiss="modal">Got it</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap.firstElementChild);
}

function initLegalUpdateNotice() {
  if (cvrLegalNoticeChecked) return;
  cvrLegalNoticeChecked = true;

  (async () => {
    const { body } = await cvrApiGet("content/legal-updates");
    if (!body?.success) return;
    const documents = body.data?.documents || [];
    if (!documents.length) return;

    const current = {};
    documents.forEach((d) => { current[d.type] = d.version; });

    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem(CVR_LEGAL_SEEN_KEY) || "null");
    } catch { stored = null; }

    if (!stored) {

      try { localStorage.setItem(CVR_LEGAL_SEEN_KEY, JSON.stringify(current)); } catch {  }
      return;
    }

    const changed = documents.filter((d) => stored[d.type] !== d.version);
    if (!changed.length) return;

    try { localStorage.setItem(CVR_LEGAL_SEEN_KEY, JSON.stringify(current)); } catch {  }

    const linkFor = (type) => (type === "privacy" ? pageUrl("privacy.html") : pageUrl(`terms.html?type=${type}`));
    const fmtDate = (raw) => {
      const d = new Date(String(raw || "").replace(" ", "T"));
      return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
    };

    const session = getCustomerSession();
    if (session && !isStaffSession(session)) {
      if (document.getElementById("navBellList")) renderNavNotifBell();
      if (document.getElementById("dashNotificationsList") && typeof refreshDashboardNotifications === "function") {
        refreshDashboardNotifications();
      }
    }

    ensureCvrLegalUpdateModal();
    const modalEl = document.getElementById("cvrLegalUpdateModal");

    modalEl.querySelector("p.text-muted-brand").innerHTML = changed.length === 1
      ? "The following document changed since you last visited. Please take a moment to review it."
      : "The following documents changed since you last visited. Please take a moment to review them.";

    modalEl.querySelector("#cvrLegalUpdateList").innerHTML = changed
      .map((d) => `
        <li class="d-flex align-items-center justify-content-between gap-3 py-2 border-bottom border-light-subtle">
          <div>
            <div class="fw-semibold text-brand">${escapeHtml(d.label)}</div>
            <div class="small text-muted-brand">Version ${escapeHtml(d.version)} &middot; Updated ${escapeHtml(fmtDate(d.updatedAt))}</div>
          </div>
          <a class="btn btn-outline-secondary btn-sm" href="${linkFor(d.type)}">Review</a>
        </li>
      `)
      .join("");

    if (window.bootstrap?.Modal) {
      bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
  })();
}

function renderFooter() {
  const footer = document.getElementById("site-footer");
  if (!footer) return;

  const smart = getSmartNavUrls();

  footer.innerHTML = `
    <footer class="footer-main">
      <div class="container section-pad pb-4">
        <div class="footer-top-grid">
          <div class="footer-brand-col">
            <div class="footer-brand-stack">
              <img src="${assetUrl("images/logo.png")}" alt="" width="44" height="44" class="footer-brand-logo brand-logo rounded-3 p-1" />
              <div class="footer-brand-heading">
                <h5 class="mb-0 text-brand" data-site-text-key="footer_copyright_name">Casa Vergara Resort</h5>
                <small class="text-uppercase text-muted-brand d-block footer-brand-kicker">Luxury Resort</small>
              </div>
              <p class="text-muted-brand mb-0 footer-brand-text" data-site-text-key="footer_tagline">Experience luxury and tranquility at our exclusive pool resort. Where every moment becomes a cherished memory.</p>
              <div class="footer-brand-social d-flex gap-2 flex-wrap">
                <a href="https://www.facebook.com/profile.php?id=100064171831065" class="footer-social" aria-label="Facebook" id="footerFacebookLink"><i class="bi bi-facebook"></i></a>
                <a href="mailto:starboxresortandhotel@yahoo.com" class="footer-social" aria-label="Email" id="footerEmailLink1">
                <i class="bi bi-envelope-fill"></i>
                </a>
                <a href="tel:+639703236544" class="footer-social" aria-label="Contact Number" id="footerPhoneLink1">
                <i class="bi bi-telephone-fill"></i>
                </a>
              </div>
            </div>
          </div>
          <div class="footer-links-col">
            <h6 class="footer-title">Quick Links</h6>
            <ul class="list-unstyled small mb-0 footer-link-list">
              <li><a href="${pageUrl("landing.html")}" class="footer-link"><i class="bi bi-chevron-right" aria-hidden="true"></i><span>Home</span></a></li>
              <li><a href="${pageUrl("booking.html")}" class="footer-link"><i class="bi bi-chevron-right" aria-hidden="true"></i><span>Rooms and Events</span></a></li>
              <li><a href="${pageUrl("about.html")}" class="footer-link"><i class="bi bi-chevron-right" aria-hidden="true"></i><span>About Us</span></a></li>
              <li><a href="${pageUrl("contact.html")}" class="footer-link"><i class="bi bi-chevron-right" aria-hidden="true"></i><span>Contact</span></a></li>
              <li><a href="${smart.myBookings}" class="footer-link"><i class="bi bi-chevron-right" aria-hidden="true"></i><span>My Bookings</span></a></li>
            </ul>
          </div>
          <div class="footer-contact-col">
            <h6 class="footer-title">Contact</h6>
            <ul class="list-unstyled small mb-0 footer-contact-list text-muted-brand">
              <li class="footer-contact-line is-multiline"><i class="bi bi-geo-alt" aria-hidden="true"></i><span data-site-text-key="footer_address">Purok 3, Barangay Langkiwa, Biñan, Laguna</span></li>
              <li class="footer-contact-line"><i class="bi bi-telephone" aria-hidden="true"></i><a href="tel:+639703236544" id="footerPhoneLink2" data-site-text-key="footer_phone">0970 323 6544</a></li>
              <li class="footer-contact-line is-multiline"><i class="bi bi-envelope" aria-hidden="true"></i><a href="mailto:starboxresortandhotel@yahoo.com" id="footerEmailLink2" data-site-text-key="footer_email">starboxresortandhotel@yahoo.com</a></li>
              <li class="footer-contact-line"><i class="bi bi-chat-dots" aria-hidden="true"></i><span data-site-text-key="footer_hours">We will respond as soon as available</span></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="footer-bottom py-3">
        <div class="container footer-bottom-inner">
          <small>© <span id="year"></span> <span data-site-text-key="footer_copyright_name">Casa Vergara Resort</span>. All rights reserved.</small>
          <div class="footer-bottom-right">
            <div class="small footer-bottom-links">
              <a href="${pageUrl("privacy.html")}" class="text-decoration-none">Privacy Policy</a>
              <a href="${pageUrl("terms.html")}" class="text-decoration-none">Terms of Service</a>
              <a href="${pageUrl("user-manual.html")}" class="text-decoration-none">User Manual</a>
              <a href="${pageUrl("sitemap.html")}" class="text-decoration-none">Sitemap</a>
            </div>
            <button type="button" class="footer-back-to-top" id="footerBackToTop" title="Back to top" aria-label="Back to top">
              <i class="bi bi-arrow-up" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    </footer>
  `;

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  document.getElementById("footerBackToTop")?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  initLegalUpdateNotice();
  applySiteText();
  bootLiveChatWidget();
}

function bootLiveChatWidget() {
  if (location.pathname.includes("/pages/admin/")) return;
  if (document.querySelector("script[data-cvr-live-chat]")) return;
  const script = document.createElement("script");
  script.src = `${assetUrl("js/live-chat.js")}?v=20261004f`;
  script.dataset.cvrLiveChat = "1";
  document.body.appendChild(script);
}

function renderAdminSidebar(active = "") {
  const allLinks = [
    ["dashboard", "Dashboard", "dashboard.html", "bi-speedometer2"],
    ["reservations", "Reservations", "reservations.html", "bi-people"],
    ["calendar", "Calendar", "calendar.html", "bi-calendar3"],
    ["payments", "Payment Verification", "payments.html", "bi-qr-code-scan"],
    ["live-chat", "Live Chat", "live-chat.html", "bi-chat-dots"],
    ["messages", "Contact Messages", "messages.html", "bi-envelope-paper"],
    ["reports", "Reports", "reports.html", "bi-file-earmark-bar-graph"],
    ["users", "Users", "users.html", "bi-person-badge"],
    ["site-content", "Site Content", "site-content.html", "bi-file-earmark-richtext"],
    ["settings", "Settings", "settings.html", "bi-gear"],
  ];

  const isFullAdmin = isFullAdminSession(getCustomerSession());
  const links = isFullAdmin ? allLinks : allLinks.filter(([id]) => !CVR_ADMIN_ONLY_SECTIONS.includes(id));

  document.body.classList.toggle("cvr-admin-staff", !isFullAdmin);
  document.body.classList.toggle("cvr-admin-full", isFullAdmin);

  const holder = document.getElementById("admin-sidebar");
  if (!holder) return;

  const extraSectionTitles = { notifications: "Notifications", contact: "Contact Clients", "live-chat": "Live Chat" };
  const activeLink = allLinks.find(([id]) => id === active);
  const sectionTitle = activeLink ? activeLink[1] : (extraSectionTitles[active] || "");

  const navRows = `
    <ul class="nav flex-column admin-drawer-nav">
      ${links.map(([id, label, href, icon], i) =>
        `<li class="nav-item cvr-sidebar-fade" style="animation-delay:${i * 0.03}s"><a class="nav-link px-3 py-2 ${id === "live-chat" ? "nav-link--bell position-relative" : ""} ${active===id?"active":""}" href="${href}"><i class="bi ${icon}"></i>${label}${id === "live-chat" ? `<span id="adminLiveChatBadge" class="badge rounded-pill text-bg-danger nav-bell-count nav-bell-count--inline d-none">0</span>` : ""}</a></li>`
      ).join("")}
    </ul>
    <div class="admin-drawer-utility">
      <span class="admin-drawer-utility-label">Account</span>
      <a class="nav-link nav-link--bell position-relative px-3 py-2 cvr-sidebar-fade ${active === "notifications" ? "active" : "text-muted-brand"}" style="animation-delay:${links.length * 0.03}s" href="notifications.html" id="adminNotifBellBtn">
        <i class="bi bi-bell"></i>Notifications
        <span id="adminNotifCountBadge" class="badge rounded-pill text-bg-danger nav-bell-count nav-bell-count--inline d-none">0</span>
      </a>
      <button type="button" class="nav-link px-3 py-2 text-muted-brand border-0 bg-transparent w-100 text-start cvr-sidebar-fade" style="animation-delay:${(links.length + 1) * 0.03}s" id="adminSwitchAccountBtn"><i class="bi bi-arrow-left-right"></i>Switch account</button>
      <button type="button" class="nav-link mt-1 px-3 py-2 text-muted-brand border-0 bg-transparent w-100 text-start cvr-sidebar-fade" style="animation-delay:${(links.length + 2) * 0.03}s" id="adminLogoutBtn"><i class="bi bi-box-arrow-right"></i>Logout</button>
    </div>
  `;

  holder.innerHTML = `
    <header class="admin-topbar">
      <div class="admin-topbar-inner">
        <a class="admin-topbar-brand" href="dashboard.html">
          <img src="${assetUrl("images/logo.png")}" class="brand-logo rounded-3 p-1" alt="Logo" />
          <span class="min-w-0">
            <strong class="text-brand d-block text-truncate brand-title">Casa Vergara Resort</strong>
            <span class="admin-role-pill ${isFullAdmin ? "" : "is-staff"}">${isFullAdmin ? "Admin Portal" : "Staff Portal"}</span>
          </span>
        </a>
        <span class="admin-topbar-divider" aria-hidden="true"></span>
        <span class="admin-topbar-section">
          <span class="admin-topbar-section-eyebrow">You're viewing</span>
          <span class="admin-topbar-section-title">${escapeHtml(sectionTitle || "Menu")}</span>
        </span>
        <div class="admin-topbar-actions">
          <button type="button" class="admin-icon-btn admin-nav-toggle" id="adminNavToggle" aria-label="Open menu" aria-expanded="false" aria-controls="adminNavDrawer" title="Menu">
            <i class="bi bi-list"></i>
            <span class="admin-nav-toggle-dot d-none" id="adminNavToggleDot"></span>
          </button>
          <a class="admin-icon-btn" href="${pageUrl("landing.html")}" title="View website" aria-label="View website">
            <i class="bi bi-house"></i>
          </a>
        </div>
      </div>
    </header>
    <div class="admin-drawer-backdrop" id="adminNavBackdrop" hidden></div>
    <aside class="admin-drawer" id="adminNavDrawer" aria-hidden="true">
      <div class="admin-drawer-head">
        <img src="${assetUrl("images/logo.png")}" alt="Casa Vergara" class="admin-drawer-logo" />
        <span>
          <span class="admin-drawer-title d-block">Menu</span>
          <span class="admin-drawer-subtitle">${isFullAdmin ? "Admin Portal" : "Staff Portal"}</span>
        </span>
        <button type="button" class="admin-icon-btn admin-icon-btn--sm" id="adminNavClose" aria-label="Close menu"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="admin-drawer-body">
        ${navRows}
      </div>
    </aside>
  `;

  const drawer = holder.querySelector("#adminNavDrawer");
  const backdrop = holder.querySelector("#adminNavBackdrop");
  const toggle = holder.querySelector("#adminNavToggle");

  const closeDrawer = () => {
    drawer?.classList.remove("is-open");
    backdrop?.classList.remove("is-open");
    if (backdrop) backdrop.hidden = true;
    drawer?.setAttribute("aria-hidden", "true");
    toggle?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("cvr-drawer-open");
  };
  const openDrawer = () => {
    drawer?.classList.add("is-open");
    if (backdrop) backdrop.hidden = false;
    requestAnimationFrame(() => backdrop?.classList.add("is-open"));
    drawer?.setAttribute("aria-hidden", "false");
    toggle?.setAttribute("aria-expanded", "true");
    document.body.classList.add("cvr-drawer-open");
    drawer?.querySelector(".nav-link")?.focus?.();
  };

  toggle?.addEventListener("click", () => {
    drawer?.classList.contains("is-open") ? closeDrawer() : openDrawer();
  });
  holder.querySelector("#adminNavClose")?.addEventListener("click", closeDrawer);
  backdrop?.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  holder.querySelector("#adminLogoutBtn")?.addEventListener("click", () => {
    closeDrawer();
    cvrConfirmLogout(pageUrl("login.html"));
  });
  holder.querySelector("#adminSwitchAccountBtn")?.addEventListener("click", () => {
    closeDrawer();
    openCvrSwitchAccountModal();
  });

  initAdminNotifBell();
  initAdminLiveChatPresence();
}

function initAdminLiveChatPresence() {
  const ping = () => {
    cvrApiPost("chat/heartbeat", {}).catch(() => {});
  };
  const refreshUnread = async () => {
    try {
      const { body } = await cvrApiGet("chat/unread");
      const n = body?.success ? Number(body.data?.unreadCount || 0) : 0;
      const badge = document.getElementById("adminLiveChatBadge");
      if (!badge) return;
      if (n > 0) {
        badge.textContent = n > 9 ? "9+" : String(n);
        badge.classList.remove("d-none");
      } else {
        badge.classList.add("d-none");
      }
    } catch {
      
    }
  };

  ping();
  refreshUnread();
  if (!window.__cvrAdminChatPresenceBound) {
    window.__cvrAdminChatPresenceBound = true;
    setInterval(() => {
      if (!document.hidden) {
        ping();
        refreshUnread();
      }
    }, 15000);
  }
}

let cvrAdminNotifItems = [];
let cvrAdminNotifSeenIds = null;

function cvrLoadSeenAdminNotifIds() {
  if (cvrAdminNotifSeenIds) return cvrAdminNotifSeenIds;
  try {
    cvrAdminNotifSeenIds = new Set(JSON.parse(sessionStorage.getItem("cvrAdminNotifSeenIds") || "[]"));
  } catch {
    cvrAdminNotifSeenIds = new Set();
  }
  return cvrAdminNotifSeenIds;
}
function cvrSaveSeenAdminNotifIds() {
  try {
    sessionStorage.setItem("cvrAdminNotifSeenIds", JSON.stringify(Array.from(cvrAdminNotifSeenIds || [])));
  } catch {

  }
}

async function initAdminNotifBell() {
  const countBadge = document.getElementById("adminNotifCountBadge");
  if (!countBadge) return;

  const seenIds = cvrLoadSeenAdminNotifIds();
  const firstRun = seenIds.size === 0;

  const poll = async () => {
    try {
      const { body } = await cvrApiGet("content/my-notifications");
      cvrAdminNotifItems = body?.success ? body.data?.notifications || [] : [];
    } catch {
      cvrAdminNotifItems = [];
    }

    if (!firstRun) {
      cvrAdminNotifItems
        .filter((n) => !n.read && !seenIds.has(n.id))
        .forEach((n) => cvrToast(n.title ? `${n.title}: ${n.message}` : n.message, "info"));
    }
    cvrAdminNotifItems.forEach((n) => seenIds.add(n.id));
    cvrSaveSeenAdminNotifIds();

    const unread = cvrAdminNotifItems.filter((n) => !n.read);
    if (unread.length > 0) {
      countBadge.textContent = unread.length > 9 ? "9+" : String(unread.length);
      countBadge.classList.remove("d-none");
    } else {
      countBadge.classList.add("d-none");
    }

    const dot = document.getElementById("adminNavToggleDot");
    if (dot) dot.classList.toggle("d-none", unread.length === 0);
  };

  await poll();
  if (!window.__cvrAdminNotifPollBound) {
    window.__cvrAdminNotifPollBound = true;
    setInterval(() => {
      if (!document.hidden) poll();
    }, 45000);
  }
}

async function initAdminNotificationsPage() {
  const listEl = document.getElementById("adminNotifPageList");
  const markAllBtn = document.getElementById("adminNotifMarkAllBtn");
  if (!listEl) return;

  const render = () => {
    if (!cvrAdminNotifItems.length) {
      listEl.innerHTML = `<p class="small text-muted-brand mb-0">You're all caught up — nothing here yet.</p>`;
      return;
    }

    listEl.innerHTML = cvrAdminNotifItems
      .map(
        (item, idx) => `
      <div class="notif-item ${item.read ? "" : "notif-item--unread"}" data-notif-idx="${idx}">
        <button type="button" class="notif-item-main notif-item--clickable d-block w-100 text-start text-decoration-none border-0 bg-transparent p-0" data-notif-idx="${idx}">
          <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
            <span class="small text-muted-brand"><i class="bi bi-envelope-paper me-1"></i>Notification</span>
            <div class="d-flex align-items-center gap-2">
              ${item.read ? "" : `<span class="badge rounded-pill text-bg-danger">New</span>`}
              <span class="small text-muted-brand">${escapeHtml(cvrTimeAgo(item.createdAt))}</span>
            </div>
          </div>
          <strong class="text-brand d-block mt-1 notif-item-title">${escapeHtml(item.title || "Notification")}</strong>
          ${item.message ? `<div class="text-muted-brand mt-1 notif-item-body">${escapeHtml(item.message)}</div>` : ""}
        </button>
        <div class="notif-item-actions d-flex align-items-center gap-3">
          <button type="button" class="btn btn-sm btn-link text-muted-brand text-decoration-none p-0 notif-item-toggle-read" data-notif-idx="${idx}">
            <i class="bi ${item.read ? "bi-envelope" : "bi-envelope-open"} me-1"></i>${item.read ? "Mark as unread" : "Mark as read"}
          </button>
          <button type="button" class="btn btn-sm btn-link text-danger text-decoration-none p-0 notif-item-delete" data-notif-idx="${idx}">
            <i class="bi bi-trash me-1"></i>Delete
          </button>
        </div>
      </div>`
      )
      .join("");

    listEl.querySelectorAll(".notif-item-main").forEach((el) => {
      el.addEventListener("click", async () => {
        const item = cvrAdminNotifItems[Number(el.dataset.notifIdx)];
        if (!item) return;
        if (!item.read) {
          item.read = true;
          cvrApiPost("content/notifications-mark-read", { id: item.id }).catch(() => {});
        }
        if (item.link) window.location.href = item.link;
        else render();
      });
    });

    listEl.querySelectorAll(".notif-item-toggle-read").forEach((el) => {
      el.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        const item = cvrAdminNotifItems[Number(el.dataset.notifIdx)];
        if (!item || el.disabled) return;
        el.disabled = true;
        item.read = !item.read;
        await cvrApiPost(item.read ? "content/notifications-mark-read" : "content/notifications-mark-unread", { id: item.id }).catch(() => {});
        render();
      });
    });

    listEl.querySelectorAll(".notif-item-delete").forEach((el) => {
      el.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        const idx = Number(el.dataset.notifIdx);
        const item = cvrAdminNotifItems[idx];
        if (!item || el.disabled) return;
        el.disabled = true;
        await cvrApiPost("content/notifications-delete", { id: item.id }).catch(() => {});
        cvrAdminNotifItems.splice(idx, 1);
        cvrToast("Notification deleted.", "info");
        render();
      });
    });
  };

  try {
    const { body } = await cvrApiGet("content/my-notifications");
    cvrAdminNotifItems = body?.success ? body.data?.notifications || [] : [];
  } catch {
    cvrAdminNotifItems = [];
  }

  render();

  const unreadIds = cvrAdminNotifItems.filter((n) => !n.read).map((n) => n.id);
  if (unreadIds.length) {
    cvrAdminNotifItems = cvrAdminNotifItems.map((n) => ({ ...n, read: true }));
    render();
    unreadIds.forEach((id) => {
      cvrApiPost("content/notifications-mark-read", { id }).catch(() => {});
    });
  }

  markAllBtn?.addEventListener("click", async () => {
    const stillUnread = cvrAdminNotifItems.filter((n) => !n.read).map((n) => n.id);
    if (!stillUnread.length) return;
    cvrAdminNotifItems = cvrAdminNotifItems.map((n) => ({ ...n, read: true }));
    render();
    stillUnread.forEach((id) => {
      cvrApiPost("content/notifications-mark-read", { id }).catch(() => {});
    });
  });
}

function applyStaffDashboardRestrictions() {

}

function initNavbarScrollEffect() {
  const navbar = document.getElementById("mainSiteNavbar");
  const header = document.getElementById("siteHeader");
  if (!navbar || !header) return;
  const update = () => {
    const scrolled = window.scrollY > 8;
    navbar.classList.toggle("is-scrolled", scrolled);
    header.classList.toggle("is-scrolled", scrolled);
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
}

function initHeaderOffset() {
  const header = document.getElementById("siteHeader");
  const spacer = document.getElementById("siteHeaderSpacer");
  if (!header || !spacer) return;

  const syncHeight = () => {
    spacer.style.height = `${header.offsetHeight}px`;
  };

  syncHeight();
  window.addEventListener("resize", syncHeight);

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(syncHeight);
    observer.observe(header);
  }
}

function initAutoCloseMobileNav() {
  const nav = document.getElementById("mainNav");
  if (!nav || !window.bootstrap) return;
  const collapse = bootstrap.Collapse.getOrCreateInstance(nav, { toggle: false });
  const links = nav.querySelectorAll("a.nav-link, .btn");
  links.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 992) collapse.hide();
    });
  });
}

function initMobileNavState() {
  const nav = document.getElementById("mainNav");
  const header = document.getElementById("siteHeader");
  if (!nav || !header) return;

  nav.addEventListener("show.bs.collapse", () => {
    header.classList.add("is-nav-open");
  });

  nav.addEventListener("hide.bs.collapse", () => {
    header.classList.remove("is-nav-open");
  });
}

function initInteractiveOptions() {
  const methodButtons = Array.from(document.querySelectorAll(".soft-card .btn-outline-primary"));
  if (methodButtons.length < 2) return;
  methodButtons.forEach((button) => {
    button.addEventListener("click", () => {
      methodButtons.forEach((other) => {
        other.classList.remove("active");
        other.classList.add("btn-outline-primary");
      });
      button.classList.add("active");
      button.classList.remove("btn-outline-primary");
    });
  });
}

function getStoredReservations() {
  try {
    return JSON.parse(localStorage.getItem("cvrReservations") || "[]");
  } catch {
    return [];
  }
}
window.getStoredReservations = getStoredReservations;

function cvrReconcileStatuses(reservationStatus, paymentStatus) {
  const payLower = String(paymentStatus || "").toLowerCase();
  const resLower = String(reservationStatus || "").toLowerCase();

  let pay;
  if (!payLower) pay = "Pending Payment";
  else if (/approv|verified|paid/.test(payLower)) pay = "Approved";
  else if (/reject|declin/.test(payLower)) pay = "Rejected";
  else if (/waiting|verification/.test(payLower)) pay = "Waiting for Verification";
  else if (/pending/.test(payLower)) pay = "Pending Payment";
  else pay = String(paymentStatus);

  const terminal = /cancel|checked out|completed/.test(resLower);
  const staffProgress = pay === "Approved" && /awaiting check-in|checked in/.test(resLower);
  let res = String(reservationStatus || "");
  if (!terminal && !staffProgress) {
    if (pay === "Approved") res = "Confirmed";
    else if (pay === "Rejected") res = "Payment Rejected";
    else if (pay === "Waiting for Verification") res = "Pending Verification";
    else res = "Pending Payment";
  }
  return { reservationStatus: res, paymentStatus: pay };
}
window.cvrReconcileStatuses = cvrReconcileStatuses;

function saveStoredReservations(records) {
  const normalized = (Array.isArray(records) ? records : []).map((record) => {
    if (!record || typeof record !== "object") return record;
    const next = cvrReconcileStatuses(record.reservationStatus, record.paymentStatus);
    record.reservationStatus = next.reservationStatus;
    record.paymentStatus = next.paymentStatus;
    return record;
  });
  localStorage.setItem("cvrReservations", JSON.stringify(normalized));
}
window.saveStoredReservations = saveStoredReservations;

let __cvrReservationsSyncInFlight = null;
async function cvrSyncReservationsFromServer() {
  if (typeof window.cvrApiGet !== "function") return;
  if (__cvrReservationsSyncInFlight) return __cvrReservationsSyncInFlight;
  __cvrReservationsSyncInFlight = (async () => {
    try {
      const { body } = await window.cvrApiGet("admin/reservations-list");
      const serverList = body && body.success && body.data && Array.isArray(body.data.reservations)
        ? body.data.reservations
        : null;
      if (!serverList) return;
      const local = getStoredReservations();
      const byId = new Map(local.map((r) => [r.id, r]));
      serverList.forEach((r) => {
        if (r && r.id) byId.set(r.id, r);
      });
      saveStoredReservations(Array.from(byId.values()));
      document.dispatchEvent(new CustomEvent("cvr-reservations-synced"));
    } catch (e) {
      console.warn("Could not refresh reservations from the server:", e);
    } finally {
      __cvrReservationsSyncInFlight = null;
    }
  })();
  return __cvrReservationsSyncInFlight;
}
window.cvrSyncReservationsFromServer = cvrSyncReservationsFromServer;

function getStoredNotifications() {
  try {
    return JSON.parse(localStorage.getItem("cvrNotifications") || "[]");
  } catch {
    return [];
  }
}
window.getStoredNotifications = getStoredNotifications;

function saveStoredNotifications(records) {
  localStorage.setItem("cvrNotifications", JSON.stringify(records));
}

function pushCvrNotification(email, { title, body, link } = {}) {
  const normalizedEmail = (email || "").toLowerCase().trim();
  if (!normalizedEmail || !title) return;
  const all = getStoredNotifications();
  all.unshift({
    id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    email: normalizedEmail,
    title,
    body: body || "",
    link: link || "",
    createdAt: new Date().toISOString(),
    read: false,
  });

  saveStoredNotifications(all.slice(0, 200));
}
window.pushCvrNotification = pushCvrNotification;

function getCvrNotificationsForEmail(email) {
  const normalizedEmail = (email || "").toLowerCase().trim();
  if (!normalizedEmail) return [];
  return getStoredNotifications()
    .filter((n) => n.email === normalizedEmail)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function markCvrNotificationRead(id) {
  const all = getStoredNotifications();
  const target = all.find((n) => n.id === id);
  if (target) target.read = true;
  saveStoredNotifications(all);
}

function markCvrNotificationUnread(id) {
  const all = getStoredNotifications();
  const target = all.find((n) => n.id === id);
  if (target) target.read = false;
  saveStoredNotifications(all);
}

function deleteCvrNotification(id) {
  saveStoredNotifications(getStoredNotifications().filter((n) => n.id !== id));
}

function getStoredReceipts() {
  try {
    return JSON.parse(localStorage.getItem("cvrReceipts") || "[]");
  } catch {
    return [];
  }
}

function saveStoredReceipts(records) {
  localStorage.setItem("cvrReceipts", JSON.stringify(records));
}

function createReceiptId() {
  return `RCPT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
}

function getReceiptByReservationId(reservationId) {
  const receipts = getStoredReceipts();
  return receipts.find((item) => item.reservation_id === reservationId) || null;
}

function createOrUpdateReceiptRecord(reservation, paymentId = "") {
  if (!reservation?.id) return null;
  const receipts = getStoredReceipts();
  const idx = receipts.findIndex((item) => item.reservation_id === reservation.id);

  const nowIso = new Date().toISOString();
  const existing = idx >= 0 ? receipts[idx] : null;
  const receipt = {
    receipt_id: existing?.receipt_id || createReceiptId(),
    reservation_id: reservation.id,
    payment_id: paymentId || existing?.payment_id || reservation.proofOfPayment?.storageRef || reservation.proofOfPayment?.filename || "",
    generated_at: nowIso,
    guest_name: reservation.customerName || "Guest",
    room_or_event_name: reservation.roomName || reservation.eventType || "Room Reservation",
    check_in_date: reservation.checkIn || reservation.checkInDate || "",
    check_out_date: reservation.checkOut || reservation.checkOutDate || "",
    check_out_time: reservation.checkOutLabel || reservation.checkOutTime || "",
    event_date: reservation.preferredDate || "",
    number_of_guests: reservation.guestsLabel || reservation.guests || reservation.eventGuests || "2",
    total_amount_paid: reservation.totalAmount || "",
    payment_method: reservation.paymentMethod || "QR / GCash",
    payment_date: reservation.paymentApprovedAt || reservation.paymentVerifiedAt || reservation.proofOfPayment?.uploadedAt || nowIso,
    payment_status: "Paid",
  };

  if (idx >= 0) receipts[idx] = receipt;
  else receipts.unshift(receipt);
  saveStoredReceipts(receipts);
  return receipt;
}

function canCurrentUserDownloadReceipt(reservation) {
  if (!reservation?.id) return false;
  const activeReservationId = localStorage.getItem("cvrActiveReservationId");
  const ownerSession = localStorage.getItem("cvrOwnerSessionKey");
  const ownerMatches = reservation.ownerSessionKey ? ownerSession === reservation.ownerSessionKey : true;
  return activeReservationId === reservation.id && ownerMatches;
}

let cachedReceiptLogoDataUrl = null;

async function loadReceiptLogoDataUrl() {
  if (cachedReceiptLogoDataUrl) return cachedReceiptLogoDataUrl;
  try {
    const res = await fetch(assetUrl("images/logo.png"));
    const blob = await res.blob();
    cachedReceiptLogoDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("logo read failed"));
      reader.readAsDataURL(blob);
    });
    return cachedReceiptLogoDataUrl;
  } catch {
    return null;
  }
}

function pdfSafeAmount(rawAmount) {
  const value = String(rawAmount || "-").trim();
  return value.replace(/^\u20b1\s*/, "PHP ");
}

async function downloadReceiptPdf(receipt) {
  const jsPdfLib = window.jspdf?.jsPDF;
  if (!jsPdfLib || !receipt) {
    window.alert("Receipt generator is unavailable right now.");
    return;
  }

  const doc = new jsPdfLib({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 54;
  const right = pageWidth - 54;
  const contentWidth = right - left;

  const primary = [12, 59, 93];
  const accent = [217, 179, 18];
  const textDark = [36, 47, 56];
  const textMuted = [90, 104, 120];
  const border = [230, 237, 243];
  const bgLight = [248, 249, 250];
  const success = [40, 128, 87];

  const logoDataUrl = await loadReceiptLogoDataUrl();

  const headerHeight = 118;
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, headerHeight, "F");
  doc.setFillColor(...accent);
  doc.rect(0, headerHeight, pageWidth, 4, "F");

  const logoBoxSize = 56;
  const logoBoxY = 30;
  if (logoDataUrl) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(left, logoBoxY, logoBoxSize, logoBoxSize, 8, 8, "F");
    const pad = 6;
    try {
      doc.addImage(logoDataUrl, "PNG", left + pad, logoBoxY + pad, logoBoxSize - pad * 2, logoBoxSize - pad * 2);
    } catch {

    }
  }

  const brandTextX = logoDataUrl ? left + logoBoxSize + 16 : left;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("Casa Vergara Resort", brandTextX, logoBoxY + 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(214, 227, 240);
  doc.text("Purok 3, Barangay Langkiwa, Bi\u00f1an, Laguna", brandTextX, logoBoxY + 38);
  doc.text("0970 323 6544  \u2022  starboxresortandhotel@yahoo.com", brandTextX, logoBoxY + 52);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("OFFICIAL RECEIPT", right, logoBoxY + 22, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(214, 227, 240);
  doc.text("Proof of verified payment", right, logoBoxY + 37, { align: "right" });

  let y = headerHeight + 42;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(...primary);
  doc.text(`Receipt No. ${receipt.receipt_id}`, left, y);

  const badgeText = (receipt.payment_status || "Paid").toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  const badgeWidth = doc.getTextWidth(badgeText) + 24;
  const badgeHeight = 20;
  const badgeX = right - badgeWidth;
  const badgeY = y - 15;
  doc.setFillColor(...success);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 10, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(badgeText, badgeX + badgeWidth / 2, badgeY + 13.5, { align: "center" });

  y += 12;
  doc.setDrawColor(...border);
  doc.setLineWidth(1);
  doc.line(left, y, right, y);
  y += 30;

  const rows = [
    ["Reservation Number", receipt.reservation_id],
    ["Guest Name", receipt.guest_name],
    ["Room / Event", receipt.room_or_event_name],
    ["Check-in Date", receipt.check_in_date || "-"],
    ["Check-out Date", (receipt.check_out_date || receipt.event_date || "-") + (receipt.check_out_time ? ` at ${receipt.check_out_time}` : "")],
    ["Number of Guests", String(receipt.number_of_guests || "-")],
    ["Payment Method", receipt.payment_method || "QR / GCash"],
    ["Payment Date", formatDateReserved(receipt.payment_date)],
  ];

  const rowHeight = 26;
  doc.setFontSize(10.5);
  rows.forEach(([label, value], idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(...bgLight);
      doc.rect(left, y - 16, contentWidth, rowHeight, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textMuted);
    doc.text(label, left + 12, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textDark);
    doc.text(String(value || "-"), left + 210, y);
    y += rowHeight;
  });

  y += 24;

  const amountBoxHeight = 62;
  doc.setFillColor(...primary);
  doc.roundedRect(left, y, contentWidth, amountBoxHeight, 10, 10, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(214, 227, 240);
  doc.text("TOTAL AMOUNT PAID", left + 24, y + 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.setTextColor(255, 255, 255);
  doc.text(pdfSafeAmount(receipt.total_amount_paid), left + 24, y + 47);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...accent);
  doc.text("VERIFIED", right - 20, y + 35, { align: "right" });

  y += amountBoxHeight + 30;

  doc.setDrawColor(...border);
  doc.line(left, y, right, y);
  y += 20;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9.5);
  doc.setTextColor(...textMuted);
  doc.text("This is a system-generated receipt and serves as proof of verified payment.", left, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Casa Vergara Resort \u2022 Purok 3, Barangay Langkiwa, Bi\u00f1an, Laguna \u2022 0970 323 6544", left, y);

  const safeId = (receipt.reservation_id || "reservation").replace(/[^\w\-]/g, "_");
  doc.save(`CasaVergara-Receipt-${safeId}.pdf`);
}

function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateReserved(rawDate = "") {
  if (!rawDate) return new Date().toLocaleDateString();
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? rawDate : date.toLocaleDateString();
}

function formatMemberSince(rawDate = "") {
  if (!rawDate) return "—";
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return rawDate;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusChipClass(status = "") {
  const map = {
    "Pending Payment": "chip-yellow",
    Waiting: "chip-blue",
    "Waiting for Verification": "chip-blue",
    Approved: "chip-green",
    Verified: "chip-green",
    Rejected: "chip-red",
  };
  return map[status] || "chip-yellow";
}

function getReservationHeroContent(target) {
  const resLower = String(target.reservationStatus || "").toLowerCase();
  const isCancelled = resLower.includes("cancel");

  if (isCancelled) {
    return {
      icon: "bi-x-circle",
      title: "Booking Cancelled",
      subtitle: target.cancellationNote || "This reservation was cancelled.",
      gradient: "linear-gradient(135deg,#7a1f1f,#b23a3a)",
    };
  }
  if (target.checkedOutAt) {
    return {
      icon: "bi-check2-circle",
      title: "Stay Completed",
      subtitle: "Thanks for staying with us! We hope to welcome you back soon.",
      gradient: "linear-gradient(135deg,#0c3b5d,#328bc3)",
    };
  }
  if (resLower.includes("checked in")) {
    return {
      icon: "bi-door-open",
      title: "Checked In",
      subtitle: "Enjoy your stay! You can check out from this page when you're ready to leave.",
      gradient: "linear-gradient(135deg,#0c3b5d,#328bc3)",
    };
  }
  if (target.paymentStatus === "Approved" || target.paymentStatus === "Verified") {
    return {
      icon: "bi-calendar-check",
      title: "Reservation Confirmed",
      subtitle: "Your payment has been verified — we look forward to welcoming you!",
      gradient: "linear-gradient(135deg,#0d5c3f,#2fa876)",
    };
  }
  if (target.paymentStatus === "Rejected") {
    return {
      icon: "bi-x-octagon",
      title: "Payment Rejected",
      subtitle: "We couldn't verify your proof of payment. Please upload a valid receipt to continue.",
      gradient: "linear-gradient(135deg,#7a1f1f,#b23a3a)",
    };
  }
  if (target.paymentStatus === "Waiting for Verification") {
    return {
      icon: "bi-hourglass-split",
      title: "Reservation Submitted",
      subtitle: "Your payment proof is now queued for manual verification.",
      gradient: "linear-gradient(135deg,#0c3b5d,#328bc3)",
    };
  }

  return {
    icon: "bi-clock-history",
    title: "Awaiting Payment",
    subtitle: "Please complete your downpayment to secure this booking.",
    gradient: "linear-gradient(135deg,#0c3b5d,#328bc3)",
  };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

function roomStayOverlapsExisting(packageId, roomName, checkIn, checkOut, excludeReservationId, scheduledCheckIn, scheduledCheckOut) {
  if (typeof window.cvrRoomStayOverlapsExisting === "function") {
    return window.cvrRoomStayOverlapsExisting(packageId, roomName, checkIn, checkOut, excludeReservationId, scheduledCheckIn, scheduledCheckOut);
  }
  const dur = window.CVRDuration;
  const records = getStoredReservations();
  for (const r of records) {
    if (excludeReservationId && r.id === excludeReservationId) continue;
    if (r.bookingType && r.bookingType !== "room") continue;
    const st = String(r.reservationStatus || "").toLowerCase();
    if (st.includes("cancel")) continue;
    const match =
      (r.packageId && packageId && r.packageId === packageId) ||
      (roomName && r.roomName && r.roomName === roomName);
    if (!match) continue;
    if (!r.checkIn || !r.checkOut) continue;

    if (dur && scheduledCheckIn && scheduledCheckOut && r.scheduledCheckIn && r.scheduledCheckOut) {
      if (dur.windowsOverlap(scheduledCheckIn, scheduledCheckOut, r.scheduledCheckIn, r.scheduledCheckOut)) return true;
      continue;
    }

    if (checkIn < r.checkOut && checkOut > r.checkIn) return true;
  }
  return false;
}

function getBlockedDateSet() {
  try {
    const arr = JSON.parse(localStorage.getItem("cvrBlockedDates") || "[]");
    return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

function formatStayLength(nights) {
  const n = Number(nights) || 0;
  if (n < 1) return "Day use (same-day check-out)";
  return `${n} night${n !== 1 ? "s" : ""}`;
}

function nightsInRange(checkIn, checkOut) {
  const out = [];
  if (!checkIn || !checkOut) return out;
  const cur = new Date(`${checkIn}T12:00:00`);
  const end = new Date(`${checkOut}T12:00:00`);
  let guard = 0;
  while (cur < end && guard < 400) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
    guard += 1;
  }
  return out;
}

function stayHitsBlockedDate(checkIn, checkOut) {
  const blocked = getBlockedDateSet();
  if (!blocked.size) return false;

  if (checkIn && checkOut && checkIn === checkOut) return blocked.has(checkIn);
  return nightsInRange(checkIn, checkOut).some((ymd) => blocked.has(ymd));
}

function eventDateTaken(eventDate, excludeReservationId) {
  return getStoredReservations().some((r) => {
    if (excludeReservationId && r.id === excludeReservationId) return false;
    if (r.bookingType !== "event") return false;
    if (String(r.reservationStatus || "").toLowerCase().includes("cancel")) return false;
    return r.preferredDate === eventDate || r.checkIn === eventDate;
  });
}

function reservationAvailabilityError(reservation, excludeReservationId) {
  if (!reservation) return "";
  if (reservation.bookingType === "event") {
    const date = reservation.preferredDate || reservation.checkIn;
    if (!date) return "Please select an event date.";
    if (getBlockedDateSet().has(date)) return "That date is unavailable (blocked for maintenance). Please choose another date.";
    if (eventDateTaken(date, excludeReservationId)) {
      return "Sorry, that event date was just booked. Please pick another date.";
    }
    return "";
  }
  const { checkIn, checkOut } = reservation;
  if (!checkIn || !checkOut || checkOut < checkIn) return "Check-out cannot be before check-in.";
  if (stayHitsBlockedDate(checkIn, checkOut)) {
    return "Those dates include an unavailable (blocked) date. Please choose another range.";
  }
  if (roomStayOverlapsExisting(reservation.packageId, reservation.roomName, checkIn, checkOut, excludeReservationId, reservation.scheduledCheckIn, reservation.scheduledCheckOut)) {
    return "Sorry, that fixed time slot was just booked for this room. Please choose a different date or duration.";
  }
  return "";
}

function getReservationById(id) {
  if (!id) return null;
  return getStoredReservations().find((r) => r.id === id) || null;
}

function canClientModifyReservation(record) {
  if (!record) return false;
  const pay = String(record.paymentStatus || "");
  if (["Approved", "Verified"].includes(pay)) return false;
  const st = String(record.reservationStatus || "").toLowerCase();
  if (st.includes("cancel")) return false;
  return true;
}

function isReservationCheckoutEligible(record) {
  if (!record || record.bookingType !== "room") return false;
  const status = String(record.reservationStatus || "").toLowerCase();
  if (status.includes("cancel") || status.includes("checked out")) return false;
  if (record.checkedOutAt) return false;

  return true;
}
window.isReservationCheckoutEligible = isReservationCheckoutEligible;

function performGuestCheckout(id) {
  const records = getStoredReservations();
  const target = records.find((r) => r.id === id);
  if (!target || !isReservationCheckoutEligible(target)) return null;

  const now = new Date();
  target.reservationStatus = "Checked Out";
  target.checkedOutAt = now.toISOString();

  const dur = window.CVRDuration;
  if (dur && target.scheduledCheckOut) {
    const overtimeHours = dur.overtimeHours(target.scheduledCheckOut, target.checkedOutAt);
    const penaltyAmount = dur.overtimePenalty(target.totalNumeric, overtimeHours);
    target.overtimeHours = overtimeHours;
    target.penaltyAmount = penaltyAmount;
    if (penaltyAmount > 0) {
      target.penaltyNote = `Checked out ${overtimeHours} hour${overtimeHours !== 1 ? "s" : ""} past the fixed check-out time (${target.checkOutLabel || ""}). Overtime penalty: ${window.CVRBookingCatalog?.formatMoney?.(penaltyAmount, target.currency) || penaltyAmount}.`;
    }
  }

  saveStoredReservations(records);
  syncReservationToServer(target, true);
  pushCvrNotification(target.email, {
    title: "You're checked out",
    body: target.penaltyAmount
      ? `You're checked out of ${target.roomName || "your room"} (${target.id}). An overtime penalty of ${window.CVRBookingCatalog?.formatMoney?.(target.penaltyAmount, target.currency) || target.penaltyAmount} applies for checking out past your fixed check-out time.`
      : `Thanks for staying with us! You're checked out of ${target.roomName || "your room"} (${target.id}).`,
    link: `reservation-status.html?id=${encodeURIComponent(target.id)}`,
  });
  return target;
}
window.performGuestCheckout = performGuestCheckout;

function getLiveOvertimeStatus(record) {
  const dur = window.CVRDuration;
  if (!dur || !record?.scheduledCheckOut) return { overtimeHours: 0, penaltyAmount: 0, isLate: false };
  return dur.liveOvertimeStatus(record.scheduledCheckOut, record.totalNumeric);
}
window.getLiveOvertimeStatus = getLiveOvertimeStatus;

function handleGuestCheckout(id) {
  const target = getReservationById(id);
  if (!target || !isReservationCheckoutEligible(target)) return null;
  const live = getLiveOvertimeStatus(target);
  const cat = window.CVRBookingCatalog;
  const penaltyWarning = live.isLate
    ? `\n\nYou are ${live.overtimeHours} hour${live.overtimeHours !== 1 ? "s" : ""} past your fixed check-out time (${target.checkOutLabel || ""}). An overtime penalty of ${cat?.formatMoney?.(live.penaltyAmount, target.currency) || live.penaltyAmount} will be applied.`
    : "";
  const confirmed = window.confirm(
    `Check out now from ${target.roomName || "your room"}? Your fixed check-out time is ${target.checkOutLabel || formatDateReserved(target.checkOut)}.${penaltyWarning}`
  );
  if (!confirmed) return null;
  return performGuestCheckout(id);
}
window.handleGuestCheckout = handleGuestCheckout;

function promptPostCheckoutReview(record) {
  if (!record || !record.id) return;

  const go = () => {
    window.location.href = `${pageUrl("landing.html")}?review=${encodeURIComponent(record.id)}#reviews`;
  };

  let modalEl = document.getElementById("cvrPostCheckoutReviewModal");
  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "cvrPostCheckoutReviewModal";
    modalEl.className = "modal fade";
    modalEl.tabIndex = -1;
    modalEl.setAttribute("aria-hidden", "true");
    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content cvr-logout-modal-content">
          <div class="modal-body text-center pt-4 pb-3 px-4">
            <div class="cvr-logout-modal-icon mb-3"><i class="bi bi-chat-square-heart"></i></div>
            <h5 class="mb-2">Thanks for staying with us!</h5>
            <p class="small text-muted-brand mb-0" id="cvrPostCheckoutReviewText">Would you like to leave a review?</p>
          </div>
          <div class="modal-footer justify-content-center border-0 pb-4">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Maybe later</button>
            <button type="button" class="btn btn-brand" id="cvrPostCheckoutReviewBtn">Write a review</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modalEl);
  }

  const text = document.getElementById("cvrPostCheckoutReviewText");
  if (text) text.textContent = `Would you like to leave a review for your stay at ${record.roomName || "your room"}?`;

  if (!window.bootstrap) {
    if (window.confirm(`Thanks for staying at ${record.roomName || "your room"}! Leave a review now?`)) go();
    return;
  }

  const reviewModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  const oldBtn = document.getElementById("cvrPostCheckoutReviewBtn");
  const btn = oldBtn.cloneNode(true);
  oldBtn.replaceWith(btn);
  btn.addEventListener("click", go);
  reviewModal.show();
}
window.promptPostCheckoutReview = promptPostCheckoutReview;

function isReservationCancelEligible(record) {
  if (!record) return false;
  const status = String(record.reservationStatus || "").toLowerCase();
  if (status.includes("cancel") || status.includes("checked out")) return false;
  if (record.checkedOutAt) return false;
  return true;
}
window.isReservationCancelEligible = isReservationCancelEligible;

function reservationHasForfeitableDownpayment(record) {
  if (!record) return false;
  if (record.proofOfPayment) return true;
  return ["Waiting for Verification", "Approved", "Verified"].includes(record.paymentStatus);
}
window.reservationHasForfeitableDownpayment = reservationHasForfeitableDownpayment;

function performGuestCancel(id, reason) {
  const records = getStoredReservations();
  const target = records.find((r) => r.id === id);
  if (!target || !isReservationCancelEligible(target)) return null;

  const forfeited = reservationHasForfeitableDownpayment(target);
  const cat = window.CVRBookingCatalog;
  const dpAmount = target.downpaymentAmount ?? target.quotation?.downpaymentAmount ?? null;
  const dpFormatted = dpAmount != null ? (cat ? cat.formatMoney(dpAmount, target.currency) : String(dpAmount)) : null;

  target.reservationStatus = "Cancelled";
  target.cancelledAt = new Date().toISOString();
  target.cancellationReason = (reason || "").trim() || null;
  target.downpaymentForfeited = forfeited;
  target.cancellationNote = forfeited
    ? `Cancelled by guest. Downpayment${dpFormatted ? ` (${dpFormatted})` : ""} is non-refundable and was forfeited per resort policy.`
    : "Cancelled by guest. No downpayment had been submitted.";

  saveStoredReservations(records);
  syncReservationToServer(target, true);
  pushCvrNotification(target.email, {
    title: "Booking cancelled",
    body: forfeited
      ? `Your reservation ${target.id} has been cancelled. As per our policy, the downpayment${dpFormatted ? ` (${dpFormatted})` : ""} is non-refundable and will not be returned.`
      : `Your reservation ${target.id} has been cancelled.`,
    link: `reservation-status.html?id=${encodeURIComponent(target.id)}`,
  });

  if (typeof cvrToast === "function") {
    cvrToast(
      forfeited
        ? `Reservation ${target.id} cancelled. Your downpayment is non-refundable and was forfeited.`
        : `Reservation ${target.id} cancelled.`,
      "success"
    );
  }
  return target;
}
window.performGuestCancel = performGuestCancel;

function handleGuestCancel(id) {
  const target = getReservationById(id);
  if (!target || !isReservationCancelEligible(target)) return null;
  const forfeited = reservationHasForfeitableDownpayment(target);
  const warning = forfeited
    ? "\n\nYour downpayment is NON-REFUNDABLE and will be forfeited if you cancel."
    : "";
  const confirmed = window.confirm(`Cancel reservation ${target.id}?${warning}`);
  if (!confirmed) return null;
  return performGuestCancel(id);
}
window.handleGuestCancel = handleGuestCancel;

function getSitePathContext() {
  const path = window.location.pathname.replace(/\\/g, "/").toLowerCase();
  if (path.includes("/pages/admin/")) {
    return { area: "admin", pagesPrefix: "../", assetPrefix: "../../" };
  }
  if (path.includes("/pages/")) {
    return { area: "customer", pagesPrefix: "", assetPrefix: "../" };
  }
  return { area: "root", pagesPrefix: "pages/", assetPrefix: "" };
}

function pageUrl(relativePage) {
  const ctx = getSitePathContext();
  if (ctx.area === "admin") return `../${relativePage}`;
  return `${ctx.pagesPrefix}${relativePage}`;
}

function assetUrl(relativeAsset) {
  return `${getSitePathContext().assetPrefix}${relativeAsset}`;
}

function applySiteImages() {
  const nodes = document.querySelectorAll("[data-site-image-slot]");
  if (!nodes.length) return;
  cvrApiGet("content/site-images")
    .then(({ body }) => {
      const images = body?.data?.images;
      if (!body?.success || !images) return;
      nodes.forEach((img) => {
        const url = images[img.dataset.siteImageSlot];
        if (url) img.src = url;
      });
    })
    .catch(() => {  });
}

function applySiteText() {
  const nodes = document.querySelectorAll("[data-site-text-key]");
  if (!nodes.length) return;
  cvrApiGet("content/site-text")
    .then(({ body }) => {
      const text = body?.data?.text;
      if (!body?.success || !text) return;
      nodes.forEach((el) => {
        const value = text[el.dataset.siteTextKey];
        if (value) el.textContent = value;
      });

      const fbUrl = text.footer_facebook_url;
      if (fbUrl) document.getElementById("footerFacebookLink")?.setAttribute("href", fbUrl);
      const phone = text.footer_phone;
      if (phone) {
        const telHref = `tel:${phone.replace(/[^0-9+]/g, "")}`;
        document.getElementById("footerPhoneLink1")?.setAttribute("href", telHref);
        document.getElementById("footerPhoneLink2")?.setAttribute("href", telHref);
      }
      const email = text.footer_email;
      if (email) {
        document.getElementById("footerEmailLink1")?.setAttribute("href", `mailto:${email}`);
        document.getElementById("footerEmailLink2")?.setAttribute("href", `mailto:${email}`);
      }
    })
    .catch(() => {  });
}

function cvrResolvePackageImage(path) {
  const p = String(path ?? "").trim();
  if (!p) return assetUrl("images/booking-photo-1.png");
  if (/^(https?:|data:|blob:|\/)/i.test(p)) return p;
  if (p.startsWith("uploads/") || p.startsWith("images/")) return assetUrl(p);
  return p;
}
window.cvrResolvePackageImage = cvrResolvePackageImage;

function resolveActiveReservationId() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("res") || params.get("id") || "";
  if (fromUrl) return fromUrl;
  return localStorage.getItem("cvrActiveReservationId") || "";
}

function getActiveReservationRecord() {
  const id = resolveActiveReservationId();
  if (!id) return null;
  return getStoredReservations().find((item) => item.id === id) || null;
}

function getSmartNavUrls() {
  const session = getCustomerSession();
  const active = getActiveReservationRecord();
  const pending = window.CVRBookingCatalog?.getPendingReservation?.();

  let payment = pageUrl("payment.html");
  let status = pageUrl("reservation-status.html");
  let reservation = pageUrl("booking.html");
  let quotation = pageUrl("quotation.html");
  const myBookings = pageUrl(session ? "customer-dashboard.html" : "reservation-status.html");

  if (active?.id) {
    payment = pageUrl(`payment.html?res=${encodeURIComponent(active.id)}`);
    status = pageUrl(`reservation-status.html?id=${encodeURIComponent(active.id)}`);
    quotation = pageUrl(`quotation.html?res=${encodeURIComponent(active.id)}`);
  }

  if (pending) {
    reservation = pageUrl("reservation-form.html");
  } else if (active?.id && canClientModifyReservation(active)) {
    reservation = pageUrl(`reservation-form.html?edit=${encodeURIComponent(active.id)}`);
  }

  return { payment, status, reservation, quotation, myBookings, activeId: active?.id || "" };
}

function applySmartNavLinks(root = document) {
  const urls = getSmartNavUrls();
  root.querySelectorAll("[data-cvr-smart]").forEach((el) => {
    const key = el.getAttribute("data-cvr-smart");
    if (urls[key]) el.setAttribute("href", urls[key]);
  });
  root.querySelectorAll("[data-cvr-back]").forEach((el) => {
    const key = el.getAttribute("data-cvr-back");
    if (urls[key]) el.setAttribute("href", urls[key]);
  });
}

function ensureReservationQuotation(record) {
  if (!record) return null;
  if (record.quotation?.lines?.length) return record.quotation;
  const builder = window.CVRQuotation?.buildQuotationFromReservation;
  if (!builder) return null;
  const quotation = builder(record);
  record.quotation = quotation;
  window.CVRQuotation?.applyQuotationToReservation?.(record, quotation);
  return quotation;
}

function getQuotationStatusChipClass(status = "") {
  const map = {
    "Pending Admin Review": "chip-yellow",
    Draft: "chip-yellow",
    Approved: "chip-blue",
    "Ready for Client": "chip-blue",
    "Accepted by Client": "chip-green",
    Revised: "chip-blue",
  };
  return map[status] || "chip-yellow";
}

function canClientAcceptQuotation(record) {
  const q = ensureReservationQuotation(record);
  if (!q) return false;
  if (q.status === "Accepted by Client") return false;
  if (q.status === "Pending Admin Review") return false;
  const blockedSpecial = (q.lines || []).some(
    (line) => line.type === "special" && (line.approved === false || (Number(line.amount) || 0) <= 0)
  );
  if (blockedSpecial) return false;
  return q.status === "Approved" || q.status === "Revised";
}

function canClientPayReservation(record) {
  if (!record?.id) return false;
  if (String(record.reservationStatus || "").toLowerCase().includes("cancel")) return false;
  const q = ensureReservationQuotation(record);
  if (!q) return false;
  if (["Approved", "Verified"].includes(record.paymentStatus)) return true;
  return q.status === "Accepted by Client" && record.paymentStatus === "Pending Payment";
}

function renderQuotationBreakdownHtml(record, cat) {
  const q = ensureReservationQuotation(record);
  if (!q) return "";
  const fmt = (n) => (cat ? cat.formatMoney(n, q.currency || record.currency || "PHP") : String(n));
  const rows = (q.lines || [])
    .map((line) => {
      const pending = line.approved === false;
      const amountLabel = pending && (Number(line.amount) || 0) === 0 ? "Pending review" : fmt(line.amount);
      const desc = line.description ? `<div class="small text-muted-brand">${escapeHtml(line.description)}</div>` : "";
      return `
        <tr class="${pending ? "cvr-quote-pending-row" : ""}">
          <td>
            <span class="cvr-quote-type badge text-bg-light border me-1">${escapeHtml(line.type)}</span>
            ${escapeHtml(line.label)}
            ${desc}
          </td>
          <td class="text-center">${line.qty ?? 1}</td>
          <td class="text-end">${pending && !line.unitPrice ? "—" : fmt(line.unitPrice ?? line.amount)}</td>
          <td class="text-end fw-semibold">${amountLabel}</td>
        </tr>`;
    })
    .join("");

  const isEvent = record.bookingType === "event";
  const isPremiumOvertime = record.packageOption === "Wedding Package" || record.packageOption === "Debut Package";
  const overtimeRate = isPremiumOvertime ? "1,500" : "1,000";
  const policyHtml = isEvent
    ? `
    <div class="alert alert-warning small mt-3 mb-0">
      <div class="fw-semibold mb-1"><i class="bi bi-info-circle me-1"></i>Event Booking Policy</div>
      <ul class="mb-0 ps-3">
        <li>Extended stay: PHP ${overtimeRate} per additional hour</li>
        <li>First come, first served — no down payment, no reservation without payment</li>
        <li>Non-refundable once paid</li>
        <li>PHP 1,000-2,000 refundable damage/loss deposit required</li>
        <li>Electric appliances/gadgets may incur a PHP 500-2,500 power consumption charge</li>
      </ul>
    </div>`
    : "";

  return `
    <div class="table-responsive">
      <table class="table table-sm align-middle cvr-quotation-table mb-0">
        <thead>
          <tr class="small text-muted-brand">
            <th>Item</th><th class="text-center">Qty</th><th class="text-end">Unit</th><th class="text-end">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><td colspan="3" class="text-end fw-semibold">Package subtotal</td><td class="text-end">${fmt(q.subtotalPackage)}</td></tr>
          <tr><td colspan="3" class="text-end fw-semibold">Add-ons</td><td class="text-end">${fmt(q.subtotalAddOns)}</td></tr>
          <tr><td colspan="3" class="text-end fw-semibold">Special / custom services</td><td class="text-end">${fmt(q.subtotalSpecial)}</td></tr>
          <tr class="table-light"><td colspan="3" class="text-end fw-bold text-brand">Total</td><td class="text-end fw-bold text-brand">${fmt(q.totalNumeric)}</td></tr>
          ${
            q.downpaymentAmount != null
              ? `<tr><td colspan="3" class="text-end fw-semibold text-primary">Downpayment due now (${q.downpaymentPercent || 50}%)</td><td class="text-end fw-semibold text-primary">${fmt(q.downpaymentAmount)}</td></tr>
                 <tr><td colspan="3" class="text-end small text-muted-brand">Balance due before ${record.bookingType === "event" ? "the event date" : "check-in"}</td><td class="text-end small text-muted-brand">${fmt(q.balanceAmount)}</td></tr>`
              : ""
          }
        </tfoot>
      </table>
    </div>
    ${q.adminNotes ? `<div class="alert alert-info small mt-3 mb-0"><strong>Admin note:</strong> ${escapeHtml(q.adminNotes)}</div>` : ""}
    ${policyHtml}`;
}

function acceptReservationQuotation(reservationId) {
  const records = getStoredReservations();
  const idx = records.findIndex((item) => item.id === reservationId);
  if (idx < 0) return { ok: false, error: "Reservation not found." };
  const record = records[idx];
  if (!canClientAcceptQuotation(record)) {
    return { ok: false, error: "This quotation is not ready for acceptance yet." };
  }
  const q = { ...record.quotation, status: "Accepted by Client", acceptedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  records[idx] = window.CVRQuotation.applyQuotationToReservation({ ...record, quotation: q }, q);
  saveStoredReservations(records);
  syncReservationToServer(records[idx], true);
  return { ok: true, record: records[idx] };
}

window.ensureReservationQuotation = ensureReservationQuotation;
window.renderQuotationBreakdownHtml = renderQuotationBreakdownHtml;
window.canClientPayReservation = canClientPayReservation;
window.canClientAcceptQuotation = canClientAcceptQuotation;

function getReservationEditContext() {
  const params = new URLSearchParams(window.location.search);
  const rescheduleId = params.get("reschedule") || "";
  const editId = params.get("edit") || rescheduleId;
  if (!editId) return null;
  const record = getReservationById(editId);
  if (!record || !canClientModifyReservation(record)) return { invalid: true, id: editId };
  return {
    id: editId,
    mode: rescheduleId ? "reschedule" : "edit",
    record,
  };
}

function reservationToPending(record) {
  if (!record) return null;
  if (record.bookingType === "room") {
    return {
      bookingType: "room",
      packageId: record.packageId,
      checkInDate: record.checkIn,
      checkOutDate: record.checkOut,
      durationKey: record.durationKey || "",
      extendedNights: record.extendedNights || null,
      customCheckInTime: record.customCheckInTime || null,
      customCheckOutTime: record.customCheckOutTime || null,
      scheduledCheckIn: record.scheduledCheckIn || "",
      scheduledCheckOut: record.scheduledCheckOut || "",
      checkInLabel: record.checkInLabel || "",
      checkOutLabel: record.checkOutLabel || "",
      guests: record.guests,
      selectedAddOns: record.selectedAddOns || [],
      createdAt: record.dateReserved,
    };
  }
  return {
    bookingType: "event",
    eventType: record.eventType,
    eventGuests: record.guests,
    preferredDate: record.preferredDate || record.checkIn,
    checkOutDate: record.checkOut || record.preferredDate || record.checkIn,
    eventTime: record.eventTime,
    durationKey: record.durationKey || "",
    extendedNights: record.extendedNights || null,
    customCheckInTime: record.customCheckInTime || null,
    customCheckOutTime: record.customCheckOutTime || null,
    scheduledCheckIn: record.scheduledCheckIn || "",
    scheduledCheckOut: record.scheduledCheckOut || "",
    checkInLabel: record.checkInLabel || "",
    checkOutLabel: record.checkOutLabel || "",
    packageOption: record.packageOption,
    additionalNotes: record.eventNotes || "",
    motif: record.motif || null,
    selectedAddOns: record.selectedAddOns || [],
    nights: record.nights || 1,
    roomSubtotal: record.roomSubtotal,
    addOnsTotal: record.addOnsTotal || 0,
    serviceFee: record.serviceFee || 0,
    taxes: record.taxes || 0,
    total: record.totalNumeric,
    currency: record.currency || "PHP",
    createdAt: record.dateReserved,
  };
}

function getSelectedAddOnIds() {
  return Array.from(document.querySelectorAll(".cvr-addon-checkbox:checked")).map((el) => el.value);
}

function renderPackageAddOnsUI(cat, bookingType, packageKey, selectedIds = []) {
  const listEl = document.getElementById("packageAddOnsList");
  const incEl = document.getElementById("packageInclusionsList");
  if (!listEl) return;
  const addOns = cat.getPackageAddOns(bookingType, packageKey);
  const selected = new Set(selectedIds);

  if (bookingType === "event") {
    const pkgCat = cat.getEventPackageCatalog(packageKey);
    if (incEl && pkgCat) {
      incEl.innerHTML = `<span class="fw-semibold text-brand d-block mb-1">Included in ${escapeHtml(packageKey)}:</span><ul class="ps-3 mb-0">${pkgCat.inclusions.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
    } else if (incEl) {
      incEl.innerHTML = "";
    }
  } else if (incEl) {
    const pkg = cat.getRoomPackageById(packageKey);
    incEl.innerHTML = pkg
      ? `<span class="fw-semibold text-brand d-block mb-1">Included:</span><ul class="ps-3 mb-0">${pkg.inclusions.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`
      : "";
  }

  if (!addOns.length) {
    listEl.innerHTML = `<p class="small text-muted-brand mb-0">No paid add-ons for this package. Use special requests for other preferences.</p>`;
    return;
  }

  const currency = bookingType === "event" ? "PHP" : cat.getRoomPackageById(packageKey)?.currency || "PHP";
  const groups = new Map();
  addOns.forEach((a) => {
    const category = a.category || "other";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(a);
  });
  const orderedCategories = Array.from(groups.keys()).sort((a, b) => {
    const ma = cat.getAddOnCategoryMeta ? cat.getAddOnCategoryMeta(a) : { order: 99 };
    const mb = cat.getAddOnCategoryMeta ? cat.getAddOnCategoryMeta(b) : { order: 99 };
    return (ma.order || 99) - (mb.order || 99);
  });

  listEl.innerHTML = orderedCategories
    .map((category) => {
      const meta = cat.getAddOnCategoryMeta ? cat.getAddOnCategoryMeta(category) : { label: "Add-ons" };
      const items = groups.get(category)
        .map(
          (a) => `
      <label class="cvr-addon-option d-flex align-items-start gap-2 p-2 rounded-3 border">
        <input type="checkbox" class="form-check-input mt-1 cvr-addon-checkbox" value="${escapeHtml(a.id)}" ${selected.has(a.id) ? "checked" : ""}>
        <span class="flex-grow-1">
          <span class="fw-semibold text-brand d-block">${escapeHtml(a.label)}</span>
          <span class="small text-muted-brand">+ ${escapeHtml(cat.formatMoney(a.price, currency))}</span>
        </span>
      </label>`
        )
        .join("");
      return `
      <div class="cvr-addon-group mb-3">
        <div class="small text-uppercase fw-semibold text-primary mb-2">${escapeHtml(meta.label)}</div>
        <div class="d-flex flex-column gap-2">${items}</div>
      </div>`;
    })
    .join("");

  listEl.querySelectorAll(".cvr-addon-checkbox").forEach((cb) => {
    cb.addEventListener("change", () => {
      if (typeof window.__cvrRecalcReservationSummary === "function") window.__cvrRecalcReservationSummary();
    });
  });
}

function renderSummaryAddOnLines(cat, addOnLines, currency) {
  const wrap = document.getElementById("summaryAddOnsLines");
  const row = document.getElementById("summaryLineAddOnsRow");
  const amt = document.getElementById("summaryLineAddOns");
  if (!wrap) return;
  if (!addOnLines?.length) {
    wrap.innerHTML = "";
    row?.classList.add("d-none");
    return;
  }
  wrap.innerHTML = addOnLines.map((l) => `<div class="d-flex justify-content-between small text-muted-brand"><span>${escapeHtml(l.label)}</span><span>+ ${escapeHtml(cat.formatMoney(l.price, currency))}</span></div>`).join("");
  if (row && amt) {
    const total = addOnLines.reduce((s, l) => s + (Number(l.price) || 0), 0);
    row.classList.remove("d-none");
    amt.textContent = cat.formatMoney(total, currency);
  }
}

function showReservationFormAlert(message, isError) {
  const el = document.getElementById("reservationFormAlert");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("d-none", "alert-success", "alert-danger");
  el.classList.add(isError ? "alert-danger" : "alert-success");
  if (!isError) el.classList.add("alert-success");
}

function readResCheckInTimeSelection() {
  const hour = document.getElementById("cvrResCheckInHour")?.value ?? "";
  const minute = document.getElementById("cvrResCheckInMinute")?.value ?? "";
  const meridiem = document.getElementById("cvrResCheckInMeridiem")?.value ?? "";
  const anyFilled = Boolean(hour || minute !== "" || meridiem);
  const allFilled = Boolean(hour && minute !== "" && meridiem);
  const parsed = allFilled ? window.CVRDuration?.parse12HourTime?.(hour, minute, meridiem) || null : null;
  const allowed = parsed ? Boolean(window.CVRDuration?.isCustomCheckInTimeAllowed?.(parsed)) : false;
  return {
    time: allowed ? parsed : null,
    incomplete: anyFilled && !allFilled,
    outOfRange: Boolean(parsed) && !allowed,
  };
}

function setResCheckInTimeSelection(hhmm) {
  const hourSel = document.getElementById("cvrResCheckInHour");
  const minuteSel = document.getElementById("cvrResCheckInMinute");
  const meridiemSel = document.getElementById("cvrResCheckInMeridiem");
  if (!hourSel || !minuteSel || !meridiemSel) return;
  const clear = () => { hourSel.value = ""; minuteSel.value = ""; meridiemSel.value = ""; };

  const match = typeof hhmm === "string" ? hhmm.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/) : null;
  if (!match) { clear(); return; }
  const h = Number(match[1]); const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) { clear(); return; }
  let h12 = h % 12; if (h12 === 0) h12 = 12;

  if (!Array.from(minuteSel.options).some((o) => o.value === String(m))) {
    const opt = document.createElement("option");
    opt.value = String(m);
    opt.textContent = String(m).padStart(2, "0");
    minuteSel.appendChild(opt);
  }
  hourSel.value = String(h12);
  minuteSel.value = String(m);
  meridiemSel.value = h >= 12 ? "PM" : "AM";
}

function renderResCheckInTimeFeedback(selection, durationKey) {
  const errEl = document.getElementById("cvrResCheckInTimeError");
  const hintEl = document.getElementById("cvrResCheckInTimeHint");
  const defaultLabel = window.CVRDuration?.get(durationKey)?.checkInLabel || "";
  if (hintEl) {
    hintEl.textContent = selection.time
      ? `Your requested arrival time is applied to the schedule, summary, and quotation below.`
      : durationKey === "extended"
        ? `Pick your own arrival time, or leave blank to use the default${defaultLabel ? ` (${defaultLabel})` : ""}. Your check-out day and time are shown in the schedule below.`
        : `Pick your own arrival time, or leave blank to use the default${defaultLabel ? ` (${defaultLabel})` : ""}. Check-out shifts with it to fulfill the full duration.`;
  }
  if (!errEl) return;
  let message = "";
  if (selection.incomplete) message = "Choose hour, minutes, and AM/PM to apply your own arrival time.";
  else if (selection.outOfRange) message = "Please choose a valid arrival time.";
  errEl.textContent = message;
  errEl.classList.toggle("d-none", !message);
}

function syncPendingCheckInTime(pending, durationKey) {
  const selection = readResCheckInTimeSelection();
  renderResCheckInTimeFeedback(selection, durationKey);
  if (pending) pending.customCheckInTime = selection.time;
  return selection.time;
}

function persistPendingReservation(pending) {
  try {
    if (pending) window.CVRBookingCatalog?.setPendingReservation?.(pending);
  } catch {

  }
}

function updateRoomFormSummary(cat, pkg) {
  const checkInEl = document.getElementById("resCheckIn");
  const checkOutEl = document.getElementById("resCheckOut");
  const flow = window.__cvrReservationFlow;
  const pending = flow?.pending || {};
  const durationKey = pending.durationKey && window.CVRDuration?.get(pending.durationKey) ? pending.durationKey : "24hr";
  const checkIn = checkInEl?.value || "";

  const guestInput = document.getElementById("resGuestCount");
  let guests = guestInput ? parseInt(guestInput.value, 10) : flow?.guestCount ?? 2;
  if (!Number.isFinite(guests)) guests = 2;
  guests = Math.min(Math.max(guests, pkg.capacity.min), pkg.capacity.max);
  if (guestInput) guestInput.value = String(guests);
  if (flow) flow.guestCount = guests;

  const selectedAddOns = getSelectedAddOnIds();
  const nights = durationKey === "extended" ? window.CVRDuration?.clampExtendedNights(pending.extendedNights) : null;

  const customCheckInTime = syncPendingCheckInTime(flow?.pending, durationKey);

  const customCheckOutTime = durationKey === "extended" ? (pending.customCheckOutTime || null) : null;
  const totals = checkIn ? cat.calculateDurationStayTotals(checkIn, durationKey, pkg.pricePerNight, selectedAddOns, pkg.id, nights, customCheckInTime, customCheckOutTime) : null;
  const fmt = (n) => cat.formatMoney(n, pkg.currency);

  document.getElementById("summarySidebarTitle").textContent = pkg.title;
  const durOpt = window.CVRDuration?.get(durationKey);
  const durLabelEl = document.getElementById("resDurationLabel");
  const scheduleEl = document.getElementById("resScheduleTimes");

  if (totals) {
    if (checkOutEl) checkOutEl.value = totals.checkOutDateOnly;
    if (durLabelEl) durLabelEl.textContent = totals.durationLabel;
    if (scheduleEl) scheduleEl.textContent = `Check-in: ${formatDateReserved(totals.checkInDateOnly)} at ${totals.checkInLabel}  →  Check-out: ${formatDateReserved(totals.checkOutDateOnly)} at ${totals.checkOutLabel}`;
    document.getElementById("summarySidebarDates").textContent = `${durOpt?.shortLabel || ""} · ${formatDateReserved(totals.checkInDateOnly)} ${totals.checkInLabel} → ${formatDateReserved(totals.checkOutDateOnly)} ${totals.checkOutLabel} · ${guests} guest${guests !== 1 ? "s" : ""}`;
    document.getElementById("summaryLineRoom").textContent = fmt(totals.roomSubtotal);
    document.getElementById("summaryLineTotal").textContent = fmt(totals.total);
    renderSummaryAddOnLines(cat, totals.addOnLines, pkg.currency);
    if (flow?.pending) {
      flow.pending.selectedAddOns = selectedAddOns;
      flow.pending.addOnLines = totals.addOnLines;
      flow.pending.addOnsTotal = totals.addOnsTotal;
      flow.pending.durationKey = durationKey;
      flow.pending.checkOutDate = totals.checkOutDateOnly;
      flow.pending.scheduledCheckIn = totals.scheduledCheckIn;
      flow.pending.scheduledCheckOut = totals.scheduledCheckOut;
      flow.pending.checkInLabel = totals.checkInLabel;
      flow.pending.checkOutLabel = totals.checkOutLabel;
      flow.pending.customCheckInTime = totals.customCheckInTime || null;
      flow.pending.customCheckOutTime = totals.customCheckOutTime || null;
    }
  } else {
    if (durLabelEl) durLabelEl.textContent = durOpt?.label || "—";
    if (scheduleEl) scheduleEl.textContent = "Select an arrival date to see your exact check-in / check-out schedule.";
    document.getElementById("summarySidebarDates").textContent = "Select an arrival date";
    document.getElementById("summaryLineRoom").textContent = "—";
    document.getElementById("summaryLineTotal").textContent = "—";
    renderSummaryAddOnLines(cat, [], pkg.currency);
  }

  const stayHint = document.getElementById("stayDatesHint");
  if (stayHint) {
    if (!stayHint.dataset.defaultText) stayHint.dataset.defaultText = stayHint.textContent;
    stayHint.textContent = durationKey === "extended"
      ? "Choose your arrival date and time. Your Multi-Day stay ends on the check-out day and time shown in the schedule below."
      : stayHint.dataset.defaultText;
  }
  persistPendingReservation(flow?.pending);
}

function updateEventFormSummary(cat, pending) {
  const fmt = (n) => cat.formatMoney(n, pending.currency || "PHP");
  const guestInput = document.getElementById("resGuestCount");
  let guests = guestInput ? parseInt(guestInput.value, 10) : pending.eventGuests || 1;
  if (!Number.isFinite(guests)) guests = pending.eventGuests || 1;
  if (guestInput) guestInput.value = String(guests);
  pending.eventGuests = guests;

  const eventDate = document.getElementById("resEventDate")?.value || pending.preferredDate;
  const durationKey = pending.durationKey && window.CVRDuration?.get(pending.durationKey) ? pending.durationKey : "12hr";
  pending.preferredDate = eventDate;
  pending.durationKey = durationKey;

  const selectedAddOns = getSelectedAddOnIds();
  const customCheckInTime = syncPendingCheckInTime(pending, durationKey);
  const eventNights = durationKey === "extended" ? window.CVRDuration?.clampExtendedNights(pending.extendedNights) : null;
  const customCheckOutTime = durationKey === "extended" ? (pending.customCheckOutTime || null) : null;
  const totals = eventDate
    ? cat.calculateDurationEventTotal(eventDate, durationKey, pending.packageOption || "", selectedAddOns, customCheckInTime, eventNights, customCheckOutTime, guests)
    : null;
  const durLabelEl = document.getElementById("resDurationLabel");
  const scheduleEl = document.getElementById("resScheduleTimes");

  if (!totals) {
    if (durLabelEl) durLabelEl.textContent = window.CVRDuration?.get(durationKey)?.label || "—";
    if (scheduleEl) scheduleEl.textContent = "Select an event date to see your exact check-in / check-out schedule.";
    document.getElementById("summarySidebarDates").textContent = "Select an event date";
    document.getElementById("summaryLineRoom").textContent = "—";
    document.getElementById("summaryLineTotal").textContent = "—";
    renderSummaryAddOnLines(cat, [], pending.currency || "PHP");
    persistPendingReservation(pending);
    return;
  }

  pending.eventTime = totals.checkInLabel;
  pending.scheduledCheckIn = totals.scheduledCheckIn;
  pending.scheduledCheckOut = totals.scheduledCheckOut;
  pending.checkInLabel = totals.checkInLabel;
  pending.checkOutLabel = totals.checkOutLabel;
  pending.checkOutDate = totals.checkOutDateOnly;
  pending.customCheckInTime = totals.customCheckInTime || null;
  pending.customCheckOutTime = totals.customCheckOutTime || null;
  pending.extendedNights = durationKey === "extended" ? totals.nights : null;
  pending.selectedAddOns = selectedAddOns;
  pending.roomSubtotal = totals.roomSubtotal;
  pending.addOnsTotal = totals.addOnsTotal;
  pending.addOnLines = totals.addOnLines;
  pending.total = totals.total;
  pending.serviceFee = totals.serviceFee;
  pending.taxes = totals.taxes;

  const list = document.getElementById("eventSummaryList");
  if (list) {
    const spansDays = pending.checkOutDate && pending.checkOutDate !== pending.preferredDate;
    list.innerHTML = `
      <li><strong>Type:</strong> ${escapeHtml(pending.eventType)}</li>
      <li><strong>Package:</strong> ${escapeHtml(pending.packageOption || "—")}</li>
      <li><strong>${spansDays ? "Start date" : "Date"}:</strong> ${formatDateReserved(pending.preferredDate)}</li>
      ${spansDays ? `<li><strong>End date:</strong> ${formatDateReserved(pending.checkOutDate)}</li>` : ""}
      ${pending.durationKey === "extended" && pending.extendedNights ? `<li><strong>Nights:</strong> ${escapeHtml(String(pending.extendedNights))}</li>` : ""}
      ${pending.eventTime ? `<li><strong>Time:</strong> ${escapeHtml(pending.eventTime)}</li>` : ""}
    `;
  }

  if (durLabelEl) durLabelEl.textContent = totals.durationLabel;
  if (scheduleEl) scheduleEl.textContent = `Check-in: ${formatDateReserved(totals.checkInDateOnly)} at ${totals.checkInLabel}  →  Check-out: ${formatDateReserved(totals.checkOutDateOnly)} at ${totals.checkOutLabel}`;

  document.getElementById("summarySidebarTitle").textContent = `Event: ${pending.eventType}`;
  const sameDay = totals.checkInDateOnly === totals.checkOutDateOnly;
  document.getElementById("summarySidebarDates").textContent = sameDay
    ? `${formatDateReserved(eventDate)} · ${guests} guests · ${totals.checkInLabel} – ${totals.checkOutLabel}`
    : `${formatDateReserved(totals.checkInDateOnly)} ${totals.checkInLabel} → ${formatDateReserved(totals.checkOutDateOnly)} ${totals.checkOutLabel} · ${guests} guest${guests !== 1 ? "s" : ""}`;
  document.getElementById("summaryLineRoom").textContent = fmt(totals.roomSubtotal);
  document.getElementById("summaryLineTotal").textContent = fmt(totals.total);
  renderSummaryAddOnLines(cat, totals.addOnLines, pending.currency || "PHP");
  persistPendingReservation(pending);
}

function populateGuestFieldsFromSessionOrRecord(record) {
  const session = getCustomerSession();
  const nameParts = (record?.customerName || "").trim().split(/\s+/);
  const fn = document.getElementById("resFirstName");
  const ln = document.getElementById("resLastName");
  const em = document.getElementById("resEmail");
  const ph = document.getElementById("resPhone");
  const sr = document.getElementById("resSpecialRequests");
  if (record) {
    if (fn) fn.value = nameParts[0] || "";
    if (ln) ln.value = nameParts.slice(1).join(" ") || "";
    if (em) em.value = record.email || "";
    if (ph) ph.value = record.phone || "";
    if (sr) sr.value = record.specialRequests || record.eventNotes || "";
  } else if (session) {
    if (fn) fn.value = session.firstName || "";
    if (ln) ln.value = session.lastName || "";
    if (em) em.value = session.email || "";
    if (ph) ph.value = session.phone || "";
  }
}

function buildReservationFromForm(cat, pending, flow) {
  const firstName = document.getElementById("resFirstName")?.value.trim() || "";
  const lastName = document.getElementById("resLastName")?.value.trim() || "";
  const email = document.getElementById("resEmail")?.value.trim() || "";
  const phone = document.getElementById("resPhone")?.value.trim() || "";
  const checkIn = document.getElementById("resCheckIn")?.value || "";
  const checkOut = document.getElementById("resCheckOut")?.value || "";
  const specialRequests = document.getElementById("resSpecialRequests")?.value.trim() || "";
  const selectedAddOns = getSelectedAddOnIds();
  const excludeId = flow?.editId || "";

  let guestsNum = parseInt(document.getElementById("resGuestCount")?.value, 10) || 2;
  if (pending.bookingType === "event") {
    guestsNum = parseInt(document.getElementById("resGuestCount")?.value, 10) || pending.eventGuests || 1;
  }

  if (!window.CVRDuration?.buildWindow || !window.CVRDuration?.isCustomCheckInTimeAllowed || !window.CVRDuration?.parse12HourTime) {
    return { error: "The booking scripts didn't load correctly. Please hard-refresh this page (Ctrl+F5, or Cmd+Shift+R on Mac) and try again." };
  }
  const STALE_SCRIPT_ERROR = "Your browser is using an outdated copy of the booking scripts, so your selected time could not be applied. Please hard-refresh this page (Ctrl+F5, or Cmd+Shift+R on Mac) and try again.";

  if (!firstName || !lastName) return { error: "Please enter your first and last name." };
  if (!isValidEmail(email)) return { error: "Please enter a valid email address." };
  if (!isValidPhone(phone)) return { error: "Please enter a valid contact number (8–15 digits)." };

  const isUpdate = Boolean(flow?.editId);
  const existing = isUpdate ? getReservationById(flow.editId) : null;
  const ownerSessionKey = existing?.ownerSessionKey || `OWN-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const reservation = {
    id: existing?.id || `CVR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
    bookingType: pending.bookingType,
    customerName: `${firstName} ${lastName}`.trim(),
    email,
    phone,
    dateReserved: existing?.dateReserved || new Date().toISOString(),
    checkIn,
    checkOut,
    guests: guestsNum,
    guestsLabel: `${guestsNum} guest${guestsNum !== 1 ? "s" : ""}`,
    arrivalTime: "",
    specialRequests,
    selectedAddOns,
    addOnLines: [],
    addOnsTotal: 0,
    paymentStatus: existing?.paymentStatus || "Pending Payment",
    proofOfPayment: existing?.proofOfPayment || null,
    reservationStatus: existing?.reservationStatus || "Awaiting Payment Verification",
    ownerSessionKey,
    paymentMethod: existing?.paymentMethod || "QR / GCash",
    clientConfirmedAt: new Date().toISOString(),
    termsAcceptedAt: existing?.termsAcceptedAt || null,
    rescheduleHistory: existing?.rescheduleHistory || [],
  };

  if (pending.bookingType === "room") {
    const pkg = cat.getRoomPackageById(pending.packageId);
    if (!pkg) return { error: "Invalid package." };
    if (pkg.isActive === false) return { error: "This package is no longer available for booking. Please choose another." };
    const durationKey = pending.durationKey && window.CVRDuration?.get(pending.durationKey) ? pending.durationKey : "24hr";
    const extendedNights = durationKey === "extended" ? window.CVRDuration?.clampExtendedNights(pending.extendedNights) : null;

    const timeSelection = readResCheckInTimeSelection();
    const customCheckInTime = timeSelection.time || null;
    if (!checkIn) return { error: "Please select your arrival date." };
    if (timeSelection.incomplete) {
      return { error: "Choose hour, minutes, and AM/PM for your arrival time, or clear all three to use the default." };
    }
    if (timeSelection.outOfRange) {
      return { error: "Please choose a valid check-in time." };
    }

    const customCheckOutTime = durationKey === "extended" ? (pending.customCheckOutTime || null) : null;
    if (durationKey === "extended" && customCheckOutTime && !window.CVRDuration?.isCustomCheckOutTimeAllowed?.(customCheckOutTime)) {
      return { error: "Please choose a valid check-out time." };
    }
    const win = window.CVRDuration.buildWindow(checkIn, durationKey, extendedNights, customCheckInTime, customCheckOutTime);
    if (!win) return { error: "Invalid stay duration." };

    if ((customCheckInTime && win.customCheckInTime !== customCheckInTime) || (customCheckOutTime && win.customCheckOutTime !== customCheckOutTime)) {
      return { error: STALE_SCRIPT_ERROR };
    }
    if (roomStayOverlapsExisting(pkg.id, pkg.title, win.checkInDateOnly, win.checkOutDateOnly, excludeId, win.scheduledCheckIn, win.scheduledCheckOut)) {
      return { error: "Sorry, that fixed time slot was just booked for this room. Please choose a different date or duration." };
    }
    const totals = cat.calculateDurationStayTotals(checkIn, durationKey, pkg.pricePerNight, selectedAddOns, pkg.id, extendedNights, customCheckInTime, customCheckOutTime);
    if (!totals) return { error: "Invalid stay length." };
    if (guestsNum < pkg.capacity.min || guestsNum > pkg.capacity.max) {
      return { error: `Guest count must be between ${pkg.capacity.min} and ${pkg.capacity.max}.` };
    }
    reservation.checkIn = totals.checkInDateOnly;
    reservation.checkOut = totals.checkOutDateOnly;
    Object.assign(reservation, {
      packageId: pkg.id,
      roomName: pkg.title,
      roomImage: pkg.image,
      roomTagline: pkg.tagline,
      currency: pkg.currency,
      durationKey,
      extendedNights,
      customCheckInTime: totals.customCheckInTime || null,
      customCheckOutTime: totals.customCheckOutTime || null,
      durationLabel: totals.durationLabel,
      scheduledCheckIn: totals.scheduledCheckIn,
      scheduledCheckOut: totals.scheduledCheckOut,
      checkInLabel: totals.checkInLabel,
      checkOutLabel: totals.checkOutLabel,
      nights: totals.nights || 1,
      dayUse: durationKey === "12hr",
      roomSubtotal: totals.roomSubtotal,
      addOnsTotal: totals.addOnsTotal,
      addOnLines: totals.addOnLines,
      serviceFee: totals.serviceFee,
      taxes: totals.taxes,
      totalNumeric: totals.total,
      totalAmount: cat.formatMoney(totals.total, pkg.currency),
    });
  } else {
    const eventDate = document.getElementById("resEventDate")?.value || pending.preferredDate;
    const durationKey = pending.durationKey && window.CVRDuration?.get(pending.durationKey) ? pending.durationKey : "12hr";
    if (pending.packageOption && cat.isEventPackageActive && !cat.isEventPackageActive(pending.packageOption)) {
      return { error: "This package is no longer available for booking. Please choose another." };
    }
    const motif = null; // motif/theme selection removed from the reservation form

    if (!eventDate) return { error: "Please select an event date." };

    const evNights = durationKey === "extended" ? window.CVRDuration?.clampExtendedNights(pending.extendedNights) : null;
    const evTimeSelection = readResCheckInTimeSelection();
    if (evTimeSelection.incomplete) {
      return { error: "Choose hour, minutes, and AM/PM for your arrival time, or clear all three to use the default." };
    }
    if (evTimeSelection.outOfRange) {
      return { error: "Please choose a valid arrival time." };
    }
    const evCustomCheckInTime = evTimeSelection.time || null;
    const evCustomCheckOutTime = durationKey === "extended" ? (pending.customCheckOutTime || null) : null;

    const evWin = window.CVRDuration?.buildWindow(eventDate, durationKey, evNights, evCustomCheckInTime, evCustomCheckOutTime);
    if (!evWin) return { error: "Invalid event duration." };
    if ((evCustomCheckInTime && evWin.customCheckInTime !== evCustomCheckInTime) || (evCustomCheckOutTime && evWin.customCheckOutTime !== evCustomCheckOutTime)) {
      return { error: STALE_SCRIPT_ERROR };
    }
    if (typeof window.cvrEventOverlapsExisting === "function" && window.cvrEventOverlapsExisting(evWin.scheduledCheckIn, evWin.scheduledCheckOut, excludeId)) {
      return { error: "Sorry, that date range overlaps an existing event booking. Please choose a different date or duration." };
    }

    const totals = cat.calculateDurationEventTotal(eventDate, durationKey, pending.packageOption || "", selectedAddOns, evCustomCheckInTime, evNights, evCustomCheckOutTime, guestsNum);
    if (!totals) return { error: "Invalid event duration." };
    const pkgCat = cat.getEventPackageCatalog(pending.packageOption || "");
    const maxGuests = pkgCat?.maxPax || pkgCat?.pax || pending.eventGuests || 999;

    if (guestsNum < 1) return { error: "Enter a valid number of guests." };
    if (guestsNum > maxGuests) return { error: `Guest count cannot exceed ${maxGuests} for this package.` };

    reservation.checkIn = totals.checkInDateOnly;
    reservation.checkOut = totals.checkOutDateOnly;
    reservation.eventType = pending.eventType;
    reservation.preferredDate = totals.checkInDateOnly;
    reservation.eventTime = totals.checkInLabel;
    reservation.durationKey = durationKey;
    reservation.durationLabel = totals.durationLabel;
    reservation.extendedNights = durationKey === "extended" ? totals.nights : null;
    reservation.scheduledCheckIn = totals.scheduledCheckIn;
    reservation.scheduledCheckOut = totals.scheduledCheckOut;
    reservation.checkInLabel = totals.checkInLabel;
    reservation.checkOutLabel = totals.checkOutLabel;
    reservation.customCheckInTime = totals.customCheckInTime || null;
    reservation.customCheckOutTime = totals.customCheckOutTime || null;
    reservation.packageOption = pending.packageOption;
    reservation.eventNotes = pending.additionalNotes || specialRequests;
    reservation.motif = motif;
    reservation.roomName = `Event — ${pending.eventType}`;
    reservation.roomImage = cat.getEventPackageCatalog?.(pending.packageOption)?.image || "../images/booking-photo-3.png";
    reservation.roomTagline = pending.packageOption || "Resort event";
    reservation.currency = pending.currency || "PHP";
    reservation.nights = 1;
    reservation.roomSubtotal = totals.roomSubtotal;
    reservation.addOnsTotal = totals.addOnsTotal;
    reservation.addOnLines = totals.addOnLines;
    reservation.serviceFee = totals.serviceFee;
    reservation.taxes = totals.taxes;
    reservation.totalNumeric = totals.total;
    reservation.totalAmount = cat.formatMoney(totals.total, reservation.currency);
  }

  return { reservation, isUpdate, existing };
}

function buildChangeSummary(existing, next) {
  if (!existing || !next) return "";
  const lines = [];
  const add = (label, oldVal, newVal) => {
    if (String(oldVal || "") !== String(newVal || "")) lines.push(`<strong>${escapeHtml(label)}:</strong> ${escapeHtml(String(oldVal || "—"))} → ${escapeHtml(String(newVal || "—"))}`);
  };
  add("Check-in / event date", existing.checkIn || existing.preferredDate, next.checkIn || next.preferredDate);
  add("Duration", existing.durationLabel, next.durationLabel);
  add("Check-in time", existing.checkInLabel, next.checkInLabel);
  add("Check-out time", existing.checkOutLabel, next.checkOutLabel);
  add("Guests", existing.guests, next.guests);
  add("Motif", existing.motif?.label, next.motif?.label);
  add("Total amount", existing.totalAmount, next.totalAmount);
  if (!lines.length) return "";
  return `<div class="fw-semibold mb-1">Changes from your previous booking:</div>${lines.join("<br>")}`;
}

function renderConfirmSummaryHtml(r, cat) {
  const fmt = (n, cur) => cat.formatMoney(n, cur || r.currency || "PHP");
  const rows = [
    ["Reservation ID", r.id],
    ["Guest", r.customerName],
    ["Email", r.email],
    ["Phone", r.phone],
    ["Type", r.bookingType === "event" ? "Event" : "Room stay"],
    ["Package", r.roomName || r.packageOption || "—"],
    ["Check-in / event date", formatDateReserved(r.checkIn || r.preferredDate)],
    ["Duration", r.durationLabel || "—"],
    ["Check-in time", r.checkInLabel || "—"],
    ["Check-out time (strict)", r.checkOutLabel || "—"],
    ["Guests", r.guestsLabel || r.guests],
    ["Motif / theme", r.motif?.label ? `${r.motif.label} (${r.motif.colors || ""})` : "—"],
    ["Package subtotal", r.roomSubtotal != null ? fmt(r.roomSubtotal, r.currency) : "—"],
    ["Add-ons", r.addOnLines?.length ? r.addOnLines.map((l) => `${l.label} (+${fmt(l.price, r.currency)})`).join(", ") : "None"],
    ["Special requests", r.specialRequests || r.eventNotes || "None"],
    ["Total", r.totalAmount || fmt(r.totalNumeric, r.currency)],
  ];
  return `<dl class="row small mb-0">${rows.map(([k, v]) => `<dt class="col-sm-4 text-muted-brand">${escapeHtml(k)}</dt><dd class="col-sm-8">${escapeHtml(String(v))}</dd>`).join("")}</dl>`;
}

function showReservationConfirmModal(reservation, changeHtml) {
  const modalEl = document.getElementById("reservationConfirmModal");
  const body = document.getElementById("resConfirmSummaryBody");
  const changeBox = document.getElementById("resConfirmChangeSummary");
  const cat = window.CVRBookingCatalog;
  if (!modalEl || !body || !cat) return;

  body.innerHTML = renderConfirmSummaryHtml(reservation, cat);
  if (changeBox) {
    if (changeHtml) {
      changeBox.innerHTML = changeHtml;
      changeBox.classList.remove("d-none");
    } else {
      changeBox.classList.add("d-none");
      changeBox.innerHTML = "";
    }
  }

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
  window.__cvrPendingConfirmReservation = reservation;
}

function persistReservationRecord(reservation, isUpdate, existing, flow) {
  const builder = window.CVRQuotation?.buildQuotationFromReservation;
  if (builder) {
    const quotation = builder(reservation);
    if (isUpdate && existing?.quotation) {
      quotation.version = (existing.quotation.version || 1) + 1;
      quotation.acceptedAt = null;
      quotation.status = quotation.lines.some((line) => line.type === "special" && !line.approved)
        ? "Pending Admin Review"
        : "Revised";
    }
    window.CVRQuotation.applyQuotationToReservation(reservation, quotation);
  }
  const records = getStoredReservations();
  if (isUpdate && existing) {
    if (flow?.mode === "reschedule") {
      reservation.rescheduleHistory = [
        ...(existing.rescheduleHistory || []),
        {
          at: new Date().toISOString(),
          previousCheckIn: existing.checkIn || existing.preferredDate,
          previousCheckOut: existing.checkOut,
          previousEventTime: existing.eventTime,
          previousTotal: existing.totalAmount,
        },
      ];
    }
    const idx = records.findIndex((x) => x.id === existing.id);
    if (idx >= 0) records[idx] = { ...existing, ...reservation, id: existing.id };
    else records.unshift(reservation);
  } else {
    records.unshift(reservation);
  }
  saveStoredReservations(records);
  localStorage.setItem("cvrActiveReservationId", reservation.id);
  localStorage.setItem("cvrOwnerSessionKey", reservation.ownerSessionKey);
  window.CVRBookingCatalog?.clearPendingReservation?.();
  syncReservationToServer(reservation, isUpdate);
}

function syncReservationToServer(reservation, isUpdate) {
  try {
    cvrApiPost("content/reservations-sync", { reservation, isUpdate: Boolean(isUpdate) }).catch((e) => {
      console.warn("Reservation sync failed (will still work locally):", e);
    });
  } catch (e) {
    console.warn("Reservation sync failed (will still work locally):", e);
  }
}
window.syncReservationToServer = syncReservationToServer;

async function refreshMyReservationsFromServer() {
  try {
    const { body } = await cvrApiGet("content/my-reservations");
    const serverList = body && body.success && body.data && Array.isArray(body.data.reservations)
      ? body.data.reservations
      : null;
    if (!serverList || !serverList.length) return;
    const local = getStoredReservations();
    const byId = new Map(local.map((r) => [r.id, r]));
    serverList.forEach((r) => {
      if (r && r.id) byId.set(r.id, r);
    });
    saveStoredReservations(Array.from(byId.values()));
  } catch (e) {

  }
}
window.refreshMyReservationsFromServer = refreshMyReservationsFromServer;

function cvrStatusFingerprint() {
  return getStoredReservations()
    .map((r) => `${r.id}:${r.reservationStatus || ""}:${r.paymentStatus || ""}`)
    .sort()
    .join("|");
}

const CVR_CHECKOUT_WARNING_MINUTES = 60;
const CVR_CHECKOUT_OVERDUE_RENUDGE_MS = 30 * 60 * 1000;

function cvrCheckoutToastState() {
  try {
    return JSON.parse(sessionStorage.getItem("cvrCheckoutToastState") || "{}");
  } catch {
    return {};
  }
}
function cvrSaveCheckoutToastState(state) {
  try {
    sessionStorage.setItem("cvrCheckoutToastState", JSON.stringify(state));
  } catch {

  }
}

function cvrCheckCheckoutApproaching() {
  if (typeof cvrToast !== "function") return;
  const records = getStoredReservations().filter(
    (r) => r.bookingType === "room" && r.scheduledCheckOut && isReservationCheckoutEligible(r)
  );
  if (!records.length) return;

  const now = Date.now();
  const state = cvrCheckoutToastState();
  let changed = false;

  records.forEach((r) => {
    const scheduledMs = new Date(r.scheduledCheckOut).getTime();
    if (Number.isNaN(scheduledMs)) return;
    const minutesUntil = (scheduledMs - now) / 60000;

    let stage = "none";
    if (minutesUntil <= 0) stage = "overdue";
    else if (minutesUntil <= CVR_CHECKOUT_WARNING_MINUTES) stage = "approaching";
    if (stage === "none") return;

    const roomLabel = r.roomName || "your room";
    const prev = state[r.id];

    if (stage === "approaching" && prev?.stage !== "approaching" && prev?.stage !== "overdue") {
      const minutesLabel = Math.max(1, Math.round(minutesUntil));
      cvrToast(
        `Heads up — your check-out time for ${roomLabel} is in about ${minutesLabel} minute${minutesLabel !== 1 ? "s" : ""} (${r.checkOutLabel || ""}). Please prepare to check out.`,
        "warning"
      );
      state[r.id] = { stage, lastShownAt: now };
      changed = true;
    } else if (stage === "overdue" && (!prev || prev.stage !== "overdue" || now - prev.lastShownAt >= CVR_CHECKOUT_OVERDUE_RENUDGE_MS)) {
      const live = getLiveOvertimeStatus(r);
      const penaltyNote = live.isLate
        ? ` An overtime penalty of ${window.CVRBookingCatalog?.formatMoney?.(live.penaltyAmount, r.currency) || live.penaltyAmount} applies so far.`
        : "";
      cvrToast(
        `Your fixed check-out time for ${roomLabel} has passed. Please check out now to avoid further overtime charges.${penaltyNote}`,
        "danger"
      );
      state[r.id] = { stage, lastShownAt: now };
      changed = true;
    }
  });

  if (changed) cvrSaveCheckoutToastState(state);
}
window.cvrCheckCheckoutApproaching = cvrCheckCheckoutApproaching;

function cvrWatchMyReservationStatuses() {
  if (window.__cvrStatusWatchBound) return;
  window.__cvrStatusWatchBound = true;

  let lastFingerprint = cvrStatusFingerprint();
  cvrCheckCheckoutApproaching();

  const check = async () => {
    if (document.hidden) return;
    await refreshMyReservationsFromServer();
    cvrCheckCheckoutApproaching();
    const next = cvrStatusFingerprint();
    if (next !== lastFingerprint) {
      lastFingerprint = next;
      document.dispatchEvent(new CustomEvent("cvr-reservations-synced"));
      window.location.reload();
    }
  };

  setInterval(check, 30000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) check();
  });
}
window.cvrWatchMyReservationStatuses = cvrWatchMyReservationStatuses;

function initReservationFormPage() {
  const cat = window.CVRBookingCatalog;
  const editCtx = getReservationEditContext();
  let pending = cat?.getPendingReservation?.();
  const noPending = document.getElementById("reservationNoPending");
  const layout = document.getElementById("reservationFormLayout");
  const hint = document.getElementById("reservationFlowHint");
  const banner = document.getElementById("reservationModeBanner");
  const submitBtn = document.getElementById("submitReservationBtn");

  if (!cat || !layout) return;

  if (editCtx?.invalid) {
    noPending?.classList.remove("d-none");
    if (noPending) noPending.textContent = "This reservation cannot be edited or has already been confirmed. View status from your dashboard.";
    layout.classList.add("d-none");
    return;
  }

  let editRecord = null;
  if (editCtx?.record) {
    editRecord = editCtx.record;
    pending = reservationToPending(editRecord);
    cat.setPendingReservation(pending);
    if (banner) {
      banner.classList.remove("d-none");
      banner.innerHTML =
        editCtx.mode === "reschedule"
          ? `<strong>Reschedule request.</strong> Update your dates or time below. Availability will be checked before confirmation. Reservation <strong>${escapeHtml(editRecord.id)}</strong>.`
          : `<strong>Edit reservation.</strong> Update your booking details below, then review and confirm. Reservation <strong>${escapeHtml(editRecord.id)}</strong>.`;
    }
    if (submitBtn) submitBtn.textContent = editCtx.mode === "reschedule" ? "Review reschedule" : "Review changes";
  }

  if (!pending) {
    noPending?.classList.remove("d-none");
    if (noPending) {
      const session = getCustomerSession();
      noPending.innerHTML = `No package or event selected. <a href="${pageUrl("booking.html")}">Return to bookings</a> to choose a room or event.${
        session ? ` Or open <a href="${pageUrl("customer-dashboard.html")}">your dashboard</a> for existing reservations.` : ""
      }`;
    }
    layout.classList.add("d-none");
    return;
  }

  noPending?.classList.add("d-none");
  layout.classList.remove("d-none");
  populateGuestFieldsFromSessionOrRecord(editRecord);

  const guestInput = document.getElementById("resGuestCount");
  if (guestInput) {
    guestInput.addEventListener("input", () => {
      if (typeof window.__cvrRecalcReservationSummary === "function") window.__cvrRecalcReservationSummary();
    });
  }

  const excludeId = editRecord?.id || "";

  document.getElementById("cvrResCheckInTimeWrap")?.classList.remove("d-none");
  setResCheckInTimeSelection(pending.customCheckInTime || "");
  ["cvrResCheckInHour", "cvrResCheckInMinute", "cvrResCheckInMeridiem"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", () => {
      if (typeof window.__cvrRecalcReservationSummary === "function") window.__cvrRecalcReservationSummary();
    });
  });

  if (pending.bookingType === "room") {
    const pkg = cat.getRoomPackageById(pending.packageId);
    if (!pkg) {
      showReservationFormAlert("Invalid package. Please return to the booking page and choose a room again.", true);
      layout.classList.add("d-none");
      return;
    }
    if (hint) hint.textContent = editCtx ? "Update your room details, add-ons, and dates as needed." : "Review your room and dates, then enter guest details.";
    document.getElementById("eventSummaryPanel")?.classList.add("d-none");
    document.getElementById("eventMotifPanel")?.classList.add("d-none");
    document.getElementById("selectedPackagePanel")?.classList.remove("d-none");
    document.getElementById("eventDateRescheduleWrap")?.classList.add("d-none");

    const img = document.getElementById("summaryPackageImage");
    if (img) { img.src = cvrResolvePackageImage(pkg.image); img.alt = pkg.title; }
    document.getElementById("summaryPackageTitle").textContent = pkg.title;
    document.getElementById("summaryPackageTagline").textContent = pkg.tagline;
    document.getElementById("summaryPackageDescription").textContent = pkg.description;
    document.getElementById("summaryPackageMeta").innerHTML = `${pkg.areaSqm} m² · ${pkg.bed} · ${pkg.capacity.min}–${pkg.capacity.max} guests · Standard check-in ${pkg.standardCheckIn}`;
    document.getElementById("summaryPackageInclusions").innerHTML = `<span class="fw-semibold text-brand">Includes:</span> ${pkg.inclusions.join(", ")}`;

    if (guestInput) {
      guestInput.min = String(pkg.capacity.min);
      guestInput.max = String(pkg.capacity.max);
      guestInput.value = String(pending.guests || editRecord?.guests || 2);
    }

    renderPackageAddOnsUI(cat, "room", pkg.id, pending.selectedAddOns || editRecord?.selectedAddOns || []);

    const checkInEl = document.getElementById("resCheckIn");
    const checkOutEl = document.getElementById("resCheckOut");
    if (checkInEl && checkOutEl) {
      checkInEl.value = pending.checkInDate || "";
      checkOutEl.value = pending.checkOutDate || "";
    }

    const recalc = () => updateRoomFormSummary(cat, pkg);
    window.__cvrRecalcReservationSummary = recalc;

    window.__cvrReservationFlow = { type: "room", pkg, pending, guestCount: parseInt(guestInput?.value, 10) || 2, editId: excludeId, mode: editCtx?.mode || "new", original: editRecord };
    if (typeof window.initReservationAvailabilityCalendars === "function") {
      window.initReservationAvailabilityCalendars({ packageId: pending.packageId, roomTitle: pkg.title, excludeReservationId: excludeId, onChange: recalc });
    } else {
      ["resCheckIn", "resCheckOut"].forEach((id) => document.getElementById(id)?.addEventListener("change", recalc));
    }
    recalc();
  } else if (pending.bookingType === "event") {
    if (hint) hint.textContent = editCtx ? "Update event details and add-ons as needed." : "Confirm your event and guest contact details.";
    document.getElementById("eventSummaryPanel")?.classList.remove("d-none");
    document.getElementById("selectedPackagePanel")?.classList.remove("d-none");

    const img = document.getElementById("summaryPackageImage");
    if (img) {
      const eventPkg = cat.getEventPackageCatalog?.(pending.packageOption);
      img.src = cvrResolvePackageImage(eventPkg?.image || "../images/booking-photo-3.png");
      img.alt = pending.packageOption || "Event venue";
    }
    document.getElementById("summaryPackageTitle").textContent = `Event: ${pending.eventType}`;
    document.getElementById("summaryPackageTagline").textContent = pending.packageOption || "Custom resort event";
    document.getElementById("summaryPackageDescription").textContent = pending.additionalNotes || "Our events team will confirm setup after payment verification.";
    document.getElementById("summaryPackageMeta").textContent = `Up to ${pending.eventGuests} guests`;
    document.getElementById("summaryPackageInclusions").textContent = "";

    const list = document.getElementById("eventSummaryList");
    if (list) {
      const spansDays = pending.checkOutDate && pending.checkOutDate !== pending.preferredDate;
      list.innerHTML = `
        <li><strong>Type:</strong> ${escapeHtml(pending.eventType)}</li>
        <li><strong>Package:</strong> ${escapeHtml(pending.packageOption || "—")}</li>
        <li><strong>${spansDays ? "Start date" : "Date"}:</strong> ${formatDateReserved(pending.preferredDate)}</li>
        ${spansDays ? `<li><strong>End date:</strong> ${formatDateReserved(pending.checkOutDate)}</li>` : ""}
        ${pending.durationKey === "extended" && pending.extendedNights ? `<li><strong>Nights:</strong> ${escapeHtml(String(pending.extendedNights))}</li>` : ""}
        ${pending.eventTime ? `<li><strong>Time:</strong> ${escapeHtml(pending.eventTime)}</li>` : ""}
      `;
    }

    renderPackageAddOnsUI(cat, "event", pending.packageOption || "", pending.selectedAddOns || editRecord?.selectedAddOns || []);

    const timeEl = document.getElementById("resEventTime");
    // Duration is fixed by the selected package (set on the booking page), so no selector here.
    const initialDuration = pending.durationKey && window.CVRDuration?.get(pending.durationKey) ? pending.durationKey : "12hr";
    pending.durationKey = initialDuration;

    if (guestInput) {
      const pkgCat = cat.getEventPackageCatalog(pending.packageOption || "");
      guestInput.min = "1";
      guestInput.max = String(pkgCat?.maxPax || pkgCat?.pax || pending.eventGuests || 999);
      guestInput.value = String(pending.eventGuests || editRecord?.guests || 1);
    }

    document.getElementById("resCheckIn").value = pending.preferredDate;
    document.getElementById("resCheckOut").value = pending.preferredDate;
    document.getElementById("roomDateCalendarsWrap")?.classList.add("d-none");
    document.getElementById("stayDatesHint")?.classList.add("d-none");

    const recalc = () => updateEventFormSummary(cat, pending);
    window.__cvrRecalcReservationSummary = recalc;
    window.__cvrReservationFlow = { type: "event", pending, guestCount: pending.eventGuests, editId: excludeId, mode: editCtx?.mode || "new", original: editRecord };

    const evDateWrap = document.getElementById("eventDateRescheduleWrap");
    const evDateHidden = document.getElementById("resEventDate");
    if (evDateWrap && evDateHidden) {
      evDateWrap.classList.remove("d-none");
      evDateHidden.value = pending.preferredDate || "";
      if (typeof window.initEventPreferredDateCalendar === "function") {
        window.initEventPreferredDateCalendar({
          excludeReservationId: excludeId,
          mountId: "cvrEventRescheduleMount",
          hiddenId: "resEventDate",
          onChange: recalc,
        });
      }
    }

    const stayH = document.querySelector("#stayDetailsPanel h4");
    if (stayH) stayH.textContent = "Event schedule & guests";

    timeEl?.addEventListener("change", recalc);
    recalc();
  }
}

function initReservationSubmission() {
  const submitBtn = document.getElementById("submitReservationBtn");
  const confirmBtn = document.getElementById("resConfirmProceedBtn");
  if (!submitBtn) return;

  submitBtn.addEventListener("click", () => {
    const cat = window.CVRBookingCatalog;
    const flow = window.__cvrReservationFlow;

    const pending = flow?.pending || cat?.getPendingReservation?.();
    if (!pending || !cat?.getPendingReservation?.()) {
      showReservationFormAlert("Session expired. Go back to bookings and select a package again.", true);
      return;
    }

    const built = buildReservationFromForm(cat, pending, flow);
    if (built.error) {
      showReservationFormAlert(built.error, true);
      return;
    }

    const availabilityError = reservationAvailabilityError(built.reservation, flow?.editId || "");
    if (availabilityError) {
      showReservationFormAlert(availabilityError, true);
      return;
    }

    const changeHtml = flow?.original ? buildChangeSummary(flow.original, built.reservation) : "";
    showReservationConfirmModal(built.reservation, changeHtml);
    window.__cvrPendingConfirmMeta = { isUpdate: built.isUpdate, existing: built.existing, flow };
  });

  confirmBtn?.addEventListener("click", () => {
    const reservation = window.__cvrPendingConfirmReservation;
    const meta = window.__cvrPendingConfirmMeta;
    if (!reservation || !meta) return;

    const lateError = reservationAvailabilityError(reservation, meta.flow?.editId || "");
    if (lateError) {
      const modalEl = document.getElementById("reservationConfirmModal");
      if (window.bootstrap?.Modal) bootstrap.Modal.getInstance(modalEl)?.hide();
      showReservationFormAlert(lateError, true);
      return;
    }
    persistReservationRecord(reservation, meta.isUpdate, meta.existing, meta.flow);

    const modalEl = document.getElementById("reservationConfirmModal");
    bootstrap.Modal.getInstance(modalEl)?.hide();
    try {
      sessionStorage.setItem(
        "cvrBookingSuccessToast",
        JSON.stringify({ isUpdate: Boolean(meta.isUpdate), id: reservation.id })
      );
    } catch {}
    window.location.href = pageUrl(`quotation.html?res=${encodeURIComponent(reservation.id)}`);
  });
}

function initQuotationReviewPage() {
  const root = document.querySelector(".quotation-page");
  if (!root) return;

  const paramId = new URLSearchParams(window.location.search).get("res");
  if (paramId) localStorage.setItem("cvrActiveReservationId", paramId);
  const id = resolveActiveReservationId();
  const records = getStoredReservations();
  const record = records.find((item) => item.id === id);
  const cat = window.CVRBookingCatalog;

  const setText = (elId, text) => {
    const el = document.getElementById(elId);
    if (el) el.textContent = text;
  };

  if (!record) {
    document.getElementById("quotationEmptyState")?.classList.remove("d-none");
    document.getElementById("quotationContent")?.classList.add("d-none");
    return;
  }

  ensureReservationQuotation(record);
  const q = record.quotation;
  setText("quotationReservationId", record.id);
  setText("quotationGuestName", record.customerName || "Guest");
  setText("quotationPackageName", record.roomName || record.packageOption || "Reservation");
  setText("quotationDateLabel", formatDateReserved(record.checkIn || record.preferredDate));

  const schedIn = record.checkInLabel
    ? `${formatDateReserved(record.checkIn || record.preferredDate)} at ${record.checkInLabel}`
    : formatDateReserved(record.checkIn || record.preferredDate);
  const schedOut = record.checkOutLabel ? ` → Check-out ${formatDateReserved(record.checkOut || record.preferredDate)} at ${record.checkOutLabel}` : "";
  const durPrefix = record.durationLabel ? `${record.durationLabel} · ` : "";
  setText("quotationScheduleLabel", `${durPrefix}Check-in ${schedIn}${schedOut}${record.customCheckInTime ? " (your requested arrival time)" : ""}`);

  const statusEl = document.getElementById("quotationStatusChip");
  if (statusEl) {
    statusEl.textContent = q.status;
    statusEl.className = `status-chip ${getQuotationStatusChipClass(q.status)}`;
  }

  const breakdown = document.getElementById("quotationBreakdown");
  if (breakdown) breakdown.innerHTML = renderQuotationBreakdownHtml(record, cat);

  window.initResponsiveEnhancements?.();

  const totalEl = document.getElementById("quotationTotalAmount");
  if (totalEl) totalEl.textContent = record.totalAmount || cat?.formatMoney(q.totalNumeric, q.currency);

  const dpPctEl = document.getElementById("quotationDownpaymentPercent");
  const dpAmtEl = document.getElementById("quotationDownpaymentAmount");
  const balAmtEl = document.getElementById("quotationBalanceAmount");
  const dpFmt = (n) => (cat ? cat.formatMoney(n, q.currency || record.currency || "PHP") : String(n));
  if (dpPctEl) dpPctEl.textContent = q.downpaymentPercent ?? record.downpaymentPercent ?? 50;
  if (dpAmtEl) dpAmtEl.textContent = dpFmt(q.downpaymentAmount ?? record.downpaymentAmount ?? 0);
  if (balAmtEl) balAmtEl.textContent = dpFmt(q.balanceAmount ?? record.balanceAmount ?? 0);

  const versionEl = document.getElementById("quotationVersion");
  if (versionEl) versionEl.textContent = `Version ${q.version || 1}`;

  const alertEl = document.getElementById("quotationStatusAlert");
  const acceptBtn = document.getElementById("quotationAcceptBtn");
  const payBtn = document.getElementById("quotationProceedPayBtn");
  const msgEl = document.getElementById("quotationActionMessage");

  if (q.status === "Pending Admin Review") {
    alertEl?.classList.remove("d-none");
    if (alertEl) {
      alertEl.className = "alert alert-warning small";
      alertEl.textContent =
        "Your special requests are being reviewed. Our team will prepare a final quotation with pricing before you can proceed to payment.";
    }
    acceptBtn?.classList.add("d-none");
    payBtn?.classList.add("d-none");
  } else if (q.status === "Accepted by Client") {
    alertEl?.classList.remove("d-none");
    if (alertEl) {
      alertEl.className = "alert alert-success small";
      alertEl.textContent = "You accepted this quotation. Proceed to payment using the amount shown below.";
    }
    acceptBtn?.classList.add("d-none");
    payBtn?.classList.remove("d-none");
    if (payBtn) payBtn.href = pageUrl(`payment.html?res=${encodeURIComponent(record.id)}`);
  } else if (canClientAcceptQuotation(record)) {
    alertEl?.classList.remove("d-none");
    if (alertEl) {
      alertEl.className = "alert alert-info small";
      alertEl.textContent = "Please review the breakdown below. Accept the quotation to continue to payment.";
    }
    acceptBtn?.classList.remove("d-none");
    payBtn?.classList.add("d-none");
  } else {
    alertEl?.classList.add("d-none");
    acceptBtn?.classList.add("d-none");
    payBtn?.classList.add("d-none");
  }

  acceptBtn?.addEventListener("click", () => {
    if (msgEl) msgEl.textContent = "";
    const result = acceptReservationQuotation(record.id);
    if (!result.ok) {
      if (msgEl) {
        msgEl.className = "small mt-2 text-danger";
        msgEl.textContent = result.error;
      }
      return;
    }
    window.location.reload();
  });
}

function showPaymentQuotationGate(record) {
  if (!record || canClientPayReservation(record)) return;
  const page = document.querySelector(".payment-page");
  if (!page || document.getElementById("paymentQuotationGate")) return;

  ensureReservationQuotation(record);
  const q = record.quotation;
  const banner = document.createElement("div");
  banner.id = "paymentQuotationGate";
  banner.className = "alert alert-warning mb-4";
  banner.innerHTML = `
    <strong>Quotation review required.</strong>
    ${q?.status === "Pending Admin Review"
      ? "Your quotation is still being prepared by our team. You will be notified when it is ready."
      : "Please review and accept your quotation before uploading payment proof."}
    <div class="mt-3">
      <a href="${pageUrl(`quotation.html?res=${encodeURIComponent(record.id)}`)}" class="btn btn-sm btn-brand">Review quotation</a>
    </div>`;

  const title = page.querySelector(".payment-title");
  title?.insertAdjacentElement("afterend", banner);

  document.getElementById("paymentUploadPanel")?.classList.add("opacity-50");
  document.getElementById("proofSubmitBtn")?.setAttribute("disabled", "disabled");
  document.getElementById("proofFile")?.setAttribute("disabled", "disabled");
  document.getElementById("paymentTermsAccept")?.setAttribute("disabled", "disabled");
}

function initPaymentPageSummary() {
  const cat = window.CVRBookingCatalog;
  const params = new URLSearchParams(window.location.search);
  const paramId = params.get("res");
  if (paramId) localStorage.setItem("cvrActiveReservationId", paramId);
  const id = localStorage.getItem("cvrActiveReservationId");
  const records = getStoredReservations();
  const r = records.find((item) => item.id === id);
  const resEl = document.getElementById("paymentReservationId");
  if (resEl && r) resEl.textContent = r.id;

  const backLink = document.querySelector(".payment-back-link");
  if (backLink && r) {
    backLink.href = pageUrl(`quotation.html?res=${encodeURIComponent(r.id)}`);
    backLink.innerHTML = '<i class="bi bi-chevron-left"></i> Back to Quotation';
  } else if (backLink) {
    const session = getCustomerSession();
    backLink.href = pageUrl(session ? "customer-dashboard.html" : "booking.html");
    backLink.innerHTML = `<i class="bi bi-chevron-left"></i> Back to ${session ? "Dashboard" : "Booking"}`;
  }

  const setTxt = (nid, text) => {
    const n = document.getElementById(nid);
    if (n) n.textContent = text;
  };

  if (!r) {
    setTxt("payRoomName", "—");
    setTxt("payLineNights", "—");
    setTxt("paySubtotal", "—");
    setTxt("payTotal", "—");
    showPaymentEmptyState();
    return;
  }

  document.getElementById("paymentEmptyBanner")?.remove();

  ensureReservationQuotation(r);
  showPaymentQuotationGate(r);

  if (typeof window.cvrLoadLegalDoc === "function") {
    const docType = r.bookingType === "event" ? "event" : "room";
    window.cvrLoadLegalDoc(docType, "paymentTermsDoc").then(() => {
      document.getElementById("paymentTermsDoc")?.querySelector(".cvr-legal-card")?.classList.add("cvr-legal-compact");
    });
  }

  const quoteBreakdown = document.getElementById("paymentQuotationBreakdown");
  if (quoteBreakdown) quoteBreakdown.innerHTML = renderQuotationBreakdownHtml(r, cat);
  window.initResponsiveEnhancements?.();

  setTxt("payRoomName", r.roomName || "Reservation");
  setTxt("payNightsLabel", r.bookingType === "event" ? "Event" : "Stay");
  const nightsLabel = r.bookingType === "event" ? "Package total" : (r.durationLabel || formatStayLength(r.nights));
  setTxt("payLineNights", nightsLabel);
  const fmt = (v) => (cat ? cat.formatMoney(v, r.currency || "PHP") : String(v));
  setTxt("paySubtotal", r.roomSubtotal != null ? fmt(r.roomSubtotal) : "—");
  setTxt("payPackageTotal", r.totalAmount || fmt(r.totalNumeric));
  const dpPercent = r.downpaymentPercent ?? (cat ? cat.DOWNPAYMENT_PERCENT : 50);
  const dpAmount = r.downpaymentAmount != null ? r.downpaymentAmount : (cat ? cat.computeDownpayment(r.totalNumeric).downpayment : r.totalNumeric);
  const balAmount = r.balanceAmount != null ? r.balanceAmount : (cat ? cat.computeDownpayment(r.totalNumeric).balance : 0);
  setTxt("payDownpaymentPercent", dpPercent);
  setTxt("payBalanceDue", fmt(balAmount));
  setTxt("payTotal", fmt(dpAmount));

  const addRow = document.getElementById("payAddOnsRow");
  const addAmt = document.getElementById("payAddOns");
  if (r.addOnsTotal > 0 && addRow && addAmt) {
    addRow.classList.remove("d-none");
    addAmt.textContent = fmt(r.addOnsTotal);
  } else if (addRow) {
    addRow.classList.add("d-none");
  }

  const detail = document.getElementById("payDetailLines");
  if (detail) {
    const parts = [];
    if (r.motif?.label) parts.push(`Motif: ${r.motif.label}`);
    if (r.eventTime) parts.push(`Time: ${r.eventTime}`);
    const payCheckOutVal = r.checkOut || r.checkOutDate || "";
    const payCheckInVal = r.checkIn || r.preferredDate || "";
    if (payCheckOutVal && payCheckInVal && payCheckOutVal !== payCheckInVal) {
      parts.push(`End date: ${formatDateReserved(payCheckOutVal)}`);
    }
    if (r.addOnLines?.length) parts.push(`Add-ons: ${r.addOnLines.map((l) => l.label).join(", ")}`);
    if (r.specialRequests) parts.push(`Requests: ${r.specialRequests.slice(0, 80)}${r.specialRequests.length > 80 ? "…" : ""}`);
    detail.innerHTML = parts.map((p) => `<div>${escapeHtml(p)}</div>`).join("");
  }
}

function showPaymentEmptyState() {
  const page = document.querySelector(".payment-page");
  if (!page || document.getElementById("paymentEmptyBanner")) return;

  const session = getCustomerSession();
  const banner = document.createElement("div");
  banner.id = "paymentEmptyBanner";
  banner.className = "alert alert-info mb-4";
  banner.innerHTML = `
    <strong>No active reservation.</strong>
    Start a new booking or open your dashboard to pay for an existing reservation.
    <div class="d-flex flex-wrap gap-2 mt-3">
      <a href="${pageUrl("booking.html")}" class="btn btn-sm btn-brand">Book now</a>
      ${session ? `<a href="${pageUrl("customer-dashboard.html")}" class="btn btn-sm btn-outline-primary">My dashboard</a>` : `<a href="${pageUrl("login.html")}" class="btn btn-sm btn-outline-primary">Sign in</a>`}
    </div>`;

  const title = page.querySelector(".payment-title");
  if (title?.parentElement) {
    title.insertAdjacentElement("afterend", banner);
  } else {
    page.querySelector(".container")?.prepend(banner);
  }

  const uploadPanel = document.getElementById("paymentUploadPanel");
  uploadPanel?.classList.add("opacity-50");
  document.getElementById("proofSubmitBtn")?.setAttribute("disabled", "disabled");
  document.getElementById("proofFile")?.setAttribute("disabled", "disabled");
}

function showReservationStatusEmptyState() {
  const page = document.querySelector(".reservation-status-page");
  if (!page) return;

  document.querySelector(".reservation-success-card")?.classList.add("d-none");
  document.querySelector(".reservation-status-layout")?.classList.add("d-none");

  let empty = document.getElementById("reservationStatusEmpty");
  if (!empty) {
    empty = document.createElement("div");
    empty.id = "reservationStatusEmpty";
    page.querySelector(".container")?.appendChild(empty);
  }

  const session = getCustomerSession();
  empty.className = "soft-card p-5 text-center";
  empty.innerHTML = `
    <i class="bi bi-calendar-x fs-1 text-primary mb-3 d-block"></i>
    <h2 class="h4 text-brand mb-2">No reservation to display</h2>
    <p class="text-muted-brand mb-4">Book a stay or event, or sign in to view reservations linked to your account.</p>
    <div class="d-flex flex-wrap justify-content-center gap-2">
      <a href="${pageUrl("booking.html")}" class="btn btn-brand">Start booking</a>
      ${session ? `<a href="${pageUrl("customer-dashboard.html")}" class="btn btn-outline-primary">My dashboard</a>` : `<a href="${pageUrl("login.html")}" class="btn btn-outline-primary">Sign in</a>`}
    </div>`;
}

function initPaymentTermsGate() {
  const terms = document.getElementById("paymentTermsAccept");
  const submitBtn = document.getElementById("proofSubmitBtn");
  const fileInput = document.getElementById("proofFile");
  const hint = document.getElementById("paymentTermsGateHint");
  if (!terms || !submitBtn) return;

  const sync = () => {
    const noReservation = Boolean(document.getElementById("paymentEmptyBanner"));
    const quotationBlocked = Boolean(document.getElementById("paymentQuotationGate"));
    const ok = terms.checked && !noReservation && !quotationBlocked;
    submitBtn.disabled = !ok;
    if (fileInput) fileInput.disabled = !ok;
    if (hint) hint.classList.toggle("d-none", ok);
  };
  terms.addEventListener("change", sync);
  sync();
}

async function initPaymentQrDisplay() {
  const img = document.getElementById("paymentQrImage");
  if (!img) return;
  const placeholder = document.getElementById("paymentQrPlaceholder");
  const labelEl = document.getElementById("paymentQrLabel");

  const showUnavailable = () => {
    img.classList.add("d-none");
    img.removeAttribute("src");
    placeholder?.classList.remove("d-none");
  };

  try {
    const { ok, body } = await cvrApiGet("content/payment-qr");
    const qr = ok && body?.success ? body.data.paymentQr : null;
    if (!qr?.configured || !qr.url) {
      showUnavailable();
      return;
    }
    img.onerror = () => {
      img.onerror = null;
      showUnavailable();
    };

    img.src = `${qr.url}?t=${Date.now()}`;
    img.classList.remove("d-none");
    placeholder?.classList.add("d-none");
    if (labelEl && qr.label) labelEl.textContent = qr.label;
  } catch (err) {
    showUnavailable();
  }
}

const BLOCKED_PROOF_FILE_EXTENSIONS = new Set([
  "exe", "msi", "bat", "cmd", "com", "scr", "vbs", "vbe", "js", "jse", "wsf", "wsh",
  "ps1", "psm1", "sh", "bash", "php", "php3", "php4", "php5", "phtml", "cgi", "pl",
  "py", "jar", "apk", "app", "dmg", "html", "htm", "svg", "swf", "reg", "lnk", "hta",
]);

function isBlockedProofFileExtension(ext) {
  return BLOCKED_PROOF_FILE_EXTENSIONS.has(String(ext || "").toLowerCase());
}

function initQrPaymentUpload() {
  initPaymentTermsGate();
  initPaymentQrDisplay();
  const form = document.getElementById("proofUploadForm");
  if (!form) return;

  const fileInput = document.getElementById("proofFile");
  const message = document.getElementById("proofUploadMessage");
  const filenameLabel = document.getElementById("proofFileName");
  const maxBytes = 5 * 1024 * 1024;
  const reservationIdText = document.getElementById("paymentReservationId");

  if (!fileInput || !message) return;

  const activeId = localStorage.getItem("cvrActiveReservationId");
  const records = getStoredReservations();
  const targetRecord = records.find((item) => item.id === activeId) || null;
  if (targetRecord && reservationIdText) reservationIdText.textContent = targetRecord.id;

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    filenameLabel.textContent = file ? `Selected: ${file.name}` : "No file chosen";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.className = "small mt-2";
    message.textContent = "";

    const termsOk = document.getElementById("paymentTermsAccept")?.checked;
    if (!termsOk) {
      message.classList.add("text-danger");
      message.textContent = "Please accept the Terms & Conditions before submitting payment.";
      return;
    }

    const activeReservationId = localStorage.getItem("cvrActiveReservationId");
    const latestRecords = getStoredReservations();
    const target = latestRecords.find((item) => item.id === activeReservationId);
    if (!target) {
      message.classList.add("text-danger");
      message.textContent = "Reservation not found. Please submit reservation details again.";
      return;
    }

    if (!canClientPayReservation(target)) {
      message.classList.add("text-danger");
      message.textContent = "Please review and accept your quotation before submitting payment.";
      return;
    }

    const file = fileInput.files?.[0];
    if (!file) {
      message.classList.add("text-danger");
      message.textContent = "Please upload your proof of payment.";
      return;
    }

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const safeName = file.name.replace(/[^\w.\-]/g, "_");

    if (isBlockedProofFileExtension(ext)) {
      message.classList.add("text-danger");
      message.textContent = "That file type isn't allowed for security reasons. Please upload your receipt as a photo, PDF, or document file instead.";
      return;
    }

    if (file.size > maxBytes) {
      message.classList.add("text-danger");
      message.textContent = "File too large. Maximum size is 5MB.";
      return;
    }

    const submitBtn = document.getElementById("proofSubmitBtn");
    const originalBtnText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";
    }
    message.classList.add("text-muted-brand");
    message.textContent = "Uploading your proof of payment…";

    const amountFormatted = target.downpaymentAmountFormatted || target.totalAmount || "";
    let uploaded = null;
    try {
      const formData = new FormData();
      formData.append("proof", file);
      formData.append("reservationId", target.id);
      formData.append("customerName", target.customerName || "");
      formData.append("email", target.email || "");
      formData.append("phone", target.phone || target.contactNumber || "");
      formData.append("amount", amountFormatted);
      formData.append("packageName", target.roomName || target.eventType || "");
      formData.append("paymentMethod", "QR / GCash");

      const { body } = await cvrApiPostForm("content/payment-proof", formData);
      if (!body?.success) {
        throw new Error(body?.message || "Upload failed. Please try again.");
      }
      uploaded = body.data || {};
    } catch (error) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
      message.className = "small mt-2 text-danger";
      message.textContent = error?.message || "We couldn't upload your proof of payment. Please try again.";
      return;
    }

    target.paymentStatus = "Waiting for Verification";
    target.paymentMethod = "QR / GCash";
    target.paymentType = "downpayment";
    target.termsAcceptedAt = new Date().toISOString();
    target.proofOfPayment = {
      filename: uploaded?.fileName || safeName,
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      storageRef: uploaded?.filePath || `proofs/${target.id}/${Date.now()}-${safeName}`,
      fileUrl: uploaded?.fileUrl || "",
      serverId: uploaded?.id || null,
      amount: target.downpaymentAmount ?? target.totalNumeric,
      amountFormatted,
    };

    saveStoredReservations(latestRecords);
    syncReservationToServer(target, true);
    localStorage.setItem("cvrActiveReservationId", target.id);
    try {
      sessionStorage.setItem("cvrPaymentSubmittedToast", JSON.stringify({ id: target.id }));
    } catch {}
    window.location.href = "reservation-status.html";
  });
}

async function initReservationStatusView() {
  const statusChip = document.getElementById("reservationPaymentStatusChip");
  const reservationId = document.getElementById("reservationStatusId");
  const proofText = document.getElementById("reservationProofText");
  const reservedDate = document.getElementById("reservationDateReserved");
  const receiptWrap = document.getElementById("reservationReceiptWrap");
  const downloadReceiptBtn = document.getElementById("downloadReceiptBtn");
  if (!statusChip || !reservationId || !proofText || !reservedDate) return;

  await refreshMyReservationsFromServer();
  cvrWatchMyReservationStatuses();

  const paramId = new URLSearchParams(window.location.search).get("id");
  if (paramId) localStorage.setItem("cvrActiveReservationId", paramId);
  const activeId = resolveActiveReservationId();
  const records = getStoredReservations();
  const target = records.find((item) => item.id === activeId) || (!activeId ? records[0] : null);
  if (!target) {
    showReservationStatusEmptyState();
    return;
  }

  localStorage.setItem("cvrActiveReservationId", target.id);

  reservationId.textContent = target.id;
  reservedDate.textContent = formatDateReserved(target.dateReserved);
  statusChip.textContent = target.paymentStatus;
  statusChip.className = "status-chip " + getStatusChipClass(target.paymentStatus);

  const hero = getReservationHeroContent(target);
  const heroEl = document.getElementById("reservationStatusHero");
  const heroIconEl = document.getElementById("reservationStatusHeroIcon");
  const heroTitleEl = document.getElementById("reservationStatusHeroTitle");
  const heroSubtitleEl = document.getElementById("reservationStatusHeroSubtitle");
  if (heroEl) heroEl.style.background = hero.gradient;
  if (heroIconEl) heroIconEl.className = `bi ${hero.icon}`;
  if (heroTitleEl) heroTitleEl.textContent = hero.title;
  if (heroSubtitleEl) heroSubtitleEl.textContent = hero.subtitle;
  proofText.textContent = target.proofOfPayment
    ? `Uploaded: ${target.proofOfPayment.filename}`
    : "No proof uploaded yet.";

  const imgEl = document.getElementById("statusRoomImage");
  if (imgEl && target.roomImage) {
    imgEl.src = cvrResolvePackageImage(target.roomImage);
    imgEl.alt = target.roomName || "Booking";
  }
  const titleEl = document.getElementById("statusRoomTitle");
  if (titleEl) titleEl.textContent = target.roomName || "Reservation";
  const descEl = document.getElementById("statusRoomDesc");
  if (descEl) descEl.textContent = target.roomTagline || target.specialRequests || "Thank you for choosing Casa Vergara Resort.";

  const setIf = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setIf("statusCheckIn", target.checkInLabel ? `${formatDateReserved(target.checkIn || target.preferredDate)} at ${target.checkInLabel}` : formatDateReserved(target.checkIn || target.preferredDate));
  setIf(
    "statusCheckOut",
    target.checkedOutAt
      ? `Checked out ${formatMemberSince(target.checkedOutAt)}${target.penaltyAmount > 0 ? ` — overtime penalty applied` : ""}`
      : target.checkOutLabel
        ? `${formatDateReserved(target.checkOut)} at ${target.checkOutLabel} (strict)`
        : target.bookingType === "room"
          ? `${formatDateReserved(target.checkOut)} (anytime)`
          : "Same day (event)"
  );
  setIf("statusEventTime", target.eventTime || "—");
  setIf("statusDurationType", target.durationLabel || "—");
  setIf("statusGuests", String(target.guestsLabel || target.guests || "—"));
  setIf("statusNights", target.durationLabel || (target.nights != null ? formatStayLength(target.nights) : "—"));
  setIf("statusMotif", target.motif?.label ? `${target.motif.label} (${target.motif.colors || ""})` : "—");
  setIf("statusAddOns", target.addOnLines?.length ? target.addOnLines.map((l) => l.label).join(", ") : "None");
  setIf("statusSpecialRequests", target.specialRequests || target.eventNotes || "None");

  const cat = window.CVRBookingCatalog;
  const fmt = (v) => (cat && target.currency ? cat.formatMoney(v, target.currency) : String(v));
  if (target.roomSubtotal != null) setIf("statusPaySubtotal", fmt(target.roomSubtotal));
  if (target.addOnsTotal > 0) {
    document.getElementById("statusPayAddOnsRow")?.classList.remove("d-none");
    setIf("statusPayAddOns", fmt(target.addOnsTotal));
  }
  setIf("statusPayTotal", target.totalAmount || fmt(target.totalNumeric));
  setIf("statusDownpaymentPercent", target.downpaymentPercent ?? (cat ? cat.DOWNPAYMENT_PERCENT : 50));
  setIf("statusDownpaymentAmount", fmt(target.downpaymentAmount ?? 0));
  setIf("statusBalanceAmount", fmt(target.balanceAmount ?? 0));
  setIf("statusBalanceLabel", target.bookingType === "event" ? "the event date" : "check-in");

  const quotePanel = document.getElementById("statusQuotationPanel");
  const quoteBody = document.getElementById("statusQuotationBreakdown");
  if (quotePanel && quoteBody) {
    ensureReservationQuotation(target);
    quotePanel.classList.remove("d-none");
    quoteBody.innerHTML = renderQuotationBreakdownHtml(target, cat);
    const quoteStatusEl = document.getElementById("statusQuotationStatus");
    if (quoteStatusEl) {
      quoteStatusEl.textContent = target.quotation?.status || "—";
      quoteStatusEl.className = `status-chip ${getQuotationStatusChipClass(target.quotation?.status)}`;
    }
    const quoteLink = document.getElementById("statusQuotationLink");
    if (quoteLink) quoteLink.href = pageUrl(`quotation.html?res=${encodeURIComponent(target.id)}`);
  }
  window.initResponsiveEnhancements?.();

  const actionPanel = document.getElementById("statusActionPanel");
  const editBtn = document.getElementById("statusEditBtn");
  const rescheduleBtn = document.getElementById("statusRescheduleBtn");
  if (canClientModifyReservation(target) && actionPanel) {
    actionPanel.classList.remove("d-none");
    if (editBtn) editBtn.href = pageUrl(`reservation-form.html?edit=${encodeURIComponent(target.id)}`);
    if (rescheduleBtn) rescheduleBtn.href = pageUrl(`reservation-form.html?reschedule=${encodeURIComponent(target.id)}`);
  }

  const cancelPanel = document.getElementById("statusCancelPanel");
  const cancelBtn = document.getElementById("statusCancelBtn");
  const cancelInfo = document.getElementById("statusCancelInfo");
  const cancelledPanel = document.getElementById("statusCancelledPanel");
  const cancelledInfo = document.getElementById("statusCancelledInfo");
  const isCancelled = String(target.reservationStatus || "").toLowerCase().includes("cancel");

  if (isCancelled) {
    cancelPanel?.classList.add("d-none");
    if (cancelledPanel && cancelledInfo) {
      cancelledPanel.classList.remove("d-none");
      cancelledInfo.textContent = target.cancellationNote
        || (target.downpaymentForfeited
          ? "This reservation was cancelled. Per resort policy, the downpayment is non-refundable and was forfeited."
          : "This reservation was cancelled.");
    }
  } else {
    cancelledPanel?.classList.add("d-none");
    if (cancelPanel && cancelBtn && isReservationCancelEligible(target)) {
      cancelPanel.classList.remove("d-none");
      const forfeitable = reservationHasForfeitableDownpayment(target);
      if (cancelInfo) {
        cancelInfo.textContent = forfeitable
          ? "Cancelling this booking will NOT refund your downpayment — it is forfeited per resort policy."
          : "You haven't submitted a downpayment yet, so cancelling now forfeits nothing.";
      }
      cancelBtn.onclick = () => {
        const forfeitWarning = forfeitable
          ? " Your downpayment is NON-REFUNDABLE and will be forfeited."
          : "";
        const confirmed = window.confirm(`Cancel reservation ${target.id}?${forfeitWarning}`);
        if (!confirmed) return;
        const updated = performGuestCancel(target.id);
        if (updated) initReservationStatusView();
      };
    } else {
      cancelPanel?.classList.add("d-none");
    }
  }

  const checkoutPanel = document.getElementById("statusCheckoutPanel");
  const checkoutBtn = document.getElementById("statusCheckoutBtn");
  const checkoutInfo = document.getElementById("statusCheckoutInfo");
  if (checkoutPanel && checkoutBtn && checkoutInfo) {
    if (target.checkedOutAt) {
      checkoutPanel.classList.remove("d-none");
      checkoutBtn.classList.add("d-none");
      checkoutInfo.textContent = target.penaltyAmount > 0
        ? `You checked out on ${formatMemberSince(target.checkedOutAt)}. ${target.penaltyNote || ""}`
        : `You checked out on ${formatMemberSince(target.checkedOutAt)}, on or before your fixed check-out time. Thanks for staying with us!`;
    } else if (isReservationCheckoutEligible(target)) {
      checkoutPanel.classList.remove("d-none");
      checkoutBtn.classList.remove("d-none");
      const live = getLiveOvertimeStatus(target);
      checkoutInfo.textContent = live.isLate
        ? `Your fixed check-out time (${target.checkOutLabel || formatDateReserved(target.checkOut)}) has passed. You are ${live.overtimeHours} hour${live.overtimeHours !== 1 ? "s" : ""} over — an overtime penalty of ${fmt(live.penaltyAmount)} will be added when you check out.`
        : `Your fixed check-out time is ${target.checkOutLabel || formatDateReserved(target.checkOut)}. Please check out by then to avoid an overtime penalty.`;
      checkoutBtn.onclick = () => {
        const updated = handleGuestCheckout(target.id);
        if (updated) {
          initReservationStatusView();
          promptPostCheckoutReview(updated);
        }
      };
    } else {
      checkoutPanel.classList.add("d-none");
    }
  }

  const quickNav = document.getElementById("statusQuickNav");
  if (quickNav) {
    const session = getCustomerSession();
    const needsPay = ["Pending Payment", "Rejected"].includes(target.paymentStatus);
    quickNav.innerHTML = `
      ${needsPay && canClientPayReservation(target) ? `<a href="${pageUrl(`payment.html?res=${encodeURIComponent(target.id)}`)}" class="btn btn-brand w-100">Upload payment</a>` : ""}
      <a href="${pageUrl(`quotation.html?res=${encodeURIComponent(target.id)}`)}" class="btn btn-outline-primary w-100">View quotation</a>
      <a href="${pageUrl("booking.html")}" class="btn btn-outline-primary w-100">Book another stay</a>
      ${session ? `<a href="${pageUrl("customer-dashboard.html")}" class="btn btn-outline-secondary w-100">My dashboard</a>` : `<a href="${pageUrl("login.html")}" class="btn btn-outline-secondary w-100">Sign in</a>`}`;
  }

  const paymentApproved = ["Approved", "Verified"].includes(target.paymentStatus);
  const receipt = getReceiptByReservationId(target.id);
  const canDownload = paymentApproved && receipt && canCurrentUserDownloadReceipt(target);

  if (receiptWrap && downloadReceiptBtn) {
    receiptWrap.classList.toggle("d-none", !canDownload);
    if (canDownload) {
      downloadReceiptBtn.onclick = () => downloadReceiptPdf(receipt);
    }
  }
}

function initPaymentVerificationTable() {
  const tableBody = document.getElementById("paymentVerificationTableBody");
  if (!tableBody) return;

  const render = () => {
    const records = getStoredReservations();
    if (!records.length) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted-brand py-4">No payment submissions yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = records
      .map((record) => {
        const proofLabel = record.proofOfPayment
          ? `<span class="small">${record.proofOfPayment.filename}</span>`
          : `<span class="small text-muted-brand">No file</span>`;
        const bookingStatus = record.reservationStatus || "Awaiting Check-in";
        const receipt = getReceiptByReservationId(record.id);
        return `
          <tr data-reservation-id="${record.id}">
            <td>${record.id}</td>
            <td>${record.customerName || "Guest"}</td>
            <td>${formatDateReserved(record.dateReserved)}</td>
            <td>${proofLabel}</td>
            <td><span class="status-chip ${getStatusChipClass(record.paymentStatus)}">${record.paymentStatus}</span></td>
            <td>
              <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-sm btn-outline-primary verify-payment-btn" data-action="approve">Approve</button>
                <button class="btn btn-sm btn-outline-danger verify-payment-btn" data-action="reject">Reject</button>
                <button class="btn btn-sm btn-outline-secondary view-receipt-btn ${receipt ? "" : "d-none"}" data-action="receipt">View Receipt</button>
                <select class="form-select form-select-sm verification-reservation-status">
                  <option ${bookingStatus === "Awaiting Check-in" ? "selected" : ""}>Awaiting Check-in</option>
                  <option ${bookingStatus === "Confirmed" ? "selected" : ""}>Confirmed</option>
                  <option ${bookingStatus === "Cancelled" ? "selected" : ""}>Cancelled</option>
                </select>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    tableBody.querySelectorAll(".verify-payment-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const row = button.closest("tr");
        const id = row?.dataset.reservationId;
        if (!id) return;

        const action = button.dataset.action;
        const recordsList = getStoredReservations();
        const target = recordsList.find((item) => item.id === id);
        if (!target) return;

        if (action === "approve") {
          target.paymentStatus = "Approved";
          target.paymentApprovedAt = new Date().toISOString();
          const paymentId = target.proofOfPayment?.storageRef || target.proofOfPayment?.filename || "";
          createOrUpdateReceiptRecord(target, paymentId);
          pushCvrNotification(target.email, {
            title: "Payment verified",
            body: `Your payment for ${target.roomName || target.eventType || "your reservation"} (${target.id}) has been verified.`,
            link: `reservation-status.html?id=${encodeURIComponent(target.id)}`,
          });
        } else {
          target.paymentStatus = "Rejected";
          pushCvrNotification(target.email, {
            title: "Payment needs attention",
            body: `We couldn't verify your payment for ${target.id}. Please check your proof of payment and resubmit.`,
            link: `payment.html?res=${encodeURIComponent(target.id)}`,
          });
        }

        saveStoredReservations(recordsList);
        syncReservationToServer(target, true);
        render();
      });
    });

    tableBody.querySelectorAll(".view-receipt-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const row = button.closest("tr");
        const id = row?.dataset.reservationId;
        if (!id) return;
        const receipt = getReceiptByReservationId(id);
        if (!receipt) return;
        downloadReceiptPdf(receipt);
      });
    });

    tableBody.querySelectorAll(".verification-reservation-status").forEach((select) => {
      select.addEventListener("change", () => {
        const row = select.closest("tr");
        const id = row?.dataset.reservationId;
        if (!id) return;
        const recordsList = getStoredReservations();
        const target = recordsList.find((item) => item.id === id);
        if (!target) return;
        target.reservationStatus = select.value;
        saveStoredReservations(recordsList);
        syncReservationToServer(target, true);

        const statusCopy = {
          "Confirmed": "Your booking has been confirmed! We're looking forward to hosting you.",
          "Cancelled": "Your booking has been cancelled. Contact us if this doesn't look right.",
          "Awaiting Check-in": "Your booking is set — we'll see you at check-in.",
        };
        pushCvrNotification(target.email, {
          title: `Booking ${select.value.toLowerCase()}`,
          body: statusCopy[select.value] || `Your reservation ${target.id} status is now "${select.value}".`,
          link: `reservation-status.html?id=${encodeURIComponent(target.id)}`,
        });
      });
    });
  };

  render();
}

function initRevealAnimations() {
  const targets = document.querySelectorAll(".soft-card, .booking-cal-card, .section-pad h1, .section-pad h2, .landing-cta-panel");
  if (!("IntersectionObserver" in window) || !targets.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  targets.forEach((target) => {
    target.classList.add("fade-in-up");
    observer.observe(target);
  });
}

function initSitemapAdminGuard() {
  const adminLinks = document.querySelectorAll('a[href^="admin/"]');
  if (!adminLinks.length) return;

  const session = getCustomerSession();
  if (!session || isStaffSession(session)) return;

  adminLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      cvrToast("Admin Portal is for staff accounts only — here's your dashboard instead.", "info");
      window.location.replace(pageUrl("customer-dashboard.html"));
    });
  });
}
window.initSitemapAdminGuard = initSitemapAdminGuard;

const SITEMAP_PAGE_INFO = {
  "landing.html": ["Home", "The Casa Vergara front page: featured rooms and event spaces, resort highlights, guest reviews and the quickest way into the booking flow.", "Everyone"],
  "booking.html": ["Rooms & Events", "Browse every room, cottage and event package with photos, inclusions, rates and live availability, then start a reservation.", "Everyone"],
  "about.html": ["About Us", "The story behind the resort, our amenities, location details and how to reach us.", "Everyone"],
  "faq.html": ["FAQs", "Answers to common questions about booking, payments, check-in and resort policies.", "Everyone"],
  "user-manual.html": ["User Manual", "A step-by-step guide with screenshots: how to register, book a room or event, pay, track your reservation, and how staff manage the system.", "Everyone"],
  "contact-clients.html": ["Contact Clients", "The staff version of the Contact page: message clients directly and review recent conversations.", "Staff only"],
  "contact.html": ["Contact", "Send a message to the resort team, view our phone, email and address, and find us on the map.", "Everyone"],
  "privacy.html": ["Privacy Policy", "How Casa Vergara collects, uses and protects the personal information you share when booking.", "Everyone"],
  "terms.html": ["Terms & Conditions", "The booking, payment, cancellation and house rules that apply to every reservation.", "Everyone"],
  "sitemap.html": ["Site Map", "You are here — a complete map of every page on the site, grouped by who it's for.", "Everyone"],
  "login.html": ["Sign In", "Log in to your guest account to manage reservations, payments, messages and reviews.", "Guests"],
  "register.html": ["Register", "Create a guest account. We'll email you a 6-digit code to verify it before your first sign-in.", "New guests"],
  "forgot-password.html": ["Reset Password", "Request a reset code by email and set a new password for your guest account.", "Guests"],
  "customer-dashboard.html": ["My Dashboard", "Your home base: upcoming and past reservations, notifications, messages and reviews in one place.", "Signed-in guests"],
  "customer-settings.html": ["Account Settings", "Update your profile details, contact number, password and notification preferences.", "Signed-in guests"],
  "reservation-form.html": ["Reservation Details", "Fill in your stay or event details — dates, guests, package and special requests.", "Signed-in guests"],
  "quotation.html": ["Quotation", "Review the itemised cost of your reservation before you commit to paying.", "Signed-in guests"],
  "payment.html": ["Payment", "Upload your downpayment or full payment proof and submit it for verification.", "Signed-in guests"],
  "reservation-status.html": ["Reservation Status", "Track where your booking stands: pending, verified, confirmed or completed.", "Signed-in guests"],
  "customer-dashboard.html#live-chat": ["Live Chat", "Message the resort team about your reservation. Staff and admins share one inbox and either can reply.", "Signed-in guests"],
  "customer-dashboard.html#messages": ["My Messages", "Replies to your Contact Us enquiries appear here in your dashboard.", "Signed-in guests"],
  "customer-dashboard.html#reviews": ["My Reviews", "Reviews you've written about your stays, with the option to edit or remove them.", "Signed-in guests"],
  "admin/dashboard.html": ["Admin Dashboard", "Operational overview: today's arrivals, pending payments, revenue snapshot and recent activity.", "Staff only"],
  "admin/reservations.html": ["Reservations", "Full reservation list with filters, status changes, guest details and approvals.", "Staff only"],
  "admin/calendar.html": ["Booking Calendar", "Month and day view of every booking, blocked date and holiday.", "Staff only"],
  "admin/payments.html": ["Payment Verification", "Review uploaded payment proofs and approve or reject them.", "Admin only"],
  "admin/packages.html": ["Packages & Rooms", "Create and edit rooms, cottages, event packages, rates and inclusions.", "Staff only"],
  "admin/site-content.html?tab=packages": ["Packages & Rooms", "Create and edit rooms, cottages, event packages, rates and inclusions.", "Staff only"],
  "admin/messages.html": ["Messages", "Inbox for guest enquiries, plus a composer for messaging clients directly.", "Staff only"],
  "admin/team.html": ["Our Team", "Edit the About Us leadership profiles shown to guests.", "Staff only"],
  "admin/site-content.html?tab=team": ["Our Team", "Edit the About Us leadership profiles shown to guests.", "Staff only"],
  "admin/notifications.html": ["Notifications", "System and guest notifications sent from the resort.", "Staff only"],
  "admin/reviews.html": ["Reviews", "Moderate guest reviews before they appear publicly.", "Staff only"],
  "admin/site-content.html?tab=reviews": ["Reviews", "Moderate guest reviews shown on the public site.", "Staff only"],
  "admin/faqs.html": ["FAQ Manager", "Add, edit and publish the questions and predetermined answers shown on the guest-facing FAQs page.", "Staff only"],
  "admin/site-content.html?tab=faqs": ["FAQ Manager", "Add, edit and publish the questions and predetermined answers shown on the guest-facing FAQs page.", "Staff only"],
  "admin/live-chat.html": ["Live Chat", "Shared inbox for guest conversations. Authorized staff and admins can reply in the same thread.", "Staff only"],
  "admin/reports.html": ["Reports", "Occupancy, revenue and booking reports with export options.", "Staff only"],
  "admin/users.html": ["Users", "Manage guest accounts and staff access.", "Staff only"],
  "admin/legal.html": ["Legal Content", "Edit the Terms, Privacy Policy and FAQ content shown on the public site.", "Admin only"],
  "admin/site-content.html?tab=legal": ["Legal Content", "Edit the Terms, Privacy Policy and FAQ content shown on the public site.", "Admin only"],
  "admin/site-content.html?tab=text": ["Site Content — Page Text", "Edit headlines, intro copy and shared details (address, phone, footer text) shown across the public site.", "Admin only"],
  "admin/site-content.html": ["Site Content", "Manage page wording, photos, room & event packages, FAQs, legal pages and team profiles for the public site.", "Staff only"],
  "admin/settings.html": ["Settings", "Resort details, contact info, email settings and system preferences.", "Staff only"],
};

function initSitemapModals() {
  const container = document.querySelector(".sitemap-page");
  if (!container) return;

  const session = getCustomerSession();
  const blockedFromAdmin = !!session && !isStaffSession(session);

  let modalEl = document.getElementById("sitemapModal");
  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "sitemapModal";
    modalEl.className = "modal fade";
    modalEl.tabIndex = -1;
    modalEl.setAttribute("aria-hidden", "true");
    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow-lg">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title text-brand d-flex align-items-center gap-2">
              <i id="sitemapModalIcon" class="bi bi-diagram-3"></i>
              <span id="sitemapModalTitle">Page</span>
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body pt-2">
            <span id="sitemapModalAudience" class="badge rounded-pill text-bg-light mb-2"></span>
            <p id="sitemapModalDesc" class="text-muted-brand mb-2"></p>
            <p id="sitemapModalPath" class="small text-muted-brand mb-0"></p>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
            <a id="sitemapModalGo" class="btn btn-brand" href="#">Open page <i class="bi bi-arrow-right ms-1"></i></a>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modalEl);
  }

  const modal = new bootstrap.Modal(modalEl);
  const titleEl = modalEl.querySelector("#sitemapModalTitle");
  const iconEl = modalEl.querySelector("#sitemapModalIcon");
  const descEl = modalEl.querySelector("#sitemapModalDesc");
  const audienceEl = modalEl.querySelector("#sitemapModalAudience");
  const pathEl = modalEl.querySelector("#sitemapModalPath");
  const goEl = modalEl.querySelector("#sitemapModalGo");

  container.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return;

    link.addEventListener("click", (event) => {
      event.preventDefault();

      const info = SITEMAP_PAGE_INFO[href] || [
        link.textContent.trim() || "Page",
        "Open this page on Casa Vergara Resort.",
        "Everyone",
      ];
      const iconClass =
        link.querySelector("i")?.className || "bi bi-file-earmark";

      titleEl.textContent = info[0];
      iconEl.className = iconClass;
      descEl.textContent = info[1];
      audienceEl.textContent = info[2];
      pathEl.textContent = href;

      const isAdminLink = href.startsWith("admin/");
      if (isAdminLink && blockedFromAdmin) {
        descEl.textContent =
          "The Admin Portal is for staff accounts only. We'll take you to your own dashboard instead.";
        goEl.textContent = "Go to my dashboard";
        goEl.setAttribute("href", pageUrl("customer-dashboard.html"));
      } else {
        goEl.innerHTML = 'Open page <i class="bi bi-arrow-right ms-1"></i>';
        goEl.setAttribute("href", href);
      }

      modal.show();
    });
  });
}
window.initSitemapModals = initSitemapModals;

function enforceRouteGuards() {
  const path = window.location.pathname.toLowerCase();

  const onStaffBlockedBookingPage =
    path.endsWith("/pages/reservation-form.html") ||
    path.endsWith("/pages/quotation.html") ||
    path.endsWith("/pages/payment.html");

  if (onStaffBlockedBookingPage) {
    const session = getCustomerSession();
    if (session && isStaffSession(session)) {
      try {
        sessionStorage.setItem("cvrBookingBlockedToast", "1");
      } catch {}
      window.location.href = pageUrl("admin/dashboard.html");
      return false;
    }
  }

  if (path.endsWith("/pages/contact.html")) {
    const session = getCustomerSession();
    if (session && isStaffSession(session)) {
      window.location.replace(pageUrl("contact-clients.html"));
      return false;
    }
  }

  if (path.endsWith("/pages/contact-clients.html")) {
    const session = getCustomerSession();
    if (!session || !isStaffSession(session)) {
      window.location.replace(pageUrl("contact.html"));
      return false;
    }
  }

  const onCustomerProtectedPage =
    path.endsWith("/pages/customer-dashboard.html") || path.endsWith("/pages/customer-settings.html");
  const onAdminProtectedPage = path.includes("/pages/admin/");

  if (!onCustomerProtectedPage && !onAdminProtectedPage) return true;

  if (!getCustomerSession()) {
    window.location.replace(pageUrl("login.html"));
    return false;
  }

  if (onAdminProtectedPage) {
    const session = getCustomerSession();
    if (session && !isStaffSession(session)) {
      window.location.replace(pageUrl("customer-dashboard.html"));
      return false;
    }

    if (session && !isFullAdminSession(session) && path.includes("/pages/admin/payments.html")) {
      window.location.replace(pageUrl("admin/dashboard.html"));
      return false;
    }
  }

  cvrVerifyServerSession(onAdminProtectedPage);

  return true;
}

async function cvrVerifyServerSession(requireAdmin) {
  try {
    const { body } = await cvrApiGet("auth/me");
    if (!body.success) {
      clearCustomerSession();
      window.location.replace(body.data?.suspended ? pageUrl("login.html") + "?suspended=1" : pageUrl("login.html"));
      return;
    }
    const role = String(body.data.user.role || "").toLowerCase();
    if (requireAdmin && role !== "admin" && role !== "event_manager") {
      window.location.replace(pageUrl("customer-dashboard.html"));
      return;
    }
    setCustomerSession(body.data.user);
  } catch {

  }
}

function initCustomerLoginForm() {
  const form = document.getElementById("customerLoginForm");
  const alertEl = document.getElementById("customerLoginAlert");
  if (!form) return;

  const showAlert = (message, kind) => {
    if (!alertEl) return;
    alertEl.textContent = message;
    alertEl.classList.remove("d-none", "alert-success", "alert-danger");
    alertEl.classList.add(kind === "success" ? "alert-success" : "alert-danger");
  };

  const verifyStatus = new URLSearchParams(window.location.search).get("verify");
  const verifyMessages = {
    success: ["Email verified! You can now sign in.", "success"],
    already: ["Your email is already verified. Please sign in.", "success"],
    expired: ["That verification code has expired. Please sign in and use \"Resend verification code\" to get a new one.", "danger"],
    invalid: ["That verification code is invalid.", "danger"],
    missing: ["Missing verification code.", "danger"],
  };
  if (verifyStatus && verifyMessages[verifyStatus]) {
    const [msg, kind] = verifyMessages[verifyStatus];
    showAlert(msg, kind);
  }

  let lastAttemptedEmail = "";
  const MAX_LOGIN_FAILS = 5;

  const emailInput = document.getElementById("loginEmail");
  const rememberBox = document.getElementById("loginRemember");
  const savedEmail = cvrGetSavedLoginEmail();
  if (savedEmail && emailInput && !emailInput.value) {
    emailInput.value = savedEmail;
    if (rememberBox) rememberBox.checked = true;
  }

  document.getElementById("loginForgotBtn")?.addEventListener("click", () => {
    cvrOpenForgotPasswordModal(emailInput?.value.trim() || "");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (alertEl) alertEl.classList.add("d-none");

    const email = document.getElementById("loginEmail")?.value.trim() || "";
    const password = document.getElementById("loginPassword")?.value || "";
    lastAttemptedEmail = email;

    if (!isValidEmail(email)) return showAlert("Please enter a valid email address.");
    if (!password) return showAlert("Please enter your password.");

    const submitBtn = form.querySelector("button[type=submit]");
    if (submitBtn) submitBtn.disabled = true;

    try {
      const { body } = await cvrApiPost("auth/login", {
        email,
        password,

        remember: !!rememberBox?.checked,
      });

      if (!body.success) {
        if (body.data?.suspended) {
          showAlert(body.message || "This account has been suspended.");
          cvrToast(body.message || "This account has been suspended. Please contact Casa Vergara.", "danger");
        } else if (body.data?.unverified) {
          showAlert(body.message || "Please verify your email address before signing in.");
          offerResendVerification(alertEl, email);
        } else {

          const fails = recordLoginFailure(email);
          showAlert(body.message || "Invalid email or password.");
          if (body.data?.suggestReset || body.data?.lockedOut || fails >= MAX_LOGIN_FAILS) {
            offerForgotPassword(alertEl, email);
          }
        }
        return;
      }

      clearLoginFailures(email);

      if (rememberBox?.checked) cvrSaveLoginEmail(email);
      else cvrClearSavedLoginEmail();

      setCustomerSession(body.data.user);
      const role = String(body.data.user.role || "").toLowerCase();

      try {
        sessionStorage.setItem("cvrLoginToast", JSON.stringify({ name: body.data.user.firstName || "" }));
      } catch {}

      window.location.href = role === "admin" || role === "event_manager" ? "admin/dashboard.html" : "landing.html";
    } catch (err) {
      showAlert("Could not reach the server. Please make sure the site is running and try again.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function cvrOpenForgotPasswordModal(email, onDone) {
  ensureCvrSwitchAccountModal();
  const modalEl = document.getElementById("cvrSwitchAccountModal");
  const label = document.getElementById("cvrSwitchAccountModalLabel");
  if (label) label.innerHTML = '<i class="bi bi-key me-2"></i>Reset password';

  renderCvrSwitchAccountForgotStep(
    { email: email || "" },
    {
      successMessage: "Your password has been reset. You can sign in with your new password now.",
      onExit: () => {
        bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        if (typeof onDone === "function") onDone();
      },
    }
  );

  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}
window.cvrOpenForgotPasswordModal = cvrOpenForgotPasswordModal;

function initCustomerLoginPicker() {
  const picker = document.getElementById("loginPickerPanel");
  const formPanel = document.getElementById("loginFormPanel");
  const passwordPanel = document.getElementById("loginPasswordPanel");
  const listEl = document.getElementById("loginAccountList");
  if (!picker || !formPanel || !listEl) return;

  const alertEl = document.getElementById("customerLoginAlert");
  const pwAlert = document.getElementById("loginPasswordAlert");
  let accounts = [];

  const backToSavedBtn = document.getElementById("loginBackToSavedBtn");
  const backToLandingBtn = document.getElementById("loginBackToLandingBtn");

  const showPanel = createCvrPanelSwitcher({ picker, form: formPanel, password: passwordPanel }, (which) => {

    const showSavedBack = which === "form" && accounts.length > 0;
    backToSavedBtn?.classList.toggle("cvr-fade-hidden", !showSavedBack);
    // both arrows live in the same corner, so only one is visible at a time
    backToLandingBtn?.classList.toggle("cvr-fade-hidden", showSavedBack);
  });

  const showPwAlert = (message) => {
    if (!pwAlert) return;
    if (!message) return pwAlert.classList.add("d-none");
    pwAlert.textContent = message;
    pwAlert.classList.remove("d-none");
  };

  const identityHtml = (acc, large) => {
    const initials = customerProfileInitials(acc);
    const cls = "cvr-switch-account-avatar" + (large ? " cvr-switch-account-avatar--lg" : "");
    return customerAvatarSrc(acc)
      ? `<img class="${cls}" src="${customerAvatarSrc(acc)}" alt="" loading="lazy" onerror="cvrAvatarFallback(this)" />`
      : `<span class="${cls} cvr-switch-account-avatar--fallback">${escapeHtml(initials)}</span>`;
  };

  function showPasswordStep(acc) {
    showPwAlert(null);
    const identity = document.getElementById("loginPasswordIdentity");
    if (identity) {
      identity.innerHTML = `
        ${identityHtml(acc, true)}
        <span class="flex-grow-1 overflow-hidden">
          <span class="d-block fw-semibold text-brand text-truncate">${escapeHtml(customerProfileDisplayName(acc))}</span>
          <span class="d-block small text-muted-brand text-truncate">${escapeHtml(acc.email)}</span>
        </span>`;
    }
    const pwInput = document.getElementById("loginPickedPassword");
    if (pwInput) pwInput.value = "";
    passwordPanel.dataset.email = acc.email;
    showPanel("password");
    setTimeout(() => pwInput?.focus(), 260);
  }

  async function signInSaved(acc, rowBtn) {
    const original = rowBtn ? rowBtn.innerHTML : "";
    if (rowBtn) {
      rowBtn.disabled = true;
      rowBtn.style.opacity = "0.6";
    }
    try {
      const { body } = await cvrApiPost("auth/remember-login", { email: acc.email });

      if (!body.success) {

        if (body.data?.needsPassword) {
          showPasswordStep(acc);
          showPwAlert(body.message || "Please enter your password to continue.");
        } else {
          cvrToast(body.message || "Could not sign in. Please use your password.", "danger");
          showPasswordStep(acc);
        }
        return;
      }

      finishLogin(body.data.user);
    } catch (err) {
      cvrToast("Could not reach the server. Please try again.", "danger");
    } finally {
      if (rowBtn) {
        rowBtn.disabled = false;
        rowBtn.style.opacity = "";
        rowBtn.innerHTML = original;
      }
    }
  }

  function finishLogin(user) {
    setCustomerSession(user);
    try {
      sessionStorage.setItem("cvrLoginToast", JSON.stringify({ name: user.firstName || "" }));
    } catch {}
    const role = String(user.role || "").toLowerCase();
    window.location.href = role === "admin" || role === "event_manager" ? "admin/dashboard.html" : "landing.html";
  }

  function renderRows() {
    listEl.innerHTML = accounts
      .map(
        (acc) => `
      <div class="cvr-switch-account-row" data-email="${escapeHtml(acc.email)}">
        <button type="button" class="cvr-switch-account-pick d-flex align-items-center gap-3 flex-grow-1 text-start">
          ${identityHtml(acc)}
          <span class="flex-grow-1 overflow-hidden">
            <span class="d-block fw-semibold text-brand text-truncate">${escapeHtml(customerProfileDisplayName(acc))}</span>
            <span class="d-block small text-muted-brand text-truncate">${acc.saved ? "Tap to sign in" : escapeHtml(acc.email)}</span>
          </span>
          <i class="bi bi-chevron-right text-muted-brand small"></i>
        </button>
        <button type="button" class="btn btn-sm btn-link text-muted-brand cvr-switch-account-remove p-1" title="Remove from this list" aria-label="Remove this account from this browser">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>`
      )
      .join("");

    listEl.querySelectorAll(".cvr-switch-account-pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        const email = btn.closest(".cvr-switch-account-row")?.dataset.email;
        const acc = accounts.find((a) => a.email === email);
        if (!acc) return;
        if (acc.saved) signInSaved(acc, btn);
        else showPasswordStep(acc);
      });
    });

    listEl.querySelectorAll(".cvr-switch-account-remove").forEach((btn) => {
      btn.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        const email = btn.closest(".cvr-switch-account-row")?.dataset.email;
        if (!email) return;
        const ok = await cvrConfirmAction({
          title: "Remove this account?",
          message: "It will no longer show up here on this browser. You can add it back by signing in again.",
          confirmLabel: "Remove",
          confirmClass: "btn-danger",
          icon: "bi-person-x",
        });
        if (!ok) return;

        removeRecentAccount(email);
        try {
          await cvrApiPost("auth/forget-account", { email });
        } catch {}
        accounts = accounts.filter((a) => a.email !== email);
        if (!accounts.length) showPanel("form");
        else renderRows();
      });
    });
  }

  document.getElementById("loginPickedBackBtn")?.addEventListener("click", () => {
    showPwAlert(null);
    showPanel(accounts.length ? "picker" : "form");
  });

  document.getElementById("loginPickedForgotBtn")?.addEventListener("click", () => {
    cvrOpenForgotPasswordModal(passwordPanel.dataset.email || "");
  });

  document.getElementById("loginPasswordForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    showPwAlert(null);

    const email = passwordPanel.dataset.email || "";
    const password = document.getElementById("loginPickedPassword")?.value || "";
    const remember = document.getElementById("loginPickedRemember")?.checked;
    if (!password) return showPwAlert("Please enter your password.");

    const btn = document.getElementById("loginPickedSubmitBtn");
    const original = btn ? btn.innerHTML : "";
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in…';
    }

    try {
      const { body } = await cvrApiPost("auth/login", { email, password, remember });

      if (!body.success) {
        showPwAlert(body.message || "Incorrect password.");
        if (body.data?.suggestReset || body.data?.lockedOut) {
          showPwAlert((body.message || "Incorrect password.") + " You can reset it with \"Forgot password?\" below.");
        }
        return;
      }

      clearLoginFailures(email);
      finishLogin(body.data.user);
    } catch (err) {
      showPwAlert("Could not reach the server. Please try again.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = original;
      }
    }
  });

  document.getElementById("loginUseAnotherBtn")?.addEventListener("click", () => {
    showPanel("form");
    setTimeout(() => document.getElementById("loginEmail")?.focus(), 260);
  });

  backToSavedBtn?.addEventListener("click", () => showPanel("picker"));

  (async () => {
    let saved = [];
    try {
      const { body } = await cvrApiGet("auth/saved-accounts");
      if (body.success && Array.isArray(body.data?.accounts)) saved = body.data.accounts;
    } catch {

    }

    const savedEmails = new Set(saved.map((a) => a.email));
    accounts = [
      ...saved.map((a) => ({ ...a, saved: true })),
      ...getRecentAccounts()
        .filter((a) => !savedEmails.has(a.email))
        .map((a) => ({ ...a, saved: false })),
    ];

    const params = new URLSearchParams(window.location.search);
    const forceForm =
      params.get("add") === "1" ||
      params.has("verify") ||
      params.get("suspended") === "1" ||
      params.get("pendingVerification") === "1";

    if (accounts.length && !forceForm) {
      renderRows();
      showPanel("picker", { immediate: true });
      if (alertEl && !alertEl.classList.contains("d-none")) {

        alertEl.classList.remove("d-none");
      }
    } else {
      showPanel("form", { immediate: true });
    }
  })();
}

function loginFailKey(email) {
  return "cvrLoginFails:" + String(email || "").trim().toLowerCase();
}

function recordLoginFailure(email) {
  try {
    const key = loginFailKey(email);
    const count = (parseInt(sessionStorage.getItem(key), 10) || 0) + 1;
    sessionStorage.setItem(key, String(count));
    return count;
  } catch {
    return 0;
  }
}

function clearLoginFailures(email) {
  try {
    sessionStorage.removeItem(loginFailKey(email));
  } catch {}
}

function offerForgotPassword(alertEl, email, onReset) {
  if (!alertEl) return;
  const note = document.createElement("div");
  note.className = "mt-2";
  note.textContent = "Still not working? ";

  const link = document.createElement("a");
  link.className = "alert-link";
  link.textContent = "Reset your password";
  if (typeof onReset === "function") {

    link.href = "#";
    link.addEventListener("click", (ev) => {
      ev.preventDefault();
      onReset();
    });
  } else {
    link.href = pageUrl("forgot-password.html") + (email ? "?email=" + encodeURIComponent(email) : "");
  }

  note.appendChild(link);
  alertEl.appendChild(note);

  if (typeof cvrToast === "function") {
    cvrToast("Having trouble signing in? You can reset your password.", "danger");
  }

  clearLoginFailures(email);
}

function offerResendVerification(alertEl, email) {
  if (!alertEl) return;
  const link = document.createElement("a");
  link.href = "#";
  link.className = "alert-link";
  link.textContent = "Resend verification code";
  link.addEventListener("click", async (ev) => {
    ev.preventDefault();
    link.textContent = "Sending...";
    const { body } = await cvrApiPost("auth/resend-verification", { email });
    alertEl.textContent = body.message || "If an unverified account exists, a new code has been sent.";
    alertEl.classList.remove("alert-danger");
    alertEl.classList.add("alert-success");

    setTimeout(() => cvrAuthNavigate("register.html?verify=" + encodeURIComponent(email)), 1200);
  });
  alertEl.appendChild(link);
}

async function verifyEmailExists(email) {
  try {
    const { body } = await cvrApiPost("auth/check-email", { email });
    if (body && body.success === false) {
      return { ok: false, verified: false, message: body.message || "That email address does not seem to exist." };
    }
    // verified === true: the mail server confirmed this mailbox exists.
    // verified === false here only means we could not confirm it (the emailed code will).
    return { ok: true, verified: !!(body && body.data && body.data.verified), message: "" };
  } catch (err) {

    return { ok: true, verified: false, message: "" };
  }
}
window.verifyEmailExists = verifyEmailExists;

async function checkPhoneAvailable(phone, email) {
  try {
    const { body } = await cvrApiPost("auth/check-phone", { phone, email });
    if (body && body.success === false) {
      return { available: false, message: body.message || "This phone number is already in use. Please try a different phone number." };
    }
    return { available: true, message: "" };
  } catch (err) {

    return { available: true, message: "" };
  }
}
window.checkPhoneAvailable = checkPhoneAvailable;

async function checkNameAvailable(firstName, lastName, email) {
  try {
    const { body } = await cvrApiPost("auth/check-name", { firstName, lastName, email });
    if (body && body.success === false && body.data?.available === false) {
      return { available: false, message: body.message || "An account already exists under this first and last name." };
    }
    return { available: true, message: "" };
  } catch (err) {

    return { available: true, message: "" };
  }
}
window.checkNameAvailable = checkNameAvailable;

function initCustomerRegisterForm() {
  const form = document.getElementById("customerRegisterForm");
  const alertEl = document.getElementById("customerRegisterAlert");
  if (!form) return;

  const emailInput = document.getElementById("regEmail");
  const emailFeedback = document.getElementById("regEmailFeedback");
  if (emailInput && emailFeedback) {
    let lastChecked = "";
    emailInput.addEventListener("blur", async () => {
      const value = emailInput.value.trim();
      if (!value || value === lastChecked) return;
      lastChecked = value;

      if (!isValidEmail(value)) {
        emailInput.classList.add("is-invalid");
        emailFeedback.className = "small mt-1 text-danger";
        emailFeedback.textContent = "Please enter a valid email address.";
        return;
      }

      emailFeedback.className = "small mt-1 text-muted-brand";
      emailFeedback.textContent = "Checking this email address...";

      const result = await verifyEmailExists(value);
      if (result.ok) {
        emailInput.classList.remove("is-invalid");
        emailInput.classList.add("is-valid");
        emailFeedback.className = "small mt-1 text-success";
        emailFeedback.textContent = result.verified
          ? "\u2713 This email account exists."
          : "This email looks valid. We will send a 6-digit code to confirm it.";
      } else {
        emailInput.classList.remove("is-valid");
        emailInput.classList.add("is-invalid");
        emailFeedback.className = "small mt-1 text-danger";
        emailFeedback.textContent = result.message;
      }
    });

    emailInput.addEventListener("input", () => {
      emailInput.classList.remove("is-valid", "is-invalid");
      emailFeedback.textContent = "";
    });
  }

  const phoneInput = document.getElementById("regPhone");
  const phoneFeedback = document.getElementById("regPhoneFeedback");
  if (phoneInput && phoneFeedback) {
    let lastCheckedPhone = "";
    phoneInput.addEventListener("blur", async () => {
      const value = phoneInput.value.trim();
      if (!value || value === lastCheckedPhone) return;
      lastCheckedPhone = value;

      if (!isValidPhone(value)) {
        phoneInput.classList.remove("is-valid");
        phoneInput.classList.add("is-invalid");
        phoneFeedback.className = "small mt-1 text-danger";
        phoneFeedback.textContent = "Please enter a valid contact number (8–15 digits).";
        return;
      }

      phoneFeedback.className = "small mt-1 text-muted-brand";
      phoneFeedback.textContent = "Checking this number...";

      const result = await checkPhoneAvailable(value, document.getElementById("regEmail")?.value.trim() || "");
      if (result.available) {
        phoneInput.classList.remove("is-invalid");
        phoneInput.classList.add("is-valid");
        phoneFeedback.className = "small mt-1 text-success";
        phoneFeedback.textContent = "This number is available.";
      } else {
        phoneInput.classList.remove("is-valid");
        phoneInput.classList.add("is-invalid");
        phoneFeedback.className = "small mt-1 text-danger";
        phoneFeedback.textContent = result.message;
      }
    });

    phoneInput.addEventListener("input", () => {
      phoneInput.classList.remove("is-valid", "is-invalid");
      phoneFeedback.textContent = "";
    });
  }

  const firstNameInput = document.getElementById("regFirstName");
  const lastNameInput = document.getElementById("regLastName");
  const nameFeedback = document.getElementById("regNameFeedback");
  if (firstNameInput && lastNameInput && nameFeedback) {
    let lastCheckedName = "";
    const checkName = async () => {
      const first = firstNameInput.value.trim();
      const last = lastNameInput.value.trim();
      if (!first || !last) return;
      const key = `${first.toLowerCase()}|${last.toLowerCase()}`;
      if (key === lastCheckedName) return;
      lastCheckedName = key;

      nameFeedback.className = "small mt-1 text-muted-brand";
      nameFeedback.textContent = "Checking this name...";

      const result = await checkNameAvailable(first, last, document.getElementById("regEmail")?.value.trim() || "");
      if (result.available) {
        firstNameInput.classList.remove("is-invalid");
        lastNameInput.classList.remove("is-invalid");
        firstNameInput.classList.add("is-valid");
        lastNameInput.classList.add("is-valid");
        nameFeedback.className = "small mt-1 text-success";
        nameFeedback.textContent = "This name is available.";
      } else {
        firstNameInput.classList.remove("is-valid");
        lastNameInput.classList.remove("is-valid");
        firstNameInput.classList.add("is-invalid");
        lastNameInput.classList.add("is-invalid");
        nameFeedback.className = "small mt-1 text-danger";
        nameFeedback.textContent = result.message;
      }
    };
    firstNameInput.addEventListener("blur", checkName);
    lastNameInput.addEventListener("blur", checkName);
    [firstNameInput, lastNameInput].forEach((input) => {
      input.addEventListener("input", () => {
        input.classList.remove("is-valid", "is-invalid");
        nameFeedback.textContent = "";
        lastCheckedName = "";
      });
    });
  }

  const showAlert = (message, kind) => {
    if (!alertEl) return;
    alertEl.textContent = message;
    alertEl.classList.remove("d-none", "alert-success", "alert-danger");
    alertEl.classList.add(kind === "success" ? "alert-success" : "alert-danger");
  };

  const verifyPanel = document.getElementById("regVerifyPanel");
  const verifyForm = document.getElementById("regVerifyForm");
  const verifyAlert = document.getElementById("regVerifyAlert");
  const signInRow = document.getElementById("regSignInRow");
  let pendingEmail = "";

  const showRegPanel = createCvrPanelSwitcher({ form, verify: verifyPanel }, (which) => {
    signInRow?.classList.toggle("d-none", which !== "form");
  });

  function codeBoxes() {
    return Array.from(document.querySelectorAll("#regCodeBoxes input"));
  }
  function readCode() {
    return codeBoxes().map((b) => b.value).join("");
  }
  function syncHiddenCode() {
    const hidden = document.getElementById("regCode");
    if (hidden) hidden.value = readCode();
  }
  function writeCode(val) {
    const digits = (val || "").replace(/\D/g, "").slice(0, 6).split("");
    codeBoxes().forEach((b, i) => {
      b.value = digits[i] || "";
    });
    syncHiddenCode();
  }
  function showVerifyAlert(message, type) {
    if (!verifyAlert) return;
    if (!message) {
      verifyAlert.classList.add("d-none");
      return;
    }
    verifyAlert.textContent = message;
    verifyAlert.classList.remove("d-none", "alert-success", "alert-danger");
    verifyAlert.classList.add(type === "success" ? "alert-success" : "alert-danger");
  }
  function showVerifyStep(email) {
    pendingEmail = email;
    if (alertEl) alertEl.classList.add("d-none");
    showVerifyAlert(null);
    writeCode("");
    const label = document.getElementById("regVerifyEmailLabel");
    if (label) label.textContent = email;
    showRegPanel("verify");
    setTimeout(() => codeBoxes()[0]?.focus(), 260);
  }
  function showRegisterStep() {
    showVerifyAlert(null);
    writeCode("");
    showRegPanel("form");
  }

  codeBoxes().forEach((box, idx, boxes) => {
    box.addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "").slice(0, 1);
      syncHiddenCode();
      if (this.value && idx < boxes.length - 1) boxes[idx + 1].focus();
    });
    box.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && !this.value && idx > 0) boxes[idx - 1].focus();
      if (e.key === "ArrowLeft" && idx > 0) boxes[idx - 1].focus();
      if (e.key === "ArrowRight" && idx < boxes.length - 1) boxes[idx + 1].focus();
    });
    box.addEventListener("focus", function () {
      this.select();
    });
    box.addEventListener("paste", function (e) {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData("text");
      writeCode(text);
      const filled = text.replace(/\D/g, "").slice(0, 6).length;
      boxes[Math.min(filled, boxes.length - 1)].focus();
    });
  });

  verifyForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = readCode();
    if (code.length !== 6) {
      showVerifyAlert("Please enter all 6 digits of the code.", "danger");
      return;
    }

    const btn = document.getElementById("regVerifyBtn");
    const original = btn ? btn.innerHTML : "";
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verifying…';
    }

    try {
      const { body } = await cvrApiPost("auth/verify-email-code", {
        email: pendingEmail,
        code,
      });

      if (body.success) {
        showVerifyAlert(body.message || "Email verified! You can now sign in.", "success");
        form.reset();
        setTimeout(() => cvrAuthNavigate("login.html?verify=success"), 900);
        return;
      }

      showVerifyAlert(body.message || "That code is incorrect. Please try again.", "danger");
      writeCode("");
      codeBoxes()[0]?.focus();
    } catch (err) {
      showVerifyAlert("Could not reach the server. Please try again.", "danger");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = original;
      }
    }
  });

  document.getElementById("regResendCode")?.addEventListener("click", async () => {
    const link = document.getElementById("regResendCode");
    if (link) link.disabled = true;
    try {
      const { body } = await cvrApiPost("auth/resend-verification", { email: pendingEmail });
      showVerifyAlert(body.message || "A new code has been sent to your email.", body.success ? "success" : "danger");
      writeCode("");
      codeBoxes()[0]?.focus();
    } catch (err) {
      showVerifyAlert("Could not reach the server. Please try again.", "danger");
    } finally {
      if (link) link.disabled = false;
    }
  });

  document.getElementById("regBackToForm")?.addEventListener("click", showRegisterStep);

  const verifyParam = new URLSearchParams(window.location.search).get("verify");
  if (verifyParam && isValidEmail(verifyParam)) {
    showVerifyStep(verifyParam);
    showVerifyAlert("Enter the 6-digit code we just emailed you.", "success");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (alertEl) alertEl.classList.add("d-none");

    const firstName = document.getElementById("regFirstName")?.value.trim() || "";
    const lastName = document.getElementById("regLastName")?.value.trim() || "";
    const email = document.getElementById("regEmail")?.value.trim() || "";
    const phone = document.getElementById("regPhone")?.value.trim() || "";
    const password = document.getElementById("regPassword")?.value || "";
    const confirm = document.getElementById("regPasswordConfirm")?.value || "";
    const terms = document.getElementById("regTerms")?.checked;

    if (!terms) return showAlert("Please agree to the Terms & Conditions and Privacy Policy.");
    if (!firstName || !lastName) return showAlert("Please enter your first and last name.");
    if (!isValidEmail(email)) return showAlert("Please enter a valid email address.");
    if (!isValidPhone(phone)) return showAlert("Please enter a valid contact number (8–15 digits).");
    if (password.length < 6) return showAlert("Password must be at least 6 characters.");
    if (password !== confirm) return showAlert("Passwords do not match.");

    const submitBtn = form.querySelector("button[type=submit]");
    if (submitBtn) submitBtn.disabled = true;

    try {
      const { body } = await cvrApiPost("auth/register", {
        firstName, lastName, email, phone, password, passwordConfirm: confirm, terms,
      });

      if (!body.success) {
        showAlert(body.message || "Registration failed. Please try again.");
        if (body.data?.phoneTaken) {
          const phoneField = document.getElementById("regPhone");
          const phoneFeedback = document.getElementById("regPhoneFeedback");
          if (phoneField) {
            phoneField.classList.remove("is-valid");
            phoneField.classList.add("is-invalid");
            phoneField.focus();
          }
          if (phoneFeedback) {
            phoneFeedback.className = "small mt-1 text-danger";
            phoneFeedback.textContent = body.message || "This phone number is already in use. Please try a different phone number.";
          }
        }
        if (body.data?.nameTaken) {
          const firstField = document.getElementById("regFirstName");
          const lastField = document.getElementById("regLastName");
          const nameFeedback = document.getElementById("regNameFeedback");
          [firstField, lastField].forEach((field) => {
            if (!field) return;
            field.classList.remove("is-valid");
            field.classList.add("is-invalid");
          });
          firstField?.focus();
          if (nameFeedback) {
            nameFeedback.className = "small mt-1 text-danger";
            nameFeedback.textContent = body.message || "An account already exists under this first and last name.";
          }
        }
        return;
      }

      showVerifyStep(email);
      cvrToast(body.message || `We sent a 6-digit code to ${email}.`, "success");
    } catch (err) {
      showAlert("Could not reach the server. Please make sure the site is running and try again.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function renderDashboardNotificationsList(items) {
  const listEl = document.getElementById("dashNotificationsList");
  if (!listEl) return;

  const unreadCount = items.filter((i) => !i.read).length;
  const unreadBadge = document.getElementById("dashNotifUnreadBadge");
  if (unreadBadge) {
    if (unreadCount > 0) {
      unreadBadge.textContent = `${unreadCount} new`;
      unreadBadge.classList.remove("d-none");
    } else {
      unreadBadge.classList.add("d-none");
    }
  }

  if (!items.length) {
    listEl.innerHTML = `<p class="small text-muted-brand mb-0">Nothing here yet. Replies to your messages and updates about your reservations will show up here.</p>`;
    return;
  }

  listEl.innerHTML = items
    .map((item, idx) => {
      const when = cvrTimeAgo(item.when);
      const kindLabel = item.kind === "reply" ? "Message reply" : item.kind === "notification" ? "Site update" : "Reservation update";
      const kindIcon = item.kind === "reply" ? "bi-envelope-open" : "bi-journal-check";
      return `
      <div class="notif-item ${item.read ? "" : "notif-item--unread"}" data-notif-idx="${idx}">
        <button type="button" class="notif-item-main notif-item--clickable d-block w-100 text-start text-decoration-none border-0 bg-transparent p-0" data-notif-idx="${idx}">
          <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
            <span class="small text-muted-brand"><i class="bi ${kindIcon} me-1"></i>${kindLabel}</span>
            <div class="d-flex align-items-center gap-2">
              ${item.read ? "" : `<span class="badge rounded-pill text-bg-danger">New</span>`}
              <span class="small text-muted-brand">${escapeHtml(when)}</span>
            </div>
          </div>
          <strong class="text-brand d-block mt-1 notif-item-title">${escapeHtml(item.title)}</strong>
          ${item.body ? `<div class="text-muted-brand mt-1 notif-item-body">${escapeHtml(item.body)}</div>` : ""}
          ${
            item.extra
              ? `<div class="notif-item-reply text-brand">
                   <div class="text-muted-brand text-uppercase mb-1" style="font-size:.7rem; letter-spacing:.04em;">Reply from Casa Vergara</div>
                   ${escapeHtml(item.extra)}
                 </div>`
              : ""
          }
        </button>
        <div class="notif-item-actions d-flex align-items-center gap-3">
          <button type="button" class="btn btn-sm btn-link text-muted-brand text-decoration-none p-0 notif-item-toggle-read" data-notif-idx="${idx}">
            <i class="bi ${item.read ? "bi-envelope" : "bi-envelope-open"} me-1"></i>${item.read ? "Mark as unread" : "Mark as read"}
          </button>
          <button type="button" class="btn btn-sm btn-link text-danger text-decoration-none p-0 notif-item-delete" data-notif-idx="${idx}">
            <i class="bi bi-trash me-1"></i>Delete
          </button>
        </div>
      </div>`;
    })
    .join("");

  listEl.querySelectorAll(".notif-item-main").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = Number(el.dataset.notifIdx);
      if (items[idx]) {
        openCvrNotificationModal(items[idx], { onChanged: refreshDashboardNotifications });
      }
    });
  });

  listEl.querySelectorAll(".notif-item-toggle-read").forEach((el) => {
    el.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      const idx = Number(el.dataset.notifIdx);
      const item = items[idx];
      if (!item || el.disabled) return;
      el.disabled = true;
      await cvrSetNotificationRead(item, !item.read);
      await refreshDashboardNotifications();
    });
  });

  listEl.querySelectorAll(".notif-item-delete").forEach((el) => {
    el.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      const idx = Number(el.dataset.notifIdx);
      const item = items[idx];
      if (!item || el.disabled) return;
      el.disabled = true;
      await cvrDeleteNotification(item);
      cvrToast("Notification deleted.", "info");
      await refreshDashboardNotifications();
    });
  });
}

async function refreshDashboardNotifications() {
  const session = getCustomerSession();
  const items = await fetchMergedCvrNotifications(session);
  renderDashboardNotificationsList(items);
  renderNavNotifBell();
}

async function loadDashboardNotifications() {
  const listEl = document.getElementById("dashNotificationsList");
  if (!listEl) return;

  const session = getCustomerSession();
  const items = await fetchMergedCvrNotifications(session);
  const unreadCount = items.filter((i) => !i.read).length;

  renderDashboardNotificationsList(items);

  const unreadReplyIds = items.filter((i) => i.kind === "reply" && !i.read).map((i) => i.rawId);
  const unreadServerIds = items.filter((i) => i.kind === "notification" && !i.read).map((i) => i.rawId);
  const unreadLocalIds = items.filter((i) => i.kind === "update" && !i.read).map((i) => i.rawId);
  unreadReplyIds.forEach((id) => {
    cvrApiPost("content/messages-mark-read", { id }).catch(() => {});
  });
  unreadServerIds.forEach((id) => {
    cvrApiPost("content/notifications-mark-read", { id }).catch(() => {});
  });
  unreadLocalIds.forEach((id) => markCvrNotificationRead(id));

  if (unreadCount > 0) {
    renderNavNotifBell();
  }
}

async function initCustomerDashboardPage() {
  const root = document.getElementById("customerDashboardRoot");
  if (!root) return;

  const session = getCustomerSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  await refreshMyReservationsFromServer();
  cvrWatchMyReservationStatuses();

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  const refreshDashboardProfile = () => {
    const s = getCustomerSession();
    if (!s) return;
    setText("dashProfileName", customerProfileDisplayName(s));
    setText("dashProfileEmail", s.email || "—");
    setText("dashProfilePhone", s.phone || "—");
    const joined = s.joinedAt ? formatMemberSince(s.joinedAt) : "—";
    setText("dashProfileMemberSince", joined);
    applyCustomerAvatarElements(s);
  };

  refreshDashboardProfile();

  (async () => {
    try {
      const { body } = await cvrApiGet("auth/me");
      if (body.success && body.data && body.data.user) {
        setCustomerSession(body.data.user);
        refreshDashboardProfile();
      }
    } catch {}
  })();

  applySmartNavLinks(root);
  loadDashboardNotifications();

  const listEl = document.getElementById("dashReservationsList");
  if (!listEl) return;

  const email = (session.email || "").toLowerCase();
  const mine = getStoredReservations().filter((r) => (r.email || "").toLowerCase() === email);

  if (!mine.length) {
    listEl.innerHTML = `<p class="small text-muted-brand mb-0">No reservations linked to your account yet. Book a room or event to see them here.</p>`;
    return;
  }

  listEl.innerHTML = mine
    .map((r) => {
      const canEdit = canClientModifyReservation(r);
      const canCheckout = isReservationCheckoutEligible(r);
      const canCancel = isReservationCancelEligible(r);
      const isCheckedOut = Boolean(r.checkedOutAt);
      const isCancelled = String(r.reservationStatus || "").toLowerCase().includes("cancel");
      const checkInVal = r.checkIn || r.preferredDate;
      const checkOutVal = r.checkOut || r.checkOutDate || "";
      const spansDays = checkOutVal && checkOutVal !== checkInVal;
      const dateLabel = spansDays
        ? `${formatDateReserved(checkInVal)} → ${formatDateReserved(checkOutVal)}`
        : formatDateReserved(checkInVal);
      const scheduleLabel = r.checkInLabel && r.checkOutLabel ? ` · ${r.checkInLabel} → ${r.checkOutLabel}` : "";
      const live = !isCheckedOut && canCheckout ? getLiveOvertimeStatus(r) : { isLate: false };
      return `
      <div class="border rounded-3 p-3 mb-2">
        <div class="d-flex flex-wrap justify-content-between gap-2 mb-1">
          <strong class="text-brand small">${escapeHtml(r.id)}</strong>
          <span class="status-chip ${isCancelled ? "chip-red" : getStatusChipClass(r.paymentStatus)}">${isCancelled ? "Cancelled" : escapeHtml(r.paymentStatus || "")}</span>
        </div>
        <div class="small text-muted-brand mb-2">${escapeHtml(r.roomName || r.eventType || "Reservation")} · ${escapeHtml(dateLabel)}${escapeHtml(scheduleLabel)} · ${escapeHtml(r.totalAmount || "")}</div>
        ${isCheckedOut ? `<div class="small text-muted-brand mb-2"><i class="bi bi-door-open me-1"></i>Checked out ${escapeHtml(formatMemberSince(r.checkedOutAt))}${r.penaltyAmount > 0 ? ` — overtime penalty applied` : ""}</div>` : ""}
        ${isCancelled ? `<div class="small text-danger mb-2"><i class="bi bi-x-circle me-1"></i>${escapeHtml(r.cancellationNote || (r.downpaymentForfeited ? "Cancelled — downpayment forfeited (non-refundable)." : "Cancelled."))}</div>` : ""}
        ${live.isLate ? `<div class="small text-danger mb-2"><i class="bi bi-alarm me-1"></i>Past fixed check-out — overtime penalty accruing (${escapeHtml(String(live.overtimeHours))}h so far)</div>` : ""}
        <div class="d-flex flex-wrap gap-2">
          <a href="quotation.html?res=${encodeURIComponent(r.id)}" class="btn btn-sm btn-outline-primary">View quotation</a>
          <a href="reservation-status.html?id=${encodeURIComponent(r.id)}" class="btn btn-sm btn-outline-secondary">Status</a>
          ${canEdit ? `<a href="reservation-form.html?edit=${encodeURIComponent(r.id)}" class="btn btn-sm btn-outline-secondary">Edit</a>` : ""}
          ${canEdit ? `<a href="reservation-form.html?reschedule=${encodeURIComponent(r.id)}" class="btn btn-sm btn-outline-secondary">Reschedule</a>` : ""}
          ${r.paymentStatus === "Pending Payment" && canClientPayReservation(r) ? `<button type="button" class="btn btn-sm btn-brand dash-pay-btn" data-id="${escapeHtml(r.id)}">Pay</button>` : ""}
          ${canCheckout ? `<button type="button" class="btn btn-sm btn-brand dash-checkout-btn" data-id="${escapeHtml(r.id)}"><i class="bi bi-door-open me-1"></i>Check out now</button>` : ""}
          ${canCancel ? `<button type="button" class="btn btn-sm btn-outline-danger dash-cancel-btn" data-id="${escapeHtml(r.id)}"><i class="bi bi-x-circle me-1"></i>Cancel booking</button>` : ""}
        </div>
      </div>`;
    })
    .join("");

  const payModalEl = document.getElementById("dashPayModal");
  const payModal = payModalEl && window.bootstrap ? window.bootstrap.Modal.getOrCreateInstance(payModalEl) : null;
  const payModalId = document.getElementById("dashPayModalId");
  const payModalTotal = document.getElementById("dashPayModalTotal");
  const payModalDownpayment = document.getElementById("dashPayModalDownpayment");
  const payModalBalance = document.getElementById("dashPayModalBalance");
  const payModalConfirmBtn = document.getElementById("dashPayModalConfirmBtn");

  listEl.querySelectorAll(".dash-pay-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const record = mine.find((r) => r.id === id);
      const payUrl = pageUrl(`payment.html?res=${encodeURIComponent(id)}`);
      if (!record || !payModal) {
        window.location.href = payUrl;
        return;
      }
      const cat = window.CVRBookingCatalog;
      const q = ensureReservationQuotation(record);
      const fmt = (v) => (cat ? cat.formatMoney(v, record.currency || "PHP") : String(v));
      if (payModalId) payModalId.textContent = record.id;
      if (payModalTotal) payModalTotal.textContent = record.totalAmount || fmt(record.totalNumeric ?? 0);
      if (payModalDownpayment) payModalDownpayment.textContent = fmt(q?.downpaymentAmount ?? record.downpaymentAmount ?? record.totalNumeric ?? 0);
      if (payModalBalance) payModalBalance.textContent = fmt(q?.balanceAmount ?? record.balanceAmount ?? 0);
      if (payModalConfirmBtn) payModalConfirmBtn.href = payUrl;
      payModal.show();
    });
  });

  const checkoutModalEl = document.getElementById("dashCheckoutModal");
  const checkoutModal = checkoutModalEl && window.bootstrap ? window.bootstrap.Modal.getOrCreateInstance(checkoutModalEl) : null;
  const checkoutModalText = document.getElementById("dashCheckoutModalText");
  const checkoutModalConfirmBtn = document.getElementById("dashCheckoutModalConfirmBtn");

  listEl.querySelectorAll(".dash-checkout-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const record = mine.find((r) => r.id === id);
      if (!record) return;
      if (!checkoutModal) {
        const updated = handleGuestCheckout(id);
        if (updated) {
          initCustomerDashboardPage();
          promptPostCheckoutReview(updated);
        }
        return;
      }
      if (checkoutModalText) {
        const cat = window.CVRBookingCatalog;
        const live = getLiveOvertimeStatus(record);
        checkoutModalText.textContent = live.isLate
          ? `Check out now from ${record.roomName || "your room"}? Your fixed check-out time (${record.checkOutLabel || formatDateReserved(record.checkOut)}) has passed — you are ${live.overtimeHours} hour${live.overtimeHours !== 1 ? "s" : ""} over. An overtime penalty of ${cat?.formatMoney?.(live.penaltyAmount, record.currency) || live.penaltyAmount} will be applied.`
          : `Check out now from ${record.roomName || "your room"}? Your fixed check-out time is ${record.checkOutLabel || formatDateReserved(record.checkOut)}.`;
      }
      if (checkoutModalConfirmBtn) {
        checkoutModalConfirmBtn.onclick = () => {
          const updated = performGuestCheckout(id);
          checkoutModal.hide();
          if (updated) {
            initCustomerDashboardPage();
            promptPostCheckoutReview(updated);
          }
        };
      }
      checkoutModal.show();
    });
  });

  const cancelModalEl = document.getElementById("dashCancelModal");
  const cancelModal = cancelModalEl && window.bootstrap ? window.bootstrap.Modal.getOrCreateInstance(cancelModalEl) : null;
  const cancelModalText = document.getElementById("dashCancelModalText");
  const cancelModalConfirmBtn = document.getElementById("dashCancelModalConfirmBtn");

  listEl.querySelectorAll(".dash-cancel-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const record = mine.find((r) => r.id === id);
      if (!record) return;
      if (!cancelModal) {
        const updated = handleGuestCancel(id);
        if (updated) initCustomerDashboardPage();
        return;
      }
      const forfeitable = reservationHasForfeitableDownpayment(record);
      if (cancelModalText) {
        cancelModalText.textContent = forfeitable
          ? `Cancel reservation ${record.id}? Your downpayment is NON-REFUNDABLE and will be forfeited per resort policy.`
          : `Cancel reservation ${record.id}? You haven't submitted a downpayment yet, so nothing will be forfeited.`;
      }
      if (cancelModalConfirmBtn) {
        cancelModalConfirmBtn.onclick = () => {
          const updated = performGuestCancel(id);
          cancelModal.hide();
          if (updated) initCustomerDashboardPage();
        };
      }
      cancelModal.show();
    });
  });
}

function initCustomerSettingsPage() {
  const root = document.getElementById("customerSettingsRoot");
  if (!root) return;

  const session = getCustomerSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  const syncNavbar = () => {
    const nav = document.getElementById("site-navbar");
    if (nav) renderNavbar("");
  };

  const refreshSettingsPreview = () => {
    const s = getCustomerSession();
    if (s) applyCustomerAvatarElements(s);
  };

  const showAlert = (el, message, kind) => {
    if (!el) return;
    el.textContent = message;
    el.classList.remove("d-none", "alert-success", "alert-danger");
    el.classList.add(kind === "success" ? "alert-success" : "alert-danger");
  };

  const hideAlert = (el) => {
    if (!el) return;
    el.classList.add("d-none");
    el.textContent = "";
  };

  refreshSettingsPreview();

  (async () => {
    const { body } = await cvrApiGet("auth/me");
    if (body?.success && body.data?.user) {
      setCustomerSession(body.data.user);
      const fresh = body.data.user;
      const fn = document.getElementById("settingsFirstName");
      const ln = document.getElementById("settingsLastName");
      const ph = document.getElementById("settingsPhone");
      if (fn) fn.value = fresh.firstName || "";
      if (ln) ln.value = fresh.lastName || "";
      if (ph) ph.value = fresh.phone || "";
      refreshSettingsPreview();
    }
  })();

  const fn = document.getElementById("settingsFirstName");
  const ln = document.getElementById("settingsLastName");
  const ph = document.getElementById("settingsPhone");
  if (fn) fn.value = session.firstName || "";
  if (ln) ln.value = session.lastName || "";
  if (ph) ph.value = session.phone || "";

  const nameAlert = document.getElementById("settingsNameAlert");
  const nameBtn = document.getElementById("saveCustomerNameBtn");
  if (nameBtn) {
    nameBtn.addEventListener("click", async () => {
      hideAlert(nameAlert);
      const firstName = document.getElementById("settingsFirstName")?.value.trim() || "";
      const lastName = document.getElementById("settingsLastName")?.value.trim() || "";
      const phone = document.getElementById("settingsPhone")?.value.trim() || "";
      if (!firstName || !lastName) {
        showAlert(nameAlert, "Please enter your first and last name.");
        return;
      }
      if (!phone) {
        showAlert(nameAlert, "Please enter a contact number.");
        return;
      }
      nameBtn.disabled = true;
      const { body } = await cvrApiPost("account/update-profile", { firstName, lastName, phone });
      nameBtn.disabled = false;
      if (!body.success) {
        showAlert(nameAlert, body.message || "Could not save your changes.");
        return;
      }
      setCustomerSession(body.data.user);
      showAlert(nameAlert, "Your profile has been updated.", "success");
      refreshSettingsPreview();
      syncNavbar();
    });
  }

  const pwAlert = document.getElementById("settingsPasswordAlert");
  const pwBtn = document.getElementById("saveCustomerPasswordBtn");
  if (pwBtn) {
    pwBtn.addEventListener("click", async () => {
      hideAlert(pwAlert);
      const currentPassword = document.getElementById("settingsCurrentPassword")?.value || "";
      const newPassword = document.getElementById("settingsNewPassword")?.value || "";
      const confirmPassword = document.getElementById("settingsConfirmPassword")?.value || "";
      if (!currentPassword) {
        showAlert(pwAlert, "Please enter your current password.");
        return;
      }
      if (newPassword.length < 6) {
        showAlert(pwAlert, "New password must be at least 6 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        showAlert(pwAlert, "New passwords do not match.");
        return;
      }
      pwBtn.disabled = true;
      const { body } = await cvrApiPost("account/update-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      pwBtn.disabled = false;
      if (!body.success) {
        showAlert(pwAlert, body.message || "Could not update your password.");
        return;
      }
      const curPw = document.getElementById("settingsCurrentPassword");
      const newPw = document.getElementById("settingsNewPassword");
      const confPw = document.getElementById("settingsConfirmPassword");
      if (curPw) curPw.value = "";
      if (newPw) newPw.value = "";
      if (confPw) confPw.value = "";
      showAlert(pwAlert, "Password updated successfully.", "success");
    });
  }

  const photoInput = document.getElementById("settingsPhotoFile");
  const photoPickBtn = document.getElementById("settingsPhotoPickBtn");
  const photoAlert = document.getElementById("settingsPhotoAlert");
  const removePhotoBtn = document.getElementById("removeCustomerPhotoBtn");

  photoPickBtn?.addEventListener("click", () => {
    photoInput?.click();
  });

  if (photoInput) {
    photoInput.addEventListener("change", async () => {
      hideAlert(photoAlert);
      const file = photoInput.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        showAlert(photoAlert, "File is too large (max 5MB).");
        photoInput.value = "";
        return;
      }
      const formData = new FormData();
      formData.append("avatar", file);
      const { body } = await cvrApiPostForm("account/upload-avatar", formData);
      if (!body.success) {
        showAlert(photoAlert, body.message || "Could not save photo.");
        photoInput.value = "";
        return;
      }
      setCustomerSession({ ...getCustomerSession(), avatarUrl: body.data.avatarUrl });
      showAlert(photoAlert, "Profile picture saved.", "success");
      refreshSettingsPreview();
      syncNavbar();
      photoInput.value = "";
    });
  }

  if (removePhotoBtn) {
    removePhotoBtn.addEventListener("click", async () => {
      hideAlert(photoAlert);
      const { body } = await cvrApiPost("account/remove-avatar", {});
      if (!body.success) {
        showAlert(photoAlert, body.message || "Could not remove photo.");
        return;
      }
      setCustomerSession({ ...getCustomerSession(), avatarUrl: null, profilePhoto: "" });
      showAlert(photoAlert, "Profile picture removed.", "success");
      refreshSettingsPreview();
      syncNavbar();
    });
  }
}

function deriveNameFromEmail(email) {
  const local = String(email || "").split("@")[0].replace(/[._+-]+/g, " ").trim();
  if (!local) return "Guest";
  return local.replace(/\b\w/g, (c) => c.toUpperCase());
}

function initContactForm() {
  const form = document.getElementById("contactMessageForm") || document.querySelector(".contact-form-grid");
  if (!form) return;

  const emailInput = form.querySelector("#contactEmail");
  const emailFeedback = document.getElementById("contactEmailFeedback");
  let lastCheckedEmail = "";
  let lastCheckResult = null;

  const runEmailCheck = async (email) => {
    if (!email || !isValidEmail(email)) return null;
    if (email === lastCheckedEmail && lastCheckResult) return lastCheckResult;
    const result = await verifyEmailExists(email);
    lastCheckedEmail = email;
    lastCheckResult = result;
    return result;
  };

  if (emailInput && emailFeedback) {
    emailInput.addEventListener("blur", async () => {
      const email = emailInput.value.trim();
      if (!email || !isValidEmail(email)) {
        emailFeedback.textContent = "";
        return;
      }
      emailFeedback.textContent = "Checking address…";
      emailFeedback.classList.remove("text-danger");
      emailFeedback.classList.add("text-muted-brand");
      const result = await runEmailCheck(email);
      if (result && !result.ok) {
        emailFeedback.textContent = result.message;
        emailFeedback.classList.remove("text-muted-brand");
        emailFeedback.classList.add("text-danger");
      } else {
        emailFeedback.textContent = "";
      }
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput?.value.trim() || "";
    const subject = form.querySelector("#contactSubject")?.value.trim() || "General Inquiry";
    const recipient = form.querySelector('input[name="recipient"]:checked')?.value || "admin";
    const message = form.querySelector("#contactMessage")?.value.trim() || "";

    if (!email || !message) {
      cvrToast("Please fill in your email and message.", "danger");
      return;
    }
    if (!isValidEmail(email)) {
      cvrToast("Please enter a valid email address.", "danger");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending…';
    }

    try {
      const emailCheck = await runEmailCheck(email);
      if (emailCheck && !emailCheck.ok) {
        cvrToast(emailCheck.message, "danger");
        if (emailFeedback) {
          emailFeedback.textContent = emailCheck.message;
          emailFeedback.classList.remove("text-muted-brand");
          emailFeedback.classList.add("text-danger");
        }
        return;
      }

      const name = deriveNameFromEmail(email);
      const { ok, body } = await cvrApiPost("content/contact", { name, email, phone: "", subject, recipient, message });
      if (!ok || !body.success) {
        cvrToast(body?.message || "We couldn't send your message. Please try again.", "danger");
        return;
      }
      cvrToast(body.message || "Thank you! Your message has been received. Our team will reply shortly.", "success");
      form.reset();
      if (emailFeedback) emailFeedback.textContent = "";
    } catch {
      cvrToast("We couldn't send your message. Please check your connection and try again.", "danger");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    }
  });
}

function initResponsiveEnhancements() {
  const wrapTable = (table) => {
    if (!table || table.closest(".table-responsive")) return;
    const wrap = document.createElement("div");
    wrap.className = "table-responsive";
    table.parentNode?.insertBefore(wrap, table);
    wrap.appendChild(table);
  };

  document
    .querySelectorAll(
      ".admin-main table, .payment-page table, .reservation-status-page table, .quotation-page table, .modal table, .cvr-quotation-table"
    )
    .forEach(wrapTable);

  document.querySelectorAll("img:not([width]):not(.brand-logo):not(.nav-profile-avatar--photo)").forEach((img) => {
    if (img.closest(".admin-sidebar, .admin-topbar, .admin-drawer, .navbar-brand")) return;
    if (!img.classList.contains("img-fluid")) img.classList.add("img-fluid");
  });

  document.querySelectorAll(".modal-dialog").forEach((dialog) => {
    dialog.classList.add("modal-dialog-scrollable");
  });
}

window.initResponsiveEnhancements = initResponsiveEnhancements;

function initConnectedNavigation() {
  applySmartNavLinks(document);
  initContactForm();
  initResponsiveEnhancements();
  window.addEventListener("resize", () => {
    window.initResponsiveEnhancements?.();
  }, { passive: true });
}

function showPostLoginToast() {
  try {
    const raw = sessionStorage.getItem("cvrLoginToast");
    if (!raw) return;
    sessionStorage.removeItem("cvrLoginToast");
    const { name } = JSON.parse(raw);
    cvrToast(`Successful login${name ? `, welcome back ${name}!` : "!"}`, "success");
  } catch {}
}

function showBookingBlockedToast() {
  try {
    if (!sessionStorage.getItem("cvrBookingBlockedToast")) return;
    sessionStorage.removeItem("cvrBookingBlockedToast");
    cvrToast("Admin and event manager accounts can't create bookings — manage reservations from here instead.", "warning");
  } catch {}
}

function showBookingSuccessToast() {
  try {
    const raw = sessionStorage.getItem("cvrBookingSuccessToast");
    if (!raw) return;
    sessionStorage.removeItem("cvrBookingSuccessToast");
    const { isUpdate } = JSON.parse(raw);
    cvrToast(
      isUpdate ? "Reservation updated successfully!" : "Booking submitted successfully! Review your quotation below.",
      "success"
    );
  } catch {}
}

function showPaymentSubmittedToast() {
  try {
    const raw = sessionStorage.getItem("cvrPaymentSubmittedToast");
    if (!raw) return;
    sessionStorage.removeItem("cvrPaymentSubmittedToast");
    cvrToast("Payment proof submitted! We'll verify it and update your status shortly.", "success");
  } catch {}
}

const AUTH_TRANSITION_PAGES = ["login.html", "register.html", "forgot-password.html"];

function isAuthPageHref(href) {
  if (!href || href.trim() === "" || href.trim().startsWith("#")) return false;
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    const file = url.pathname.split("/").pop();
    return AUTH_TRANSITION_PAGES.includes(file);
  } catch {
    return false;
  }
}

function cvrAuthNavigate(href) {
  const body = document.body;
  if (!body.classList.contains("login-bg")) {
    window.location.href = href;
    return;
  }
  body.classList.add("auth-page-leaving");
  body.classList.remove("auth-page-visible");
  window.setTimeout(() => {
    window.location.href = href;
  }, 260);
}
window.cvrAuthNavigate = cvrAuthNavigate;

function initAuthPageTransitions() {
  const body = document.body;
  if (!body.classList.contains("login-bg")) return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => body.classList.add("auth-page-visible"));
  });

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest("a[href]");
    if (!link || link.target === "_blank") return;
    if (!isAuthPageHref(link.getAttribute("href"))) return;

    e.preventDefault();
    cvrAuthNavigate(link.href);
  });

  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      body.classList.remove("auth-page-leaving");
      body.classList.add("auth-page-visible");
    }
  });
}

function initAdminTopbarScrollState() {
  const bar = document.querySelector(".admin-topbar");
  if (!bar) return;
  const sync = () => bar.classList.toggle("is-scrolled", window.scrollY > 4);
  sync();
  window.addEventListener("scroll", sync, { passive: true });
}

function labelAdminTableCells(table) {
  const heads = Array.from(table.querySelectorAll("thead th")).map((th) =>
    (th.textContent || "").replace(/\s+/g, " ").trim()
  );
  if (!heads.length) return;
  table.querySelectorAll("tbody tr").forEach((row) => {
    const cells = row.querySelectorAll("td");

    if (cells.length === 1 && cells[0].hasAttribute("colspan")) {
      row.classList.add("is-placeholder-row");
      return;
    }
    row.classList.remove("is-placeholder-row");
    cells.forEach((cell, i) => {
      const label = heads[i] || "";
      if (label) cell.setAttribute("data-label", label);
      else cell.removeAttribute("data-label");
    });
  });
}

function initAdminMobileTables() {
  if (!document.querySelector(".admin-page, .admin-wrap")) return;
  const tables = Array.from(document.querySelectorAll(".admin-wrap table.table")).filter(
    (t) => !t.closest(".fc") && !t.classList.contains("no-stack") && t.querySelector("thead th")
  );
  tables.forEach((table) => {
    table.classList.add("admin-stack-table");
    labelAdminTableCells(table);
    const body = table.querySelector("tbody");
    if (!body) return;
    const observer = new MutationObserver(() => labelAdminTableCells(table));
    observer.observe(body, { childList: true, subtree: true });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (!enforceRouteGuards()) return;
  initAuthPageTransitions();
  initConnectedNavigation();
  initInteractiveOptions();
  initRevealAnimations();
  initReservationSubmission();
  initQrPaymentUpload();
  initPaymentPageSummary();
  initQuotationReviewPage();
  initReservationStatusView();
  initPaymentVerificationTable();
  initCustomerLoginForm();
  initCustomerLoginPicker();
  initCustomerRegisterForm();
  initCustomerDashboardPage();
  initCustomerSettingsPage();
  showPostLoginToast();
  showBookingBlockedToast();
  showBookingSuccessToast();
  showPaymentSubmittedToast();
  initAdminTopbarScrollState();
  initAdminMobileTables();
});

function cvrConfirmModal(options = {}) {
  const {
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmText = "Delete",
    cancelText = "Cancel",
    confirmVariant = "danger",
    icon = "bi-exclamation-triangle",
    withReason = false,
    reasonLabel = "Reason (optional)",
    reasonPlaceholder = "",
    reasonRequired = false,
  } = options;

  return new Promise((resolve) => {
    let modalEl = document.getElementById("cvrConfirmModal");
    if (!modalEl) {
      modalEl = document.createElement("div");
      modalEl.id = "cvrConfirmModal";
      modalEl.className = "modal fade";
      modalEl.tabIndex = -1;
      modalEl.setAttribute("aria-hidden", "true");
      modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title d-flex align-items-center gap-2">
                <i id="cvrConfirmModalIcon" class="bi bi-exclamation-triangle text-danger"></i>
                <span id="cvrConfirmModalTitle">Are you sure?</span>
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p class="mb-0 text-muted-brand" id="cvrConfirmModalMessage"></p>
              <div class="mt-3 d-none" id="cvrConfirmModalReasonWrap">
                <label class="form-label small text-muted-brand mb-1" for="cvrConfirmModalReason" id="cvrConfirmModalReasonLabel"></label>
                <textarea class="form-control" id="cvrConfirmModalReason" rows="3"></textarea>
                <div class="small text-danger mt-1 d-none" id="cvrConfirmModalReasonError">Please provide a reason.</div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" id="cvrConfirmModalCancelBtn">Cancel</button>
              <button type="button" class="btn btn-danger" id="cvrConfirmModalConfirmBtn">Delete</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(modalEl);
    }

    modalEl.querySelector("#cvrConfirmModalIcon").className = `bi ${icon} text-${confirmVariant}`;
    modalEl.querySelector("#cvrConfirmModalTitle").textContent = title;
    modalEl.querySelector("#cvrConfirmModalMessage").textContent = message;
    modalEl.querySelector("#cvrConfirmModalCancelBtn").textContent = cancelText;

    const confirmBtn = modalEl.querySelector("#cvrConfirmModalConfirmBtn");
    confirmBtn.textContent = confirmText;
    confirmBtn.className = `btn btn-${confirmVariant}`;

    const reasonWrap = modalEl.querySelector("#cvrConfirmModalReasonWrap");
    const reasonInput = modalEl.querySelector("#cvrConfirmModalReason");
    const reasonError = modalEl.querySelector("#cvrConfirmModalReasonError");
    reasonWrap.classList.toggle("d-none", !withReason);
    reasonError.classList.add("d-none");
    reasonInput.value = "";
    reasonInput.placeholder = reasonPlaceholder;
    modalEl.querySelector("#cvrConfirmModalReasonLabel").textContent = reasonLabel;

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    let settled = false;

    const cleanup = () => {
      confirmBtn.removeEventListener("click", onConfirm);
      modalEl.removeEventListener("hidden.bs.modal", onHidden);
    };
    const onConfirm = () => {
      const reason = reasonInput.value.trim();
      if (withReason && reasonRequired && reason === "") {
        reasonError.classList.remove("d-none");
        reasonInput.focus();
        return;
      }
      settled = true;
      cleanup();
      modal.hide();
      resolve({ confirmed: true, reason });
    };
    const onHidden = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ confirmed: false, reason: "" });
    };

    confirmBtn.addEventListener("click", onConfirm);
    modalEl.addEventListener("hidden.bs.modal", onHidden);
    modal.show();
  });
}
window.cvrConfirmModal = cvrConfirmModal;
/* ---- Casa Vergara: CTA panel entrance animation + tap ripple (laravel-ui.css) ---- */
(function () {
  function init() {
    var panels = document.querySelectorAll(".landing-cta-panel");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panels.forEach(function (panel) {
      if (reduce || !("IntersectionObserver" in window)) return;
      panel.classList.add("cv-anim");
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { panel.classList.add("is-in"); io.disconnect(); }
        });
      }, { threshold: 0.2 });
      io.observe(panel);
      panel.addEventListener("touchstart", function () {
        panel.classList.add("is-touched");
        clearTimeout(panel._cvT);
        panel._cvT = setTimeout(function () { panel.classList.remove("is-touched"); }, 900);
      }, { passive: true });
    });
    document.addEventListener("pointerdown", function (ev) {
      var btn = ev.target.closest && ev.target.closest(".landing-cta-panel .btn");
      if (!btn) return;
      var r = btn.getBoundingClientRect();
      var s = document.createElement("span");
      var size = Math.max(r.width, r.height);
      s.className = "cv-ripple";
      s.style.width = s.style.height = size + "px";
      s.style.left = ev.clientX - r.left - size / 2 + "px";
      s.style.top = ev.clientY - r.top - size / 2 + "px";
      btn.appendChild(s);
      setTimeout(function () { s.remove(); }, 650);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
