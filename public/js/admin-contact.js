

function initAdminContactPage() {
  const clientsBody = document.getElementById("contactClientsBody");
  if (!clientsBody) return;

  const clientsEmpty = document.getElementById("contactClientsEmpty");
  const clientCount = document.getElementById("contactClientCount");
  const clientSearch = document.getElementById("contactClientSearch");
  const alertBox = document.getElementById("contactAlert");
  const recentList = document.getElementById("contactRecentList");
  const recentEmpty = document.getElementById("contactRecentEmpty");

  const modalEl = document.getElementById("contactComposeModal");
  const modal = modalEl ? new bootstrap.Modal(modalEl) : null;
  const modalLabel = document.getElementById("contactComposeModalLabel");
  const composeAlert = document.getElementById("contactComposeAlert");
  const composeClient = document.getElementById("contactComposeClient");
  const composeName = document.getElementById("contactComposeName");
  const composeEmail = document.getElementById("contactComposeEmail");
  const composeSubject = document.getElementById("contactComposeSubject");
  const composeTextarea = document.getElementById("contactComposeTextarea");
  const composeQuick = document.getElementById("contactComposeQuick");
  const composeSendBtn = document.getElementById("contactComposeSendBtn");

  const TEMPLATES = {
    booking:
      "Hi there,\n\nWe're just following up on your booking with Casa Vergara. Let us know if you'd like to adjust your dates, add guests, or arrange anything special for your stay.\n\nWe're happy to help.",
    payment:
      "Hi there,\n\nThis is a friendly reminder that we're still waiting for the payment (or proof of payment) for your reservation at Casa Vergara. Once we receive it, we'll confirm your booking right away.\n\nThank you!",
    thanks:
      "Hi there,\n\nThank you for staying with us at Casa Vergara! We hope you had a relaxing time. If you have a moment, we'd love to hear your feedback — and we hope to welcome you back soon.",
  };

  let clients = [];
  let replyToId = 0;

  const showAlert = (message, kind) => {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none", "alert-success", "alert-danger");
    alertBox.classList.add(kind === "success" ? "alert-success" : "alert-danger");
  };
  const showComposeError = (message) => {
    if (!composeAlert) return;
    composeAlert.textContent = message;
    composeAlert.classList.remove("d-none");
  };
  const hideComposeError = () => composeAlert?.classList.add("d-none");

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(String(value).replace(" ", "T")).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const renderClients = () => {
    const q = (clientSearch?.value || "").trim().toLowerCase();
    const filtered = clients.filter(
      (c) => !q || `${c.name} ${c.email}`.toLowerCase().includes(q)
    );
    if (clientCount) clientCount.textContent = String(filtered.length);

    if (!filtered.length) {
      clientsBody.innerHTML = "";
      clientsEmpty?.classList.remove("d-none");
      return;
    }
    clientsEmpty?.classList.add("d-none");
    clientsBody.innerHTML = filtered
      .map(
        (c) => `
        <tr>
          <td>
            <div class="fw-semibold">${escapeHtml(c.name)}</div>
            <div class="small text-muted-brand">${escapeHtml(c.email)}</div>
          </td>
          <td class="small text-muted-brand">${escapeHtml(c.phone || "—")}</td>
          <td class="text-end">
            <button type="button" class="btn btn-sm btn-brand contact-message-btn" data-id="${c.id}">
              <i class="bi bi-send me-1"></i>Message
            </button>
          </td>
        </tr>`
      )
      .join("");
  };

  const renderRecent = (messages) => {
    const recent = messages.slice(0, 8);
    if (!recent.length) {
      recentList.innerHTML = "";
      recentEmpty?.classList.remove("d-none");
      return;
    }
    recentEmpty?.classList.add("d-none");
    recentList.innerHTML = recent
      .map(
        (m) => `
        <div class="border rounded-3 p-2">
          <div class="d-flex justify-content-between gap-2">
            <div class="fw-semibold small text-truncate">${escapeHtml(m.name)}</div>
            <span class="small text-muted-brand text-nowrap">${formatDate(m.createdAt)}</span>
          </div>
          <div class="small text-muted-brand text-truncate">${escapeHtml(m.subject || "")}</div>
          <div class="d-flex justify-content-between align-items-center mt-1">
            ${
              m.origin === "staff"
                ? `<span class="badge text-bg-primary">Sent by us</span>`
                : m.repliedAt
                ? `<span class="badge text-bg-success">Replied</span>`
                : `<span class="badge text-bg-warning">Awaiting reply</span>`
            }
            <button type="button" class="btn btn-sm btn-outline-primary contact-reply-btn"
              data-id="${m.id}" data-name="${escapeHtml(m.name)}" data-email="${escapeHtml(m.email)}"
              data-subject="${escapeHtml(m.subject || "")}" data-origin="${escapeHtml(m.origin || "guest")}">
              <i class="bi bi-reply-fill me-1"></i>${m.origin === "staff" ? "Send again" : "Reply"}
            </button>
          </div>
        </div>`
      )
      .join("");
  };

  const openCompose = ({ clientId = 0, name = "", email = "", subject = "", replyId = 0 } = {}) => {
    hideComposeError();
    replyToId = replyId;
    if (modalLabel) {
      modalLabel.innerHTML = replyId
        ? `<i class="bi bi-reply-fill me-2"></i>Reply to ${escapeHtml(name)}`
        : `<i class="bi bi-pencil-square me-2"></i>Message a client`;
    }
    composeSubject.value = subject;
    composeTextarea.value = "";
    composeName.value = name;
    composeEmail.value = email;
    const manual = !clientId;
    composeName.readOnly = !manual;
    composeEmail.readOnly = !manual;
    if (composeClient) {
      composeClient.value = String(clientId || 0);
      composeClient.disabled = !!replyId;
    }
    modal?.show();
  };

  const loadClients = async () => {
    try {
      const { body } = await cvrApiGet("admin/clients-list");
      if (!body.success) {
        showAlert(body.message || "Could not load clients.", "danger");
        return;
      }
      clients = body.data.clients || [];
      if (composeClient) {
        composeClient.innerHTML =
          `<option value="0">Other / type an email manually</option>` +
          clients
            .map((c) => `<option value="${c.id}">${escapeHtml(c.name)} — ${escapeHtml(c.email)}</option>`)
            .join("");
      }
      renderClients();
    } catch {
      showAlert("Could not load clients. Please check your connection.", "danger");
    }
  };

  const loadRecent = async () => {
    try {
      const { body } = await cvrApiGet("admin/messages-list");
      if (!body.success) return;
      renderRecent(body.data.messages || []);
    } catch {

    }
  };

  clientSearch?.addEventListener("input", renderClients);

  clientsBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".contact-message-btn");
    if (!btn) return;
    const client = clients.find((c) => c.id === Number(btn.dataset.id));
    if (!client) return;
    openCompose({ clientId: client.id, name: client.name, email: client.email });
  });

  recentList.addEventListener("click", (e) => {
    const btn = e.target.closest(".contact-reply-btn");
    if (!btn) return;
    const isGuest = btn.dataset.origin !== "staff";
    openCompose({
      name: btn.dataset.name,
      email: btn.dataset.email,
      subject: btn.dataset.subject ? `Re: ${btn.dataset.subject}` : "",
      replyId: isGuest ? Number(btn.dataset.id) : 0,
    });
  });

  composeClient?.addEventListener("change", () => {
    const client = clients.find((c) => c.id === Number(composeClient.value));
    if (client) {
      composeName.value = client.name;
      composeEmail.value = client.email;
      composeName.readOnly = true;
      composeEmail.readOnly = true;
    } else {
      composeName.value = "";
      composeEmail.value = "";
      composeName.readOnly = false;
      composeEmail.readOnly = false;
    }
  });

  composeQuick?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-template]");
    if (!btn) return;
    composeTextarea.value = TEMPLATES[btn.dataset.template] || "";
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

  document.getElementById("contactComposeBtn")?.addEventListener("click", () => openCompose());

  composeSendBtn?.addEventListener("click", async () => {
    hideComposeError();
    const message = composeTextarea.value.trim();
    if (!message) {
      showComposeError("Please write a message before sending.");
      return;
    }

    const label = composeSendBtn.querySelector(".admin-btn-label");
    const spinner = composeSendBtn.querySelector(".spinner-border");
    composeSendBtn.disabled = true;
    label?.classList.add("d-none");
    spinner?.classList.remove("d-none");

    try {
      let body;
      if (replyToId) {
        ({ body } = await cvrApiPost("admin/messages-reply", { id: replyToId, reply: message }));
      } else {
        const payload = {
          clientId: Number(composeClient?.value || 0),
          name: composeName.value.trim(),
          email: composeEmail.value.trim(),
          subject: composeSubject.value.trim() || "A message from Casa Vergara",
          message,
        };
        if (!payload.clientId && (!payload.name || !payload.email)) {
          showComposeError("Pick a client account, or type the recipient's name and email.");
          return;
        }
        ({ body } = await cvrApiPost("admin/messages-compose", payload));
      }

      if (!body.success) {
        showComposeError(body.message || "Could not send the message. Please try again.");
        return;
      }
      modal?.hide();
      cvrToast(body.message || "Message sent to the client.", body.data?.emailSent === false ? "warning" : "success");
      loadRecent();
    } catch {
      showComposeError("Could not send the message. Please check your connection and try again.");
    } finally {
      composeSendBtn.disabled = false;
      label?.classList.remove("d-none");
      spinner?.classList.add("d-none");
    }
  });

  modalEl?.addEventListener("hidden.bs.modal", () => {
    replyToId = 0;
    if (composeClient) composeClient.disabled = false;
  });

  loadClients();
  loadRecent();
}

window.initAdminContactPage = initAdminContactPage;
