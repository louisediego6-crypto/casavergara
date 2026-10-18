

function initAdminMessagesPage() {
  const tableBody = document.getElementById("messagesTableBody");
  if (!tableBody) return;

  const emptyRow = document.getElementById("messagesEmptyRow");
  const searchInput = document.getElementById("messagesSearchInput");
  const statusFilter = document.getElementById("messagesStatusFilter");
  const directionFilter = document.getElementById("messagesDirectionFilter");
  const resultCount = document.getElementById("messagesResultCount");
  const alertBox = document.getElementById("messagesAlert");

  const replyModalEl = document.getElementById("messageReplyModal");
  const replyModal = replyModalEl ? new bootstrap.Modal(replyModalEl) : null;
  const replyAlert = document.getElementById("messageReplyAlert");
  const replyIdInput = document.getElementById("messageReplyId");
  const replyGuestName = document.getElementById("messageReplyGuestName");
  const replyGuestEmail = document.getElementById("messageReplyGuestEmail");
  const replySubjectBadge = document.getElementById("messageReplySubjectBadge");
  const replyOriginalText = document.getElementById("messageReplyOriginalText");
  const replyPreviousWrap = document.getElementById("messageReplyPreviousWrap");
  const replyPreviousText = document.getElementById("messageReplyPreviousText");
  const replyTextarea = document.getElementById("messageReplyTextarea");
  const replySendBtn = document.getElementById("messageReplySendBtn");

  let latestMessages = [];

  const showAlert = (message, kind) => {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none", "alert-success", "alert-danger");
    alertBox.classList.add(kind === "success" ? "alert-success" : "alert-danger");
  };

  const showReplyAlert = (message) => {
    if (!replyAlert) return;
    replyAlert.textContent = message;
    replyAlert.classList.remove("d-none");
  };
  const hideReplyAlert = () => {
    if (!replyAlert) return;
    replyAlert.classList.add("d-none");
    replyAlert.textContent = "";
  };

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value.replace(" ", "T")).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const statusBadge = (m) =>
    m.repliedAt
      ? `<span class="badge text-bg-success">Replied</span>`
      : `<span class="badge text-bg-warning">Awaiting reply</span>`;

  const recipientBadge = (m) =>
    m.recipientRole === "staff"
      ? `<span class="badge text-bg-info-subtle text-info-emphasis border border-info-subtle"><i class="bi bi-people me-1"></i>Staff</span>`
      : `<span class="badge text-bg-light border"><i class="bi bi-person-badge me-1"></i>Admin</span>`;

  const originBadge = (m) =>
    m.origin === "staff"
      ? `<span class="badge text-bg-primary"><i class="bi bi-send me-1"></i>Sent by us</span>`
      : `<span class="badge text-bg-light border"><i class="bi bi-inbox me-1"></i>From guest</span>`;

  const applyFiltersAndRender = () => {
    const q = (searchInput?.value || "").trim().toLowerCase();
    const status = statusFilter?.value || "all";
    const direction = directionFilter?.value || "all";

    const filtered = latestMessages.filter((m) => {
      const origin = m.origin === "staff" ? "staff" : "guest";
      if (direction !== "all" && origin !== direction) return false;
      if (status === "replied" && !m.repliedAt) return false;
      if (status === "unreplied" && m.repliedAt) return false;
      if (q) {
        const hay = `${m.name} ${m.email} ${m.subject} ${m.message}`.toLowerCase();
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
        (m) => `
        <tr data-id="${m.id}">
          <td>
            <div class="fw-semibold">${escapeHtml(m.name)}</div>
            <div class="small text-muted-brand">${escapeHtml(m.email)}</div>
            ${m.phone ? `<div class="small text-muted-brand">${escapeHtml(m.phone)}</div>` : ""}
          </td>
          <td>
            <div class="mb-1"><span class="badge text-bg-light border">${escapeHtml(m.subject)}</span></div>
            <div class="small text-truncate" style="max-width: 320px;">${escapeHtml(m.message)}</div>
          </td>
          <td class="text-nowrap">
            <div class="mb-1">${recipientBadge(m)}</div>
            <div>${originBadge(m)}</div>
          </td>
          <td class="small text-muted-brand text-nowrap">${formatDate(m.createdAt)}</td>
          <td class="text-end text-nowrap">
            <div class="mb-2">${statusBadge(m)}</div>
            <button type="button" class="btn btn-sm btn-brand message-reply-btn" data-id="${m.id}">
              <i class="bi bi-reply-fill me-1"></i>${m.origin === "staff" ? "View / send again" : m.repliedAt ? "View / reply again" : "Reply"}
            </button>
          </td>
        </tr>`
      )
      .join("");
  };

  let pendingOpenId = Number(new URLSearchParams(window.location.search).get("open")) || 0;

  const loadMessages = async () => {
    const { body } = await cvrApiGet("admin/messages-list");
    if (!body.success) {
      showAlert(body.message || "Could not load contact messages.");
      return;
    }
    latestMessages = body.data.messages || [];
    applyFiltersAndRender();

    if (pendingOpenId) {
      const target = latestMessages.find((row) => row.id === pendingOpenId);
      pendingOpenId = 0;
      if (target) {
        openReplyModal(target);
        document.querySelector(`tr[data-id="${target.id}"]`)?.scrollIntoView({ block: "center" });
      }
    }
  };

  searchInput?.addEventListener("input", applyFiltersAndRender);
  statusFilter?.addEventListener("change", applyFiltersAndRender);
  directionFilter?.addEventListener("change", applyFiltersAndRender);

  const openReplyModal = (m) => {
    hideReplyAlert();
    replyIdInput.value = String(m.id);
    replyGuestName.textContent = m.name;
    replyGuestEmail.textContent = m.email;
    replySubjectBadge.textContent = m.subject;
    replyOriginalText.textContent = m.message;
    if (m.adminReply) {
      replyPreviousWrap.classList.remove("d-none");
      replyPreviousText.textContent = m.adminReply;
    } else {
      replyPreviousWrap.classList.add("d-none");
      replyPreviousText.textContent = "";
    }
    replyTextarea.value = "";
    replyModal?.show();
    setTimeout(() => replyTextarea?.focus(), 300);
  };

  tableBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".message-reply-btn");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const m = latestMessages.find((row) => row.id === id);
    if (m) openReplyModal(m);
  });

  replySendBtn?.addEventListener("click", async () => {
    hideReplyAlert();
    const id = Number(replyIdInput.value);
    const reply = replyTextarea.value.trim();

    if (!reply) {
      showReplyAlert("Please write a reply before sending.");
      return;
    }

    const label = replySendBtn.querySelector(".admin-btn-label");
    const spinner = replySendBtn.querySelector(".spinner-border");
    replySendBtn.disabled = true;
    label?.classList.add("d-none");
    spinner?.classList.remove("d-none");

    try {
      const { body } = await cvrApiPost("admin/messages-reply", { id, reply });
      if (!body.success) {
        showReplyAlert(body.message || "Could not send the reply. Please try again.");
        return;
      }
      replyModal?.hide();
      const emailSent = body.data?.emailSent !== false;
      cvrToast(body.message || "Reply sent to the guest's Gmail.", emailSent ? "success" : "warning");
      loadMessages();
    } catch {
      showReplyAlert("Could not send the reply. Please check your connection and try again.");
    } finally {
      replySendBtn.disabled = false;
      label?.classList.remove("d-none");
      spinner?.classList.add("d-none");
    }
  });

  const composeBtn = document.getElementById("messageComposeBtn");
  const composeModalEl = document.getElementById("messageComposeModal");
  const composeModal = composeModalEl ? new bootstrap.Modal(composeModalEl) : null;
  const composeAlert = document.getElementById("messageComposeAlert");
  const composeClient = document.getElementById("messageComposeClient");
  const composeName = document.getElementById("messageComposeName");
  const composeEmail = document.getElementById("messageComposeEmail");
  const composeSubject = document.getElementById("messageComposeSubject");
  const composeTextarea = document.getElementById("messageComposeTextarea");
  const composeQuick = document.getElementById("messageComposeQuick");
  const composeSendBtn = document.getElementById("messageComposeSendBtn");

  let clients = [];
  let clientsLoaded = false;

  const showComposeError = (message) => {
    if (!composeAlert) return;
    composeAlert.textContent = message;
    composeAlert.classList.remove("d-none");
  };
  const hideComposeError = () => composeAlert?.classList.add("d-none");

  const loadClients = async () => {
    if (clientsLoaded || !composeClient) return;
    const { body } = await cvrApiGet("admin/clients-list");
    if (!body.success) return;
    clients = body.data.clients || [];
    clientsLoaded = true;
    composeClient.innerHTML =
      `<option value="0">Other / type an email manually</option>` +
      clients
        .map((c) => `<option value="${c.id}">${escapeHtml(c.name)} — ${escapeHtml(c.email)}</option>`)
        .join("");
  };

  const TEMPLATES = {
    booking: "Hi there,\n\nWe're just following up on your booking with Casa Vergara. Let us know if you'd like to adjust your dates, add guests, or arrange anything special for your stay.\n\nWe're happy to help.",
    payment: "Hi there,\n\nThis is a friendly reminder that we're still waiting for the payment (or proof of payment) for your reservation at Casa Vergara. Once we receive it, we'll confirm your booking right away.\n\nThank you!",
    thanks: "Hi there,\n\nThank you for staying with us at Casa Vergara! We hope you had a relaxing time. If you have a moment, we'd love to hear your feedback — and we hope to welcome you back soon.",
  };

  composeClient?.addEventListener("change", () => {
    const id = Number(composeClient.value);
    const client = clients.find((c) => c.id === id);
    if (client) {
      composeName.value = client.name;
      composeEmail.value = client.email;
      composeName.readOnly = true;
      composeEmail.readOnly = true;
    } else {
      composeName.readOnly = false;
      composeEmail.readOnly = false;
      composeName.value = "";
      composeEmail.value = "";
    }
  });

  composeQuick?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-template]");
    if (!btn) return;
    const text = TEMPLATES[btn.dataset.template];
    if (!text) return;
    composeTextarea.value = text;
    if (!composeSubject.value.trim()) {
      composeSubject.value =
        btn.dataset.template === "payment"
          ? "Payment reminder for your reservation"
          : btn.dataset.template === "thanks"
          ? "Thank you for staying with us"
          : "Following up on your booking";
    }
    composeTextarea.focus();
  });

  composeBtn?.addEventListener("click", async () => {
    hideComposeError();
    composeSubject.value = "";
    composeTextarea.value = "";
    composeName.value = "";
    composeEmail.value = "";
    composeName.readOnly = false;
    composeEmail.readOnly = false;
    if (composeClient) composeClient.value = "0";
    composeModal?.show();
    loadClients();
  });

  composeSendBtn?.addEventListener("click", async () => {
    hideComposeError();
    const payload = {
      clientId: Number(composeClient?.value || 0),
      name: composeName.value.trim(),
      email: composeEmail.value.trim(),
      subject: composeSubject.value.trim() || "A message from Casa Vergara",
      message: composeTextarea.value.trim(),
    };

    if (!payload.clientId && (!payload.name || !payload.email)) {
      showComposeError("Pick a client account, or type the recipient's name and email.");
      return;
    }
    if (!payload.message) {
      showComposeError("Please write a message before sending.");
      return;
    }

    const label = composeSendBtn.querySelector(".admin-btn-label");
    const spinner = composeSendBtn.querySelector(".spinner-border");
    composeSendBtn.disabled = true;
    label?.classList.add("d-none");
    spinner?.classList.remove("d-none");
    try {
      const { body } = await cvrApiPost("admin/messages-compose", payload);
      if (!body.success) {
        showComposeError(body.message || "Could not send the message. Please try again.");
        return;
      }
      composeModal?.hide();
      cvrToast(body.message || "Message sent to the client.", body.data?.emailSent === false ? "warning" : "success");
      loadMessages();
    } catch {
      showComposeError("Could not send the message. Please check your connection and try again.");
    } finally {
      composeSendBtn.disabled = false;
      label?.classList.remove("d-none");
      spinner?.classList.add("d-none");
    }
  });

  loadMessages();
}

window.initAdminMessagesPage = initAdminMessagesPage;
