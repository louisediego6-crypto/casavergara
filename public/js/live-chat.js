
/* ==========================================================================
   Shared chat helpers (used by the guest widget and the admin inbox)
   ========================================================================== */

const CVR_CHAT_MAX_BYTES = 8 * 1024 * 1024;
const CVR_CHAT_MAX_STAGED = 6;
const CVR_CHAT_IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp"];
const CVR_CHAT_ALLOWED_EXTS = [...CVR_CHAT_IMAGE_EXTS, "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"];
const CVR_CHAT_FILE_ACCEPT = CVR_CHAT_ALLOWED_EXTS.map((e) => `.${e}`).join(",");
const CVR_CHAT_GROUP_GAP_MS = 15 * 60 * 1000;

const CVR_CHAT_STICKERS = [
  "👍", "❤️", "😂", "😮", "😢", "🙏", "🎉", "🔥",
  "👏", "😍", "😊", "😎", "🥳", "🤝", "✅", "👌",
  "🌴", "🏝️", "🏖️", "🌅", "🏊", "🍹", "🛏️", "🍽️",
  "🚗", "📅", "💳", "⭐", "🎂", "🥂", "🌺", "☀️",
];

const CVR_CHAT_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🙂", "😉", "😊", "😍", "😘",
  "😎", "🤩", "🥳", "😇", "🤗", "🤔", "😐", "😴", "😢", "😭", "😡", "🥺",
  "👍", "👎", "👌", "✌️", "🙏", "👏", "🤝", "💪", "❤️", "💙", "💛", "🔥",
  "🎉", "✨", "⭐", "🌴", "🏖️", "🏊", "🍹", "☀️", "🛏️", "📅", "✅", "❓",
];

