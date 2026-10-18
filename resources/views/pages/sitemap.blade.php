@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Casa Vergara - Site Map</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../css/style.css?v=20261004f" rel="stylesheet">
  <link href="../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <link href="../css/casa-refresh.css?v=20261018a" rel="stylesheet">
  <style>
    /* Six-section layout: balanced 3 x 2 grid with a connector bar that matches */
    .sitemap-branches > div:nth-child(6) .sitemap-group.fade-in-up.in-view { animation-delay: 0.4s; }
    @media (min-width: 1200px) {
      .sitemap-branches::before { left: 16.66%; right: 16.66%; }
      .sitemap-branches > div:nth-child(n+4) .sitemap-branch-stem { display: none; }
    }
    .sitemap-intro a { font-weight: 600; text-decoration: none; border-bottom: 1px solid var(--accent); }
  </style>
</head>
<body>
  <div id="site-navbar"></div>

  <header class="legal-hero">
    <div class="container">
      <div class="legal-shell">
        <nav aria-label="Breadcrumb" class="legal-rise" style="--i:0">
          <ol class="legal-crumbs">
            <li><a href="landing.html">Home</a></li>
            <li aria-current="page">Site Map</li>
          </ol>
        </nav>
        <h1 class="legal-rise" style="--i:1">Site Map</h1>
        <p class="legal-hero-lead legal-rise" style="--i:2">Every page on Casa Vergara Resort, organized by who it's for. Search for any page below, or start with the User Manual if you're new here.</p>
        <div class="legal-switch legal-rise" style="--i:3">
          <a href="user-manual.html"><i class="bi bi-book" aria-hidden="true"></i>User Manual</a>
          <a href="sitemap.html" aria-current="page"><i class="bi bi-diagram-3" aria-hidden="true"></i>Site Map</a>
          <a href="terms.html"><i class="bi bi-file-earmark-text" aria-hidden="true"></i>Terms &amp; Conditions</a>
          <a href="privacy.html"><i class="bi bi-shield-check" aria-hidden="true"></i>Privacy Policy</a>
        </div>
      </div>
    </div>
  </header>

  <div class="legal-main">
    <div class="legal-shell">
    <div class="container position-relative sitemap-page">
      <div class="sitemap-page-glow" aria-hidden="true"></div>

      <div class="text-center mb-4 sitemap-page-header">

        <div class="sitemap-stats" id="sitemapStats" aria-hidden="true">
          <span class="sitemap-stat"><i class="bi bi-diagram-3"></i><b>6</b> sections</span>
          <span class="sitemap-stat-sep">&middot;</span>
          <span class="sitemap-stat"><i class="bi bi-file-earmark-text"></i><b id="sitemapTotalCount">42</b> pages</span>
        </div>

        <div class="sitemap-search-wrap">
          <i class="bi bi-search sitemap-search-icon" aria-hidden="true"></i>
          <input type="text" id="sitemapSearch" class="sitemap-search-input" placeholder="Search for a page… e.g. “payment”, “dashboard”, “privacy”" autocomplete="off" aria-label="Search pages">
          <button type="button" id="sitemapSearchClear" class="sitemap-search-clear" aria-label="Clear search" hidden>
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <div class="sitemap-root-wrap">
        <a href="landing.html" class="sitemap-root soft-card">
          <span class="sitemap-root-ring" aria-hidden="true"></span>
          <i class="bi bi-house-heart-fill"></i>
          <span>Casa Vergara Resort</span>
        </a>
        <div class="sitemap-root-stem" aria-hidden="true"></div>
      </div>

      <div class="row g-4 sitemap-branches" id="sitemapBranches">

        <div class="col-12 col-md-6 col-xl-4">
          <div class="sitemap-branch-stem sitemap-stem-public" aria-hidden="true"></div>
          <div class="soft-card p-4 h-100 sitemap-group" style="--group-accent: var(--secondary); --group-accent-rgb: 50, 139, 195;">
            <div class="sitemap-group-head">
              <span class="sitemap-group-icon"><i class="bi bi-globe2"></i></span>
              <div class="sitemap-group-head-text">
                <h5 class="text-brand mb-0">Explore</h5>
                <span class="sitemap-group-count"></span>
              </div>
            </div>
            <p class="small text-muted-brand mb-3">Browse the resort &mdash; open to every visitor</p>
            <ul class="sitemap-link-list">
              <li><a href="landing.html"><i class="bi bi-house"></i><span>Home</span></a></li>
              <li><a href="booking.html"><i class="bi bi-door-open"></i><span>Rooms &amp; Events</span></a></li>
              <li><a href="about.html"><i class="bi bi-info-circle"></i><span>About Us</span></a></li>
              <li><a href="contact.html"><i class="bi bi-envelope"></i><span>Contact</span></a></li>
            </ul>
          </div>
        </div>

        <div class="col-12 col-md-6 col-xl-4">
          <div class="sitemap-branch-stem sitemap-stem-help" aria-hidden="true"></div>
          <div class="soft-card p-4 h-100 sitemap-group" style="--group-accent: #e08a1e; --group-accent-rgb: 224, 138, 30;">
            <div class="sitemap-group-head">
              <span class="sitemap-group-icon"><i class="bi bi-life-preserver"></i></span>
              <div class="sitemap-group-head-text">
                <h5 class="text-brand mb-0">Help &amp; Legal</h5>
                <span class="sitemap-group-count"></span>
              </div>
            </div>
            <p class="small text-muted-brand mb-3">Guides, answers and policies &mdash; open to everyone</p>
            <ul class="sitemap-link-list">
              <li><a href="user-manual.html"><i class="bi bi-book"></i><span>User Manual <em>(new)</em></span></a></li>
              <li><a href="faq.html"><i class="bi bi-question-circle"></i><span>FAQs</span></a></li>
              <li><a href="privacy.html"><i class="bi bi-shield-check"></i><span>Privacy Policy</span></a></li>
              <li><a href="terms.html"><i class="bi bi-file-earmark-text"></i><span>Terms &amp; Conditions</span></a></li>
              <li><a href="sitemap.html"><i class="bi bi-diagram-3"></i><span>Site Map</span></a></li>
            </ul>
          </div>
        </div>

        <div class="col-12 col-md-6 col-xl-4">
          <div class="sitemap-branch-stem sitemap-stem-account" aria-hidden="true"></div>
          <div class="soft-card p-4 h-100 sitemap-group" style="--group-accent: var(--accent); --group-accent-rgb: 217, 179, 18;">
            <div class="sitemap-group-head">
              <span class="sitemap-group-icon"><i class="bi bi-person-check"></i></span>
              <div class="sitemap-group-head-text">
                <h5 class="text-brand mb-0">Account</h5>
                <span class="sitemap-group-count"></span>
              </div>
            </div>
            <p class="small text-muted-brand mb-3">Sign in or join Casa Vergara</p>
            <ul class="sitemap-link-list">
              <li><a href="login.html"><i class="bi bi-box-arrow-in-right"></i><span>Sign In</span></a></li>
              <li><a href="register.html"><i class="bi bi-person-plus"></i><span>Register</span></a></li>
              <li><a href="forgot-password.html"><i class="bi bi-key"></i><span>Reset Password</span></a></li>
            </ul>
          </div>
        </div>

        <div class="col-12 col-md-6 col-xl-4">
          <div class="sitemap-branch-stem sitemap-stem-guest" aria-hidden="true"></div>
          <div class="soft-card p-4 h-100 sitemap-group" style="--group-accent: var(--primary); --group-accent-rgb: 12, 59, 93;">
            <div class="sitemap-group-head">
              <span class="sitemap-group-icon"><i class="bi bi-grid-1x2"></i></span>
              <div class="sitemap-group-head-text">
                <h5 class="text-brand mb-0">Guest Dashboard</h5>
                <span class="sitemap-group-count"></span>
              </div>
            </div>
            <p class="small text-muted-brand mb-3">For signed-in guests</p>
            <ul class="sitemap-link-list">
              <li><a href="customer-dashboard.html"><i class="bi bi-speedometer2"></i><span>My Dashboard</span></a></li>
              <li><a href="customer-settings.html"><i class="bi bi-gear"></i><span>Account Settings</span></a></li>
              <li><a href="reservation-form.html"><i class="bi bi-journal-check"></i><span>Reservation Details</span></a></li>
              <li><a href="quotation.html"><i class="bi bi-receipt"></i><span>Quotation</span></a></li>
              <li><a href="payment.html"><i class="bi bi-credit-card"></i><span>Payment</span></a></li>
              <li><a href="reservation-status.html"><i class="bi bi-activity"></i><span>Reservation Status</span></a></li>
              <li><a href="customer-dashboard.html#live-chat"><i class="bi bi-chat-dots"></i><span>Live Chat</span></a></li>
              <li><a href="customer-dashboard.html#reviews"><i class="bi bi-star-half"></i><span>My Reviews</span></a></li>
            </ul>
          </div>
        </div>

        <div class="col-12 col-md-6 col-xl-4">
          <div class="sitemap-branch-stem sitemap-stem-admin" aria-hidden="true"></div>
          <div class="soft-card p-4 h-100 sitemap-group" style="--group-accent: #7a4fbf; --group-accent-rgb: 122, 79, 191;">
            <div class="sitemap-group-head">
              <span class="sitemap-group-icon"><i class="bi bi-shield-lock"></i></span>
              <div class="sitemap-group-head-text">
                <h5 class="text-brand mb-0">Admin Portal</h5>
                <span class="sitemap-group-count"></span>
              </div>
            </div>
            <p class="small text-muted-brand mb-3">Full management access &mdash; admin accounts only</p>
            <ul class="sitemap-link-list">
              <li><a href="admin/dashboard.html"><i class="bi bi-speedometer2"></i><span>Dashboard</span></a></li>
              <li><a href="admin/reservations.html"><i class="bi bi-people"></i><span>Reservations</span></a></li>
              <li><a href="admin/calendar.html"><i class="bi bi-calendar3"></i><span>Booking Calendar</span></a></li>
              <li><a href="admin/payments.html"><i class="bi bi-qr-code-scan"></i><span>Payment Verification</span></a></li>
              <li><a href="admin/site-content.html?tab=reviews"><i class="bi bi-star"></i><span>Reviews</span></a></li>
              <li><a href="admin/live-chat.html"><i class="bi bi-chat-dots"></i><span>Live Chat</span></a></li>
              <li><a href="admin/messages.html"><i class="bi bi-envelope-paper"></i><span>Contact Messages</span></a></li>
              <li><a href="contact-clients.html"><i class="bi bi-envelope-paper"></i><span>Contact Clients</span></a></li>
              <li><a href="admin/notifications.html"><i class="bi bi-bell"></i><span>Notifications</span></a></li>
              <li><a href="admin/reports.html"><i class="bi bi-file-earmark-bar-graph"></i><span>Reports</span></a></li>
              <li><a href="admin/users.html"><i class="bi bi-person-badge"></i><span>Users</span></a></li>
              <li><a href="admin/site-content.html"><i class="bi bi-file-earmark-richtext"></i><span>Site Content <em>(text, photos, packages, FAQs, legal, team)</em></span></a></li>
              <li><a href="admin/settings.html"><i class="bi bi-gear"></i><span>Settings</span></a></li>
            </ul>
          </div>
        </div>

        <div class="col-12 col-md-6 col-xl-4">
          <div class="sitemap-branch-stem sitemap-stem-staff" aria-hidden="true"></div>
          <div class="soft-card p-4 h-100 sitemap-group" style="--group-accent: #1f9d76; --group-accent-rgb: 31, 157, 118;">
            <div class="sitemap-group-head">
              <span class="sitemap-group-icon"><i class="bi bi-person-workspace"></i></span>
              <div class="sitemap-group-head-text">
                <h5 class="text-brand mb-0">Staff Portal</h5>
                <span class="sitemap-group-count"></span>
              </div>
            </div>
            <p class="small text-muted-brand mb-3">Day-to-day operations &mdash; event-manager staff accounts (Packages, Reviews &amp; Reports are view-only here)</p>
            <ul class="sitemap-link-list">
              <li><a href="admin/dashboard.html"><i class="bi bi-speedometer2"></i><span>Dashboard</span></a></li>
              <li><a href="admin/reservations.html"><i class="bi bi-people"></i><span>Reservations</span></a></li>
              <li><a href="admin/calendar.html"><i class="bi bi-calendar3"></i><span>Booking Calendar</span></a></li>
              <li><a href="admin/site-content.html?tab=reviews"><i class="bi bi-star"></i><span>Reviews <em>(view only)</em></span></a></li>
              <li><a href="admin/live-chat.html"><i class="bi bi-chat-dots"></i><span>Live Chat</span></a></li>
              <li><a href="admin/messages.html"><i class="bi bi-envelope-paper"></i><span>Contact Messages</span></a></li>
              <li><a href="contact-clients.html"><i class="bi bi-envelope-paper"></i><span>Contact Clients</span></a></li>
              <li><a href="admin/notifications.html"><i class="bi bi-bell"></i><span>Notifications</span></a></li>
              <li><a href="admin/reports.html"><i class="bi bi-file-earmark-bar-graph"></i><span>Reports <em>(bookings only)</em></span></a></li>
              <li><a href="admin/site-content.html"><i class="bi bi-file-earmark-richtext"></i><span>Site Content <em>(FAQs, Team &amp; Packages view-only)</em></span></a></li>
            </ul>
          </div>
        </div>

      </div>

      <p class="text-center text-muted-brand sitemap-search-empty" id="sitemapSearchEmpty" hidden>
        <i class="bi bi-search d-block mb-2" aria-hidden="true"></i>
        No pages match “<span id="sitemapSearchEmptyTerm"></span>”. Try a different word, or
        <button type="button" class="btn btn-link p-0 align-baseline" id="sitemapSearchEmptyReset">clear the search</button>.
      </p>
    </div>
    </div>
  </div>

  <div id="site-footer"></div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../js/main.js?v=20260926c"></script>
  <script>
    renderNavbar("");
    renderFooter();
    initSitemapModals();

    (function initSitemapExtras() {
      const groups = Array.from(document.querySelectorAll(".sitemap-group"));
      if (!groups.length) return;

      let totalPages = 0;
      groups.forEach((group) => {
        const count = group.querySelectorAll(".sitemap-link-list li").length;
        totalPages += count;
        const countEl = group.querySelector(".sitemap-group-count");
        if (countEl) countEl.textContent = `${count} page${count === 1 ? "" : "s"}`;
      });
      const totalEl = document.getElementById("sitemapTotalCount");
      if (totalEl) totalEl.textContent = String(totalPages);

      const input = document.getElementById("sitemapSearch");
      const clearBtn = document.getElementById("sitemapSearchClear");
      const emptyState = document.getElementById("sitemapSearchEmpty");
      const emptyTerm = document.getElementById("sitemapSearchEmptyTerm");
      const emptyReset = document.getElementById("sitemapSearchEmptyReset");
      if (!input) return;

      function applyFilter() {
        const term = input.value.trim().toLowerCase();
        clearBtn.hidden = !term;

        let anyVisible = false;
        groups.forEach((group) => {
          const col = group.closest('[class*="col-"]');
          const items = Array.from(group.querySelectorAll(".sitemap-link-list li"));
          let groupMatches = !term;

          items.forEach((li) => {
            const matches = !term || li.textContent.toLowerCase().includes(term);
            li.classList.toggle("sitemap-item-hidden", !matches);
            if (matches) groupMatches = true;
          });

          if (col) col.classList.toggle("sitemap-group-hidden", !groupMatches);
          if (groupMatches) anyVisible = true;
        });

        emptyTerm.textContent = input.value.trim();
        emptyState.hidden = !term || anyVisible;
      }

      input.addEventListener("input", applyFilter);
      clearBtn.addEventListener("click", () => {
        input.value = "";
        applyFilter();
        input.focus();
      });
      emptyReset?.addEventListener("click", () => {
        input.value = "";
        applyFilter();
        input.focus();
      });
    })();
  </script>
</body>
</html>

@endverbatim
