@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contact Clients - Admin - Casa Vergara</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../css/style.css?v=20261004f" rel="stylesheet">
  <link href="../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../css/laravel-ui.css?v=20261018b" rel="stylesheet">
</head>
<body>
  <div id="site-navbar"></div>
  <main class="container py-5 admin-contact-page">
      <div class="d-flex justify-content-between align-items-center mb-4 admin-page-head flex-wrap gap-3">
        <div>
          <h1 class="h2 text-brand mb-1"><i class="bi bi-chat-dots me-2"></i>Contact Clients</h1>
          <p class="text-muted-brand mb-0">The staff version of the Contact page: instead of sending an enquiry, you reach out to clients directly. Messages are emailed and appear in the client's dashboard.</p>
        </div>
        <button type="button" class="btn btn-brand" id="contactComposeBtn"><i class="bi bi-pencil-square me-1"></i>New message</button>
      </div>

      <div id="contactAlert" class="alert d-none small" role="alert"></div>

      <div class="row g-4">
        <div class="col-lg-7">
          <div class="soft-card p-3 mb-4">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <h5 class="text-brand mb-0"><i class="bi bi-people me-2"></i>Client directory</h5>
              <span class="badge text-bg-light border" id="contactClientCount">0</span>
            </div>
            <input type="text" class="form-control mb-3" id="contactClientSearch" placeholder="Search clients by name or email">
            <div class="table-responsive" style="max-height:420px;overflow:auto;">
              <table class="table align-middle mb-0">
                <thead><tr><th>Client</th><th>Phone</th><th class="text-end">Action</th></tr></thead>
                <tbody id="contactClientsBody"></tbody>
              </table>
              <div id="contactClientsEmpty" class="text-center text-muted-brand py-4 d-none">No clients match your search.</div>
            </div>
          </div>
        </div>

        <div class="col-lg-5">
          <div class="soft-card p-3 mb-4">
            <h5 class="text-brand mb-3"><i class="bi bi-clock-history me-2"></i>Recent conversations</h5>
            <div id="contactRecentList" class="d-flex flex-column gap-2"></div>
            <div id="contactRecentEmpty" class="text-center text-muted-brand py-4 d-none">No messages yet.</div>
            <a href="admin/messages.html" class="btn btn-outline-secondary btn-sm w-100 mt-3"><i class="bi bi-envelope-paper me-1"></i>Open full inbox</a>
          </div>

          <div class="soft-card p-3">
            <h5 class="text-brand mb-3"><i class="bi bi-building me-2"></i>Resort contact details</h5>
            <ul class="list-unstyled small text-muted-brand mb-0">
              <li class="mb-2"><i class="bi bi-geo-alt me-2 text-primary"></i>Casa Vergara Resort, Philippines</li>
              <li class="mb-2"><i class="bi bi-telephone me-2 text-primary"></i>+63 900 000 0000</li>
              <li class="mb-2"><i class="bi bi-envelope me-2 text-primary"></i>casavergara.resort@gmail.com</li>
              <li><i class="bi bi-chat-dots me-2 text-primary"></i>Our team will respond as soon as available</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  <div id="site-footer"></div>

  <div class="modal fade" id="contactComposeModal" tabindex="-1" aria-labelledby="contactComposeModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="contactComposeModalLabel"><i class="bi bi-pencil-square me-2"></i>Message a client</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div id="contactComposeAlert" class="alert alert-danger d-none small" role="alert"></div>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label small text-muted-brand mb-1" for="contactComposeClient">Client account</label>
              <select class="form-select" id="contactComposeClient">
                <option value="0">Other / type an email manually</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label small text-muted-brand mb-1" for="contactComposeSubject">Subject</label>
              <input type="text" class="form-control" id="contactComposeSubject" maxlength="100" placeholder="About your upcoming booking">
            </div>
            <div class="col-md-6">
              <label class="form-label small text-muted-brand mb-1" for="contactComposeName">Recipient name</label>
              <input type="text" class="form-control" id="contactComposeName" maxlength="150" placeholder="Juan Dela Cruz">
            </div>
            <div class="col-md-6">
              <label class="form-label small text-muted-brand mb-1" for="contactComposeEmail">Recipient email</label>
              <input type="email" class="form-control" id="contactComposeEmail" maxlength="191" placeholder="guest@example.com">
            </div>
            <div class="col-12">
              <label class="form-label small text-muted-brand mb-1">Quick templates</label>
              <div class="d-flex flex-wrap gap-2" id="contactComposeQuick">
                <button type="button" class="btn btn-sm btn-outline-secondary" data-template="booking">Booking follow-up</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" data-template="payment">Payment reminder</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" data-template="thanks">Thank you after stay</button>
              </div>
            </div>
            <div class="col-12">
              <label class="form-label small text-muted-brand mb-1" for="contactComposeTextarea">Message</label>
              <textarea class="form-control" id="contactComposeTextarea" rows="7" maxlength="3000" placeholder="Write your message — it will be emailed to the client and shown in their dashboard."></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-brand" id="contactComposeSendBtn">
            <span class="admin-btn-label"><i class="bi bi-send me-1"></i>Send message</span>
            <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../js/main.js?v=20260925a"></script>
  <script src="../js/admin-contact.js?v=20260830i"></script>
  <script>renderNavbar("contact"); renderFooter(); initAdminContactPage();</script>
</body>
</html>

@endverbatim
