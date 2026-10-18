@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contact Messages - Admin - Casa Vergara</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../../css/style.css?v=20260926c" rel="stylesheet">
  <link href="../../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <link href="../../css/admin-modern.css?v=20261018a" rel="stylesheet">
</head>
<body>
  <div class="admin-wrap admin-page admin-messages-page">
    <div id="admin-sidebar"></div>
    <main class="admin-main">
      <div class="d-flex justify-content-between align-items-center mb-4 admin-page-head flex-wrap gap-3">
        <div>
          <h1 class="h2 text-brand mb-1"><i class="bi bi-envelope-paper me-2"></i>Contact Messages</h1>
          <p class="text-muted-brand mb-0">Guest enquiries from the Contact Us form, plus messages your team sends out. Replies and new messages are emailed to the client and appear in their dashboard.</p>
        </div>
        <button type="button" class="btn btn-brand" id="messageComposeBtn"><i class="bi bi-pencil-square me-1"></i>New message to client</button>
      </div>

      <div id="messagesAlert" class="alert d-none small" role="alert"></div>

      <div class="soft-card p-3 mb-3">
        <div class="row g-3 align-items-end">
          <div class="col-md-5">
            <label class="form-label small text-muted-brand mb-1" for="messagesSearchInput">Search</label>
            <input type="text" class="form-control" id="messagesSearchInput" placeholder="Search name, email, subject, or message">
          </div>
          <div class="col-md-3">
            <label class="form-label small text-muted-brand mb-1" for="messagesDirectionFilter">Type</label>
            <select class="form-select" id="messagesDirectionFilter">
              <option value="all">All messages</option>
              <option value="guest">From guests</option>
              <option value="staff">Sent by us</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small text-muted-brand mb-1" for="messagesStatusFilter">Status</label>
            <select class="form-select" id="messagesStatusFilter">
              <option value="all">All</option>
              <option value="unreplied">Awaiting reply</option>
              <option value="replied">Replied</option>
            </select>
          </div>
          <div class="col-md-2">
            <span class="badge text-bg-light border" id="messagesResultCount">0</span>
          </div>
        </div>
      </div>

      <div class="soft-card p-3 admin-table-card">
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Message</th>
                <th>To / Type</th>
                <th>Received</th>
                <th class="text-end">Status / Action</th>
              </tr>
            </thead>
            <tbody id="messagesTableBody"></tbody>
          </table>
          <div id="messagesEmptyRow" class="text-center text-muted-brand py-4 d-none">No messages match your filters.</div>
        </div>
      </div>
    </main>
  </div>

  <div class="modal fade" id="messageComposeModal" tabindex="-1" aria-labelledby="messageComposeModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="messageComposeModalLabel"><i class="bi bi-pencil-square me-2"></i>New message to a client</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div id="messageComposeAlert" class="alert alert-danger d-none small" role="alert"></div>

          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label small text-muted-brand mb-1" for="messageComposeClient">Client account</label>
              <select class="form-select" id="messageComposeClient">
                <option value="0">Other / type an email manually</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label small text-muted-brand mb-1" for="messageComposeSubject">Subject</label>
              <input type="text" class="form-control" id="messageComposeSubject" maxlength="100" placeholder="About your upcoming booking">
            </div>
            <div class="col-md-6">
              <label class="form-label small text-muted-brand mb-1" for="messageComposeName">Recipient name</label>
              <input type="text" class="form-control" id="messageComposeName" maxlength="150" placeholder="Juan Dela Cruz">
            </div>
            <div class="col-md-6">
              <label class="form-label small text-muted-brand mb-1" for="messageComposeEmail">Recipient email</label>
              <input type="email" class="form-control" id="messageComposeEmail" maxlength="191" placeholder="guest@example.com">
            </div>
            <div class="col-12">
              <label class="form-label small text-muted-brand mb-1" for="messageComposeQuick">Quick templates</label>
              <div class="d-flex flex-wrap gap-2" id="messageComposeQuick">
                <button type="button" class="btn btn-sm btn-outline-secondary" data-template="booking">Booking follow-up</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" data-template="payment">Payment reminder</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" data-template="thanks">Thank you after stay</button>
              </div>
            </div>
            <div class="col-12">
              <label class="form-label small text-muted-brand mb-1" for="messageComposeTextarea">Message</label>
              <textarea class="form-control" id="messageComposeTextarea" rows="7" maxlength="3000" placeholder="Write your message — it will be emailed to the client and shown in their dashboard."></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-brand" id="messageComposeSendBtn">
            <span class="admin-btn-label"><i class="bi bi-send me-1"></i>Send message</span>
            <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="messageReplyModal" tabindex="-1" aria-labelledby="messageReplyModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="messageReplyModalLabel">Reply to guest</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div id="messageReplyAlert" class="alert d-none small" role="alert"></div>

          <div class="soft-card p-3 mb-3 bg-light border">
            <div class="d-flex justify-content-between flex-wrap gap-2 mb-2">
              <div>
                <div class="fw-semibold" id="messageReplyGuestName"></div>
                <div class="small text-muted-brand" id="messageReplyGuestEmail"></div>
              </div>
              <span class="badge text-bg-light border" id="messageReplySubjectBadge"></span>
            </div>
            <p class="small mb-0 messages-original-text" id="messageReplyOriginalText"></p>
          </div>

          <div id="messageReplyPreviousWrap" class="soft-card p-3 mb-3 border d-none">
            <div class="small text-muted-brand mb-1"><i class="bi bi-reply-fill me-1"></i>Your previous reply</div>
            <p class="small mb-0" id="messageReplyPreviousText"></p>
          </div>

          <form id="messageReplyForm">
            <input type="hidden" id="messageReplyId" value="0">
            <label class="form-label small text-muted-brand mb-1" for="messageReplyTextarea">Your reply</label>
            <textarea class="form-control" id="messageReplyTextarea" rows="6" maxlength="3000" placeholder="Type your reply — it will be emailed directly to the guest."></textarea>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-brand" id="messageReplySendBtn">
            <span class="admin-btn-label"><i class="bi bi-send me-1"></i>Send reply</span>
            <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../../js/main.js?v=20260926b"></script>
  <script src="../../js/admin-messages.js?v=20260830i"></script>
  <script>renderAdminSidebar("messages"); initAdminMessagesPage();</script>
</body>
</html>

@endverbatim
