
function initAdminLiveChatPage() {
  const listEl = document.getElementById("liveChatList");
  const threadEl = document.getElementById("liveChatThread");
  const emptyEl = document.getElementById("liveChatEmpty");
  const composer = document.getElementById("liveChatComposer");
  const composerMount = document.getElementById("liveChatComposerMount");
  const searchInput = document.getElementById("liveChatSearch");
  const guestNameEl = document.getElementById("liveChatGuestName");
  const guestAvatarEl = document.getElementById("liveChatGuestAvatar");
  const shellEl = document.getElementById("liveChatShell");
  const profileEl = document.getElementById("liveChatProfile");
  const profileToggle = document.getElementById("liveChatProfileToggle");
  const guestMetaEl = document.getElementById("liveChatGuestMeta");
  const presenceEl = document.getElementById("liveChatStaffPresence");
  if (!listEl || !threadEl) return;

  window.__cvrChatIsStaffView = true;
  cvrChatBindAvatarFallback(listEl);
  cvrChatBindAvatarFallback(guestAvatarEl);

  cvrChatBindMessageEvents(threadEl, {
    onDelete: async (id, scope) => {
      const body = await cvrChatDeleteMessage(id, scope);
      if (!body?.success) {
        if (typeof cvrToast === "function") cvrToast(body?.message || "Could not delete the message.", "danger");
        return;
      }
      if (scope === "me") state.messages = state.messages.filter((m) => m.id !== id);
      else state.messages = state.messages.map((m) => (m.id === id ? body.data.message : m));
      renderThread(true);
      loadInbox();
    },
  });
  const scroller = cvrChatCreateScroller(threadEl);
  let renderedSig = "";

  const state = {
    conversations: [],
    activeId: 0,
    messages: [],
    lastId: 0,
    sig: "",
    userId: (typeof getCustomerSession === "function" ? getCustomerSession() : null)?.id || 0,
    topics: [],
  };

  const params = new URLSearchParams(location.search);
  const requestedId = Number(params.get("c") || 0);

  const applyPresence = (presence) => {
    if (!presenceEl) return;
    const online = !!presence?.staffOnline;
    presenceEl.innerHTML = online
      ? `<span class="cvr-chat-status-dot is-online"></span> You are online. Staff and admins share this inbox.`
      : `<span class="cvr-chat-status-dot is-offline"></span> No team member is marked online right now`;
  };

  const filteredConversations = () => {
    const q = (searchInput?.value || "").trim().toLowerCase();
    if (!q) return state.conversations;
    return state.conversations.filter((c) => {
      const hay = `${c.customerName || ""} ${c.customerEmail || ""} ${c.lastMessagePreview || ""} ${c.reservationId || ""}`.toLowerCase();
      return hay.includes(q);
    });
  };

  const renderList = () => {
    const items = filteredConversations();
    if (!items.length) {
      listEl.innerHTML = `<p class="small text-muted-brand px-3 py-4 mb-0">No client conversations yet.</p>`;
      return;
    }
    listEl.innerHTML = items
      .map((c) => {
        const active = Number(c.id) === Number(state.activeId);
        const unread = Number(c.staffUnread) > 0;
        const when = c.lastMessageAt ? cvrChatFormatTime(c.lastMessageAt) : "";
        return `<button type="button" class="live-chat-conv ${active ? "is-active" : ""} ${unread ? "is-unread" : ""}" data-id="${c.id}">
          <span class="live-chat-conv-avatar" title="${escapeHtml(cvrChatGuestPresenceLabel(c))}">
            ${cvrChatAvatarMarkup(c.customerAvatarUrl, cvrChatInitials(c.customerName || "Guest"), "cvr-chat-avatar--md")}
            <span class="live-chat-presence-dot ${c.customerOnline ? "is-online" : ""}"></span>
          </span>
          <span class="live-chat-conv-body">
            <span class="d-flex justify-content-between gap-2">
              <strong class="text-truncate">${escapeHtml(c.customerName || "Guest")}</strong>
              ${unread ? `<span class="badge text-bg-danger">${c.staffUnread > 9 ? "9+" : c.staffUnread}</span>` : ""}
            </span>
            <span class="d-block small text-muted-brand text-truncate">${escapeHtml(c.lastMessagePreview || "No messages yet")}</span>
            <span class="d-block small text-muted-brand">${escapeHtml(when)}${c.reservationId ? " · " + escapeHtml(c.reservationId) : ""}</span>
          </span>
        </button>`;
      })
      .join("");
  };


  /* ---------- Guest profile / account preview ---------- */
  const PROFILE_KEY = "cvrChatProfileOpen";
  const profileState = { open: true, cache: {}, html: "" };
  try {
    profileState.open = localStorage.getItem(PROFILE_KEY) !== "0";
  } catch {}

  const setProfileOpen = (open) => {
    profileState.open = open;
    try { localStorage.setItem(PROFILE_KEY, open ? "1" : "0"); } catch {}
    profileState.html = "";
    renderProfile();
    if (open) loadProfile(true);
  };

  const fmtDate = (raw) => {
    const d = cvrChatParseDate(raw);
    return d ? d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
  };

  const fmtMoney = (amount, currency) => {
    if (amount === null || amount === undefined) return "";
    const sym = !currency || currency === "PHP" ? "₱" : `${currency} `;
    return sym + Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const chipTone = (text) => {
    const t = String(text || "").toLowerCase();
    if (/(confirm|approv|paid|complete|verified|active|success)/.test(t)) return "ok";
    if (/(cancel|reject|declin|fail|suspend|refund)/.test(t)) return "bad";
    if (/(pend|await|review|wait|unpaid|partial|new)/.test(t)) return "warn";
    return "";
  };

  const chip = (text, tone) => (text ? `<span class="lcp-chip ${tone ?? chipTone(text)}">${escapeHtml(text)}</span>` : "");

  const infoRow = (icon, label, valueHtml) =>
    valueHtml
      ? `<div class="lcp-row"><i class="bi ${icon}"></i><div><span class="lcp-label">${label}</span><span class="lcp-value">${valueHtml}</span></div></div>`
      : "";

  const renderProfile = () => {
    if (!profileEl || !shellEl) return;
    const conv = state.conversations.find((c) => Number(c.id) === Number(state.activeId));

    if (profileToggle) {
      profileToggle.classList.toggle("d-none", !conv);
      profileToggle.setAttribute("aria-expanded", conv && profileState.open ? "true" : "false");
      profileToggle.classList.toggle("active", !!(conv && profileState.open));
    }

    if (!conv || !profileState.open) {
      shellEl.classList.remove("has-profile");
      profileEl.classList.add("d-none");
      profileState.html = "";
      return;
    }
    shellEl.classList.add("has-profile");
    profileEl.classList.remove("d-none");

    const p = profileState.cache[conv.id]?.data || null;
    const name = p?.name || conv.customerName || "Guest";
    const email = p?.email || conv.customerEmail || "";
    const online = !!conv.customerOnline;
    const presence = cvrChatGuestPresenceLabel(conv);

    let html = `
      <div class="lcp-head">
        <button type="button" class="lcp-close" data-profile-close aria-label="Close profile"><i class="bi bi-x-lg"></i></button>
        <span class="lcp-avatar">
          ${cvrChatAvatarMarkup(p?.avatarUrl || conv.customerAvatarUrl, cvrChatInitials(name), "cvr-chat-avatar--xl")}
          <span class="live-chat-presence-dot live-chat-presence-dot--lg ${online ? "is-online" : ""}"></span>
        </span>
        <h3 class="lcp-name">${escapeHtml(name)}</h3>
        <div class="lcp-presence ${online ? "is-online" : ""}">${escapeHtml(presence)}</div>
        ${p ? `<div class="lcp-chips">${chip(p.verified ? "Verified" : "Not verified", p.verified ? "ok" : "warn")}${chip(p.accountStatus === "suspended" ? "Suspended" : "Active account", p.accountStatus === "suspended" ? "bad" : "ok")}</div>` : ""}
      </div>`;

    if (!p) {
      html += profileState.cache[conv.id]?.error
        ? `<p class="lcp-empty">Could not load the account details.</p>`
        : `<p class="lcp-empty">Loading account details…</p>`;
    } else {
      html += `
      <section class="lcp-section">
        <h4>Account</h4>
        ${infoRow("bi-envelope", "Email", email ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : "")}
        ${infoRow("bi-telephone", "Phone", p.phone ? `<a href="tel:${escapeHtml(p.phone)}">${escapeHtml(p.phone)}</a>` : "")}
        ${infoRow("bi-calendar-check", "Member since", escapeHtml(fmtDate(p.memberSince)))}
        ${infoRow("bi-hash", "Account ID", escapeHtml(String(p.userId)))}
      </section>
      <section class="lcp-section">
        <h4>This chat</h4>
        ${infoRow("bi-chat-dots", "Messages", `${p.chat.messages} total · ${p.chat.fromGuest} from the guest`)}
        ${infoRow("bi-clock-history", "Started", escapeHtml(fmtDate(p.chat.startedAt)))}
        ${infoRow("bi-tag", "Topic", escapeHtml(cvrChatTopicLabel(p.chat.topic, state.topics) || ""))}
        ${infoRow("bi-bookmark", "Linked booking", escapeHtml(p.chat.reservationId || ""))}
      </section>
      <section class="lcp-section">
        <h4>Bookings <span class="lcp-count">${p.reservationCount}</span></h4>
        ${
          p.reservations.length
            ? p.reservations
                .map((r) => {
                  const dates =
                    r.type === "event"
                      ? fmtDate(r.date || r.checkIn)
                      : [fmtDate(r.checkIn), fmtDate(r.checkOut)].filter(Boolean).join(" → ");
                  return `<div class="lcp-booking">
                    <div class="d-flex justify-content-between align-items-center gap-2">
                      <strong class="text-truncate">${escapeHtml(r.id)}</strong>${chip(r.status)}
                    </div>
                    <div class="lcp-booking-line"><i class="bi ${r.type === "event" ? "bi-balloon-heart" : "bi-house-door"}"></i>${escapeHtml(r.name || (r.type === "event" ? "Event booking" : "Room stay"))}</div>
                    ${dates ? `<div class="lcp-booking-line"><i class="bi bi-calendar3"></i>${escapeHtml(dates)}</div>` : ""}
                    <div class="d-flex justify-content-between align-items-center gap-2 mt-1">${chip(r.paymentStatus)}<span class="lcp-total">${escapeHtml(fmtMoney(r.total, r.currency))}</span></div>
                  </div>`;
                })
                .join("")
            : `<p class="lcp-empty">No bookings yet.</p>`
        }
        ${p.reservationCount > p.reservations.length ? `<a class="lcp-more" href="reservations.html">View all ${p.reservationCount} in Reservations <i class="bi bi-arrow-right"></i></a>` : ""}
      </section>
      ${email ? `<div class="lcp-actions"><a class="btn btn-sm btn-brand w-100" href="mailto:${escapeHtml(email)}"><i class="bi bi-envelope me-1"></i>Email guest</a></div>` : ""}`;
    }

    if (html === profileState.html) return;
    profileState.html = html;
    profileEl.innerHTML = html;
  };

  const loadProfile = async (force = false) => {
    if (!profileState.open || !state.activeId) return;
    const id = state.activeId;
    const cached = profileState.cache[id];
    if (!force && cached && Date.now() - cached.at < 60000) return;
    const { body } = await cvrApiGet(`chat/profile?id=${id}`);
    if (!body?.success) {
      profileState.cache[id] = { data: cached?.data || null, error: true, at: Date.now() };
    } else {
      profileState.cache[id] = { data: body.data.profile, error: false, at: Date.now() };
    }
    renderProfile();
  };

  profileEl?.addEventListener("click", (e) => {
    if (e.target.closest("[data-profile-close]")) setProfileOpen(false);
  });
  profileToggle?.addEventListener("click", () => setProfileOpen(!profileState.open));
  guestAvatarEl?.addEventListener("click", () => {
    if (!profileState.open) setProfileOpen(true);
  });
  cvrChatBindAvatarFallback(profileEl);

  const renderThread = (force = false) => {
    const conv = state.conversations.find((c) => Number(c.id) === Number(state.activeId));
    if (!conv) {
      emptyEl?.classList.remove("d-none");
      composer?.classList.add("d-none");
      threadEl.innerHTML = "";
      guestAvatarEl?.classList.add("d-none");
      renderProfile();
      renderedSig = "";
      if (guestNameEl) guestNameEl.textContent = "Select a conversation";
      if (guestMetaEl) guestMetaEl.textContent = "Client messages appear here as they arrive.";
      return;
    }
    emptyEl?.classList.add("d-none");
    composer?.classList.remove("d-none");
    renderProfile();
    if (guestNameEl) guestNameEl.textContent = conv.customerName || "Guest";
    if (guestAvatarEl) {
      guestAvatarEl.innerHTML = `${cvrChatAvatarMarkup(conv.customerAvatarUrl, cvrChatInitials(conv.customerName || "Guest"), "cvr-chat-avatar--md")}<span class="live-chat-presence-dot ${conv.customerOnline ? "is-online" : ""}"></span>`;
      guestAvatarEl.classList.remove("d-none");
    }
    if (guestMetaEl) {
      const bits = [conv.customerEmail, conv.reservationId].filter(Boolean);
      guestMetaEl.innerHTML = `<span class="cvr-chat-status-dot ${conv.customerOnline ? "is-online" : "is-offline"}"></span><strong class="${conv.customerOnline ? "text-success" : ""}">${escapeHtml(cvrChatGuestPresenceLabel(conv))}</strong>${bits.length ? " · " + escapeHtml(bits.join(" · ")) : ""}`;
    }
    const last = state.messages.length ? state.messages[state.messages.length - 1].id : 0;
    const seenKey = state.messages.map((m) => `${m.id}${m.readAt ? "r" : ""}${m.deleted ? "d" : ""}`).join(",");
    const sig = `${state.activeId}:${state.messages.length}:${last}:${seenKey}`;
    if (sig === renderedSig && !force) return;
    const switched = !renderedSig.startsWith(`${state.activeId}:`);
    renderedSig = sig;
    scroller.beforeRender(force || switched);
    threadEl.innerHTML = cvrChatRenderBubbles(state.messages || [], {
      viewer: "staff",
      theirAvatar: cvrChatInitials(conv.customerName || "Guest"),
      theirAvatarUrl: conv.customerAvatarUrl || "",
    });
    scroller.afterRender();
  };

  const loadInbox = async () => {
    const { body } = await cvrApiGet("chat/inbox");
    if (!body?.success) return;
    state.conversations = body.data.conversations || [];
    state.topics = body.data.topics || [];
    applyPresence(body.data.presence);
    if (!state.activeId && requestedId) state.activeId = requestedId;
    if (!state.activeId && state.conversations.length) state.activeId = state.conversations[0].id;
    renderList();
    updateSidebarBadge(body.data.unreadCount || 0);
  };

  const loadThread = async (reset) => {
    if (!state.activeId) {
      renderThread();
      return;
    }
    const after = reset ? 0 : state.lastId;
    const { body } = await cvrApiGet(`chat/thread?id=${state.activeId}&afterId=${after}`);
    if (!body?.success) return;
    applyPresence(body.data.presence);
    if (reset) state.messages = body.data.messages || [];
    else {
      (body.data.messages || []).forEach((m) => {
        if (!state.messages.some((x) => x.id === m.id)) state.messages.push(m);
      });
    }
    const applied = cvrChatApplyStatuses(state.messages, body.data.statuses || []);
    state.messages = applied.messages;
    state.sig = body.data.sig || "";
    if (state.messages.length) state.lastId = Math.max(state.lastId, state.messages[state.messages.length - 1].id);
    const conv = body.data.conversation;
    if (conv) {
      const idx = state.conversations.findIndex((c) => Number(c.id) === Number(conv.id));
      if (idx >= 0) state.conversations[idx] = { ...state.conversations[idx], ...conv };
    }
    renderThread();
    renderList();
    loadProfile();
    await cvrApiPost("chat/mark-read", { conversationId: state.activeId });
  };

  const updateSidebarBadge = (n) => {
    const badge = document.getElementById("adminLiveChatBadge");
    if (!badge) return;
    if (n > 0) {
      badge.textContent = n > 9 ? "9+" : String(n);
      badge.classList.remove("d-none");
    } else badge.classList.add("d-none");
  };

  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-id]");
    if (!btn) return;
    state.activeId = Number(btn.dataset.id);
    state.lastId = 0;
    state.sig = "";
    state.messages = [];
    const url = new URL(location.href);
    url.searchParams.set("c", String(state.activeId));
    history.replaceState({}, "", url);
    renderList();
    loadThread(true);
  });

  searchInput?.addEventListener("input", renderList);

  const composerCtl = composerMount
    ? cvrChatBuildComposer(composerMount, {
        send: async (payload) => {
          if (!state.activeId) return false;
          let res;
          if (payload.type === "file") {
            const fd = new FormData();
            fd.append("file", payload.file);
            fd.append("conversationId", String(state.activeId));
            res = await cvrApiPostForm("chat/send", fd);
          } else {
            res = await cvrApiPost("chat/send", { ...payload, conversationId: state.activeId });
          }
          const body = res.body;
          if (!body?.success) {
            if (typeof cvrToast === "function") cvrToast(body?.message || "Could not send reply.", "danger");
            return false;
          }
          if (body.data.message && !state.messages.some((x) => x.id === body.data.message.id)) {
            state.messages.push(body.data.message);
            state.lastId = body.data.message.id;
          }
          renderThread(true);
          loadInbox();
          return true;
        },
      })
    : null;

  const poll = async () => {
    await loadInbox();
    if (state.activeId) await loadThread(false);
  };

  poll();
  setInterval(() => {
    if (!document.hidden) poll();
  }, 2500);
}

window.initAdminLiveChatPage = initAdminLiveChatPage;
