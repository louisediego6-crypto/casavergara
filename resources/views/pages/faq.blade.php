@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Casa Vergara - FAQs</title>
  <meta name="description" content="Answers to common questions about rooms, rates, bookings and payments at Casa Vergara Resort." />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../css/style.css?v=20261004f" rel="stylesheet">
  <link href="../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../css/laravel-ui.css?v=20261018b" rel="stylesheet">
</head>
<body data-page="faq">
  <div id="site-navbar"></div>

  <section class="contact-hero-pro text-white">
    <div class="container">
      <div class="row align-items-center g-4">
        <div class="col-lg-7">
          <p class="text-uppercase small fw-semibold text-warning mb-2 contact-hero-kicker" data-site-text-key="faq_hero_kicker">Help center</p>
          <h1 class="display-4 fw-bold mb-3" data-site-text-key="faq_hero_title">Frequently asked questions</h1>
          <p class="lead mb-4 opacity-90">Browse the answers our guests ask for most, straight from the resort team.</p>
          <div class="d-flex flex-wrap gap-2">
            <a href="contact.html" class="btn btn-outline-light btn-lg"><i class="bi bi-headset me-2"></i>Talk to the front desk</a>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="contact-hero-panel">
            <div class="d-flex align-items-start gap-3 mb-3">
              <span class="contact-hero-icon"><i class="bi bi-lightning-charge-fill"></i></span>
              <div>
                <h6 class="fw-semibold mb-1">Common questions</h6>
                <p class="small mb-0 opacity-75">Answers from our published FAQ list</p>
              </div>
            </div>
            <div class="d-flex align-items-start gap-3 mb-3">
              <span class="contact-hero-icon"><i class="bi bi-patch-question-fill"></i></span>
              <div>
                <h6 class="fw-semibold mb-1">Rooms, rates &amp; payments</h6>
                <p class="small mb-0 opacity-75">Everything you need before booking</p>
              </div>
            </div>
            <div class="d-flex align-items-start gap-3">
              <span class="contact-hero-icon"><i class="bi bi-headset"></i></span>
              <div>
                <h6 class="fw-semibold mb-1">Still stuck?</h6>
                <p class="small mb-0 opacity-75">Phone: +63 970 323 6544</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section-pad bg-light">
    <div class="container">
      <div class="row g-4 g-xl-5">

        <div class="col-lg-9 mx-auto">
          <div id="faqStaffBanner" class="alert alert-info d-none align-items-center justify-content-between gap-2 flex-wrap mb-3" role="alert"></div>

          <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <h2 class="h4 fw-bold text-brand mb-0">Browse questions</h2>
            <span class="faq-count small text-muted-brand" id="faqCount"></span>
          </div>

          <div class="faq-search-wrap mb-3">
            <i class="bi bi-search"></i>
            <input type="search" class="form-control faq-search-input" id="faqSearch" placeholder="Search questions (e.g. check-in time, downpayment)" aria-label="Search FAQs" />
          </div>

          <div class="faq-category-row mb-4" id="faqCategories" role="tablist" aria-label="FAQ categories"></div>

          <div id="faqList" class="faq-list">
            <div class="faq-skeleton"></div>
            <div class="faq-skeleton"></div>
            <div class="faq-skeleton"></div>
          </div>

          <div class="soft-card p-4 mt-4 faq-cta-card">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <h6 class="fw-semibold mb-1 text-brand">Didn't find your answer?</h6>
                <p class="small text-muted-brand mb-0">Send us a message for reservation inquiries and concerns. Our team will respond as soon as available.</p>
              </div>
              <div class="d-flex flex-wrap gap-2">
                <button type="button" class="btn btn-brand" id="faqOpenLiveChat"><i class="bi bi-chat-dots me-2"></i>Live Chat</button>
                <a href="contact.html" class="btn btn-outline-primary"><i class="bi bi-envelope me-2"></i>Contact us</a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>

  <div id="site-footer"></div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../js/main.js?v=20260930a"></script>
  <script src="../js/faq-page.js?v=20260830i"></script>
  <script>
    renderNavbar("faq");
    renderFooter();
    initCVRFaqPage();
    document.getElementById("faqOpenLiveChat")?.addEventListener("click", () => {
      window.__cvrOpenLiveChatPending = true;
      document.dispatchEvent(new CustomEvent("cvr-open-live-chat"));
    });
  </script>
</body>
</html>

@endverbatim
