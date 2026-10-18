@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Live Chat - Admin - Casa Vergara</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../../css/style.css?v=20261004f" rel="stylesheet">
  <link href="../../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <link href="../../css/admin-modern.css?v=20261018a" rel="stylesheet">
</head>
<body>
  <div class="admin-wrap admin-page admin-live-chat-page">
    <div id="admin-sidebar"></div>
    <main class="admin-main">
      <div class="d-flex justify-content-between align-items-center mb-4 admin-page-head flex-wrap gap-3">
        <div>
          <h1 class="h2 text-brand mb-1"><i class="bi bi-chat-dots me-2"></i>Live Chat</h1>
          <p class="text-muted-brand mb-1">Shared inbox for authorized staff and admins. Either can reply in the same conversation. Guests can leave a message when no one is available.</p>
          <p class="small mb-0" id="liveChatStaffPresence"><span class="cvr-chat-status-dot is-offline"></span> Connecting…</p>
        </div>
      </div>

      <div class="live-chat-shell soft-card overflow-hidden" id="liveChatShell">
        <aside class="live-chat-sidebar">
          <div class="p-3 border-bottom">
            <label class="form-label small text-muted-brand mb-1" for="liveChatSearch">Conversations</label>
            <input type="search" class="form-control form-control-sm" id="liveChatSearch" placeholder="Search guest, email, booking…">
          </div>
          <div id="liveChatList" class="live-chat-list"></div>
        </aside>
        <section class="live-chat-main">
          <div class="live-chat-main-head p-3 border-bottom d-flex align-items-center gap-3">
            <button type="button" id="liveChatGuestAvatar" class="live-chat-head-avatar d-none" title="View profile" aria-label="View profile"></button>
            <div class="min-w-0">
              <h2 class="h5 text-brand mb-0" id="liveChatGuestName">Select a conversation</h2>
              <p class="small text-muted-brand mb-0" id="liveChatGuestMeta">Client messages appear here as they arrive.</p>
            </div>
            <button type="button" id="liveChatProfileToggle" class="btn btn-sm btn-outline-primary ms-auto d-none" aria-controls="liveChatProfile" aria-expanded="false">
              <i class="bi bi-person-vcard me-1"></i><span>Profile</span>
            </button>
          </div>
          <div id="liveChatEmpty" class="text-center text-muted-brand py-5 px-3">Choose a client on the left to read and reply.</div>
          <div id="liveChatThread" class="cvr-chat-messages live-chat-thread"></div>
          <div id="liveChatComposer" class="border-top bg-white d-none">
            <div id="liveChatComposerMount"></div>
          </div>
        </section>
        <aside id="liveChatProfile" class="live-chat-profile d-none" aria-label="Guest profile"></aside>
      </div>
    </main>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../../js/main.js?v=20260930c"></script>
  <script src="../../js/live-chat.js?v=20261004f"></script>
  <script src="../../js/admin-live-chat.js?v=20261004f"></script>
  <script>renderAdminSidebar("live-chat"); initAdminLiveChatPage();</script>
</body>
</html>

@endverbatim