function cvrChatFormatTime(raw) {
  if (!raw) return "";
  const d = new Date(String(raw).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function cvrChatParseDate(raw) {
  const d = new Date(String(raw || "").replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

function cvrChatSeparatorLabel(raw) {
  const d = cvrChatParseDate(raw);
  if (!d) return "";
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return time;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
  return `${date}, ${time}`;
}

function cvrChatTopicLabel(id, topics) {
  const found = (topics || []).find((t) => t.id === id);
  if (found) return found.label;
  const fallback = {
    room_availability: "Room availability",
    event_bookings: "Event bookings",
    reservation_details: "Reservation details",
    requested_changes: "Requested changes",
    payment_verification: "Payment verification",
    other: "Other inquiry",
  };
  return fallback[id] || "";
}

/** "Online", "Active 5 min ago", "Offline" for a guest, from the conversation payload. */
function cvrChatGuestPresenceLabel(conv) {
  if (conv?.customerOnline) return "Online";
  const secs = conv?.customerSeenAgo;
  if (secs === null || secs === undefined) return "Offline";
  if (secs < 90) return "Active just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `Active ${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `Active ${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `Active ${days} day${days === 1 ? "" : "s"} ago`;
}

function cvrChatFileUrl(m, download) {
  return `${cvrApiBase()}/chat/file?id=${encodeURIComponent(m.id)}${download ? "&download=1" : ""}`;
}

function cvrChatFileExt(name) {
  const parts = String(name || "").split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function cvrChatFileIcon(name) {
  const ext = cvrChatFileExt(name);
  if (ext === "pdf") return "bi-file-earmark-pdf-fill";
  if (ext === "doc" || ext === "docx") return "bi-file-earmark-word-fill";
  if (ext === "xls" || ext === "xlsx" || ext === "csv") return "bi-file-earmark-excel-fill";
  if (ext === "ppt" || ext === "pptx") return "bi-file-earmark-ppt-fill";
  if (ext === "txt") return "bi-file-earmark-text-fill";
  if (CVR_CHAT_IMAGE_EXTS.includes(ext)) return "bi-file-earmark-image-fill";
  return "bi-file-earmark-fill";
}

function cvrChatFormatSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function cvrChatLinkify(escaped) {
  return escaped.replace(
    /(https?:\/\/[^\s<]+[^\s<.,;:!?)"'\]])/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
}

/**
 * Round profile picture with an initials fallback (also used if the photo fails to load).
 * cls: extra classes, e.g. "cvr-chat-avatar--lg"
 */
function cvrChatAvatarMarkup(url, initials, cls = "") {
  const text = escapeHtml(initials || "G");
  if (url) {
    return `<span class="cvr-chat-avatar cvr-chat-avatar--photo ${cls}" data-initials="${text}"><img src="${escapeHtml(url)}" alt="" loading="lazy" /></span>`;
  }
  return `<span class="cvr-chat-avatar ${cls}">${text}</span>`;
}

/** If a profile photo can't load, swap it for the initials. Call once per container. */
function cvrChatBindAvatarFallback(container) {
  if (!container || container.dataset.cvrAvatarBound) return;
  container.dataset.cvrAvatarBound = "1";
  container.addEventListener(
    "error",
    (e) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement)) return;
      const wrap = img.closest(".cvr-chat-avatar--photo");
      if (!wrap) return;
      wrap.classList.remove("cvr-chat-avatar--photo");
      wrap.textContent = wrap.dataset.initials || "G";
    },
    true
  );
}

function cvrChatInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function cvrChatBubbleInner(m, mine) {
  if (m.deleted) {
    return `<div class="cvr-bubble cvr-bubble--deleted"><i class="bi bi-slash-circle"></i> ${mine ? "You deleted this message" : "This message was deleted"}</div>`;
  }
  const type = m.type || "text";
  if (type === "sticker") {
    return `<div class="cvr-bubble cvr-bubble--sticker">${escapeHtml(m.body)}</div>`;
  }
  if (type === "gif") {
    const url = m.attachment?.url || "";
    return `<button type="button" class="cvr-bubble cvr-bubble--media" data-lightbox="${escapeHtml(url)}" aria-label="Open GIF">
      <img src="${escapeHtml(url)}" alt="${escapeHtml(m.attachment?.name || "GIF")}" loading="lazy" />
      <span class="cvr-media-tag">GIF</span>
    </button>`;
  }
  if (type === "image") {
    const url = cvrChatFileUrl(m, false);
    return `<button type="button" class="cvr-bubble cvr-bubble--media" data-lightbox="${escapeHtml(url)}" aria-label="Open photo">
      <img src="${escapeHtml(url)}" alt="${escapeHtml(m.attachment?.name || "Photo")}" loading="lazy" />
    </button>`;
  }
  if (type === "file") {
    const name = m.attachment?.name || "File";
    const ext = cvrChatFileExt(name).toUpperCase();
    return `<a class="cvr-bubble cvr-bubble--file" href="${escapeHtml(cvrChatFileUrl(m, true))}" target="_blank" rel="noopener">
      <span class="cvr-file-ico"><i class="bi ${cvrChatFileIcon(name)}"></i></span>
      <span class="cvr-file-meta">
        <strong>${escapeHtml(name)}</strong>
        <small>${escapeHtml([ext, cvrChatFormatSize(m.attachment?.size)].filter(Boolean).join(" · "))}</small>
      </span>
      <i class="bi bi-download cvr-file-dl"></i>
    </a>`;
  }
  return `<div class="cvr-bubble cvr-bubble--text">${cvrChatLinkify(escapeHtml(m.body)).replace(/\n/g, "<br>")}</div>`;
}

/**
 * Messenger-style thread: grouped bubbles, centered time separators, avatars.
 * opts.viewer: "customer" (guest widget) or "staff" (admin inbox)
 * opts.theirAvatar: initials shown beside the other person's messages
 */
function cvrChatRenderBubbles(messages, opts = {}) {
  const viewer = opts.viewer || "customer";
  const theirAvatar = opts.theirAvatar || "CV";

  if (!messages.length && viewer === "staff") {
    return `<div class="cvr-chat-empty"><p>No messages yet.</p></div>`;
  }
  if (!messages.length) {
    return `<div class="cvr-chat-empty">
      <span class="cvr-chat-avatar cvr-chat-avatar--lg">CV</span>
      <strong>Casa Vergara</strong>
      <p>Send us a message for reservation inquiries and concerns. You can share photos, files, stickers and GIFs.</p>
    </div>`;
  }

  const sameSender = (a, b) => a && b && a.senderRole === b.senderRole && a.senderId === b.senderId;
  const near = (a, b) => {
    const da = cvrChatParseDate(a.createdAt);
    const db = cvrChatParseDate(b.createdAt);
    return da && db && Math.abs(db - da) <= CVR_CHAT_GROUP_GAP_MS;
  };

  // "Seen" / "Sent" label goes under the newest message I sent (that still exists)
  const isMine = (m) => (viewer === "staff" ? m.senderRole === "staff" : m.senderRole === "customer");
  let lastMineIdx = -1;
  messages.forEach((m, i) => {
    if (isMine(m) && !m.deleted) lastMineIdx = i;
  });

  let html = "";
  messages.forEach((m, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const startsBlock = !prev || !near(prev, m);
    if (startsBlock) html += `<div class="cvr-msg-sep">${escapeHtml(cvrChatSeparatorLabel(m.createdAt))}</div>`;

    const mine = viewer === "staff" ? m.senderRole === "staff" : m.senderRole === "customer";
    const first = startsBlock || !sameSender(prev, m);
    const last = !next || !near(m, next) || !sameSender(m, next);
    const showWho = first && (!mine || viewer === "staff");
    const who = mine
      ? `${escapeHtml(m.senderLabel || "Resort team")} · Team`
      : escapeHtml(m.senderLabel || (viewer === "staff" ? "Guest" : "Resort team"));
    // Their profile photo: the sender's own picture, else the guest's (staff view), else initials / resort logo
    const photo = m.senderAvatarUrl || (viewer === "staff" ? opts.theirAvatarUrl : "") || "";
    const avatar = mine
      ? ""
      : last
        ? cvrChatAvatarMarkup(photo, viewer === "staff" ? theirAvatar : "CV")
        : `<span class="cvr-chat-avatar cvr-chat-avatar--gap"></span>`;

    const menu = `<div class="cvr-msg-actions">
        <button type="button" class="cvr-msg-more" data-msg-menu="${m.id}" data-mine="${mine ? 1 : 0}" data-deleted="${m.deleted ? 1 : 0}" aria-label="Message options" aria-haspopup="menu"><i class="bi bi-three-dots"></i></button>
      </div>`;

    let status = "";
    if (i === lastMineIdx) {
      status = m.readAt
        ? `<div class="cvr-msg-status is-seen" title="Seen ${escapeHtml(cvrChatFormatTime(m.readAt))}"><i class="bi bi-check2-all"></i> Seen ${escapeHtml(cvrChatSeparatorLabel(m.readAt))}</div>`
        : `<div class="cvr-msg-status"><i class="bi bi-check2"></i> Sent</div>`;
    }

    const bubble = cvrChatBubbleInner(m, mine);
    html += `<div class="cvr-msg ${mine ? "cvr-msg--mine" : "cvr-msg--theirs"} ${first ? "is-first" : ""} ${last ? "is-last" : ""}" data-id="${m.id}" title="${escapeHtml(cvrChatFormatTime(m.createdAt))}">
      ${avatar}
      <div class="cvr-msg-col">
        ${showWho ? `<div class="cvr-msg-who">${who}</div>` : ""}
        <div class="cvr-msg-row">${mine ? menu + bubble : bubble + menu}</div>
        ${status}
      </div>
    </div>`;
  });
  return html;
}

function cvrChatOpenLightbox(src) {
  if (!src) return;
  document.querySelector(".cvr-lightbox")?.remove();
  const box = document.createElement("div");
  box.className = "cvr-lightbox";
  box.innerHTML = `<button type="button" class="cvr-lightbox-close" aria-label="Close"><i class="bi bi-x-lg"></i></button>
    <img src="${escapeHtml(src)}" alt="" />`;
  const close = () => {
    box.remove();
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => {
    if (e.key === "Escape") close();
  };
  box.addEventListener("click", (e) => {
    if (e.target.tagName !== "IMG") close();
  });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(box);
}

/* ---------- Message options menu (one floating menu, never clipped by the chat panel) ---------- */
let cvrChatMenuEl = null;
let cvrChatMenuCleanup = null;

function cvrChatCloseMenus() {
  if (cvrChatMenuCleanup) {
    cvrChatMenuCleanup();
    cvrChatMenuCleanup = null;
  }
  if (cvrChatMenuEl) {
    cvrChatMenuEl.remove();
    cvrChatMenuEl = null;
  }
}

function cvrChatOpenMenu(toggle, onPick) {
  const id = Number(toggle.dataset.msgMenu);
  if (cvrChatMenuEl && Number(cvrChatMenuEl.dataset.for) === id) {
    cvrChatCloseMenus();
    return;
  }
  cvrChatCloseMenus();

  const mine = toggle.dataset.mine === "1";
  const deleted = toggle.dataset.deleted === "1";
  const menu = document.createElement("div");
  menu.className = "cvr-msg-menu";
  menu.dataset.for = String(id);
  menu.setAttribute("role", "menu");
  menu.innerHTML = `
    <button type="button" role="menuitem" data-scope="me"><i class="bi bi-eye-slash"></i><span>Delete for me</span></button>
    ${mine && !deleted ? `<button type="button" role="menuitem" class="is-danger" data-scope="everyone"><i class="bi bi-trash3"></i><span>Delete for everyone</span></button>` : ""}`;
  document.body.appendChild(menu);
  cvrChatMenuEl = menu;

  // Place it beside the "..." button and keep it fully inside the screen
  const r = toggle.getBoundingClientRect();
  const mw = menu.offsetWidth;
  const mh = menu.offsetHeight;
  const pad = 8;
  let left = mine ? r.right - mw : r.left;
  left = Math.max(pad, Math.min(left, window.innerWidth - mw - pad));
  let top = r.bottom + 6;
  if (top + mh > window.innerHeight - pad) top = Math.max(pad, r.top - mh - 6);
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;

  menu.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-scope]");
    if (!btn) return;
    cvrChatCloseMenus();
    onPick(id, btn.dataset.scope === "everyone" ? "everyone" : "me");
  });

  const onDocClick = (e) => {
    if (!menu.contains(e.target) && !e.target.closest("[data-msg-menu]")) cvrChatCloseMenus();
  };
  const onKey = (e) => {
    if (e.key === "Escape") cvrChatCloseMenus();
  };
  const onMove = () => cvrChatCloseMenus();
  document.addEventListener("click", onDocClick, true);
  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", onMove);
  window.addEventListener("scroll", onMove, true);
  cvrChatMenuCleanup = () => {
    document.removeEventListener("click", onDocClick, true);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onMove);
    window.removeEventListener("scroll", onMove, true);
  };
}

/**
 * Small branded confirmation dialog (replaces the browser's confirm()).
 * Resolves true when the user confirms, false on cancel / Esc / backdrop click.
 */
function cvrChatConfirm(opts = {}) {
  const {
    title = "Are you sure?",
    message = "",
    confirmText = "Confirm",
    cancelText = "Cancel",
    icon = "bi-trash3",
    danger = true,
  } = opts;

  return new Promise((resolve) => {
    document.querySelector(".cvr-confirm")?.remove();
    const previouslyFocused = document.activeElement;
    const root = document.createElement("div");
    root.className = "cvr-confirm";
    root.innerHTML = `
      <div class="cvr-confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="cvrConfirmTitle" aria-describedby="cvrConfirmText">
        <span class="cvr-confirm-ico ${danger ? "is-danger" : ""}"><i class="bi ${escapeHtml(icon)}"></i></span>
        <h3 class="cvr-confirm-title" id="cvrConfirmTitle">${escapeHtml(title)}</h3>
        <p class="cvr-confirm-text" id="cvrConfirmText">${escapeHtml(message)}</p>
        <div class="cvr-confirm-actions">
          <button type="button" class="cvr-confirm-btn" data-act="cancel">${escapeHtml(cancelText)}</button>
          <button type="button" class="cvr-confirm-btn ${danger ? "is-danger" : "is-primary"}" data-act="ok">${escapeHtml(confirmText)}</button>
        </div>
      </div>`;
    document.body.appendChild(root);

    const cancelBtn = root.querySelector('[data-act="cancel"]');
    const okBtn = root.querySelector('[data-act="ok"]');

    const finish = (value) => {
      document.removeEventListener("keydown", onKey, true);
      root.remove();
      try { previouslyFocused?.focus?.(); } catch {}
      resolve(value);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        finish(false);
      } else if (e.key === "Tab") {
        // keep focus inside the dialog
        e.preventDefault();
        (document.activeElement === cancelBtn ? okBtn : cancelBtn).focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    root.addEventListener("mousedown", (e) => {
      if (e.target === root) finish(false);
    });
    cancelBtn.addEventListener("click", () => finish(false));
    okBtn.addEventListener("click", () => finish(true));
    cancelBtn.focus(); // safest default for a destructive action
  });
}

/** Calls chat/delete. scope: "me" | "everyone". Resolves to the API body. */
async function cvrChatDeleteMessage(messageId, scope) {
  const { body } = await cvrApiPost("chat/delete", { messageId, scope });
  return body;
}

/**
 * Applies seen / deleted / hidden changes from the server onto a local message list.
 * Returns { messages, changed }.
 */
function cvrChatApplyStatuses(messages, statuses) {
  let changed = false;
  let list = messages;
  (statuses || []).forEach((st) => {
    const idx = list.findIndex((m) => m.id === st.id);
    if (idx < 0) return;
    if (st.hidden) {
      list = list.filter((m) => m.id !== st.id);
      changed = true;
      return;
    }
    const m = list[idx];
    const next = { ...m };
    if ((m.readAt || null) !== (st.readAt || null)) next.readAt = st.readAt || null;
    if (st.deleted && !m.deleted) {
      next.deleted = true;
      next.body = "";
      next.type = "text";
      next.attachment = null;
    }
    if (next.readAt !== m.readAt || next.deleted !== m.deleted) {
      list = list.slice();
      list[idx] = next;
      changed = true;
    }
  });
  return { messages: list, changed };
}

/**
 * Opens photos/GIFs full-size when clicked and powers the per-message options menu.
 * opts.onDelete(messageId, scope) is called when the user picks a delete option.
 * Safe to call once per messages container.
 */
function cvrChatBindMessageEvents(container, opts = {}) {
  if (!container || container.dataset.cvrBound) return;
  container.dataset.cvrBound = "1";
  cvrChatBindAvatarFallback(container);

  const pick = async (id, scope) => {
    const everyone = scope === "everyone";
    const ok = await cvrChatConfirm(
      everyone
        ? {
            title: "Delete for everyone?",
            message: "This message will be removed for you and for the other person. This can't be undone.",
            confirmText: "Delete for everyone",
            icon: "bi-trash3",
            danger: true,
          }
        : {
            title: "Delete for you?",
            message: "This message will only be removed from your chat. The other person can still see it.",
            confirmText: "Delete for me",
            icon: "bi-eye-slash",
            danger: false,
          }
    );
    if (ok && typeof opts.onDelete === "function") opts.onDelete(id, scope);
  };

  container.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-lightbox]");
    if (trigger) {
      cvrChatOpenLightbox(trigger.dataset.lightbox);
      return;
    }
    const toggle = e.target.closest("[data-msg-menu]");
    if (toggle) cvrChatOpenMenu(toggle, pick);
  });
}

