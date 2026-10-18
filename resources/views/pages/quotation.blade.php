@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Casa Vergara - Quotation</title>
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
  <section class="section-pad bg-light quotation-page">
    <div class="container">
      <a href="customer-dashboard.html" class="text-decoration-none small text-primary quotation-back-link"><i class="bi bi-chevron-left"></i> Back to dashboard</a>
      <h1 class="display-6 fw-bold text-brand mt-2 mb-2">Reservation Quotation</h1>
      <p class="text-muted-brand small mb-4">Review your package, add-ons, and any additional services before payment.</p>

      <div id="quotationEmptyState" class="soft-card p-5 text-center d-none">
        <i class="bi bi-file-earmark-text fs-1 text-primary mb-3 d-block"></i>
        <h2 class="h5 text-brand">No quotation found</h2>
        <p class="text-muted-brand mb-3">Start a booking to receive a quotation.</p>
        <a href="booking.html" class="btn btn-brand">Book now</a>
      </div>

      <div id="quotationContent" class="row g-4">
        <div class="col-lg-8">
          <div class="soft-card p-4 mb-4">
            <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
              <div>
                <p class="text-uppercase small text-primary fw-semibold mb-1">Quotation</p>
                <h2 class="h4 text-brand mb-0" id="quotationPackageName">—</h2>
                <p class="small text-muted-brand mb-0">Reservation <strong id="quotationReservationId">—</strong></p>
              </div>
              <div class="text-md-end">
                <span id="quotationStatusChip" class="status-chip chip-yellow">—</span>
                <div class="small text-muted-brand mt-1" id="quotationVersion">Version 1</div>
              </div>
            </div>
            <div class="row g-3 small mb-3">
              <div class="col-sm-6"><strong>Guest:</strong> <span id="quotationGuestName">—</span></div>
              <div class="col-sm-6"><strong>Date:</strong> <span id="quotationDateLabel">—</span></div>
              <div class="col-12"><strong>Schedule:</strong> <span id="quotationScheduleLabel">—</span></div>
            </div>
            <div id="quotationStatusAlert" class="alert alert-info small d-none" role="status"></div>
            <div id="quotationBreakdown"></div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="soft-card p-4 quotation-summary-card quotation-summary-sticky">
            <h5 class="text-brand mb-1">Total package price</h5>
            <div class="h3 fw-bold text-brand mb-3" id="quotationTotalAmount">—</div>
            <div class="soft-card p-3 mb-3" style="background:#eef6fd;border-color:#d5e9fa;">
              <div class="d-flex justify-content-between small mb-1">
                <span>Downpayment due now (<span id="quotationDownpaymentPercent">50</span>%)</span>
                <strong class="text-brand" id="quotationDownpaymentAmount">—</strong>
              </div>
              <div class="d-flex justify-content-between small text-muted-brand">
                <span>Balance due later</span>
                <span id="quotationBalanceAmount">—</span>
              </div>
            </div>
            <p class="small text-muted-brand mb-4">Accepting the quotation reserves your date. You'll pay the downpayment above to confirm; any admin revisions will update these totals.</p>
            <button type="button" class="btn btn-brand w-100 mb-2 d-none" id="quotationAcceptBtn">
              <i class="bi bi-check2-circle me-2"></i>Accept quotation
            </button>
            <a href="#" class="btn btn-accent w-100 d-none" id="quotationProceedPayBtn">Proceed to payment</a>
            <div id="quotationActionMessage" class="small mt-2" aria-live="polite"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
  <div id="site-footer"></div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../js/duration-pricing.js?v=20260924d"></script>
  <script src="../js/booking-data.js?v=20260924d"></script>
  <script src="../js/main.js?v=20260925a"></script>
  <script>renderNavbar("booking"); renderFooter();</script>
</body>
</html>

@endverbatim
