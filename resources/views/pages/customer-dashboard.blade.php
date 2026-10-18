@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Casa Vergara - My Dashboards</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../css/style.css?v=20261004f" rel="stylesheet">
  <link href="../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <script>
    (function () {
      try {
        var raw = localStorage.getItem("cvrCustomerSession");
        var s = raw ? JSON.parse(raw) : null;
        if (!s || !s.email) window.location.replace("login.html");
      } catch (err) {
        window.location.replace("login.html");
      }
    })();
  </script>
</head>
<body id="customerDashboardRoot">
  <div id="site-navbar"></div>

  <section class="section-pad pb-5">
    <div class="container">
      <div class="row g-4 align-items-stretch">
        <div class="col-lg-4">
          <div class="soft-card p-4 h-100 customer-dash-profile">
            <div class="d-flex align-items-center gap-3 mb-4">
              <div class="dash-avatar-lg-wrap position-relative flex-shrink-0">
                <img id="dashProfileAvatarImg" class="dash-avatar-lg-img rounded-circle object-fit-cover d-none" width="56" height="56" alt="">
                <div class="dash-avatar-lg text-white fw-bold" id="dashProfileAvatar" aria-hidden="true">—</div>
              </div>
              <div class="min-w-0">
                <h1 class="h4 text-brand mb-1 text-truncate" id="dashProfileName">Guest</h1>
                <p class="small text-muted-brand mb-0">Customer account</p>
              </div>
            </div>
            <dl class="row small mb-0 g-2">
              <dt class="col-4 text-muted-brand">Email</dt>
              <dd class="col-8 mb-0 text-break" id="dashProfileEmail">—</dd>
              <dt class="col-4 text-muted-brand">Phone</dt>
              <dd class="col-8 mb-0" id="dashProfilePhone">—</dd>
              <dt class="col-4 text-muted-brand">Member</dt>
              <dd class="col-8 mb-0" id="dashProfileMemberSince">—</dd>
            </dl>
            <a href="booking.html" class="btn btn-accent w-100 mt-3">Plan a stay</a>
            <a href="customer-settings.html" class="btn btn-outline-secondary w-100 mt-2"><i class="bi bi-gear me-1"></i>Account settings</a>
          </div>
        </div>
        <div class="col-lg-8">
          <p class="text-uppercase text-primary fw-semibold small mb-2">Guest hub</p>
          <h2 class="display-6 fw-bold text-brand mb-3">Your dashboard</h2>
          <p class="text-muted-brand mb-4">Jump to reservations, payments, or track the status of your booking.</p>
          <div class="row g-3">
            <div class="col-sm-6">
              <a href="booking.html" data-cvr-smart="reservation" class="text-decoration-none">
                <div class="soft-card p-4 h-100 customer-dash-tile d-flex flex-column">
                  <span class="dash-tile-icon mb-3 text-primary"><i class="bi bi-journal-check fs-3"></i></span>
                  <h3 class="h5 text-brand mb-1">Reservation</h3>
                  <p class="small text-muted-brand mb-0">Browse packages and complete your reservation details.</p>
                </div>
              </a>
            </div>
            <div class="col-sm-6">
              <a href="booking.html" class="text-decoration-none">
                <div class="soft-card p-4 h-100 customer-dash-tile d-flex flex-column">
                  <span class="dash-tile-icon mb-3 text-primary"><i class="bi bi-door-open fs-3"></i></span>
                  <h3 class="h5 text-brand mb-1">Booking</h3>
                  <p class="small text-muted-brand mb-0">Browse rooms and events, then start a new hold.</p>
                </div>
              </a>
            </div>
            <div class="col-sm-6">
              <a href="payment.html" data-cvr-smart="payment" class="text-decoration-none">
                <div class="soft-card p-4 h-100 customer-dash-tile d-flex flex-column">
                  <span class="dash-tile-icon mb-3 text-primary"><i class="bi bi-credit-card fs-3"></i></span>
                  <h3 class="h5 text-brand mb-1">Payment</h3>
                  <p class="small text-muted-brand mb-0">Upload proof of payment for an active reservation.</p>
                </div>
              </a>
            </div>
            <div class="col-sm-6">
              <a href="reservation-status.html" data-cvr-smart="status" class="text-decoration-none">
                <div class="soft-card p-4 h-100 customer-dash-tile d-flex flex-column">
                  <span class="dash-tile-icon mb-3 text-primary"><i class="bi bi-activity fs-3"></i></span>
                  <h3 class="h5 text-brand mb-1">Status</h3>
                  <p class="small text-muted-brand mb-0">See verification progress and booking summary.</p>
                </div>
              </a>
            </div>
            <div class="col-sm-6">
              <a href="customer-dashboard.html#live-chat" class="text-decoration-none" id="dashLiveChatTile">
                <div class="soft-card p-4 h-100 customer-dash-tile d-flex flex-column">
                  <span class="dash-tile-icon mb-3 text-primary"><i class="bi bi-chat-dots fs-3"></i></span>
                  <h3 class="h5 text-brand mb-1">Live Chat</h3>
                  <p class="small text-muted-brand mb-0">Send us a message for reservation inquiries and concerns. Our team will respond as soon as available.</p>
                </div>
              </a>
            </div>
          </div>
          <div class="soft-card p-4 mt-4">
            <h3 class="h5 text-brand mb-3">Your reservations</h3>
            <div id="dashReservationsList"></div>
          </div>

          <div class="soft-card p-4 mt-4" id="notifications">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <h3 class="h5 text-brand mb-0">
                <i class="bi bi-bell me-2 text-primary"></i>Notifications
              </h3>
              <span id="dashNotifUnreadBadge" class="badge rounded-pill text-bg-danger d-none"></span>
            </div>
            <p class="small text-muted-brand mb-3">Replies to your Contact Us messages, plus updates about your reservations — payment verification, quotations, and booking status. You'll also get these by email.</p>
            <div id="dashNotificationsList">
              <p class="small text-muted-brand mb-0">Loading…</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div id="site-footer"></div>

  <div class="modal fade" id="dashPayModal" tabindex="-1" aria-labelledby="dashPayModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title text-brand" id="dashPayModalLabel"><i class="bi bi-credit-card me-2"></i>Proceed to payment</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p class="small text-muted-brand mb-3">You're about to upload proof of payment for reservation <strong id="dashPayModalId">—</strong>.</p>
          <div class="d-flex justify-content-between small mb-1"><span>Total package price</span><strong id="dashPayModalTotal">—</strong></div>
          <div class="d-flex justify-content-between small mb-1"><span>Downpayment due now</span><strong id="dashPayModalDownpayment">—</strong></div>
          <div class="d-flex justify-content-between small text-muted-brand"><span>Balance due before check-in</span><span id="dashPayModalBalance">—</span></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <a href="#" id="dashPayModalConfirmBtn" class="btn btn-brand">Continue to payment</a>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="dashCheckoutModal" tabindex="-1" aria-labelledby="dashCheckoutModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title text-brand" id="dashCheckoutModalLabel"><i class="bi bi-door-open me-2"></i>Check out now</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p class="small text-muted-brand mb-0" id="dashCheckoutModalText">—</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-brand" id="dashCheckoutModalConfirmBtn">
            <i class="bi bi-door-open me-1"></i>Confirm check out
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="dashCancelModal" tabindex="-1" aria-labelledby="dashCancelModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title text-danger" id="dashCancelModalLabel"><i class="bi bi-x-circle me-2"></i>Cancel booking</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p class="small text-muted-brand mb-0" id="dashCancelModalText">—</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Keep booking</button>
          <button type="button" class="btn btn-danger" id="dashCancelModalConfirmBtn">
            <i class="bi bi-x-circle me-1"></i>Yes, cancel booking
          </button>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../js/duration-pricing.js?v=20260924d"></script>
  <script src="../js/main.js?v=20260930a"></script>
  <script>
    renderNavbar("");
    renderFooter();
    document.getElementById("dashLiveChatTile")?.addEventListener("click", (e) => {
      e.preventDefault();
      window.__cvrOpenLiveChatPending = true;
      document.dispatchEvent(new CustomEvent("cvr-open-live-chat"));
    });
  </script>
</body>
</html>

@endverbatim