/** Keeps the thread pinned to the newest message unless the reader scrolled up. */
function cvrChatCreateScroller(el) {
  let stick = true;
  el.addEventListener("scroll", () => {
    stick = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  });
  el.addEventListener(
    "load",
    () => {
      if (stick) el.scrollTop = el.scrollHeight;
    },
    true
  );
  return {
    beforeRender(force) {
      stick = force || stick || !el.dataset.cvrRendered;
    },
    afterRender() {
      el.dataset.cvrRendered = "1";
      if (stick) el.scrollTop = el.scrollHeight;
    },
  };
}

/**
 * Messenger-style composer: attach file, photo, stickers, GIFs and emoji.
 * Files and GIFs are first added to a preview tray; nothing is sent until the
 * send button (or Enter) is pressed. Stickers send immediately, like Messenger.
 *
 * opts.send(payload) -> Promise<boolean>
 *   payload: { type: "text", message } | { type: "sticker", sticker }
 *          | { type: "gif", url, title } | { type: "file", file }
 */
function cvrChatBuildComposer(mount, opts) {
  const toast = (msg, type = "danger") => {
    if (typeof cvrToast === "function") cvrToast(msg, type);
  };

  mount.innerHTML = `
    <form class="cvr-cmp" autocomplete="off">
      <div class="cvr-cmp-pop d-none" role="dialog" aria-label="Stickers, GIFs and emoji"></div>
      <div class="cvr-cmp-tray d-none" aria-label="Attachments ready to send"></div>
      <div class="cvr-cmp-row">
        <button type="button" class="cvr-cmp-ico" data-act="file" title="Attach a file" aria-label="Attach a file"><i class="bi bi-paperclip"></i></button>
        <button type="button" class="cvr-cmp-ico" data-act="photo" title="Send a photo" aria-label="Send a photo"><i class="bi bi-image-fill"></i></button>
        <button type="button" class="cvr-cmp-ico" data-act="stickers" title="Stickers" aria-label="Stickers"><i class="bi bi-stickies-fill"></i></button>
        <button type="button" class="cvr-cmp-ico cvr-cmp-ico--gif" data-act="gif" title="Choose a GIF" aria-label="Choose a GIF"><span>GIF</span></button>
        <div class="cvr-cmp-pill">
          <textarea rows="1" maxlength="2000" placeholder="Aa" aria-label="Type your message"></textarea>
          <button type="button" class="cvr-cmp-emoji" data-act="emoji" title="Emoji" aria-label="Emoji"><i class="bi bi-emoji-smile-fill"></i></button>
        </div>
        <button type="submit" class="cvr-cmp-send" aria-label="Send"><i class="bi bi-hand-thumbs-up-fill"></i></button>
      </div>
      <input type="file" class="d-none" data-role="file-input" multiple accept="${CVR_CHAT_FILE_ACCEPT}" />
      <input type="file" class="d-none" data-role="photo-input" multiple accept="image/*" />
      <input type="file" class="d-none" data-role="gif-input" accept="image/gif" />
    </form>`;

  const form = mount.querySelector("form");
  const pop = mount.querySelector(".cvr-cmp-pop");
  const tray = mount.querySelector(".cvr-cmp-tray");
  const ta = mount.querySelector("textarea");
  const sendBtn = mount.querySelector(".cvr-cmp-send");
  const fileInput = mount.querySelector('[data-role="file-input"]');
  const photoInput = mount.querySelector('[data-role="photo-input"]');
  const gifInput = mount.querySelector('[data-role="gif-input"]');

  const items = [];
  let uid = 0;
  let busy = false;
  let popTab = null;
  const gif = { q: "", gifs: [], offset: 0, hasMore: false, loading: false, state: "idle", timer: null, token: 0 };

  /* ---------- sending state ---------- */
  const updateSend = () => {
    const hasContent = ta.value.trim() !== "" || items.length > 0;
    sendBtn.disabled = busy;
    sendBtn.classList.toggle("is-like", !hasContent);
    sendBtn.setAttribute("aria-label", hasContent ? "Send" : "Send a thumbs up");
    sendBtn.innerHTML = hasContent
      ? '<i class="bi bi-send-fill"></i>'
      : '<i class="bi bi-hand-thumbs-up-fill"></i>';
  };

  const autosize = () => {
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 96)}px`;
  };

  /* ---------- staging tray ---------- */
  const thumbFor = (it) => {
    if (it.previewUrl) {
      return `<img src="${escapeHtml(it.previewUrl)}" alt="${escapeHtml(it.name)}" />${it.kind === "gif" ? '<span class="cvr-stage-tag">GIF</span>' : ""}`;
    }
    return `<div class="cvr-stage-file"><i class="bi ${cvrChatFileIcon(it.name)}"></i><span>${escapeHtml(it.name)}</span></div>`;
  };

  const renderTray = () => {
    tray.classList.toggle("d-none", items.length === 0);
    tray.innerHTML =
      items
        .map(
          (it) => `<div class="cvr-stage cvr-stage--${it.status}" data-id="${it.id}" title="${escapeHtml(it.name)}">
            ${thumbFor(it)}
            ${busy ? "" : `<button type="button" class="cvr-stage-x" data-remove="${it.id}" aria-label="Remove ${escapeHtml(it.name)}"><i class="bi bi-x"></i></button>`}
            ${it.status === "sending" ? '<span class="cvr-stage-overlay"><span class="spinner-border spinner-border-sm"></span></span>' : ""}
            ${it.status === "error" ? '<span class="cvr-stage-overlay cvr-stage-overlay--err" title="Could not send. Press send to retry."><i class="bi bi-exclamation-lg"></i></span>' : ""}
          </div>`
        )
        .join("") +
      (items.length < CVR_CHAT_MAX_STAGED && !busy
        ? '<button type="button" class="cvr-stage-add" data-act="file" aria-label="Add more files"><i class="bi bi-plus-lg"></i></button>'
        : "");
    updateSend();
  };

  const removeItem = (id) => {
    const idx = items.findIndex((x) => x.id === id);
    if (idx < 0) return;
    const [it] = items.splice(idx, 1);
    if (it.objectUrl) URL.revokeObjectURL(it.objectUrl);
    renderTray();
  };

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    let added = 0;
    for (const file of files) {
      if (items.length >= CVR_CHAT_MAX_STAGED) {
        toast(`You can attach up to ${CVR_CHAT_MAX_STAGED} files at a time.`, "info");
        break;
      }
      const ext = cvrChatFileExt(file.name);
      if (!CVR_CHAT_ALLOWED_EXTS.includes(ext)) {
        toast(`"${file.name}" isn't a supported type. Use photos, PDF, Word, Excel, PowerPoint, TXT or CSV.`);
        continue;
      }
      if (file.size > CVR_CHAT_MAX_BYTES) {
        toast(`"${file.name}" is larger than 8 MB.`);
        continue;
      }
      if (file.size === 0) {
        toast(`"${file.name}" is empty.`);
        continue;
      }
      const isImage = CVR_CHAT_IMAGE_EXTS.includes(ext);
      const objectUrl = isImage ? URL.createObjectURL(file) : "";
      items.push({
        id: ++uid,
        kind: ext === "gif" ? "gif-file" : isImage ? "image" : "file",
        file,
        name: file.name,
        previewUrl: objectUrl,
        objectUrl,
        status: "ready",
      });
      added += 1;
    }
    if (added) renderTray();
  };

  const addGif = (g) => {
    if (items.length >= CVR_CHAT_MAX_STAGED) {
      toast(`You can attach up to ${CVR_CHAT_MAX_STAGED} items at a time.`, "info");
      return;
    }
    items.push({
      id: ++uid,
      kind: "gif",
      url: g.url,
      title: g.title || "GIF",
      name: g.title || "GIF",
      previewUrl: g.preview || g.url,
      status: "ready",
    });
    renderTray();
  };

  /* ---------- sticker / GIF / emoji popover ---------- */
  const loadGifs = async (reset) => {
    if (gif.loading) return;
    gif.loading = true;
    if (reset) {
      gif.gifs = [];
      gif.offset = 0;
      gif.hasMore = false;
    }
    gif.state = "loading";
    const token = ++gif.token;
    renderGifBody();
    try {
      const qs = `chat/gifs?q=${encodeURIComponent(gif.q)}&offset=${gif.offset}`;
      const { body } = await cvrApiGet(qs);
      if (token !== gif.token) return;
      if (body?.success) {
        gif.gifs = gif.gifs.concat(body.data.gifs || []);
        gif.offset = body.data.nextOffset || gif.gifs.length;
        gif.hasMore = !!body.data.hasMore;
        gif.state = gif.gifs.length ? "ready" : "empty";
      } else {
        gif.state = body?.data?.code === "not_configured" ? "not_configured" : "error";
      }
    } catch {
      gif.state = "error";
    } finally {
      gif.loading = false;
    }
    if (popTab === "gif") renderGifBody();
  };

  const renderGifBody = () => {
    const body = pop.querySelector(".cvr-gif-body");
    if (!body) return;
    if (gif.state === "not_configured") {
      body.innerHTML = `<div class="cvr-pop-note"><i class="bi bi-filetype-gif"></i>
        <p>GIF search isn't set up yet.<br>You can still send a GIF from your device.</p>
        <button type="button" class="btn btn-sm btn-brand" data-act="gif-upload">Choose a GIF file</button></div>`;
      return;
    }
    if (gif.state === "error") {
      body.innerHTML = `<div class="cvr-pop-note"><p>Couldn't load GIFs right now.</p>
        <button type="button" class="btn btn-sm btn-outline-primary" data-act="gif-retry">Try again</button></div>`;
      return;
    }
    if (gif.state === "empty") {
      body.innerHTML = `<div class="cvr-pop-note"><p>No GIFs found for "${escapeHtml(gif.q)}".</p></div>`;
      return;
    }
    body.innerHTML =
      `<div class="cvr-gif-grid">${gif.gifs
        .map(
          (g, i) => `<button type="button" class="cvr-gif-item" data-gif="${i}" title="${escapeHtml(g.title)}">
            <img src="${escapeHtml(g.preview)}" alt="${escapeHtml(g.title)}" loading="lazy" /></button>`
        )
        .join("")}</div>` +
      (gif.state === "loading" ? '<div class="cvr-pop-loading"><span class="spinner-border spinner-border-sm"></span></div>' : "") +
      '<div class="cvr-pop-credit">Powered by GIPHY</div>';
  };

  const renderPop = () => {
    const tabs = [
      ["stickers", "Stickers"],
      ["gif", "GIFs"],
      ["emoji", "Emoji"],
    ];
    let bodyHtml = "";
    if (popTab === "stickers") {
      bodyHtml = `<div class="cvr-sticker-grid">${CVR_CHAT_STICKERS.map(
        (st) => `<button type="button" class="cvr-sticker" data-sticker="${st}" aria-label="Send sticker ${st}">${st}</button>`
      ).join("")}</div>`;
    } else if (popTab === "emoji") {
      bodyHtml = `<div class="cvr-emoji-grid">${CVR_CHAT_EMOJIS.map(
        (em) => `<button type="button" class="cvr-emoji" data-emoji="${em}">${em}</button>`
      ).join("")}</div>`;
    } else {
      bodyHtml = `<div class="cvr-gif-search"><i class="bi bi-search"></i>
          <input type="search" placeholder="Search GIFs" value="${escapeHtml(gif.q)}" aria-label="Search GIFs" /></div>
        <div class="cvr-gif-body"></div>`;
    }
    pop.innerHTML = `<div class="cvr-pop-tabs" role="tablist">${tabs
      .map(
        ([id, label]) =>
          `<button type="button" role="tab" class="${popTab === id ? "is-active" : ""}" data-tab="${id}" aria-selected="${popTab === id}">${label}</button>`
      )
      .join("")}</div><div class="cvr-pop-body">${bodyHtml}</div>`;
    if (popTab === "gif") {
      renderGifBody();
      if (gif.state === "idle") loadGifs(true);
    }
  };

  const markActiveButtons = () => {
    mount.querySelectorAll(".cvr-cmp-row [data-act]").forEach((btn) => {
      const act = btn.dataset.act;
      const isActive =
        (act === "stickers" && popTab === "stickers") ||
        (act === "gif" && popTab === "gif") ||
        (act === "emoji" && popTab === "emoji");
      btn.classList.toggle("is-active", isActive);
    });
  };

  const closePop = () => {
    popTab = null;
    pop.classList.add("d-none");
    markActiveButtons();
  };

  const openPop = (tab) => {
    if (popTab === tab) {
      closePop();
      return;
    }
    popTab = tab;
    pop.classList.remove("d-none");
    renderPop();
    markActiveButtons();
  };

  /* ---------- sending ---------- */
  const submit = async () => {
    if (busy) return;
    const text = ta.value.trim();

    if (!items.length && !text) {
      busy = true;
      updateSend();
      await opts.send({ type: "sticker", sticker: "👍" });
      busy = false;
      updateSend();
      return;
    }

    busy = true;
    closePop();
    renderTray();

    // Attachments go first, in the order they were added; the typed text goes last.
    for (const it of [...items]) {
      it.status = "sending";
      renderTray();
      const payload =
        it.kind === "gif"
          ? { type: "gif", url: it.url, title: it.title }
          : { type: "file", file: it.file };
      const ok = await opts.send(payload);
      if (!ok) {
        it.status = "error";
        busy = false;
        renderTray();
        return;
      }
      removeItem(it.id);
    }

    if (text) {
      const ok = await opts.send({ type: "text", message: text });
      if (!ok) {
        busy = false;
        updateSend();
        return;
      }
      ta.value = "";
      autosize();
    }

    busy = false;
    renderTray();
    ta.focus();
  };

  /* ---------- events ---------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submit();
  });

  ta.addEventListener("input", () => {
    autosize();
    updateSend();
  });
  ta.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      if (ta.value.trim() || items.length) form.requestSubmit();
    }
  });
  ta.addEventListener("focus", closePop);
  ta.addEventListener("paste", (e) => {
    const files = e.clipboardData?.files;
    if (files && files.length) {
      e.preventDefault();
      addFiles(files);
    }
  });

  mount.addEventListener("click", (e) => {
    const removeBtn = e.target.closest("[data-remove]");
    if (removeBtn) {
      removeItem(Number(removeBtn.dataset.remove));
      return;
    }

    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "file") fileInput.click();
    else if (act === "photo") photoInput.click();
    else if (act === "gif-upload") gifInput.click();
    else if (act === "gif-retry") loadGifs(true);
    else if (act === "stickers" || act === "gif" || act === "emoji") openPop(act);

    const tab = e.target.closest("[data-tab]");
    if (tab) {
      popTab = tab.dataset.tab;
      renderPop();
      markActiveButtons();
      return;
    }

    const sticker = e.target.closest("[data-sticker]");
    if (sticker) {
      closePop();
      if (!busy) {
        busy = true;
        updateSend();
        opts.send({ type: "sticker", sticker: sticker.dataset.sticker }).finally(() => {
          busy = false;
          updateSend();
        });
      }
      return;
    }

    const emoji = e.target.closest("[data-emoji]");
    if (emoji) {
      const start = ta.selectionStart ?? ta.value.length;
      const end = ta.selectionEnd ?? ta.value.length;
      ta.value = ta.value.slice(0, start) + emoji.dataset.emoji + ta.value.slice(end);
      const pos = start + emoji.dataset.emoji.length;
      ta.setSelectionRange(pos, pos);
      autosize();
      updateSend();
      return;
    }

    const gifBtn = e.target.closest("[data-gif]");
    if (gifBtn) {
      const g = gif.gifs[Number(gifBtn.dataset.gif)];
      if (g) {
        addGif(g);
        closePop();
        ta.focus();
      }
    }
  });

  pop.addEventListener("input", (e) => {
    if (e.target.matches('input[type="search"]')) {
      clearTimeout(gif.timer);
      const value = e.target.value.trim();
      gif.timer = setTimeout(() => {
        gif.q = value;
        gif.loading = false;
        loadGifs(true);
      }, 350);
    }
  });

  pop.addEventListener(
    "scroll",
    (e) => {
      const body = e.target;
      if (popTab !== "gif" || !gif.hasMore || gif.loading) return;
      if (body.scrollHeight - body.scrollTop - body.clientHeight < 60) loadGifs(false);
    },
    true
  );

  const onPicked = (input) => {
    addFiles(input.files);
    input.value = "";
  };
  fileInput.addEventListener("change", () => onPicked(fileInput));
  photoInput.addEventListener("change", () => onPicked(photoInput));
  gifInput.addEventListener("change", () => {
    onPicked(gifInput);
    closePop();
  });

  document.addEventListener("click", (e) => {
    if (popTab && !mount.contains(e.target)) closePop();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popTab) closePop();
  });

  const dropEl = mount.closest(".cvr-chat-panel, .live-chat-main") || mount;
  dropEl.addEventListener("dragover", (e) => {
    if (e.dataTransfer?.types?.includes("Files")) {
      e.preventDefault();
      dropEl.classList.add("is-dragover");
    }
  });
  dropEl.addEventListener("dragleave", (e) => {
    if (!dropEl.contains(e.relatedTarget)) dropEl.classList.remove("is-dragover");
  });
  dropEl.addEventListener("drop", (e) => {
    if (e.dataTransfer?.files?.length) {
      e.preventDefault();
      dropEl.classList.remove("is-dragover");
      addFiles(e.dataTransfer.files);
    }
  });

  updateSend();

  return {
    focus: () => ta.focus(),
    isBusy: () => busy,
  };
}

function initLiveChatWidget() {
  if (window.__cvrLiveChatBound) return;
  if (location.pathname.includes("/pages/admin/")) return;

  const session = typeof getCustomerSession === "function" ? getCustomerSession() : null;
  if (session && typeof isStaffSession === "function" && isStaffSession(session)) return;

  window.__cvrLiveChatBound = true;

  const dock = document.createElement("div");
  dock.id = "cvrLiveChatDock";
  dock.className = "cvr-live-chat-dock";
  dock.innerHTML = `
    <div id="cvrLiveChatPanel" class="cvr-chat-panel d-none" role="dialog" aria-labelledby="cvrLiveChatTitle">
      <div class="cvr-chat-panel-head">
        <div class="d-flex align-items-center gap-2">
          <span class="cvr-chat-avatar cvr-chat-avatar--head">CV</span>
          <div class="flex-grow-1 min-w-0">
            <h2 class="h6 text-brand mb-0" id="cvrLiveChatTitle">Casa Vergara</h2>
            <p class="small mb-0" id="cvrLiveChatStatus"><span class="cvr-chat-status-dot is-offline"></span> Checking availability…</p>
          </div>
          <button type="button" class="btn-close" id="cvrLiveChatClose" aria-label="Close chat"></button>
        </div>
      </div>
      <div id="cvrLiveChatUnavailable" class="cvr-chat-unavailable d-none" role="status"></div>
      <div id="cvrLiveChatAuth" class="cvr-chat-auth-gate d-none">
        <p class="small text-muted-brand mb-3">Sign in to send us a message for reservation inquiries and concerns. Our team will respond as soon as available.</p>
        <a class="btn btn-brand w-100" id="cvrLiveChatLoginLink" href="#">Log in to chat</a>
      </div>
      <div id="cvrLiveChatThreadWrap" class="d-none flex-column">
        <div id="cvrLiveChatMessages" class="cvr-chat-messages"></div>
        <div id="cvrLiveChatComposer" class="cvr-cmp-mount"></div>
      </div>
    </div>
    <button type="button" class="btn btn-brand cvr-chat-fab" id="cvrLiveChatFab" aria-label="Live Chat" title="Live Chat">
      <i class="bi bi-chat-dots-fill"></i>
      <span id="cvrLiveChatBadge" class="cvr-chat-fab-badge d-none">0</span>
    </button>
  `;
  document.body.appendChild(dock);

  const panel = document.getElementById("cvrLiveChatPanel");
  const fab = document.getElementById("cvrLiveChatFab");
  const closeBtn = document.getElementById("cvrLiveChatClose");
  const statusEl = document.getElementById("cvrLiveChatStatus");
  const unavailableEl = document.getElementById("cvrLiveChatUnavailable");
  const authEl = document.getElementById("cvrLiveChatAuth");
  const threadWrap = document.getElementById("cvrLiveChatThreadWrap");
  const messagesEl = document.getElementById("cvrLiveChatMessages");
  const composerMount = document.getElementById("cvrLiveChatComposer");
  const badge = document.getElementById("cvrLiveChatBadge");
  const loginLink = document.getElementById("cvrLiveChatLoginLink");
  if (loginLink) loginLink.href = pageUrl("login.html");

  const state = {
    open: false,
    messages: [],
    lastId: 0,
    sig: "",
    userId: session?.id || null,
    pollTimer: null,
    abort: null,
  };

  cvrChatBindMessageEvents(messagesEl, {
    onDelete: async (id, scope) => {
      const body = await cvrChatDeleteMessage(id, scope);
      if (!body?.success) {
        if (typeof cvrToast === "function") cvrToast(body?.message || "Could not delete the message.", "danger");
        return;
      }
      if (scope === "me") state.messages = state.messages.filter((m) => m.id !== id);
      else state.messages = state.messages.map((m) => (m.id === id ? body.data.message : m));
      renderMessages();
    },
  });
  const scroller = cvrChatCreateScroller(messagesEl);

  const setBadge = (n) => {
    if (!badge) return;
    if (n > 0) {
      badge.textContent = n > 9 ? "9+" : String(n);
      badge.classList.remove("d-none");
    } else {
      badge.classList.add("d-none");
    }
  };

  const applyPresence = (presence) => {
    if (!statusEl) return;
    const online = !!presence?.staffOnline;
    statusEl.innerHTML = online
      ? `<span class="cvr-chat-status-dot is-online"></span> Online · A team member is available`
      : `<span class="cvr-chat-status-dot is-offline"></span> Offline · Leave a message`;
    if (unavailableEl) {
      if (online) {
        unavailableEl.classList.add("d-none");
        unavailableEl.textContent = "";
      } else {
        unavailableEl.classList.remove("d-none");
        unavailableEl.textContent = presence?.unavailableMessage
          || "Send us a message for reservation inquiries and concerns. Our team will respond as soon as available.";
      }
    }
  };

  const renderMessages = (force = false) => {
    if (!messagesEl) return;
    scroller.beforeRender(force);
    messagesEl.innerHTML = cvrChatRenderBubbles(state.messages, { viewer: "customer" });
    scroller.afterRender();
  };

  const mergeMessages = (incoming) => {
    let changed = false;
    incoming.forEach((m) => {
      if (!state.messages.some((x) => x.id === m.id)) {
        state.messages.push(m);
        changed = true;
      }
    });
    state.messages.sort((a, b) => a.id - b.id);
    if (state.messages.length) state.lastId = Math.max(state.lastId, state.messages[state.messages.length - 1].id);
    return changed;
  };

  const loadConversation = async () => {
    const current = typeof getCustomerSession === "function" ? getCustomerSession() : null;
    if (!current) {
      authEl?.classList.remove("d-none");
      threadWrap?.classList.add("d-none");
      threadWrap?.classList.remove("d-flex");
      const { body } = await cvrApiGet("chat/presence");
      if (body?.success) applyPresence(body.data);
      return;
    }
    authEl?.classList.add("d-none");
    threadWrap?.classList.remove("d-none");
    threadWrap?.classList.add("d-flex");
    const { body } = await cvrApiGet("chat/conversation");
    if (!body?.success) return;
    state.userId = current.id;
    state.messages = body.data.messages || [];
    state.lastId = state.messages.length ? state.messages[state.messages.length - 1].id : 0;
    state.sig = body.data.sig || "";
    applyPresence(body.data.presence);
    setBadge(body.data.conversation?.customerUnread || 0);
    renderMessages(true);
    if (state.open) {
      cvrApiPost("chat/mark-read", {}).catch(() => {});
      setBadge(0);
    }
  };

  const stopPoll = () => {
    if (state.abort) {
      try { state.abort.abort(); } catch {}
      state.abort = null;
    }
    if (state.pollTimer) {
      clearTimeout(state.pollTimer);
      state.pollTimer = null;
    }
  };

  const pollOnce = async (wait) => {
    const current = typeof getCustomerSession === "function" ? getCustomerSession() : null;
    if (!current) {
      const { body } = await cvrApiGet("chat/presence");
      if (body?.success) applyPresence(body.data);
      return;
    }
    const qs = `chat/poll?afterId=${state.lastId || 0}&sig=${encodeURIComponent(state.sig || "")}${wait ? "&wait=1" : ""}`;
    const { body } = await cvrApiGet(qs);
    if (!body?.success) return;
    let changed = mergeMessages(body.data.messages || []);
    // Seen receipts, "deleted for everyone" and "deleted for me" from other devices
    const applied = cvrChatApplyStatuses(state.messages, body.data.statuses || []);
    if (applied.changed) {
      state.messages = applied.messages;
      changed = true;
    }
    state.sig = body.data.sig || "";
    applyPresence(body.data.presence);
    if (changed) renderMessages();
    if (!state.open) setBadge(body.data.unread || 0);
    else if ((body.data.messages || []).length) {
      cvrApiPost("chat/mark-read", {}).catch(() => {});
      setBadge(0);
    }
  };

  const loopPoll = async () => {
    try {
      await pollOnce(state.open);
    } catch {
      
    }
    state.pollTimer = setTimeout(loopPoll, state.open ? 400 : 8000);
  };

  const openPanel = async () => {
    state.open = true;
    panel?.classList.remove("d-none");
    fab?.setAttribute("aria-expanded", "true");
    await loadConversation();
    if (authEl?.classList.contains("d-none")) {
      renderMessages(true);
      composer.focus();
    }
  };

  const closePanel = () => {
    state.open = false;
    panel?.classList.add("d-none");
    fab?.setAttribute("aria-expanded", "false");
  };

  fab?.addEventListener("click", () => {
    if (state.open) closePanel();
    else openPanel();
  });
  closeBtn?.addEventListener("click", closePanel);

  const composer = cvrChatBuildComposer(composerMount, {
    send: async (payload) => {
      const res =
        payload.type === "file"
          ? await (() => {
              const fd = new FormData();
              fd.append("file", payload.file);
              return cvrApiPostForm("chat/send", fd);
            })()
          : await cvrApiPost("chat/send", payload);
      const body = res.body;
      if (!body?.success) {
        if (typeof cvrToast === "function") cvrToast(body?.message || "Could not send message.", "danger");
        return false;
      }
      mergeMessages([body.data.message]);
      applyPresence(body.data.presence);
      renderMessages(true);
      setBadge(0);
      return true;
    },
  });

  document.addEventListener("cvr-open-live-chat", () => {
    if (!state.open) openPanel();
  });

  if (location.hash === "#live-chat" || window.__cvrOpenLiveChatPending) {
    window.__cvrOpenLiveChatPending = false;
    openPanel();
  }

  // Tell the server this guest left so staff see "Offline" right away
  window.addEventListener("pagehide", () => {
    if (!state.userId || !navigator.sendBeacon) return;
    try { navigator.sendBeacon(`${cvrApiBase()}/chat/leave`, new Blob(["{}"], { type: "application/json" })); } catch {}
  });

  loadConversation().then(loopPoll);
}

window.__cvrLiveChatInit = initLiveChatWidget;
window.initLiveChatWidget = initLiveChatWidget;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLiveChatWidget);
} else {
  initLiveChatWidget();
}
